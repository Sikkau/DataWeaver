import { Database, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { DataSource } from '@/types'

interface DataSourceCardProps {
  dataSource: DataSource
  isSelected?: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

const DB_ICONS: Record<string, React.ReactNode> = {
  mysql: <Database className="h-4 w-4 text-blue-500" />,
  postgresql: <Database className="h-4 w-4 text-blue-600" />,
  sqlserver: <Database className="h-4 w-4 text-red-500" />,
  oracle: <Database className="h-4 w-4 text-red-600" />,
}

const STATUS_CONFIG = {
  active: {
    color: 'bg-green-500',
    text: '活跃',
    textColor: 'text-green-700',
  },
  inactive: {
    color: 'bg-gray-400',
    text: '禁用',
    textColor: 'text-gray-600',
  },
  error: {
    color: 'bg-red-500',
    text: '错误',
    textColor: 'text-red-700',
  },
}

export function DataSourceCard({
  dataSource,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
}: DataSourceCardProps) {
  const status = STATUS_CONFIG[dataSource.status]

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-card p-4 cursor-pointer transition-all',
        'hover:shadow-md hover:border-primary/50',
        isSelected && 'border-primary shadow-md ring-2 ring-primary/20'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div className="mt-0.5">{DB_ICONS[dataSource.type]}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{dataSource.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
              {dataSource.type}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {dataSource.host}:{dataSource.port}
            </p>
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2 mt-3">
        <div className={cn('h-2 w-2 rounded-full', status.color)} />
        <span className={cn('text-xs font-medium', status.textColor)}>
          {status.text}
        </span>
      </div>

      {/* Description if available */}
      {dataSource.description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {dataSource.description}
        </p>
      )}
    </div>
  )
}
