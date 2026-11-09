export type UserRole = 'admin' | 'pimpinan' | 'operator' | 'penyidik'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Subcategory {
  id: number
  category_id: number
  name: string
  slug: string
  description?: string
  is_active: boolean
  cases_count?: number
  created_at?: string
  updated_at?: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  is_active: boolean
  subcategories: Subcategory[]
  cases_count?: number
  created_at?: string
  updated_at?: string
}

export type CaseStatus =
  | 'laporan_masuk'
  | 'dalam_penyelidikan'
  | 'dalam_penyidikan'
  | 'p21'
  | 'sp3'
  | 'selesai'

export interface CaseRecord {
  id: number
  case_number: string
  reporter_name: string
  reporter_gender?: 'laki-laki' | 'perempuan' | null
  reporter_age?: number | null
  reporter_occupation?: string | null
  category_id: number
  category?: Category
  subcategory_id: number
  subcategory?: Subcategory
  material_loss: number
  material_loss_formatted: string
  incident_date: string
  report_date: string
  description?: string | null
  status: CaseStatus
  status_label: string
  officer_id?: number | null
  officer?: User | null
  created_by?: number
  creator?: User | null
  updated_by?: number | null
  updater?: User | null
  created_at: string
  updated_at: string
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ApiResponse<T> {
  message?: string
  data: T
  meta?: PaginationMeta
}

export interface DashboardSummary {
  total_cases: number
  total_loss: number
  total_loss_formatted: string
}

export interface StatusDistributionItem {
  status: CaseStatus
  label: string
  total: number
}

export interface MonthlyTrendItem {
  month: number
  month_name: string
  total: number
  loss: number
}

export interface CategoryStatItem {
  id: number
  name: string
  total: number
  loss: number
}

export interface RecentCaseItem {
  id: number
  case_number: string
  reporter_name: string
  category?: string
  subcategory?: string
  material_loss: number
  material_loss_formatted: string
  status: CaseStatus
  status_label: string
  report_date: string
  officer?: string | null
}

export interface DashboardData {
  year: number
  month: number | null
  summary: DashboardSummary
  status_distribution: StatusDistributionItem[]
  monthly_trend: MonthlyTrendItem[]
  by_category: CategoryStatItem[]
  recent_cases: RecentCaseItem[]
}

export interface ReportCategoryItem {
  name: string
  total: number
  loss: number
  loss_formatted: string
}

export interface ReportData {
  summary: DashboardSummary
  by_category: ReportCategoryItem[]
  by_status: StatusDistributionItem[]
  cases: CaseRecord[]
}
