import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request interceptor to attach bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hakam_auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle unauthenticated 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('hakam_auth_token')
      localStorage.removeItem('hakam_auth_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Helper formatters
export function formatRupiah(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '-'
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

export const STATUS_MAP: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  laporan_masuk: {
    label: 'Laporan Masuk',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  dalam_penyelidikan: {
    label: 'Dalam Penyelidikan',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  dalam_penyidikan: {
    label: 'Dalam Penyidikan',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  p21: {
    label: 'P-21 (Lengkap)',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  sp3: {
    label: 'SP3 (Dihentikan)',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  selesai: {
    label: 'Selesai',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
}

export const ROLE_MAP: Record<
  string,
  { label: string; badgeClass: string }
> = {
  admin: {
    label: 'Administrator',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  pimpinan: {
    label: 'Pimpinan',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  operator: {
    label: 'Operator',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  penyidik: {
    label: 'Penyidik',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
}
