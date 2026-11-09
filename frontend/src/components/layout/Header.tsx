import React, { useState } from 'react'
import {
  Bars3Icon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { ConfirmModal } from '../common/Modal'

interface HeaderProps {
  onToggleSidebar: () => void
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logout()
    setIsLoggingOut(false)
    setShowLogoutConfirm(false)
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200/90 shadow-2xs">
        {/* Left side: Hamburger on mobile */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden transition-colors"
            title="Buka Navigasi"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <img src="/logo.png" alt="Logo Sipetir" className="w-7 h-7 object-contain lg:hidden" />
        </div>

        {/* Right side: User information & Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          {user && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {user.name}
                </span>
                <span className="text-[11px] text-slate-500 leading-tight">
                  {user.email}
                </span>
              </div>
            </div>
          )}

          {/* Logout button */}
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors"
            title="Keluar dari sistem"
          >
            <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Logout confirmation dialog */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari sistem Sipetir? Sesi login Anda akan diakhiri secara aman."
        confirmText="Keluar"
        cancelText="Tetap di Sini"
        isDestructive={true}
        isLoading={isLoggingOut}
      />
    </>
  )
}
