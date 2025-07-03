import { Suspense } from "react"
import { DashboardCards } from "@/components/dashboard-cards"
import { getCurrentUser } from "@/lib/supabase/queries.client"
import { getDashboardStats } from "@/lib/supabase/queries.server"
import { redirect } from "next/navigation"

async function DashboardContent() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/login")
    }

    if (user.role !== "inversionista" && user.role !== "emisor") {
        redirect("/login") // O redirige a otra página de admin
    }

    const stats = await getDashboardStats(user.id, user.role)

    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
            </div>
            <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
                <div className="p-6">
                    <div className="flex items-center justify-between space-y-2 mb-6">
                        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    </div>

                    <DashboardCards stats={stats} userRole={user.role} />

                    <div className="mt-6">
                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                            <h3 className="text-lg font-semibold mb-4">Análisis de Rendimiento</h3>
                            <div className="flex items-center justify-center h-64 text-muted-foreground">
                                <p>Gráficos próximamente...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function DashboardPage() {
    return (
        <Suspense
            fallback={
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                        <div className="aspect-video rounded-xl bg-muted/50 animate-pulse" />
                        <div className="aspect-video rounded-xl bg-muted/50 animate-pulse" />
                        <div className="aspect-video rounded-xl bg-muted/50 animate-pulse" />
                    </div>
                    <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min animate-pulse" />
                </div>
            }
        >
            <DashboardContent />
        </Suspense>
    )
}
