import { createClient } from "@/lib/supabase/server"
import type { Profile, DashboardStats, Bond } from "@/lib/types"

// ============================================================================
// AUTH QUERIES (solo servidor)
// ============================================================================

export async function getCurrentUserProfile(): Promise<Profile | null> {
    try {
        const supabase = await createClient()
        const {
            data: { user: authUser },
            error: authError,
        } = await supabase.auth.getUser()
        if (authError || !authUser) return null
        const { data: profile, error } = await supabase.from("profiles").select("*").eq("user_id", authUser.id).single()
        if (error) {
            console.error("Error getting user profile:", error)
            return null
        }
        return profile
    } catch (error) {
        console.error("Error getting user profile:", error)
        return null
    }
}

// ============================================================================
// ANALYTICS QUERIES (solo servidor)
// ============================================================================

export async function getDashboardStats(userId: string, userRole: "emisor" | "inversionista"): Promise<DashboardStats> {
    try {
        const supabase = await createClient()
        if (userRole === "emisor") {
            const { data: bonds } = await supabase.from("bonds").select("*, investments(*)").eq("emisor_id", userId)
            const totalBonds = bonds?.length || 0
            const activeBonds = bonds?.filter((b) => b.status === "active").length || 0
            const allInvestments = bonds?.flatMap((b) => b.investments || []) || []
            const totalInvestments = allInvestments.length
            const activeInvestments = allInvestments.filter((i) => i.status === "active").length
            const totalInvested = allInvestments.reduce((sum, i) => sum + (i.amount || 0), 0)
            const averageRate =
                bonds && bonds.length > 0
                    ? bonds.reduce((sum, b) => sum + (b.interest_rate || 0), 0) / bonds.length
                    : 0
            return {
                totalBonds,
                activeBonds,
                totalInvestments,
                activeInvestments,
                totalInvested,
                totalReturns: 0,
                averageRate,
                portfolioValue: totalInvested,
            }
        } else {
            const { data: investments } = await supabase
                .from("investments")
                .select("*, bond:bonds(*), payments(*)")
                .eq("investor_id", userId)
            const totalInvestments = investments?.length || 0
            const activeInvestments = investments?.filter((i) => i.status === "active").length || 0
            const totalInvested = investments?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0
            const allPayments = investments?.flatMap((i) => i.payments || []) || []
            const totalReturns = allPayments.filter((p) => p.status === "paid").reduce((sum, p) => sum + (p.amount || 0), 0)
            const bondsWithRates =
                investments?.filter(
                    (inv): inv is typeof inv & { bond: Bond } =>
                        inv.bond !== null && typeof inv.bond === "object" && "interest_rate" in inv.bond,
                ) || []
            const averageRate =
                bondsWithRates.length > 0
                    ? bondsWithRates.reduce((sum, inv) => sum + inv.bond.interest_rate, 0) / bondsWithRates.length
                    : 0
            return {
                totalBonds: 0,
                activeBonds: 0,
                totalInvestments,
                activeInvestments,
                totalInvested,
                totalReturns,
                averageRate,
                portfolioValue: totalInvested + totalReturns,
            }
        }
    } catch (error) {
        console.error("Error getting dashboard stats:", error)
        return {
            totalBonds: 0,
            activeBonds: 0,
            totalInvestments: 0,
            activeInvestments: 0,
            totalInvested: 0,
            totalReturns: 0,
            averageRate: 0,
            portfolioValue: 0,
        }
    }
}