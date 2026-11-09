import React, { useState, useEffect, useCallback } from 'react'
import {
  UsersIcon,
  PlusIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import api, { formatDate } from '../../services/api'
import { User, UserRole, PaginationMeta } from '../../types'
import { RoleBadge } from '../../components/common/Badge'
import { Modal } from '../../components/common/Modal'
import { Pagination } from '../../components/common/Pagination'
import { SkeletonTable } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'
import { useAuth } from '../../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

export const UserList: React.FC = () => {
  const { user: currentUser, hasRole } = useAuth()

  // Guard: Admin only
  if (!hasRole(['admin'])) {
    return <Navigate to="/dashboard" replace />
  }

  // State
  const [users, setUsers] = useState<User[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRole, setFormRole] = useState<UserRole>('operator')
  const [formIsActive, setFormIsActive] = useState<boolean>(true)
  const [formPassword, setFormPassword] = useState('')
  const [formPasswordConfirm, setFormPasswordConfirm] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('per_page', '15')
      if (search) params.append('search', search)
      if (selectedRole) params.append('role', selectedRole)

      const res = await api.get(`/users?${params.toString()}`)
      setUsers(res.data.data)
      if (res.data.meta) {
        setMeta(res.data.meta)
      }
    } catch (err) {
      console.error('Error fetching users', err)
      setFeedback({ type: 'error', text: 'Gagal memuat daftar pengguna.' })
    } finally {
      setIsLoading(false)
    }
  }, [page, search, selectedRole])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleOpenAdd = () => {
    setEditingUser(null)
    setFormName('')
    setFormEmail('')
    setFormRole('operator')
    setFormIsActive(true)
    setFormPassword('')
    setFormPasswordConfirm('')
    setFormErrors({})
    setModalOpen(true)
  }

  const handleOpenEdit = (u: User) => {
    setEditingUser(u)
    setFormName(u.name)
    setFormEmail(u.email)
    setFormRole(u.role)
    setFormIsActive(u.is_active)
    setFormPassword('')
    setFormPasswordConfirm('')
    setFormErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!formName.trim()) errors.name = 'Nama lengkap wajib diisi.'
    if (!formEmail.trim()) errors.email = 'Alamat email wajib diisi.'

    if (!editingUser) {
      if (!formPassword) {
        errors.password = 'Kata sandi wajib diisi.'
      } else if (formPassword.length < 8) {
        errors.password = 'Kata sandi minimal 8 karakter.'
      }
      if (formPassword !== formPasswordConfirm) {
        errors.password_confirmation = 'Konfirmasi kata sandi tidak cocok.'
      }
    } else if (formPassword) {
      if (formPassword.length < 8) {
        errors.password = 'Kata sandi minimal 8 karakter.'
      }
      if (formPassword !== formPasswordConfirm) {
        errors.password_confirmation = 'Konfirmasi kata sandi tidak cocok.'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        is_active: formIsActive,
      }
      if (formPassword) {
        payload.password = formPassword
        payload.password_confirmation = formPasswordConfirm
      }

      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload)
        setFeedback({
          type: 'success',
          text: `Akun "${formName}" berhasil diperbarui.`,
        })
      } else {
        await api.post('/users', payload)
        setFeedback({
          type: 'success',
          text: `Akun baru "${formName}" berhasil dibuat.`,
        })
      }

      setModalOpen(false)
      fetchUsers()
    } catch (err: unknown) {
      console.error('Error saving user', err)
      let msg = 'Gagal menyimpan data pengguna.'
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as {
          response?: { data?: { message?: string; errors?: Record<string, string[]> } }
        }
        if (ax.response?.data?.errors) {
          const first = Object.keys(ax.response.data.errors)[0]
          msg = ax.response.data.errors[first][0]
        } else if (ax.response?.data?.message) {
          msg = ax.response.data.message
        }
      }
      setFeedback({ type: 'error', text: msg })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Manajemen Pengguna &amp; Hak Akses
          </h1>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Cari nama atau email pengguna..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value)
              setPage(1)
            }}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Role</option>
            <option value="admin">Administrator</option>
            <option value="pimpinan">Pimpinan</option>
            <option value="operator">Operator</option>
            <option value="penyidik">Penyidik</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : users.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Peran (Role)</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-4">Terdaftar</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                            {u.name.charAt(0)}
                          </div>
                          <span>{u.name}</span>
                          {currentUser?.id === u.id && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                              Anda
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {u.email}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs">
                            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-medium text-xs">
                            <XCircleIcon className="w-4 h-4 text-rose-600" />
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        >
                          <PencilSquareIcon className="w-3.5 h-3.5" />
                          <span>Sunting</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination meta={meta} onPageChange={(p) => setPage(p)} />
          </>
        ) : (
          <EmptyState
            title="Tidak ada pengguna ditemukan"
            description="Tidak ada pengguna yang cocok dengan kriteria pencarian Anda."
            isSearch={true}
          />
        )}
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? `Sunting Pengguna: ${editingUser.name}` : 'Tambah Pengguna Baru'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Name */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: Briptu Ahmad Pratama"
              required
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formErrors.name && (
              <p className="mt-1 text-[11px] text-rose-600">{formErrors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Alamat Email Resmi <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="ahmad@gmail.com"
              required
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formErrors.email && (
              <p className="mt-1 text-[11px] text-rose-600">{formErrors.email}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Peran / Otoritas (Role) <span className="text-rose-500">*</span>
            </label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as UserRole)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Administrator (Akses Penuh &amp; Pengguna)</option>
              <option value="pimpinan">Pimpinan (Hanya Baca: Dashboard &amp; Laporan)</option>
              <option value="operator">Operator (Input &amp; Edit Kasus)</option>
              <option value="penyidik">Penyidik (Input, Tangani &amp; Edit Kasus)</option>
            </select>
          </div>

          {/* Status Aktif Toggle (Edit only) */}
          {editingUser && (
            <div className="flex items-center gap-2 pt-1">
              <input
                id="is_active"
                type="checkbox"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="font-medium text-slate-700 select-none">
                Akun Aktif (Dapat masuk ke sistem)
              </label>
            </div>
          )}

          {/* Password Fields */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                {editingUser
                  ? 'Ganti Kata Sandi (Kosongkan jika tidak diubah)'
                  : 'Kata Sandi'} {!editingUser && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formErrors.password && (
                <p className="mt-1 text-[11px] text-rose-600">{formErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Konfirmasi Kata Sandi
              </label>
              <input
                type="password"
                value={formPasswordConfirm}
                onChange={(e) => setFormPasswordConfirm(e.target.value)}
                placeholder="Ulangi kata sandi"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formErrors.password_confirmation && (
                <p className="mt-1 text-[11px] text-rose-600">
                  {formErrors.password_confirmation}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Pengguna'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
