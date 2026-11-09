import React from 'react'
import { FolderPlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface EmptyStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  isSearch?: boolean
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Tidak ada data ditemukan',
  description = 'Belum ada data yang tercatat dalam sistem untuk kriteria ini.',
  actionLabel,
  onAction,
  isSearch = false,
}) => {
  return (
    <div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 my-4">
      <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        {isSearch ? (
          <MagnifyingGlassIcon className="w-6 h-6" />
        ) : (
          <FolderPlusIcon className="w-6 h-6" />
        )}
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  )
}
