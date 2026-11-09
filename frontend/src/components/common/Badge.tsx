import React from 'react'
import { STATUS_MAP, ROLE_MAP } from '../../services/api'
import { CaseStatus, UserRole } from '../../types'

export const StatusBadge: React.FC<{ status: CaseStatus | string; className?: string }> = ({
  status,
  className = '',
}) => {
  const item = STATUS_MAP[status] || {
    label: status,
    text: 'text-slate-700',
  }

  return (
    <span className={`inline-block text-xs font-semibold ${item.text} ${className}`}>
      {item.label}
    </span>
  )
}

export const RoleBadge: React.FC<{ role: UserRole | string; className?: string }> = ({
  role,
  className = '',
}) => {
  const item = ROLE_MAP[role] || {
    label: role,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border uppercase tracking-wider ${item.badgeClass} ${className}`}
    >
      {item.label}
    </span>
  )
}
