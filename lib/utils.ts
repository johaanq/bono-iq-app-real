import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PaymentFrequency, Bond, AmortizationRow } from "@/lib/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function validateRequired(value: string | undefined | null): boolean {
  return Boolean(value && value.trim().length > 0)
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  // Validates Peruvian phone numbers: +51 999 999 999 or 999999999
  const phoneRegex = /^(\+51\s?)?[9]\d{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}

export function validateRUC(ruc: string): boolean {
  // Validates Peruvian RUC: 11 digits starting with 10, 15, 17, or 20
  const rucRegex = /^(10|15|17|20)\d{9}$/
  return rucRegex.test(ruc)
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  if (password.length < 8) errors.push("Debe tener al menos 8 caracteres")
  if (!/[A-Z]/.test(password)) errors.push("Debe tener una letra mayúscula")
  if (!/[a-z]/.test(password)) errors.push("Debe tener una letra minúscula")
  if (!/\d/.test(password)) errors.push("Debe tener un número")
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Debe tener un carácter especial")
  return { isValid: errors.length === 0, errors }
}

export function validatePositiveNumber(value: number): boolean {
  return typeof value === "number" && value > 0 && !isNaN(value)
}

export function validatePercentage(value: number): boolean {
  return typeof value === "number" && value >= 0 && value <= 100 && !isNaN(value)
}

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

export function formatCurrency(amount: number, currency = "PEN"): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(number: number): string {
  return new Intl.NumberFormat("es-PE").format(number)
}

export function formatPercentage(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`
}

export function formatDate(date: string | Date, format: "short" | "long" | "relative" = "short"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date

  if (format === "relative") {
    const now = new Date()
    const diffInMs = now.getTime() - dateObj.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Hoy"
    if (diffInDays === 1) return "Ayer"
    if (diffInDays < 7) return `Hace ${diffInDays} días`
    if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semanas`
    if (diffInDays < 365) return `Hace ${Math.floor(diffInDays / 30)} meses`
    return `Hace ${Math.floor(diffInDays / 365)} años`
  }

  const options: Intl.DateTimeFormatOptions =
      format === "long"
          ? { year: "numeric", month: "long", day: "numeric" }
          : { year: "numeric", month: "2-digit", day: "2-digit" }

  return dateObj.toLocaleDateString("es-PE", options)
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

export function calculateDaysToMaturity(emissionDate: string, termYears: number): number {
  const today = new Date()
  const emission = new Date(emissionDate)
  const maturity = new Date(emission)
  maturity.setFullYear(maturity.getFullYear() + termYears)

  const diffInMs = maturity.getTime() - today.getTime()
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24))
}

export function calculateYield(principal: number, interest: number, months: number): number {
  return (interest / principal) * (12 / months) * 100
}

export function calculateCompoundInterest(principal: number, rate: number, time: number, frequency = 12): number {
  return principal * Math.pow(1 + rate / frequency, frequency * time)
}

export function calculateAmortization(bond: Bond): AmortizationRow[] {
  const rows: AmortizationRow[] = []
  const periodsPerYear = getPeriodsPerYear(bond.payment_frequency)
  const totalPeriods = bond.term_years * periodsPerYear
  const periodRate = bond.interest_rate / 100 / periodsPerYear
  const couponPayment = bond.nominal_value * periodRate

  const emissionDate = new Date(bond.emission_date)

  for (let i = 1; i <= totalPeriods; i++) {
    const paymentDate = new Date(emissionDate)
    paymentDate.setMonth(paymentDate.getMonth() + (12 / periodsPerYear) * i)

    const isLastPeriod = i === totalPeriods
    const amortization = isLastPeriod ? bond.nominal_value : 0
    const totalFlow = couponPayment + amortization

    rows.push({
      periodo: i,
      fecha: paymentDate.toISOString().split("T")[0],
      saldo_inicial: bond.nominal_value,
      cupon: couponPayment,
      amortizacion: amortization,
      flujo_total: totalFlow,
      saldo_final: isLastPeriod ? 0 : bond.nominal_value,
    })
  }

  return rows
}

function getPeriodsPerYear(frequency: PaymentFrequency): number {
  switch (frequency) {
    case "mensual":
      return 12
    case "trimestral":
      return 4
    case "semestral":
      return 2
    case "anual":
      return 1
    default:
      return 2
  }
}

// ============================================================================
// STRING FUNCTIONS
// ============================================================================

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

export function slugify(text: string): string {
  return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9 -]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .trim()
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function capitalizeWords(text: string): string {
  return text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}

// ============================================================================
// ARRAY FUNCTIONS
// ============================================================================

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
      (groups, item) => {
        const group = String(item[key])
        groups[group] = groups[group] || []
        groups[group].push(item)
        return groups
      },
      {} as Record<string, T[]>,
  )
}

export function sortBy<T>(array: T[], key: keyof T, direction: "asc" | "desc" = "asc"): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]

    if (aVal == null && bVal == null) return 0
    if (aVal == null) return direction === "asc" ? -1 : 1
    if (bVal == null) return direction === "asc" ? 1 : -1

    if (aVal < bVal) return direction === "asc" ? -1 : 1
    if (aVal > bVal) return direction === "asc" ? 1 : -1
    return 0
  })
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)]
}

// ============================================================================
// OBJECT FUNCTIONS
// ============================================================================

export function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj }
  keys.forEach((key) => delete result[key])
  return result
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

// ============================================================================
// URL FUNCTIONS
// ============================================================================

export function buildUrl(base: string, params: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(base, window.location.origin)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  })
  return url.toString()
}

export function getQueryParams(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const params = new URLSearchParams(window.location.search)
  const result: Record<string, string> = {}
  params.forEach((value, key) => {
    result[key] = value
  })
  return result
}

// ============================================================================
// LOCAL STORAGE FUNCTIONS
// ============================================================================

export function setLocalStorage(key: string, value: unknown): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error("Error setting localStorage:", error)
  }
}

export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error("Error getting localStorage:", error)
    return defaultValue
  }
}

export function removeLocalStorage(key: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(key)
  } catch (error) {
    console.error("Error removing localStorage:", error)
  }
}

// ============================================================================
// DEBOUNCE FUNCTION
// ============================================================================

export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return function (this: unknown, ...args: Parameters<T>) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Ha ocurrido un error inesperado"
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}
