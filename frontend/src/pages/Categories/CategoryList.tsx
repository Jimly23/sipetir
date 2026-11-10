import React, { useState, useEffect } from 'react'
import {
  TagIcon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  FolderIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import api from '../../services/api'
import { Category, Subcategory } from '../../types'
import { Modal, ConfirmModal } from '../../components/common/Modal'
import { SkeletonTable } from '../../components/common/LoadingSpinner'
import { EmptyState } from '../../components/common/EmptyState'
import { useAuth } from '../../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

export const CategoryList: React.FC = () => {
  const { hasRole } = useAuth()

  // Guard: Admin only
  if (!hasRole(['admin'])) {
    return <Navigate to="/dashboard" replace />
  }

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Category Modal state (Add / Edit)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [catName, setCatName] = useState('')
  const [catDescription, setCatDescription] = useState('')
  const [isSavingCategory, setIsSavingCategory] = useState(false)

  // Subcategory Modal state (Add subcategory to category)
  const [subModalOpen, setSubModalOpen] = useState(false)
  const [targetCategory, setTargetCategory] = useState<Category | null>(null)
  const [subName, setSubName] = useState('')
  const [subDescription, setSubDescription] = useState('')
  const [isSavingSub, setIsSavingSub] = useState(false)

  // Delete confirmations
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null)
  const [deleteSubTarget, setDeleteSubTarget] = useState<{
    catId: number
    sub: Subcategory
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/categories')
      setCategories(res.data.data)
    } catch (err) {
      console.error('Error fetching categories', err)
      setFeedback({ type: 'error', text: 'Gagal memuat kategori dari server.' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Open Add Category Modal
  const handleOpenAddCategory = () => {
    setEditingCategory(null)
    setCatName('')
    setCatDescription('')
    setCategoryModalOpen(true)
  }

  // Open Edit Category Modal
  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat)
    setCatName(cat.name)
    setCatDescription(cat.description || '')
    setCategoryModalOpen(true)
  }

  // Save Category (Create / Update)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catName.trim()) return

    setIsSavingCategory(true)
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, {
          name: catName.trim(),
          description: catDescription.trim() || null,
        })
        setFeedback({ type: 'success', text: `Kategori "${catName}" berhasil diperbarui.` })
      } else {
        await api.post('/categories', {
          name: catName.trim(),
          description: catDescription.trim() || null,
        })
        setFeedback({ type: 'success', text: `Kategori "${catName}" berhasil ditambahkan.` })
      }
      setCategoryModalOpen(false)
      fetchCategories()
    } catch (err: unknown) {
      let msg = 'Gagal menyimpan kategori.'
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string } } }
        msg = ax.response?.data?.message || msg
      }
      setFeedback({ type: 'error', text: msg })
    } finally {
      setIsSavingCategory(false)
    }
  }

  // Delete Category
  const handleDeleteCategory = async () => {
    if (!deleteCategoryTarget) return
    setIsDeleting(true)
    try {
      await api.delete(`/categories/${deleteCategoryTarget.id}`)
      setFeedback({
        type: 'success',
        text: `Kategori "${deleteCategoryTarget.name}" berhasil dihapus.`,
      })
      setDeleteCategoryTarget(null)
      fetchCategories()
    } catch (err: unknown) {
      let msg = 'Gagal menghapus kategori.'
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string } } }
        msg = ax.response?.data?.message || msg
      }
      setFeedback({ type: 'error', text: msg })
    } finally {
      setIsDeleting(false)
    }
  }

  // Open Add Subcategory Modal
  const handleOpenAddSub = (cat: Category) => {
    setTargetCategory(cat)
    setSubName('')
    setSubDescription('')
    setSubModalOpen(true)
  }

  // Save Subcategory
  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetCategory || !subName.trim()) return

    setIsSavingSub(true)
    try {
      await api.post(`/categories/${targetCategory.id}/subcategories`, {
        name: subName.trim(),
        description: subDescription.trim() || null,
      })
      setFeedback({
        type: 'success',
        text: `Subkategori "${subName}" berhasil ditambahkan ke ${targetCategory.name}.`,
      })
      setSubModalOpen(false)
      fetchCategories()
    } catch (err: unknown) {
      let msg = 'Gagal menambahkan subkategori.'
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string } } }
        msg = ax.response?.data?.message || msg
      }
      setFeedback({ type: 'error', text: msg })
    } finally {
      setIsSavingSub(false)
    }
  }

  // Delete Subcategory
  const handleDeleteSub = async () => {
    if (!deleteSubTarget) return
    setIsDeleting(true)
    try {
      await api.delete(
        `/categories/${deleteSubTarget.catId}/subcategories/${deleteSubTarget.sub.id}`
      )
      setFeedback({
        type: 'success',
        text: `Subkategori "${deleteSubTarget.sub.name}" berhasil dihapus.`,
      })
      setDeleteSubTarget(null)
      fetchCategories()
    } catch (err: unknown) {
      let msg = 'Gagal menghapus subkategori.'
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string } } }
        msg = ax.response?.data?.message || msg
      }
      setFeedback({ type: 'error', text: msg })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Klasifikasi &amp; Modus Kejahatan
          </h1>
        </div>

        <button
          type="button"
          onClick={handleOpenAddCategory}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Tambah Kategori Baru</span>
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

      {/* Category Cards List */}
      {isLoading ? (
        <SkeletonTable rows={4} cols={4} />
      ) : categories.length > 0 ? (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all hover:border-slate-300"
            >
              {/* Category Header */}
              <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <TagIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{cat.name}</h2>
                    {cat.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleOpenAddSub(cat)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>Tambah Modus</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEditCategory(cat)}
                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-md transition-colors"
                    title="Edit Kategori"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteCategoryTarget(cat)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                    title="Hapus Kategori"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Subcategories list */}
              <div className="p-4 sm:p-5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                  Subkategori / Ragam Modus:
                </span>
                {cat.subcategories && cat.subcategories.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {cat.subcategories.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 flex items-center justify-between group hover:bg-slate-100/60 transition-colors"
                      >
                        <div className="truncate pr-2">
                          <span className="text-xs font-semibold text-slate-800 block truncate">
                            {sub.name}
                          </span>
                          {sub.description && (
                            <span className="text-[10px] text-slate-500 block truncate">
                              {sub.description}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setDeleteSubTarget({ catId: cat.id, sub })}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                          title="Hapus Subkategori"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Belum ada subkategori modus untuk kategori ini.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Belum ada kategori yang dibuat"
          description="Tambahkan klasifikasi kategori pertama untuk mengelompokkan laporan kejahatan siber."
          actionLabel="Tambah Kategori Pertama"
          onAction={handleOpenAddCategory}
        />
      )}

      {/* Modal Add / Edit Category */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title={editingCategory ? 'Sunting Kategori' : 'Tambah Kategori Baru'}
        size="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Nama Kategori <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Contoh: Pemerasan Digital"
              required
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Deskripsi Singkat
            </label>
            <textarea
              rows={3}
              value={catDescription}
              onChange={(e) => setCatDescription(e.target.value)}
              placeholder="Penjelasan ringkas mengenai lingkup kejahatan dalam kategori ini..."
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCategoryModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSavingCategory || !catName.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50"
            >
              {isSavingCategory ? 'Menyimpan...' : 'Simpan Kategori'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Add Subcategory */}
      <Modal
        isOpen={subModalOpen}
        onClose={() => setSubModalOpen(false)}
        title={`Tambah Subkategori pada "${targetCategory?.name}"`}
        size="md"
      >
        <form onSubmit={handleSaveSub} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Nama Subkategori / Modus <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              placeholder="Contoh: Skema Ponzi / Romance Scam"
              required
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Keterangan Modus
            </label>
            <textarea
              rows={3}
              value={subDescription}
              onChange={(e) => setSubDescription(e.target.value)}
              placeholder="Uraian pola atau mekanisme kejahatan terkait..."
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSubModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSavingSub || !subName.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50"
            >
              {isSavingSub ? 'Menyimpan...' : 'Tambah Subkategori'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Category Modal */}
      <ConfirmModal
        isOpen={!!deleteCategoryTarget}
        onClose={() => setDeleteCategoryTarget(null)}
        onConfirm={handleDeleteCategory}
        title="Konfirmasi Hapus Kategori"
        message={`Apakah Anda yakin ingin menghapus kategori "${deleteCategoryTarget?.name}"? Penghapusan akan ditolak jika masih terdapat data kasus yang menggunakan kategori ini.`}
        confirmText="Hapus Kategori"
        cancelText="Batal"
        isDestructive={true}
        isLoading={isDeleting}
      />

      {/* Confirm Delete Subcategory Modal */}
      <ConfirmModal
        isOpen={!!deleteSubTarget}
        onClose={() => setDeleteSubTarget(null)}
        onConfirm={handleDeleteSub}
        title="Konfirmasi Hapus Subkategori"
        message={`Apakah Anda yakin ingin menghapus subkategori "${deleteSubTarget?.sub.name}"? Penghapusan akan ditolak jika masih terdapat kasus yang tertaut pada subkategori ini.`}
        confirmText="Hapus Subkategori"
        cancelText="Batal"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  )
}
