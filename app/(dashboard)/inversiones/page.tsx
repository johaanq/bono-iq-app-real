"use client"
import { useEffect, useState } from "react"
import { getCurrentUser } from "@/lib/supabase/queries.client"
import { getInvestments } from "@/lib/supabase/queries.client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import type { InvestmentWithDetails, User } from "@/lib/types"
import { formatCurrency, formatDate, formatPercentage } from "@/lib/utils"

export default function InversionsPage() {
    const [user, setUser] = useState<User | null>(null)
    const [investments, setInvestments] = useState<InvestmentWithDetails[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const currentUser = await getCurrentUser()
                if (!currentUser) return

                setUser(currentUser)
                const userInvestments = await getInvestments()
                // Filtra por el usuario actual
                const filtered = (userInvestments.data || []).filter(
                    (inv) => inv.investor_id === currentUser.id
                )
                setInvestments(filtered)
            } catch (error) {
                console.error("Error fetching data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Cargando inversiones...</p>
                </div>
            </div>
        )
    }

    if (!user || user.role !== "inversionista") {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold">Acceso Restringido</h2>
                <p className="text-muted-foreground">Solo los inversores pueden acceder a esta página</p>
            </div>
        )
    }

    const activeInvestments = investments.filter((inv) => inv.status === "active")
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0)
    const totalReturn = investments.reduce((sum, inv) => sum + (inv.expected_return || 0), 0)

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-green-100 text-green-800">Activa</Badge>
            case "matured":
                return <Badge variant="outline">Vencida</Badge>
            case "cancelled":
                return <Badge variant="destructive">Cancelada</Badge>
            default:
                return <Badge variant="secondary">Desconocido</Badge>
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Mis Inversiones</h2>
                    <p className="text-muted-foreground">Administra tu portafolio de inversiones en bonos</p>
                </div>
                <Link href="/bonos">
                    <Button>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Explorar Bonos
                    </Button>
                </Link>
            </div>

            {/* Resumen */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Inversiones</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{investments.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inversiones Activas</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeInvestments.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Capital Invertido</CardTitle>
                        <TrendingDown className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Retorno Esperado</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalReturn)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabla de inversiones */}
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Inversiones</CardTitle>
                    <CardDescription>Todas tus inversiones en bonos</CardDescription>
                </CardHeader>
                <CardContent>
                    {investments.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Bono</TableHead>
                                        <TableHead>Monto Invertido</TableHead>
                                        <TableHead>Fecha de Inversión</TableHead>
                                        <TableHead>Retorno Esperado</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {investments.map((investment) => (
                                        <TableRow key={investment.id}>
                                            <TableCell className="font-medium">
                                                <div>
                                                    <div className="font-semibold">{investment.bond?.name || "Bono eliminado"}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {investment.bond?.interest_rate && formatPercentage(investment.bond.interest_rate)} •{" "}
                                                        {investment.bond?.payment_frequency}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{formatCurrency(investment.amount)}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{formatDate(investment.investment_date)}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-green-600">
                                                    {investment.expected_return ? formatCurrency(investment.expected_return) : "N/A"}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(investment.status)}</TableCell>
                                            <TableCell className="text-right">
                                                {investment.bond && (
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/bonos/${investment.bond.id}`}>
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            Ver Bono
                                                        </Link>
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                                <TrendingUp className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">No tienes inversiones</h3>
                            <p className="mt-2 text-muted-foreground">
                                Comienza explorando los bonos disponibles para hacer tu primera inversión
                            </p>
                            <Link href="/bonos">
                                <Button className="mt-4">
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    Explorar Bonos
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}