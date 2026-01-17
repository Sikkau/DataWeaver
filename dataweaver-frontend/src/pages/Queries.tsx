import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Save, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const mockDataSources = [
  { id: '1', name: 'Production DB' },
  { id: '2', name: 'Analytics DB' },
]

export function Queries() {
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;')
  const [selectedDataSource, setSelectedDataSource] = useState('')
  const [results, setResults] = useState<Record<string, unknown>[]>([])

  const executeQuery = () => {
    // Mock results
    setResults([
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Query Editor</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Save className="mr-2 h-4 w-4" />
            Save Query
          </Button>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Query
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>SQL Editor</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select data source" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDataSources.map((ds) => (
                      <SelectItem key={ds.id} value={ds.id}>
                        {ds.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={executeQuery}>
                  <Play className="mr-2 h-4 w-4" />
                  Run
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 rounded-md border">
                <Editor
                  height="100%"
                  defaultLanguage="sql"
                  value={query}
                  onChange={(value) => setQuery(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              {results.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(results[0]).map((key) => (
                        <TableHead key={key}>{key}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((row, i) => (
                      <TableRow key={i}>
                        {Object.values(row).map((value, j) => (
                          <TableCell key={j}>{String(value)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">Run a query to see results</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No saved queries</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
