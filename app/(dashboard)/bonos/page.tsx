import { Suspense } from "react"
import { BondsTable } from "@/components/bonds-table"
import { getCurrentUser } from "@/lib/supabase/queries.client"
import { getBonds } from "@/lib/supabase/queries.client"
import { redirect } from "next/navigation"

async function BonosContent() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/login")
    }

    // Para inversionista, solo bonos activos; para emisor, todos
    const bonds = await getBonds({
        status: user.role === "inversionista" ? ["active"] : undefined,
    })

    const title = user.role === "emisor" ? "Todos los Bonos" : "Bonos Disponibles"
    const description = user.role === "emisor" ? "Todos los bonos en el sistema" : "Bonos disponibles para inversión"

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                <p className="text-muted-foreground">{description}</p>
            </div>
            <BondsTable bonds={bonds} title={title} description={description} showInvestButton={user.role === "inversionista"} />
        </div>
    )
}

export default function BonosPage() {
    return (
        <Suspense
            fallback={
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-96 bg-muted animate-pulse rounded-lg" />
                </div>
            }
        >
            <BonosContent />
        </Suspense>
    )
}