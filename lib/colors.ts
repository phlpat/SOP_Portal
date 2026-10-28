import type { Priority, StatusColor } from './types'

export const STATUS_COLOR_STYLES: Record<StatusColor, { badge: string; dot: string; chart: string; label: string }> = {
  slate: { badge: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400', chart: '#94a3b8', label: 'Slate' },
  blue: { badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-600', chart: '#2563eb', label: 'Blue' },
  indigo: { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-600', chart: '#4f46e5', label: 'Indigo' },
  violet: { badge: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500', chart: '#8b5cf6', label: 'Violet' },
  amber: { badge: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500', chart: '#f59e0b', label: 'Amber' },
  orange: { badge: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', chart: '#f97316', label: 'Orange' },
  emerald: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-600', chart: '#059669', label: 'Emerald' },
  rose: { badge: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', chart: '#f43f5e', label: 'Rose' },
}

export const PRIORITY_STYLES: Record<Priority, string> = {
  Critical: 'bg-red-50 text-red-700 border-red-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Medium: 'bg-sky-50 text-sky-700 border-sky-200',
  Low: 'bg-slate-50 text-slate-600 border-slate-200',
}
