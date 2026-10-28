import type { SopRow } from './metrics'

function cell(value: string) {
  // Neutralise spreadsheet formula injection, then quote.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}

export function sopsToCsv(rows: SopRow[]) {
  const header = ['SOP ID', 'SOP Name', 'Stream', 'Workstream', 'PIC / Owner', 'Status', 'Priority', 'Target Date', 'Last Updated', 'Description']
  const lines = rows.map((r) =>
    [r.code, r.name, r.stream?.name ?? '', r.workstream?.name ?? '', r.owner, r.status?.name ?? '', r.priority, r.targetDate, r.updatedAt.slice(0, 10), r.description]
      .map(cell)
      .join(','),
  )
  return [header.map(cell).join(','), ...lines].join('\r\n')
}

export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob(['\ufeff', content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
