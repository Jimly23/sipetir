import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  ChartBarSquareIcon,
  FolderOpenIcon,
  TagIcon,
  DocumentChartBarIcon,
  UsersIcon,
  BoltIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth()

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: ChartBarSquareIcon,
      roles: ['admin', 'pimpinan', 'operator', 'penyidik'],
    },
    {
      name: 'Data Kasus',
      path: '/cases',
      icon: FolderOpenIcon,
      roles: ['admin', 'pimpinan', 'operator', 'penyidik'],
    },
    {
      name: 'Kategori Kejahatan',
      path: '/categories',
      icon: TagIcon,
      roles: ['admin'],
    },
    {
      name: 'Laporan & Rekap',
      path: '/reports',
      icon: DocumentChartBarIcon,
      roles: ['admin', 'pimpinan', 'operator', 'penyidik'],
    },
    {
      name: 'Manajemen Pengguna',
      path: '/users',
      icon: UsersIcon,
      roles: ['admin'],
    },
  ]

  const filteredNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  )

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white text-slate-700 border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="Logo Sipetir"
              className="w-9 h-9 object-contain drop-shadow-sm shrink-0"
            />
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 uppercase">SIPETIR</span>
              <span className="block text-[10px] font-medium tracking-wider text-slate-500 uppercase -mt-1">
                Sistem Pendataan Tipidter
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/80 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
