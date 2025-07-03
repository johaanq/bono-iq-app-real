import {createClient, createClient as createBrowserClient} from "@/lib/supabase/client"
import type {
    Profile,
    Bond,
    Investment,
    Payment,
    BondWithIssuer,
    InvestmentWithDetails,
    PaymentWithInvestment,
    PaginatedResponse,
    PaginationParams,
    CreateBondForm,
    UpdateBondForm,
    CreateInvestmentForm,
    UpdateProfileForm,
    BondCalculation,
    PaymentFrequency,
    BondFilters,
    InvestmentFilters,
    PaymentFilters,
    AmortizationRow,
    GracePeriod,
    User
} from "@/lib/types"

// ============================================================================
// PROFILE QUERIES (cliente)
// ============================================================================

export async function getCurrentUser(): Promise<User | null> {
    try {
        const supabase = await createClient()
        const {
            data: { user: authUser },
            error: authError,
        } = await supabase.auth.getUser()
        if (authError || !authUser) return null
        const { data: user, error } = await supabase.from("users").select("*").eq("id", authUser.id).single()
        if (error) {
            console.error("Error getting user:", error)
            return null
        }
        return user
    } catch (error) {
        console.error("Error getting current user:", error)
        return null
    }
}

export async function getProfile(userId: string): Promise<Profile | null> {
    try {
        const supabase = createBrowserClient()
        const { data: profile, error } = await supabase.from("profiles").select("*").eq("user_id", userId).single()
        if (error) {
            console.error("Error getting profile:", error)
            return null
        }
        return profile
    } catch (error) {
        console.error("Error getting profile:", error)
        return null
    }
}

export async function updateProfile(userId: string, updates: UpdateProfileForm): Promise<Profile | null> {
    try {
        const supabase = createBrowserClient()
        const { data: profile, error } = await supabase
            .from("profiles")
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .select()
            .single()
        if (error) {
            console.error("Error updating profile:", error)
            return null
        }
        return profile
    } catch (error) {
        console.error("Error updating profile:", error)
        return null
    }
}

// ============================================================================
// BOND QUERIES (cliente)
// ============================================================================

export async function getBonds(filters: BondFilters = {}, pagination: PaginationParams = {}): Promise<Bond[]> {
    try {
        const supabase = createBrowserClient()
        const { page = 1, limit = 10 } = pagination
        const offset = (page - 1) * limit

        let query = supabase.from("bonds").select(`
            *,
            emisor:profiles!bonds_emisor_id_fkey(*)
        `)

        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
        }
        if (filters.status && filters.status.length > 0) {
            query = query.in("status", filters.status)
        }
        if (filters.interest_rate_min !== undefined) {
            query = query.gte("interest_rate", filters.interest_rate_min)
        }
        if (filters.interest_rate_max !== undefined) {
            query = query.lte("interest_rate", filters.interest_rate_max)
        }
        if (filters.term_years_min !== undefined) {
            query = query.gte("term_years", filters.term_years_min)
        }
        if (filters.term_years_max !== undefined) {
            query = query.lte("term_years", filters.term_years_max)
        }
        if (filters.amount_min !== undefined) {
            query = query.gte("nominal_value", filters.amount_min)
        }
        if (filters.amount_max !== undefined) {
            query = query.lte("nominal_value", filters.amount_max)
        }
        if (filters.emisor_id) {
            query = query.eq("emisor_id", filters.emisor_id)
        }
        if (filters.sort_by) {
            query = query.order(filters.sort_by, { ascending: filters.sort_order === "asc" })
        } else {
            query = query.order("created_at", { ascending: false })
        }

        query = query.range(offset, offset + limit - 1)
        const { data, error } = await query
        if (error) {
            console.error("Error getting bonds:", error)
            return []
        }
        return data || []
    } catch (error) {
        console.error("Error getting bonds:", error)
        return []
    }
}

export async function getBond(id: string): Promise<BondWithIssuer | null> {
    try {
        const supabase = createBrowserClient()
        const { data: bond, error } = await supabase
            .from("bonds")
            .select(`
                *,
                emisor:profiles!bonds_emisor_id_fkey(*)
            `)
            .eq("id", id)
            .single()
        if (error) {
            console.error("Error getting bond:", error)
            return null
        }
        return bond
    } catch (error) {
        console.error("Error getting bond:", error)
        return null
    }
}

export async function createBond(bondData: CreateBondForm, emisorId: string): Promise<Bond | null> {
    try {
        const supabase = createBrowserClient()
        const { data: bond, error } = await supabase
            .from("bonds")
            .insert({
                ...bondData,
                emisor_id: emisorId,
                status: "inactive",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single()
        if (error) {
            console.error("Error creating bond:", error)
            return null
        }
        return bond
    } catch (error) {
        console.error("Error creating bond:", error)
        return null
    }
}

export async function updateBond(id: string, updates: UpdateBondForm): Promise<Bond | null> {
    try {
        const supabase = createBrowserClient()
        const { data: bond, error } = await supabase
            .from("bonds")
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single()
        if (error) {
            console.error("Error updating bond:", error)
            return null
        }
        return bond
    } catch (error) {
        console.error("Error updating bond:", error)
        return null
    }
}

export async function deleteBond(id: string): Promise<boolean> {
    try {
        const supabase = createBrowserClient()
        const { error } = await supabase.from("bonds").delete().eq("id", id)
        if (error) {
            console.error("Error deleting bond:", error)
            return false
        }
        return true
    } catch (error) {
        console.error("Error deleting bond:", error)
        return false
    }
}

// ============================================================================
// INVESTMENT QUERIES (cliente)
// ============================================================================

export async function getInvestments(
    filters: InvestmentFilters = {},
    pagination: PaginationParams = {},
): Promise<PaginatedResponse<InvestmentWithDetails>> {
    try {
        const supabase = createBrowserClient()
        const { page = 1, limit = 10 } = pagination
        const offset = (page - 1) * limit

        let query = supabase.from("investments").select(`
            *,
            bond:bonds(*, emisor:profiles!bonds_emisor_id_fkey(*)),
            payments(*)
        `)

        if (filters.search) {
            query = query.or(`bond.name.ilike.%${filters.search}%`)
        }
        if (filters.status && filters.status.length > 0) {
            query = query.in("status", filters.status)
        }
        if (filters.bond_id) {
            query = query.eq("bond_id", filters.bond_id)
        }
        if (filters.investment_date_from) {
            query = query.gte("investment_date", filters.investment_date_from)
        }
        if (filters.investment_date_to) {
            query = query.lte("investment_date", filters.investment_date_to)
        }
        if (filters.amount_min !== undefined) {
            query = query.gte("amount", filters.amount_min)
        }
        if (filters.amount_max !== undefined) {
            query = query.lte("amount", filters.amount_max)
        }
        if (filters.sort_by) {
            query = query.order(filters.sort_by, { ascending: filters.sort_order === "asc" })
        } else {
            query = query.order("investment_date", { ascending: false })
        }

        query = query.range(offset, offset + limit - 1)
        const { data, error, count } = await query
        if (error) {
            console.error("Error getting investments:", error)
            return {
                data: [],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false,
                },
            }
        }

        const investmentsWithDetails: InvestmentWithDetails[] = (data || []).map((investment) => {
            const payments = investment.payments || []
            const totalPaid = payments
                .filter((p: Payment) => p.status === "paid")
                .reduce((sum: number, p: Payment) => sum + p.amount, 0)
            const nextPayment = payments
                .filter((p: Payment) => p.status === "pending")
                .sort(
                    (a: Payment, b: Payment) =>
                        new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime(),
                )[0]
            return {
                ...investment,
                total_paid: totalPaid,
                next_payment: nextPayment,
            }
        })

        return {
            data: investmentsWithDetails,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
                hasNext: offset + limit < (count || 0),
                hasPrev: page > 1,
            },
        }
    } catch (error) {
        console.error("Error getting investments:", error)
        return {
            data: [],
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            },
        }
    }
}

export async function getInvestment(id: string): Promise<InvestmentWithDetails | null> {
    try {
        const supabase = createBrowserClient()
        const { data, error } = await supabase
            .from("investments")
            .select(`
                *,
                bond:bonds(*, emisor:profiles!bonds_emisor_id_fkey(*)),
                payments(*)
            `)
            .eq("id", id)
            .single()
        if (error) {
            console.error("Error getting investment:", error)
            return null
        }
        const payments = data.payments || []
        const totalPaid = payments
            .filter((p: Payment) => p.status === "paid")
            .reduce((sum: number, p: Payment) => sum + p.amount, 0)
        const nextPayment = payments
            .filter((p: Payment) => p.status === "pending")
            .sort(
                (a: Payment, b: Payment) =>
                    new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime(),
            )[0]
        return {
            ...data,
            total_paid: totalPaid,
            next_payment: nextPayment,
        }
    } catch (error) {
        console.error("Error getting investment:", error)
        return null
    }
}

export async function createInvestment(
    investmentData: CreateInvestmentForm,
    investorId: string,
): Promise<Investment | null> {
    try {
        const supabase = createBrowserClient()
        const bond = await getBond(investmentData.bond_id)
        if (!bond) {
            console.error("Bond not found")
            return null
        }
        const maturityDate = new Date(
            new Date(bond.emission_date).getTime() + bond.term_years * 365 * 24 * 60 * 60 * 1000,
        ).toISOString()
        const expectedReturn = investmentData.amount * (bond.interest_rate / 100) * bond.term_years

        const { data: investment, error } = await supabase
            .from("investments")
            .insert({
                ...investmentData,
                investor_id: investorId,
                investment_date: new Date().toISOString(),
                status: "active",
                expected_return: expectedReturn,
                maturity_date: maturityDate,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single()
        if (error) {
            console.error("Error creating investment:", error)
            return null
        }
        return investment
    } catch (error) {
        console.error("Error creating investment:", error)
        return null
    }
}

// ============================================================================
// PAYMENT QUERIES (cliente)
// ============================================================================

export async function getPayments(
    filters: PaymentFilters = {},
    pagination: PaginationParams = {},
): Promise<PaginatedResponse<PaymentWithInvestment>> {
    try {
        const supabase = createBrowserClient()
        const { page = 1, limit = 10 } = pagination
        const offset = (page - 1) * limit

        let query = supabase.from("payments").select(`
            *,
            investment:investments(*, bond:bonds(*))
        `)

        if (filters.status && filters.status.length > 0) {
            query = query.in("status", filters.status)
        }
        if (filters.type && filters.type.length > 0) {
            query = query.in("type", filters.type)
        }
        if (filters.scheduled_date_from) {
            query = query.gte("scheduled_date", filters.scheduled_date_from)
        }
        if (filters.scheduled_date_to) {
            query = query.lte("scheduled_date", filters.scheduled_date_to)
        }
        if (filters.investment_id) {
            query = query.eq("investment_id", filters.investment_id)
        }
        if (filters.sort_by) {
            query = query.order(filters.sort_by, { ascending: filters.sort_order === "asc" })
        } else {
            query = query.order("scheduled_date", { ascending: true })
        }

        query = query.range(offset, offset + limit - 1)
        const { data, error, count } = await query
        if (error) {
            console.error("Error getting payments:", error)
            return {
                data: [],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false,
                },
            }
        }
        return {
            data: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
                hasNext: offset + limit < (count || 0),
                hasPrev: page > 1,
            },
        }
    } catch (error) {
        console.error("Error getting payments:", error)
        return {
            data: [],
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            },
        }
    }
}

// ============================================================================
// CALCULATION FUNCTIONS (cliente)
// ============================================================================

export function calculateAmortization(
    amount: number,
    annualRate: number,
    termYears: number,
    paymentFrequency: PaymentFrequency,
    gracePeriods = 0,
    graceType: GracePeriod = "sin_gracia",
): AmortizationRow[] {
    const schedule: AmortizationRow[] = []
    const periodsPerYear = {
        mensual: 12,
        trimestral: 4,
        semestral: 2,
        anual: 1,
    }[paymentFrequency]
    const totalPeriods = termYears * periodsPerYear
    const periodRate = annualRate / 100 / periodsPerYear
    let saldoPendiente = amount
    const fechaInicio = new Date()
    for (let periodo = 1; periodo <= totalPeriods; periodo++) {
        const fechaPago = new Date(fechaInicio)
        fechaPago.setMonth(fechaPago.getMonth() + (periodo * 12) / periodsPerYear)
        let interes = 0
        let capital = 0
        let cuota = 0
        if (periodo <= gracePeriods) {
            if (graceType === "gracia_total") {
                interes = 0
                capital = 0
                cuota = 0
            } else if (graceType === "gracia_parcial") {
                interes = saldoPendiente * periodRate
                capital = 0
                cuota = interes
            }
        } else {
            const remainingPeriods = totalPeriods - Math.max(periodo - 1, gracePeriods)
            interes = saldoPendiente * periodRate
            if (remainingPeriods > 0) {
                cuota =
                    (saldoPendiente * periodRate * Math.pow(1 + periodRate, remainingPeriods)) /
                    (Math.pow(1 + periodRate, remainingPeriods) - 1)
                capital = cuota - interes
            } else {
                capital = saldoPendiente
                cuota = capital + interes
            }
        }
        const saldoInicial = saldoPendiente
        saldoPendiente = Math.max(0, saldoPendiente - capital)
        schedule.push({
            periodo,
            fecha: fechaPago.toISOString().split("T")[0],
            saldo_inicial: saldoInicial,
            cupon: interes,
            amortizacion: capital,
            flujo_total: cuota,
            saldo_final: saldoPendiente,
        })
    }
    return schedule
}

export function calculateBondReturns(bondCalculation: BondCalculation): {
    totalIntereses: number
    totalARecibir: number
    rendimientoAnual: number
} {
    const totalIntereses = bondCalculation.schedule.reduce((sum, cuota) => sum + cuota.cupon, 0)
    const totalARecibir = bondCalculation.investment_amount + totalIntereses
    const rendimientoAnual = (totalIntereses / bondCalculation.investment_amount / bondCalculation.term_years) * 100
    return {
        totalIntereses,
        totalARecibir,
        rendimientoAnual,
    }
}