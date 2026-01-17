import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Search, PlayCircle, AlertCircle } from 'lucide-react'

const stats = [
  { title: 'Data Sources', value: '12', icon: Database, color: 'text-blue-500' },
  { title: 'Queries', value: '48', icon: Search, color: 'text-green-500' },
  { title: 'Active Jobs', value: '5', icon: PlayCircle, color: 'text-yellow-500' },
  { title: 'Alerts', value: '2', icon: AlertCircle, color: 'text-red-500' },
]

export function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent queries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No active jobs</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
