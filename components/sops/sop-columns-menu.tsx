'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Columns3, GripVertical, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { COLUMN_LABELS, DEFAULT_COLUMN_CONFIG, type ColumnConfig, type ColumnKey } from './sop-columns'

interface Props {
  config: ColumnConfig
  onChange: (next: ColumnConfig) => void
  /** Columns that make sense in the current view (Stream is left out on a stream page). */
  available: ColumnKey[]
}

/** Panel to show or hide table columns and change their order. Reorder by dragging or with the arrows. */
export function ColumnsMenu({ config, onChange, available }: Props) {
  const [open, setOpen] = useState(false)
  const [dragKey, setDragKey] = useState<ColumnKey | null>(null)
  const [overKey, setOverKey] = useState<ColumnKey | null>(null)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const list = config.order.filter((k) => available.includes(k))
  const visibleCount = list.filter((k) => !config.hidden.includes(k)).length

  function toggle(key: ColumnKey) {
    const hidden = config.hidden.includes(key) ? config.hidden.filter((k) => k !== key) : [...config.hidden, key]
    onChange({ ...config, hidden })
  }

  /** Moves `key` to the position of `target` within the full order (hidden-from-view columns keep their place). */
  function moveTo(key: ColumnKey, target: ColumnKey) {
    if (key === target) return
    const order = config.order.filter((k) => k !== key)
    order.splice(order.indexOf(target) + (config.order.indexOf(key) < config.order.indexOf(target) ? 1 : 0), 0, key)
    onChange({ ...config, order })
  }

  function step(key: ColumnKey, dir: -1 | 1) {
    const target = list[list.indexOf(key) + dir]
    if (target) moveTo(key, target)
  }

  return (
    <div ref={root} className="relative">
      <Button variant="outline" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Columns3 data-icon="inline-start" />
        Columns
      </Button>
      {open && (
        <div role="dialog" aria-label="Choose table columns" className="absolute right-0 top-full z-30 mt-2 w-72 rounded-lg border bg-popover p-2 text-popover-foreground shadow-md">
          <p className="px-2 pb-1 pt-0.5 text-xs text-muted-foreground">Tick to show a column. Drag or use the arrows to reorder.</p>
          <ul className="flex flex-col">
            {list.map((key, i) => {
              const shown = !config.hidden.includes(key)
              return (
                <li
                  key={key}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('text/plain', key)
                    setDragKey(key)
                  }}
                  onDragOver={(e) => {
                    if (!dragKey) return
                    e.preventDefault()
                    setOverKey(key)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (dragKey) moveTo(dragKey, key)
                    setDragKey(null)
                    setOverKey(null)
                  }}
                  onDragEnd={() => {
                    setDragKey(null)
                    setOverKey(null)
                  }}
                  className={`flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-muted ${dragKey === key ? 'opacity-40' : ''} ${dragKey && overKey === key && dragKey !== key ? 'ring-2 ring-primary' : ''}`}
                >
                  <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" aria-hidden="true" />
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={shown}
                      // The table needs at least one column, so the last visible one cannot be switched off.
                      disabled={shown && visibleCount <= 1}
                      onChange={() => toggle(key)}
                    />
                    <span className="truncate">{COLUMN_LABELS[key]}</span>
                  </label>
                  <Button variant="ghost" size="icon-sm" aria-label={`Move ${COLUMN_LABELS[key]} up`} disabled={i === 0} onClick={() => step(key, -1)}>
                    <ArrowUp />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`Move ${COLUMN_LABELS[key]} down`} disabled={i === list.length - 1} onClick={() => step(key, 1)}>
                    <ArrowDown />
                  </Button>
                </li>
              )
            })}
          </ul>
          <div className="mt-1 border-t pt-1">
            <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_COLUMN_CONFIG)}>
              <RotateCcw data-icon="inline-start" />
              Reset to default
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
