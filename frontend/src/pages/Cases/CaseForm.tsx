import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeftIcon,
  UserIcon,
  DocumentTextIcon,
  ShieldExclamationIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import api, { formatRupiah } from '../../services/api'
import { Category, Subcategory, User, CaseStatus } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'

export const CaseForm: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { hasRole } = useAuth()

  // Guard: Only admin, operator, penyidik can create/edit
  useEffect(() => {
    if (!hasRole(['admin', 'operator', 'penyidik'])) {
      navigate('/cases')
    }
  }, [hasRole, navigate])

  // Form State
  const [formData, setFormData] = useState({
    // Pelapor
    reporter_name: '',
    reporter_gender: 'laki-laki',
    reporter_age: '',
    reporter_occupation: '',
    // Kasus & Kerugian
    category_id: '',
    subcategory_id: '',
    material_loss: '0',
    incident_date: '',
    report_date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'laporan_masuk' as CaseStatus,
    officer_id: '',
  })

  // Metadata dropdowns
  const [categories, setCategories] = useState<Category[]>([])
  const [availableSubcategories, setAvailableSubcategories] = useState<Subcategory[]>([])
  const [officers, setOfficers] = useState<User[]>([])

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  // Fetch categories & officers
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, offRes] = await Promise.all([
          api.get('/categories'),
          api.get('/officers'),
        ])
        setCategories(catRes.data.data)
        setOfficers(offRes.data.data)
      } catch (err) {
        console.error('Error fetching metadata', err)
      }
    }
    fetchMetadata()
  }, [])

  // If edit mode, load existing case data
  useEffect(() => {
    if (isEdit) {
      const fetchCase = async () => {
        setIsLoading(true)
        try {
          const res = await api.get(`/cases/${id}`)
          const c = res.data.data
          setFormData({
            reporter_name: c.reporter_name || '',
            reporter_gender: c.reporter_gender || 'laki-laki',
            reporter_age: c.reporter_age ? c.reporter_age.toString() : '',
            reporter_occupation: c.reporter_occupation || '',
            category_id: c.category_id ? c.category_id.toString() : '',
            subcategory_id: c.subcategory_id ? c.subcategory_id.toString() : '',
            material_loss: c.material_loss ? c.material_loss.toString() : '0',
            incident_date: c.incident_date || '',
            report_date: c.report_date || '',
            description: c.description || '',
            status: c.status || 'laporan_masuk',
            officer_id: c.officer_id ? c.officer_id.toString() : '',
          })
        } catch (err) {
          console.error('Failed to load case data', err)
          setServerError('Gagal memuat data kasus untuk disunting.')
        } finally {
          setIsLoading(false)
        }
      }
      fetchCase()
    }
  }, [id, isEdit])

  // Update subcategories when category changes
  useEffect(() => {
    if (formData.category_id) {
      const selected = categories.find(
        (c) => c.id.toString() === formData.category_id.toString()
      )
      if (selected && selected.subcategories) {
        setAvailableSubcategories(selected.subcategories)
      } else {
        setAvailableSubcategories([])
      }
    } else {
      setAvailableSubcategories([])
    }
  }, [formData.category_id, categories])

  // Validation
  const validate = () => {
    const errors: Record<string, string> = {}
    const today = new Date().toISOString().split('T')[0]

    if (!formData.reporter_name.trim()) {
      errors.reporter_name = 'Nama pelapor wajib diisi.'
    }
    if (formData.reporter_age) {
      const age = parseInt(formData.reporter_age)
      if (isNaN(age) || age < 1 || age > 150) {
        errors.reporter_age = 'Umur harus berupa angka antara 1 sampai 150.'
      }
    }
    if (!formData.category_id) {
      errors.category_id = 'Kategori kejahatan wajib dipilih.'
    }
    if (!formData.subcategory_id) {
      errors.subcategory_id = 'Subkategori modus wajib dipilih.'
    }
    if (formData.material_loss === '' || isNaN(Number(formData.material_loss)) || Number(formData.material_loss) < 0) {
      errors.material_loss = 'Kerugian material harus berupa angka dan tidak boleh negatif.'
    }
    if (!formData.incident_date) {
      errors.incident_date = 'Tanggal kejadian wajib diisi.'
    } else if (formData.incident_date > today) {
      errors.incident_date = 'Tanggal kejadian tidak boleh melewati hari ini.'
    }
    if (!formData.report_date) {
      errors.report_date = 'Tanggal laporan wajib diisi.'
    } else if (formData.report_date > today) {
      errors.report_date = 'Tanggal laporan tidak boleh melewati hari ini.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    if (!validate()) return

    setIsSaving(true)
    try {
      const payload = {
        reporter_name: formData.reporter_name.trim(),
        reporter_gender: formData.reporter_gender || null,
        reporter_age: formData.reporter_age ? parseInt(formData.reporter_age) : null,
        reporter_occupation: formData.reporter_occupation.trim() || null,
        category_id: parseInt(formData.category_id),
        subcategory_id: parseInt(formData.subcategory_id),
        material_loss: parseFloat(formData.material_loss) || 0,
        incident_date: formData.incident_date,
        report_date: formData.report_date,
        description: formData.description.trim() || null,
        status: formData.status,
        officer_id: formData.officer_id ? parseInt(formData.officer_id) : null,
      }

      if (isEdit) {
        await api.put(`/cases/${id}`, payload)
      } else {
        await api.post('/cases', payload)
      }

      navigate('/cases')
    } catch (err: unknown) {
      console.error('Error saving case', err)
      let msg = 'Gagal menyimpan berkas kasus.'
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as {
          response?: { data?: { message?: string; errors?: Record<string, string[]> } }
        }
        if (axiosErr.response?.data?.errors) {
          const firstKey = Object.keys(axiosErr.response.data.errors)[0]
          msg = axiosErr.response.data.errors[firstKey][0]
        } else if (axiosErr.response?.data?.message) {
          msg = axiosErr.response.data.message
        }
      }
      setServerError(msg)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="Memuat berkas kasus..." />
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/cases"
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Kembali ke Daftar Kasus"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {isEdit ? 'Sunting Berkas Kasus' : 'Registrasi Kasus Baru'}
            </h1>
            <p className="text-xs text-slate-500">
              {isEdit
                ? 'Perbarui informasi pelapor, kronologi, dan status berkas.'
                : 'Lengkapi formulir terstruktur di bawah untuk memasukkan laporan perkara baru.'}
            </p>
          </div>
        </div>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
          <span>{serverError}</span>
          <button
            type="button"
            onClick={() => setServerError(null)}
            className="font-bold underline text-rose-900"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* BAGIAN 1: INFORMASI PELAPOR */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              1. Informasi Pelapor
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Nama Pelapor */}
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">
                Nama Lengkap Pelapor <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.reporter_name}
                onChange={(e) =>
                  setFormData({ ...formData, reporter_name: e.target.value })
                }
                placeholder="Contoh: Budi Santoso"
                className={`w-full py-2 px-3 bg-slate-50 border rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.reporter_name ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {formErrors.reporter_name && (
                <p className="mt-1 text-[11px] text-rose-600">
                  {formErrors.reporter_name}
                </p>
              )}
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Jenis Kelamin
              </label>
              <select
                value={formData.reporter_gender}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reporter_gender: e.target.value as 'laki-laki' | 'perempuan',
                  })
                }
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="laki-laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
              </select>
            </div>

            {/* Umur */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Umur (Tahun)
              </label>
              <input
                type="number"
                min="1"
                max="150"
                value={formData.reporter_age}
                onChange={(e) =>
                  setFormData({ ...formData, reporter_age: e.target.value })
                }
                placeholder="Contoh: 32"
                className={`w-full py-2 px-3 bg-slate-50 border rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.reporter_age ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {formErrors.reporter_age && (
                <p className="mt-1 text-[11px] text-rose-600">
                  {formErrors.reporter_age}
                </p>
              )}
            </div>

            {/* Pekerjaan */}
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">
                Pekerjaan Pelapor
              </label>
              <input
                type="text"
                value={formData.reporter_occupation}
                onChange={(e) =>
                  setFormData({ ...formData, reporter_occupation: e.target.value })
                }
                placeholder="Contoh: Wiraswasta / Karyawan Swasta / PNS"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* BAGIAN 2: INFORMASI KASUS & KERUGIAN */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              2. Informasi Kasus &amp; Kerugian
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Kategori Kejahatan */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Kategori Kejahatan <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category_id: e.target.value,
                    subcategory_id: '', // Reset subcategory when category changes
                  })
                }
                className={`w-full py-2 px-3 bg-slate-50 border rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.category_id ? 'border-rose-400' : 'border-slate-200'
                }`}
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {formErrors.category_id && (
                <p className="mt-1 text-[11px] text-rose-600">
                  {formErrors.category_id}
                </p>
              )}
            </div>

            {/* Subkategori Modus (Dependent Dropdown) */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Subkategori / Modus Kejahatan <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.subcategory_id}
                disabled={!formData.category_id}
                onChange={(e) =>
                  setFormData({ ...formData, subcategory_id: e.target.value })
                }
                className={`w-full py-2 px-3 bg-slate-50 border rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-100 ${
                  formErrors.subcategory_id ? 'border-rose-400' : 'border-slate-200'
                }`}
              >
                <option value="">
                  {formData.category_id
                    ? '-- Pilih Subkategori --'
                    : '-- Pilih kategori terlebih dahulu --'}
                </option>
                {availableSubcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {formErrors.subcategory_id && (
                <p className="mt-1 text-[11px] text-rose-600">
                  {formErrors.subcategory_id}
                </p>
              )}
            </div>

            {/* Total Kerugian Material */}
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">
                Total Kerugian Material (Rp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.material_loss}
                  onChange={(e) =>
                    setFormData({ ...formData, material_loss: e.target.value })
                  }
                  placeholder="0"
                  className={`w-full pl-10 pr-3 py-2 bg-slate-50 border rounded-lg text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.material_loss ? 'border-rose-400' : 'border-slate-200'
                  }`}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  Terbilang format rupiah:
                </span>
                <span className="font-semibold text-blue-600">
                  {formatRupiah(formData.material_loss || 0)}
                </span>
              </div>
              {formErrors.material_loss && (
                <p className="mt-1 text-[11px] text-rose-600">
                  {formErrors.material_loss}
                </p>
              )}
            </div>

            {/* Tanggal Kejadian */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Tanggal Kejadian <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={formData.incident_date}
                onChange={(e) =>
                  setFormData({ ...formData, incident_date: e.target.value })
                }
                className={`w-full py-2 px-3 bg-slate-50 border rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.incident_date ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {formErrors.incident_date && (
                <p className="mt-1 text-[11px] text-rose-600">
                  {formErrors.incident_date}
                </p>
              )}
            </div>

            {/* Tanggal Laporan */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Tanggal Laporan <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={formData.report_date}
                onChange={(e) =>
                  setFormData({ ...formData, report_date: e.target.value })
                }
                className={`w-full py-2 px-3 bg-slate-50 border rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.report_date ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {formErrors.report_date && (
                <p className="mt-1 text-[11px] text-rose-600">
                  {formErrors.report_date}
                </p>
              )}
            </div>

            {/* Status Kasus */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Status Kasus
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as CaseStatus })
                }
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="laporan_masuk">Laporan Masuk</option>
                <option value="dalam_penyelidikan">Dalam Penyelidikan</option>
                <option value="dalam_penyidikan">Dalam Penyidikan</option>
                <option value="p21">P-21 (Berkas Lengkap)</option>
                <option value="sp3">SP3 (Penghentian Penyidikan)</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>

            {/* Petugas yang Menangani */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Petugas Penangan
              </label>
              <select
                value={formData.officer_id}
                onChange={(e) =>
                  setFormData({ ...formData, officer_id: e.target.value })
                }
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Belum Ditunjuk --</option>
                {officers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Kronologi & Keterangan */}
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">
                Kronologi Kejadian / Keterangan Kasus
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Uraikan kronologi singkat kejadian perkara, modus operandi, akun atau nomor rekening terkait, dll..."
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/cases"
            className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                <span>{isEdit ? 'Simpan Perubahan' : 'Registrasikan Kasus'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
