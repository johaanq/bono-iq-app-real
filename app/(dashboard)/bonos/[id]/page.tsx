"use client"

import { useEffect, useState } from "react"
import { notFound, useRouter } from "next/navigation"
import { getBond } from "@/lib/supabase/queries.client"
import { calculateAmortization } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calculator } from "lucide-react"
import Link from "next/link"
import type { Bond, AmortizationRow } from "@/lib/types"
import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { formatCurrency, formatDate, formatPercentage } from "@/lib/utils"

interface BondDetailPageProps {
    params: {
        id: string
    }
}

export default function BondDetailPage({ params }: BondDetailPageProps) {
    const [bond, setBond] = useState<Bond | null>(null)
    const [amortization, setAmortization] = useState<AmortizationRow[]>([])
    const [showAmortization, setShowAmortization] = useState(false)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchBond = async () => {
            try {
                const bondData = await getBond(params.id)
                if (!bondData) {
                    notFound()
                    return
                }
                setBond(bondData)

                const amortizationData = calculateAmortization(bondData)
                setAmortization(amortizationData)
            } catch (error) {
                console.error("Error fetching bond:", error)
                notFound()
            } finally {
                setLoading(false)
            }
        }

        fetchBond()
    }, [params.id])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Cargando bono...</p>
                </div>
            </div>
        )
    }

    if (!bond) {
        notFound()
        return null
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "text-green-600 bg-green-50"
            case "inactive":
                return "text-gray-600 bg-gray-50"
            case "matured":
                return "text-red-600 bg-red-50"
            default:
                return "text-gray-600 bg-gray-50"
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case "active":
                return "Activo"
            case "inactive":
                return "Inactivo"
            case "matured":
                return "Vencido"
            default:
                return "Desconocido"
        }
    }

    const getRateTypeText = (rateType: string) => {
        return rateType === "efectiva" ? "Efectiva" : "Nominal"
    }

    const getPaymentFrequencyText = (frequency: string) => {
        const frequencies = {
            anual: "Anual",
            semestral: "Semestral",
            trimestral: "Trimestral",
            mensual: "Mensual",
        }
        return frequencies[frequency as keyof typeof frequencies] || frequency
    }

    const getGracePeriodText = (gracePeriod: string) => {
        const periods = {
            sin_gracia: "Sin gracia",
            gracia_parcial: "Gracia parcial",
            gracia_total: "Gracia total",
        }
        return periods[gracePeriod as keyof typeof periods] || gracePeriod
    }

    const amortizationColumns: ColumnDef<AmortizationRow>[] = [
        {
            accessorKey: "periodo",
            header: "Período",
            cell: ({ row }) => <div className="font-mono">{row.original.periodo}</div>,
        },
        {
            accessorKey: "fecha",
            header: "Fecha",
            cell: ({ row }) => <div className="font-mono text-sm">{formatDate(row.original.fecha)}</div>,
        },
        {
            accessorKey: "saldo_inicial",
            header: "Saldo Inicial",
            cell: ({ row }) => <div className="font-mono text-sm">{formatCurrency(row.original.saldo_inicial)}</div>,
        },
        {
            accessorKey: "cupon",
            header: "Cupón",
            cell: ({ row }) => <div className="font-mono text-sm text-green-600">{formatCurrency(row.original.cupon)}</div>,
        },
        {
            accessorKey: "amortizacion",
            header: "Amortización",
            cell: ({ row }) => (
                <div className="font-mono text-sm text-blue-600">{formatCurrency(row.original.amortizacion)}</div>
            ),
        },
        {
            accessorKey: "flujo_total",
            header: "Flujo Total",
            cell: ({ row }) => (
                <div className="font-mono text-sm font-semibold">{formatCurrency(row.original.flujo_total)}</div>
            ),
        },
        {
            accessorKey: "saldo_final",
            header: "Saldo Final",
            cell: ({ row }) => <div className="font-mono text-sm">{formatCurrency(row.original.saldo_final)}</div>,
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/bonos">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver a Bonos
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{bond.name}</h2>
                    <p className="text-muted-foreground">Método Americano - Solo cupones + principal al vencimiento</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información General</CardTitle>
                            <CardDescription>Detalles principales del bono</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Valor Nominal</label>
                                <p className="text-lg font-semibold">{formatCurrency(bond.nominal_value)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Tasa de Interés</label>
                                <div className="flex items-center gap-2">
                                    <p className="text-lg font-semibold">{formatPercentage(bond.interest_rate)}</p>
                                    <Badge variant="outline">{getRateTypeText(bond.rate_type)}</Badge>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Tasa de Descuento</label>
                                <p className="text-lg font-semibold">{formatPercentage(bond.discount_rate)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Frecuencia de Pago</label>
                                <p className="text-lg font-semibold">{getPaymentFrequencyText(bond.payment_frequency)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Fecha de Emisión</label>
                                <p className="text-lg font-semibold">{formatDate(bond.emission_date)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Plazo</label>
                                <p className="text-lg font-semibold">{bond.term_years} años</p>
                            </div>
                        </CardContent>
                    </Card>

                    {bond.grace_period !== "sin_gracia" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Período de Gracia</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Tipo de Gracia</label>
                                    <p className="text-lg font-semibold">{getGracePeriodText(bond.grace_period)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Gastos y Comisiones</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Gastos de Emisión</label>
                                <p className="text-lg font-semibold">{formatPercentage(bond.emission_expenses)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Gastos de Colocación</label>
                                <p className="text-lg font-semibold">{formatPercentage(bond.placement_expenses)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Gastos de Estructuración</label>
                                <p className="text-lg font-semibold">{formatPercentage(bond.structuring_expenses)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Gastos Cavali</label>
                                <p className="text-lg font-semibold">{formatPercentage(bond.cavali_expenses)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Estado del Bono</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Estado</label>
                                <div className="mt-1">
                                    <Badge className={getStatusColor(bond.status)}>{getStatusText(bond.status)}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tabla de Amortización</CardTitle>
                            <CardDescription>Cronograma de pagos método americano</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => setShowAmortization(!showAmortization)} variant="outline" className="w-full">
                                <Calculator className="h-4 w-4 mr-2" />
                                {showAmortization ? "Ocultar" : "Ver"} Cronograma
                            </Button>
                        </CardContent>
                    </Card>

                    {bond.status === "active" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Invertir en este Bono</CardTitle>
                                <CardDescription>Valor nominal: {formatCurrency(bond.nominal_value)}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full" size="lg" onClick={() => router.push(`/invertir/${bond.id}`)}>
                                    Invertir Ahora
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {showAmortization && (
                <Card>
                    <CardHeader>
                        <CardTitle>Cronograma de Pagos - Método Americano</CardTitle>
                        <CardDescription>
                            Solo se pagan cupones durante la vida del bono. El principal se paga completo al vencimiento.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={amortizationColumns} data={amortization} />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
