import { useState, useMemo } from 'react'
import { Search, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, Wrench } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Tool } from '@/types'
import { useI18n } from '@/i18n/I18nContext'
import { cn } from '@/lib/utils'

interface ToolSelectorProps {
  availableTools: Tool[]
  selectedToolIds: string[]
  onChange: (toolIds: string[]) => void
  isLoading?: boolean
}

export function ToolSelector({
  availableTools,
  selectedToolIds,
  onChange,
  isLoading,
}: ToolSelectorProps) {
  const { t } = useI18n()
  const [leftSearch, setLeftSearch] = useState('')
  const [rightSearch, setRightSearch] = useState('')
  const [leftChecked, setLeftChecked] = useState<Set<string>>(new Set())
  const [rightChecked, setRightChecked] = useState<Set<string>>(new Set())

  // Split tools into available (not selected) and selected
  const { unselectedTools, selectedTools } = useMemo(() => {
    const selectedSet = new Set(selectedToolIds)
    return {
      unselectedTools: availableTools.filter(t => !selectedSet.has(t.id)),
      selectedTools: availableTools.filter(t => selectedSet.has(t.id)),
    }
  }, [availableTools, selectedToolIds])

  // Filter tools by search
  const filteredUnselected = useMemo(() => {
    if (!leftSearch.trim()) return unselectedTools
    const query = leftSearch.toLowerCase()
    return unselectedTools.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.displayName.toLowerCase().includes(query)
    )
  }, [unselectedTools, leftSearch])

  const filteredSelected = useMemo(() => {
    if (!rightSearch.trim()) return selectedTools
    const query = rightSearch.toLowerCase()
    return selectedTools.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.displayName.toLowerCase().includes(query)
    )
  }, [selectedTools, rightSearch])

  // Move selected items to right
  const moveToRight = () => {
    const newSelected = [...selectedToolIds, ...Array.from(leftChecked)]
    onChange(newSelected)
    setLeftChecked(new Set())
  }

  // Move all to right
  const moveAllToRight = () => {
    const allIds = unselectedTools.map(t => t.id)
    onChange([...selectedToolIds, ...allIds])
    setLeftChecked(new Set())
  }

  // Move selected items to left
  const moveToLeft = () => {
    const toRemove = new Set(rightChecked)
    const newSelected = selectedToolIds.filter(id => !toRemove.has(id))
    onChange(newSelected)
    setRightChecked(new Set())
  }

  // Move all to left
  const moveAllToLeft = () => {
    onChange([])
    setRightChecked(new Set())
  }

  // Toggle item in left list
  const toggleLeftItem = (id: string) => {
    const newChecked = new Set(leftChecked)
    if (newChecked.has(id)) {
      newChecked.delete(id)
    } else {
      newChecked.add(id)
    }
    setLeftChecked(newChecked)
  }

  // Toggle item in right list
  const toggleRightItem = (id: string) => {
    const newChecked = new Set(rightChecked)
    if (newChecked.has(id)) {
      newChecked.delete(id)
    } else {
      newChecked.add(id)
    }
    setRightChecked(newChecked)
  }

  // Toggle all in left list
  const toggleAllLeft = () => {
    if (leftChecked.size === filteredUnselected.length) {
      setLeftChecked(new Set())
    } else {
      setLeftChecked(new Set(filteredUnselected.map(t => t.id)))
    }
  }

  // Toggle all in right list
  const toggleAllRight = () => {
    if (rightChecked.size === filteredSelected.length) {
      setRightChecked(new Set())
    } else {
      setRightChecked(new Set(filteredSelected.map(t => t.id)))
    }
  }

  const renderToolItem = (
    tool: Tool,
    checked: boolean,
    onToggle: () => void
  ) => (
    <div
      key={tool.id}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors',
        checked ? 'bg-primary/10' : 'hover:bg-muted'
      )}
      onClick={onToggle}
    >
      <Checkbox checked={checked} onCheckedChange={onToggle} />
      <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{tool.displayName}</div>
        <div className="text-xs text-muted-foreground truncate">
          <code>{tool.name}</code>
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {t.common?.loading || 'Loading...'}
      </div>
    )
  }

  return (
    <div className="flex gap-4">
      {/* Left Panel - Available Tools */}
      <Card className="flex-1">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>{t.mcpServers?.toolSelector?.available || 'Available Tools'}</span>
            <span className="text-muted-foreground font-normal">
              {leftChecked.size > 0 && `${leftChecked.size}/`}{unselectedTools.length}
            </span>
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.mcpServers?.toolSelector?.searchPlaceholder || 'Search tools...'}
              value={leftSearch}
              onChange={(e) => setLeftSearch(e.target.value)}
              className="pl-9 h-8"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUnselected.length > 0 && (
            <div
              className="flex items-center gap-2 px-4 py-2 border-b cursor-pointer hover:bg-muted/50"
              onClick={toggleAllLeft}
            >
              <Checkbox
                checked={leftChecked.size === filteredUnselected.length && filteredUnselected.length > 0}
                onCheckedChange={toggleAllLeft}
              />
              <span className="text-sm text-muted-foreground">
                {t.mcpServers?.toolSelector?.selectAll || 'Select All'}
              </span>
            </div>
          )}
          <ScrollArea className="h-[300px]">
            <div className="p-2 space-y-1">
              {filteredUnselected.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {leftSearch
                    ? (t.mcpServers?.toolSelector?.noResults || 'No matching tools')
                    : (t.mcpServers?.toolSelector?.allSelected || 'All tools selected')
                  }
                </div>
              ) : (
                filteredUnselected.map(tool =>
                  renderToolItem(tool, leftChecked.has(tool.id), () => toggleLeftItem(tool.id))
                )
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Transfer Buttons */}
      <div className="flex flex-col justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={moveAllToRight}
          disabled={unselectedTools.length === 0}
          title={t.mcpServers?.toolSelector?.moveAllRight || 'Move all to right'}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={moveToRight}
          disabled={leftChecked.size === 0}
          title={t.mcpServers?.toolSelector?.moveRight || 'Move selected to right'}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={moveToLeft}
          disabled={rightChecked.size === 0}
          title={t.mcpServers?.toolSelector?.moveLeft || 'Move selected to left'}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={moveAllToLeft}
          disabled={selectedToolIds.length === 0}
          title={t.mcpServers?.toolSelector?.moveAllLeft || 'Move all to left'}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Right Panel - Selected Tools */}
      <Card className="flex-1">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>{t.mcpServers?.toolSelector?.selected || 'Selected Tools'}</span>
            <span className="text-muted-foreground font-normal">
              {rightChecked.size > 0 && `${rightChecked.size}/`}{selectedTools.length}
            </span>
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.mcpServers?.toolSelector?.searchPlaceholder || 'Search tools...'}
              value={rightSearch}
              onChange={(e) => setRightSearch(e.target.value)}
              className="pl-9 h-8"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSelected.length > 0 && (
            <div
              className="flex items-center gap-2 px-4 py-2 border-b cursor-pointer hover:bg-muted/50"
              onClick={toggleAllRight}
            >
              <Checkbox
                checked={rightChecked.size === filteredSelected.length && filteredSelected.length > 0}
                onCheckedChange={toggleAllRight}
              />
              <span className="text-sm text-muted-foreground">
                {t.mcpServers?.toolSelector?.selectAll || 'Select All'}
              </span>
            </div>
          )}
          <ScrollArea className="h-[300px]">
            <div className="p-2 space-y-1">
              {filteredSelected.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {rightSearch
                    ? (t.mcpServers?.toolSelector?.noResults || 'No matching tools')
                    : (t.mcpServers?.toolSelector?.noSelected || 'No tools selected')
                  }
                </div>
              ) : (
                filteredSelected.map(tool =>
                  renderToolItem(tool, rightChecked.has(tool.id), () => toggleRightItem(tool.id))
                )
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
