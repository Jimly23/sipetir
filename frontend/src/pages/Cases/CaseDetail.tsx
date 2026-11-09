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
import { CaseRecord } from '../../types'
import { StatusBadge } from '../../components/common/Badge'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'

export const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasRole } = useAuth()

  const [caseData, setCaseData] = useState<CaseRecord | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

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

  const canEdit = hasRole(['admin', 'operator', 'penyidik'])

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
                <span className="text-[10px] font-medium text-slate-400 uppercase block">
                  Petugas Penangan
                </span>
                <span className="font-semibold text-slate-800">
                  {caseData.officer?.name || (
                    <span className="text-slate-400 italic">Belum ditunjuk</span>
                  )}
                </span>
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
    </div>
  )
}
