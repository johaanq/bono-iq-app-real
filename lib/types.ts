// src/lib/types.ts
import type { LucideIcon } from "lucide-react"

// ============================================================================
// DATABASE ENTITIES
// ============================================================================

export interface User {
    id: string
    email: string
    role: UserRole
    created_at: string
    updated_at: string
}

export interface Profile {
    id: string
    user_id: string
    first_name: string
    last_name: string
    phone?: string
    address?: string
    city?: string
    country?: string
    birth_date?: string
    ruc?: string
    company_name?: string
    position?: string
    website?: string
    bio?: string
    avatar_url?: string
    role: UserRole
    created_at: string
    updated_at: string
}

export interface Bond {
    id: string
    emisor_id: string
    name: string
    description?: string
    nominal_value: number
    interest_rate: number
    discount_rate: number
    rate_type: RateType
    grace_period: GracePeriod
    emission_expenses: number
    placement_expenses: number
    structuring_expenses: number
    cavali_expenses: number
    emission_date: string
    term_years: number
    payment_frequency: PaymentFrequency
    status: BondStatus
    created_at: string
    updated_at: string
}

export interface Investment {
    id: string
    investor_id: string
    bond_id: string
    amount: number
    investment_date: string
    status: InvestmentStatus
    expected_return: number
    maturity_date: string
    created_at: string
    updated_at: string
}

export interface Payment {
    id: string
    investment_id: string
    amount: number
    scheduled_date: string
    payment_date?: string
    type: PaymentType
    status: PaymentStatus
    coupon_number?: number
    interest?: number
    principal?: number
    remaining_balance?: number
    created_at: string
    updated_at: string
}

export interface Document {
    id: string
    bond_id: string
    name: string
    type: DocumentType
    url: string
    size: number
    created_at: string
}

export type BondFilters = {
    search?: string
    status?: string[]
    interest_rate_min?: number
    interest_rate_max?: number
    term_years_min?: number
    term_years_max?: number
    amount_min?: number
    amount_max?: number
    emisor_id?: string
    sort_by?: string
    sort_order?: "asc" | "desc"
}

export type InvestmentFilters = {
    search?: string
    status?: string[]
    bond_id?: string
    investment_date_from?: string
    investment_date_to?: string
    amount_min?: number
    amount_max?: number
    sort_by?: string
    sort_order?: "asc" | "desc"
}

export type PaymentFilters = {
    status?: string[]
    type?: string[]
    scheduled_date_from?: string
    scheduled_date_to?: string
    investment_id?: string
    sort_by?: string
    sort_order?: "asc" | "desc"
}

// ============================================================================
// ENUMS
// ============================================================================

export type UserRole = "inversionista" | "emisor" | "admin"

export type BondStatus = "active" | "inactive" | "matured"

export type InvestmentStatus = "active" | "completed" | "cancelled" | "matured"

export type PaymentStatus = "pending" | "paid" | "overdue" | "cancelled"

export type PaymentType = "coupon" | "principal" | "coupon_principal"

export type PaymentFrequency = "anual" | "semestral" | "trimestral" | "mensual"

export type RateType = "efectiva" | "nominal"

export type GracePeriod = "sin_gracia" | "gracia_parcial" | "gracia_total"

export type RiskRating = "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "CCC" | "CC" | "C" | "D"

export type DocumentType = "prospecto" | "estados_financieros" | "calificacion_riesgo" | "garantias" | "otros"

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

export interface NavItem {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
        title: string
        url: string
    }[]
}

// ============================================================================
// EXTENDED TYPES WITH RELATIONS
// ============================================================================

export interface ProfileWithUser extends Profile {
    user: User
}

export interface BondWithIssuer extends Bond {
    emisor: Profile
}

export interface BondWithStats extends Bond {
    emisor: Profile
    total_investments: number
    number_investors: number
    completion_percentage: number
    available_amount: number
}

export interface InvestmentWithBond extends Investment {
    bond: Bond
}

export interface InvestmentWithDetails extends Investment {
    bond: BondWithIssuer
    payments: Payment[]
    total_paid: number
    next_payment?: Payment
}

export interface PaymentWithInvestment extends Payment {
    investment: InvestmentWithBond
}

// ============================================================================
// FORM TYPES
// ============================================================================

export type SignUpForm = {
    nombre: string
    apellido: string
    email: string
    password: string
    confirmPassword: string
    rol: "inversionista" | "emisor"
    ruc?: string
}

export interface LoginForm {
    email: string
    password: string
}

export interface ResetPasswordForm {
    email: string
}

export interface UpdatePasswordForm {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

export interface UpdateProfileForm {
    first_name: string
    last_name: string
    phone?: string
    address?: string
    city?: string
    country?: string
    birth_date?: string | null
    ruc?: string
    company_name?: string
    position?: string
    website?: string
    bio?: string
    avatar_url?: string
}

export interface CreateBondForm {
    name: string
    description?: string
    nominal_value: number
    interest_rate: number
    discount_rate: number
    rate_type: RateType
    grace_period: GracePeriod
    emission_expenses: number
    placement_expenses: number
    structuring_expenses: number
    cavali_expenses: number
    emission_date: string
    term_years: number
    payment_frequency: PaymentFrequency
}

export interface UpdateBondForm extends Partial<CreateBondForm> {
    status?: BondStatus
}

export interface CreateInvestmentForm {
    bond_id: string
    amount: number
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface DashboardStats {
    totalBonds: number
    activeBonds: number
    totalInvestments: number
    activeInvestments: number
    totalInvested: number
    totalReturns: number
    averageRate: number
    portfolioValue: number
}

// ============================================================================
// CALCULATION TYPES
// ============================================================================

export interface AmortizationRow {
    periodo: number
    fecha: string
    saldo_inicial: number
    cupon: number
    amortizacion: number
    flujo_total: number
    saldo_final: number
}

export interface BondCalculation {
    investment_amount: number
    interest_rate: number
    term_years: number
    payment_frequency: PaymentFrequency
    grace_period?: GracePeriod
    schedule: AmortizationRow[]
    total_interest: number
    total_to_receive: number
    periodic_payment?: number
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export interface ApiError {
    message: string
    code?: string
    details?: Record<string, unknown>
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginationParams {
    page?: number
    limit?: number
}

export interface PaginatedResponse<T> {
    data: T[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
    }
}