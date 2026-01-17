import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { DataSource, DataSourceFormData, DataSourceType } from '@/types'

const formSchema = z.object({
  name: z.string().min(1, '请输入数据源名称'),
  type: z.enum(['mysql', 'postgresql', 'sqlserver', 'oracle'], '请选择数据库类型'),
  host: z.string().min(1, '请输入主机地址'),
  port: z.number().int().min(1, '端口必须大于0').max(65535, '端口必须小于65536'),
  database: z.string().min(1, '请输入数据库名'),
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface DataSourceFormProps {
  dataSource?: DataSource
  onSubmit: (data: DataSourceFormData) => void
  onCancel: () => void
  onTestConnection?: () => void
  isSubmitting?: boolean
  isTesting?: boolean
}

const DEFAULT_PORTS: Record<DataSourceType, number> = {
  mysql: 3306,
  postgresql: 5432,
  sqlserver: 1433,
  oracle: 1521,
}

export function DataSourceForm({
  dataSource,
  onSubmit,
  onCancel,
  onTestConnection,
  isSubmitting = false,
  isTesting = false,
}: DataSourceFormProps) {
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: dataSource
      ? {
          name: dataSource.name,
          type: dataSource.type,
          host: dataSource.host,
          port: dataSource.port,
          database: dataSource.database,
          username: dataSource.username,
          password: '', // Don't populate password for security
          description: dataSource.description || '',
        }
      : {
          name: '',
          type: 'postgresql',
          host: 'localhost',
          port: 5432,
          database: '',
          username: '',
          password: '',
          description: '',
        },
  })

  // Update port when database type changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'type' && value.type) {
        const currentPort = form.getValues('port')
        const defaultPort = DEFAULT_PORTS[value.type as DataSourceType]

        // Only update if port is still at a default value
        if (Object.values(DEFAULT_PORTS).includes(currentPort)) {
          form.setValue('port', defaultPort)
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>名称</FormLabel>
              <FormControl>
                <Input placeholder="Production Database" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>数据库类型</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择数据库类型" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="sqlserver">SQL Server</SelectItem>
                  <SelectItem value="oracle">Oracle</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Host and Port */}
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="host"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>主机地址</FormLabel>
                <FormControl>
                  <Input placeholder="localhost" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="port"
            render={({ field }) => (
              <FormItem>
                <FormLabel>端口</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="5432"
                    {...field}
                    value={field.value}
                    onChange={(e) => {
                      const value = e.target.value
                      field.onChange(value === '' ? 0 : parseInt(value, 10))
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Database */}
        <FormField
          control={form.control}
          name="database"
          render={({ field }) => (
            <FormItem>
              <FormLabel>数据库名</FormLabel>
              <FormControl>
                <Input placeholder="mydb" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Username */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>用户名</FormLabel>
              <FormControl>
                <Input placeholder="postgres" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>密码</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={dataSource ? '留空以保持不变' : '••••••••'}
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              {dataSource && (
                <FormDescription>留空以保持密码不变</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>描述（可选）</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="关于此数据源的描述..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {onTestConnection && (
              <Button
                type="button"
                variant="outline"
                onClick={onTestConnection}
                disabled={isTesting || isSubmitting}
              >
                {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                测试连接
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dataSource ? '更新' : '创建'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
