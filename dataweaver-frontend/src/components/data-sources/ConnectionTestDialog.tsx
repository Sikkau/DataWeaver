import { CheckCircle2, XCircle, Loader2, Database } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { TestConnectionResult } from '@/types'

interface ConnectionTestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: TestConnectionResult | null
  isLoading: boolean
  onViewTables?: () => void
}

export function ConnectionTestDialog({
  open,
  onOpenChange,
  result,
  isLoading,
  onViewTables,
}: ConnectionTestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>测试数据库连接</DialogTitle>
          <DialogDescription>
            正在验证数据库连接配置...
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">连接中...</p>
            </div>
          )}

          {!isLoading && result && (
            <div className="space-y-4">
              {/* Success State */}
              {result.success && (
                <>
                  <div className="flex items-center justify-center">
                    <div className="rounded-full bg-green-100 p-3">
                      <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-lg">连接成功！</h3>
                    <p className="text-sm text-muted-foreground">
                      {result.message}
                    </p>
                    {result.latency !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        延迟: {result.latency}ms
                      </p>
                    )}
                  </div>
                  <Alert>
                    <Database className="h-4 w-4" />
                    <AlertDescription>
                      数据库连接配置正确，可以正常使用。
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {/* Error State */}
              {!result.success && (
                <>
                  <div className="flex items-center justify-center">
                    <div className="rounded-full bg-red-100 p-3">
                      <XCircle className="h-12 w-12 text-red-600" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-lg">连接失败</h3>
                    <p className="text-sm text-muted-foreground">
                      请检查连接配置并重试
                    </p>
                  </div>
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription className="break-words">
                      {result.message}
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!isLoading && result?.success && onViewTables && (
            <Button
              variant="outline"
              onClick={() => {
                onViewTables()
                onOpenChange(false)
              }}
              className="w-full sm:w-auto"
            >
              <Database className="mr-2 h-4 w-4" />
              查看表列表
            </Button>
          )}
          <Button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {result?.success ? '完成' : '关闭'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
