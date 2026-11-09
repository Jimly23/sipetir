import React from 'react'

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; text?: string }> = ({
  size = 'md',
  text,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div
        className={`${sizeClasses[size]} border-blue-600 border-t-transparent rounded-full animate-spin`}
      />
      {text && <p className="text-sm font-medium text-slate-500 animate-pulse">{text}</p>}
    </div>
  )
}

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 6,
}) => {
  return (
    <div className="w-full animate-pulse divide-y divide-slate-200">
      <div className="bg-slate-100 py-3.5 px-4 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-200 rounded flex-1"></div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="py-4 px-4 flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className={`h-4 bg-slate-100 rounded ${c === 0 ? 'w-16' : 'flex-1'}`}
            ></div>
          ))}
        </div>
      ))}
    </div>
  )
}

export const SkeletonCard: React.FC = () => (
  <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm animate-pulse space-y-3">
    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
    <div className="h-8 bg-slate-200 rounded w-2/3"></div>
    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
  </div>
)
