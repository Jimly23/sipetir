import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  UserIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ClockIcon,
  BanknotesIcon,
  CalendarIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline'
import api, { formatDate } from '../../services/api'
import { CaseRecord, User } from '../../types'
import { StatusBadge } from '../../components/common/Badge'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { Modal } from '../../components/common/Modal'
import { useAuth } from '../../contexts/AuthContext'

export const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, hasRole } = useAuth()

  const [caseData, setCaseData] = useState<CaseRecord | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Assignment Modal State for Admin & Pimpinan
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false)
  const [officers, setOfficers] = useState<User[]>([])
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState<boolean>(false)
  const [assignFeedback, setAssignFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const fetchCase = async () => {
      setIsLoading(true)
      try {
        const res = await api.get(`/cases/${id}`)
        setCaseData(res.data.data)
      } catch (err) {
        console.error('Failed to load case detail', err)
        setError('Kasus tidak ditemukan atau Anda tidak memiliki hak akses.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchCase()
  }, [id])

  const canEdit = hasRole(['admin', 'pimpinan', 'penyidik'])
  const canAssign = hasRole(['admin', 'pimpinan'])

  const handleOpenAssignModal = async () => {
    setSelectedOfficerId(caseData?.officer_id ? caseData.officer_id.toString() : '')
    setIsAssignModalOpen(true)
    try {
      const res = await api.get('/officers')
      setOfficers(res.data.data)
    } catch (err) {
      console.error('Failed to load officers', err)
    }
  }

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!caseData) return
    setIsAssigning(true)
    try {
      const res = await api.put(`/cases/${caseData.id}`, {
        officer_id: selectedOfficerId ? parseInt(selectedOfficerId) : null,
      })
      setCaseData(res.data.data)
      setIsAssignModalOpen(false)
      setAssignFeedback({
        type: 'success',
        text: 'Penunjukan penyidik penangan perkara berhasil diperbarui.',
      })
    } catch (err: unknown) {
      console.error('Failed to assign officer', err)
      let msg = 'Gagal menyimpan penunjukan penyidik.'
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string } } }
        msg = ax.response?.data?.message || msg
      }
      setAssignFeedback({ type: 'error', text: msg })
    } finally {
      setIsAssigning(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="Memuat berkas perkara..." />
  }

  if (error || !caseData) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {error || 'Data berkas tidak dapat ditemukan.'}
        </div>
        <button
          onClick={() => navigate('/cases')}
          className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg"
        >
          Kembali ke Daftar Kasus
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/cases"
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Kembali ke Daftar"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono text-slate-900">
                {caseData.case_number}
              </h1>
              <StatusBadge status={caseData.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tercatat dalam sistem sejak {formatDate(caseData.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Cetak Berkas"
          >
            <PrinterIcon className="w-4 h-4" />
            <span>Cetak Berkas</span>
          </button>

          {canEdit && (
            <Link
              to={`/cases/${caseData.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <PencilSquareIcon className="w-4 h-4" />
              <span>Sunting Kasus</span>
            </Link>
          )}
        </div>
      </div>

      {/* Alert Penunjukan */}
      {assignFeedback && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between animate-in fade-in ${
            assignFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{assignFeedback.text}</span>
          <button
            type="button"
            onClick={() => setAssignFeedback(null)}
            className="text-xs font-semibold underline ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Case Details & Chronology (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* Card 1: Informasi Kasus & Kerugian */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center gap-2">
              <DocumentTextIcon className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Rincian Perkara &amp; Kerugian
              </h2>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                    Kategori Kejahatan
                  </span>
                  <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                    {caseData.category?.name || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                    Subkategori / Modus
                  </span>
                  <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                    {caseData.subcategory?.name || '-'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                  Total Kerugian Finansial Korban
                </span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  {caseData.material_loss_formatted}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">
                      Tgl Kejadian
                    </span>
                    <span className="font-semibold text-slate-700">
                      {formatDate(caseData.incident_date)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">
                      Tgl Laporan
                    </span>
                    <span className="font-semibold text-slate-700">
                      {formatDate(caseData.report_date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Kronologi Kejadian */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Kronologi Kejadian / Keterangan Kasus
              </h2>
            </div>
            <div className="p-5 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {caseData.description || (
                <span className="text-slate-400 italic">
                  Tidak ada keterangan kronologi rinci yang dicatat untuk kasus ini.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Pelapor & Petugas (1 col) */}
        <div className="space-y-6">
          {/* Card 3: Informasi Pelapor */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Profil Pelapor
              </h2>
            </div>
            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase block">
                  Nama Lengkap
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {caseData.reporter_name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase block">
                    Gender
                  </span>
                  <span className="font-medium text-slate-700 capitalize">
                    {caseData.reporter_gender || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase block">
                    Umur
                  </span>
                  <span className="font-medium text-slate-700">
                    {caseData.reporter_age ? `${caseData.reporter_age} Tahun` : '-'}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase block">
                  Pekerjaan
                </span>
                <span className="font-medium text-slate-700">
                  {caseData.reporter_occupation || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Penugasan & Audit Trail */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Penugasan &amp; Audit Trail
              </h2>
            </div>
            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-slate-400 uppercase">
                    Petugas Penangan (Penyidik)
                  </span>
                  {canAssign && (
                    <button
                      type="button"
                      onClick={handleOpenAssignModal}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {caseData.officer ? 'Ubah Penyidik' : 'Tunjuk Penyidik'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-sm">
                    {caseData.officer?.name || (
                      <span className="text-slate-400 italic font-normal">Belum ditunjuk</span>
                    )}
                  </span>
                  {caseData.officer && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium border border-amber-200">
                      PENYIDIK
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase block">
                  Pencatat Pertama (Registrator)
                </span>
                <span className="font-medium text-slate-700">
                  {caseData.creator?.name || 'Sistem'}
                </span>
              </div>
              {caseData.updater && (
                <div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase block">
                    Terakhir Diperbarui Oleh
                  </span>
                  <span className="font-medium text-slate-700">
                    {caseData.updater.name}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
                <p>Dibuat: {formatDate(caseData.created_at)}</p>
                <p>Pembaruan: {formatDate(caseData.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BAGIAN: Progress Status Kasus - Full Width */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center gap-2">
          <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Progress Status Kasus
          </h2>
        </div>
        <div className="p-5">
          {(() => {
            const STATUS_STEPS = [
              { value: 'laporan_masuk', label: 'Laporan Masuk' },
              { value: 'dalam_penyelidikan', label: 'Dalam Penyelidikan' },
              { value: 'henti_lidik', label: 'Henti Lidik' },
              { value: 'naik_penyidikan', label: 'Naik Penyidikan' },
              { value: 'p19', label: 'P-19 (Berkas & BB Tidak Lengkap)' },
              { value: 'p21', label: 'P-21 (Berkas & BB Lengkap)' },
              { value: 'sp3_kurang_bukti', label: 'SP3 (Kurang Bukti)' },
              { value: 'sp3_restoratif_justice', label: 'SP3 (Restoratif Justice)' },
              { value: 'selesai', label: 'Selesai' },
            ];
            const currentIdx = STATUS_STEPS.findIndex(s => s.value === caseData.status);

            return (
              <div className="space-y-1">
                {STATUS_STEPS.map((step, idx) => {
                  const isPassed = idx < currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div
                      key={step.value}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs ${
                        isCurrent
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : isPassed
                          ? 'bg-emerald-50/60 border border-emerald-200'
                          : 'bg-slate-50/40 border border-slate-200/60 opacity-50'
                      }`}
                    >
                      {/* Step indicator */}
                      <div
                        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] ${
                          isCurrent
                            ? 'bg-blue-600 text-white shadow-sm'
                            : isPassed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {isPassed ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          idx + 1
                        )}
                      </div>

                      {/* Label */}
                      <span
                        className={`font-semibold ${
                          isCurrent
                            ? 'text-blue-800'
                            : isPassed
                            ? 'text-emerald-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </span>

                      {/* Badge */}
                      {isCurrent && (
                        <span className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
                          PROSES
                        </span>
                      )}
                      {isPassed && (
                        <span className="ml-auto text-[10px] font-semibold text-emerald-600">
                          Terlewati ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Modal Tunjuk Penyidik (Khusus Admin & Pimpinan) */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Penunjukan Penyidik - ${caseData.case_number}`}
        size="md"
      >
        <form onSubmit={handleSaveAssignment} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Pilih Penyidik Penangan
            </label>
            <p className="text-[11px] text-slate-500 mb-2.5">
              Sebagai {user?.role === 'pimpinan' ? 'Pimpinan' : 'Administrator'}, Anda berwenang menunjuk personel penyidik untuk menangani berkas perkara ini.
            </p>
            <select
              value={selectedOfficerId}
              onChange={(e) => setSelectedOfficerId(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">-- Belum Ditunjuk / Kosongkan --</option>
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isAssigning}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isAssigning ? 'Menyimpan...' : 'Simpan Penunjukan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
