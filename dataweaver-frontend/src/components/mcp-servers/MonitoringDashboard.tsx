import { Activity, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { McpServerStats, McpServerCallLog } from '@/types'
import { useI18n } from '@/i18n/I18nContext'
import { cn } from '@/lib/utils'

interface MonitoringDashboardProps {
  stats: McpServerStats | null
  logs: McpServerCallLog[]
  isLoading?: boolean
}

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#ec4899']

export function MonitoringDashboard({ stats, logs, isLoading }: MonitoringDashboardProps) {
  const { t } = useI18n()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {t.common?.loading || 'Loading...'}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {t.mcpServers?.monitoring?.noData || 'No monitoring data available'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.mcpServers?.monitoring?.totalCalls || 'Total Calls'}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.callsToday.toLocaleString()} {t.mcpServers?.monitoring?.today || 'today'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.mcpServers?.monitoring?.successRate || 'Success Rate'}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.successRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.successRate >= 0.95 ? (
                <span className="text-green-600">{t.mcpServers?.monitoring?.excellent || 'Excellent'}</span>
              ) : stats.successRate >= 0.9 ? (
                <span className="text-yellow-600">{t.mcpServers?.monitoring?.good || 'Good'}</span>
              ) : (
                <span className="text-red-600">{t.mcpServers?.monitoring?.needsAttention || 'Needs attention'}</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.mcpServers?.monitoring?.avgResponseTime || 'Avg Response Time'}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageResponseTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              {stats.averageResponseTime < 100 ? (
                <span className="text-green-600">{t.mcpServers?.monitoring?.fast || 'Fast'}</span>
              ) : stats.averageResponseTime < 500 ? (
                <span className="text-yellow-600">{t.mcpServers?.monitoring?.normal || 'Normal'}</span>
              ) : (
                <span className="text-red-600">{t.mcpServers?.monitoring?.slow || 'Slow'}</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t.mcpServers?.monitoring?.topTool || 'Top Tool'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {stats.topTools[0]?.toolName || '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.topTools[0]?.calls.toLocaleString() || 0} {t.mcpServers?.monitoring?.calls || 'calls'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t.mcpServers?.monitoring?.callTrend || 'Call Trend'}
            </CardTitle>
            <CardDescription>
              {t.mcpServers?.monitoring?.callTrendDesc || 'Daily call volume over time'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats.callsTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.callsTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="calls"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name={t.mcpServers?.monitoring?.totalCalls || 'Total Calls'}
                    />
                    <Line
                      type="monotone"
                      dataKey="success"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      name={t.mcpServers?.monitoring?.successCalls || 'Success'}
                    />
                    <Line
                      type="monotone"
                      dataKey="errors"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      name={t.mcpServers?.monitoring?.errorCalls || 'Errors'}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  {t.mcpServers?.monitoring?.noChartData || 'No data to display'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Tools Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t.mcpServers?.monitoring?.topTools || 'Top Tools'}
            </CardTitle>
            <CardDescription>
              {t.mcpServers?.monitoring?.topToolsDesc || 'Most frequently called tools'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats.topTools.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topTools} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="toolName"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Bar
                      dataKey="calls"
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                      name={t.mcpServers?.monitoring?.calls || 'Calls'}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  {t.mcpServers?.monitoring?.noChartData || 'No data to display'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Response Time Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t.mcpServers?.monitoring?.responseTimeDistribution || 'Response Time Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {stats.responseTimeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.responseTimeDistribution}
                      dataKey="count"
                      nameKey="range"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {stats.responseTimeDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  {t.mcpServers?.monitoring?.noChartData || 'No data to display'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Call Logs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {t.mcpServers?.monitoring?.recentCalls || 'Recent Calls'}
            </CardTitle>
            <CardDescription>
              {t.mcpServers?.monitoring?.recentCallsDesc || 'Latest tool invocations'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.mcpServers?.monitoring?.time || 'Time'}</TableHead>
                    <TableHead>{t.mcpServers?.monitoring?.tool || 'Tool'}</TableHead>
                    <TableHead>{t.mcpServers?.monitoring?.status || 'Status'}</TableHead>
                    <TableHead className="text-right">
                      {t.mcpServers?.monitoring?.responseTime || 'Response Time'}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        {t.mcpServers?.monitoring?.noLogs || 'No recent calls'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.toolName}</TableCell>
                        <TableCell>
                          <Badge
                            variant={log.status === 'success' ? 'default' : 'destructive'}
                            className={cn(
                              'text-xs',
                              log.status === 'success' && 'bg-green-500'
                            )}
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{log.responseTime}ms</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
