import { useState, useMemo } from 'react'
import { Search, Table as TableIcon, Database } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import type { TableInfo } from '@/types'

interface TableBrowserProps {
  tables: TableInfo[]
  isLoading: boolean
  error?: Error | null
}

export function TableBrowser({ tables, isLoading, error }: TableBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter tables based on search query
  const filteredTables = useMemo(() => {
    if (!searchQuery) return tables

    const query = searchQuery.toLowerCase()
    return tables.filter(
      (table) =>
        table.name.toLowerCase().includes(query) ||
        table.schema?.toLowerCase().includes(query)
    )
  }, [tables, searchQuery])

  // Format row count
  const formatRowCount = (count?: number) => {
    if (count === undefined) return '-'
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            表列表
            {!isLoading && tables.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({tables.length})
              </span>
            )}
          </CardTitle>
        </div>
        {/* Search Input */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索表名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            disabled={isLoading}
          />
        </div>
      </CardHeader>

      <CardContent>
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              加载表列表失败: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !error && tables.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold mb-2">没有找到表</h3>
            <p className="text-sm text-muted-foreground">
              此数据源中没有可访问的表
            </p>
          </div>
        )}

        {/* No Results State */}
        {!isLoading && !error && tables.length > 0 && filteredTables.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold mb-2">没有匹配的结果</h3>
            <p className="text-sm text-muted-foreground">
              尝试使用不同的搜索关键词
            </p>
          </div>
        )}

        {/* Tables List */}
        {!isLoading && !error && filteredTables.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>表名</TableHead>
                  <TableHead className="text-right w-24">行数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTables.map((table, index) => (
                  <TableRow
                    key={`${table.schema}-${table.name}-${index}`}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      <TableIcon className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{table.name}</span>
                        {table.schema && (
                          <span className="text-xs text-muted-foreground">
                            {table.schema}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatRowCount(table.rowCount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Results count */}
        {!isLoading &&
          !error &&
          tables.length > 0 &&
          searchQuery &&
          filteredTables.length > 0 && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              显示 {filteredTables.length} / {tables.length} 个表
            </p>
          )}
      </CardContent>
    </Card>
  )
}
