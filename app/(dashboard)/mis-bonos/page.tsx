"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getBonds, getProfile, updateBond } from "@/lib/supabase/queries.client"
import { BondsTable } from "@/components/bonds-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"
import type { Bond, Profile } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

export default function MisBonosPage() {
    const [userProfile, setUserProfile] = useState<Profile | null>(null)
    const [bonds, setBonds] = useState<Bond[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const supabase = createClient()
                const {
                    data: { user },
                } = await supabase.auth.getUser()

                if (!user) return

                const profile = await getProfile(user.id)
                if (!profile || profile.role !== "emisor") {
                    return
                }

                setUserProfile(profile)
                const userBonds = await getBonds({ emisor_id: user.id })
                setBonds(userBonds)
            } catch (error) {
                console.error("Error fetching data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const handlePublishBond = async (bondId: string) => {
        try {
            const updatedBond = await updateBond(bondId, { status: "active" })
            if (updatedBond) {
                setBonds((prev) => prev.map((bond) => (bond.id === bondId ? { ...bond, status: "active" } : bond)))
                alert("¡Bono publicado exitosamente!")
            }
        } catch (error) {
            console.error("Error publishing bond:", error)
            alert("Error al publicar el bono")
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Cargando bonos...</p>
                </div>
            </div>
        )
    }

    if (!userProfile || userProfile.role !== "emisor") {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold">Acceso Restringido</h2>
                <p className="text-muted-foreground">Solo los emisores pueden acceder a esta página</p>
            </div>
        )
    }

    const draftBonds = bonds.filter((bond) => bond.status === "inactive")
    const publishedBonds = bonds.filter((bond) => bond.status !== "inactive")

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Mis Bonos</h2>
                    <p className="text-muted-foreground">Administra los bonos que has emitido con método americano</p>
                </div>
                <Link href="/crear-bono">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Nuevo Bono
                    </Button>
                </Link>
            </div>

            {/* Resumen */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bonos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{bonds.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Borradores</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{draftBonds.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Publicados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{publishedBonds.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(
                                bonds.reduce((sum, bond) => sum + bond.nominal_value, 0),
                                "compact"
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Borradores */}
            {draftBonds.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Borradores</CardTitle>
                        <CardDescription>Bonos que aún no has publicado</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {draftBonds.map((bond) => (
                                <div key={bond.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-1">
                                        <h4 className="font-medium">{bond.name}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {formatCurrency(bond.nominal_value)} • {bond.interest_rate}% ({bond.rate_type}) •{" "}
                                            {bond.payment_frequency}
                                            {bond.grace_period !== "sin_gracia" && ` • ${bond.grace_period}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Borrador</Badge>
                                        <Link href={`/bonos/${bond.id}`}>
                                            <Button variant="outline" size="sm">
                                                Ver
                                            </Button>
                                        </Link>
                                        <Button size="sm" onClick={() => handlePublishBond(bond.id)}>
                                            Publicar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Todos los bonos */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold">Todos los Bonos</h3>
                    <p className="text-sm text-muted-foreground">Lista completa de tus bonos emitidos con método americano</p>
                </div>

                {bonds.length > 0 ? (
                    <BondsTable bonds={bonds} showInvestButton={false} />
                ) : (
                    <div className="rounded-lg border border-dashed p-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                            <Plus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">No has creado bonos</h3>
                        <p className="mt-2 text-muted-foreground">
                            Comienza creando tu primer bono con método americano para atraer inversionistas
                        </p>
                        <Link href="/crear-bono">
                            <Button className="mt-4">
                                <Plus className="h-4 w-4 mr-2" />
                                Crear Primer Bono
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
