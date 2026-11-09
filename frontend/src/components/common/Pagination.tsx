import React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { PaginationMeta } from '../../types'

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

export const Pagination: React.FC<PaginationProps> = ({ meta, onPageChange }) => {
  const { current_page, last_page, total, per_page } = meta

  if (last_page <= 1) return null

  const start = (current_page - 1) * per_page + 1
  const end = Math.min(current_page * per_page, total)

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const delta = 1

    for (let i = 1; i <= last_page; i++) {
      if (
        i === 1 ||
        i === last_page ||
        (i >= current_page - delta && i <= current_page + delta)
      ) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...')
      }
    }
    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t border-slate-200">
      <div className="text-xs text-slate-500">
        Menampilkan <span className="font-semibold text-slate-700">{start}</span> -{' '}
        <span className="font-semibold text-slate-700">{end}</span> dari{' '}
        <span className="font-semibold text-slate-700">{total}</span> data
      </div>

      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page === 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Halaman Sebelumnya"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        {getPageNumbers().map((p, idx) =>
          typeof p === 'number' ? (
            <button
              key={idx}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-8 h-8 px-2 text-xs font-medium rounded-lg border transition-colors ${
                p === current_page
                  ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={idx} className="px-2 text-xs text-slate-400">
              ...
            </span>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page === last_page}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Halaman Selanjutnya"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
