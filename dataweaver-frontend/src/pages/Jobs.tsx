import { Plus, Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const mockJobs = [
  {
    id: '1',
    name: 'Daily User Sync',
    schedule: '0 0 * * *',
    status: 'running',
    lastRun: '2024-01-13 00:00:00',
    nextRun: '2024-01-14 00:00:00',
  },
  {
    id: '2',
    name: 'Weekly Report',
    schedule: '0 8 * * 1',
    status: 'completed',
    lastRun: '2024-01-08 08:00:00',
    nextRun: '2024-01-15 08:00:00',
  },
  {
    id: '3',
    name: 'Data Cleanup',
    schedule: '0 2 * * *',
    status: 'failed',
    lastRun: '2024-01-13 02:00:00',
    nextRun: '2024-01-14 02:00:00',
  },
]

const statusColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  running: 'default',
  completed: 'secondary',
  failed: 'destructive',
  pending: 'secondary',
}

export function Jobs() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Jobs</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Job
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.name}</TableCell>
                  <TableCell className="font-mono text-sm">{job.schedule}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[job.status] || 'secondary'}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{job.lastRun}</TableCell>
                  <TableCell>{job.nextRun}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {job.status === 'running' ? (
                        <Button variant="ghost" size="icon">
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
