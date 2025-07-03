"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown, Eye, TrendingUp } from "lucide-react"
import Link from "next/link"
import type { Bond } from "@/lib/types"
import { formatCurrency, formatDate, formatPercentage, calculateDaysToMaturity } from "@/lib/utils"

interface BondsTableProps {
    bonds: Bond[]
    title?: string
    description?: string
    showInvestButton?: boolean
}

export function BondsTable({ bonds, title, description, showInvestButton = false }: BondsTableProps) {
    const [sortConfig, setSortConfig] = useState<{
        key: keyof Bond
        direction: "asc" | "desc"
    } | null>(null)

    const sortedBonds = [...bonds].sort((a, b) => {
        if (!sortConfig) return 0

        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        if (aValue == null && bValue == null) return 0
        if (aValue == null) return sortConfig.direction === "asc" ? 1 : -1
        if (bValue == null) return sortConfig.direction === "asc" ? -1 : 1

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
        return 0
    })

    const handleSort = (key: keyof Bond) => {
        setSortConfig((current) => {
            if (current?.key === key) {
                return {
                    key,
                    direction: current.direction === "asc" ? "desc" : "asc",
                }
            }
            return { key, direction: "asc" }
        })
    }

    const getStatusConfig = (status: string) => {
        const statusConfigs = {
            active: {
                variant: "default" as const,
                label: "Activo",
                className: "bg-green-100 text-green-800",
            },
            inactive: {
                variant: "secondary" as const,
                label: "Inactivo",
                className: "bg-gray-100 text-gray-800",
            },
            matured: {
                variant: "outline" as const,
                label: "Vencido",
                className: "bg-red-100 text-red-800",
            },
        }

        return statusConfigs[status as keyof typeof statusConfigs] || statusConfigs.inactive
    }

    const getRateTypeText = (rateType: string) => {
        return rateType === "efectiva" ? "TEA" : "TNA"
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

    if (bonds.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title || "Bonos"}</CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                            <TrendingUp className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">No hay bonos disponibles</h3>
                        <p className="mt-2 text-muted-foreground">
                            {showInvestButton
                                ? "No hay bonos disponibles para inversión en este momento"
                                : "Aún no se han creado bonos"}
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title || "Bonos"}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort("name")} className="h-auto p-0 font-semibold">
                                        Nombre
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleSort("nominal_value")}
                                        className="h-auto p-0 font-semibold"
                                    >
                                        Valor Nominal
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleSort("interest_rate")}
                                        className="h-auto p-0 font-semibold"
                                    >
                                        Tasa
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>Plazo</TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleSort("emission_date")}
                                        className="h-auto p-0 font-semibold"
                                    >
                                        Emisión
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedBonds.map((bond) => {
                                const statusConfig = getStatusConfig(bond.status)
                                const daysToMaturity = calculateDaysToMaturity(bond.emission_date, bond.term_years)

                                return (
                                    <TableRow key={bond.id}>
                                        <TableCell className="font-medium">
                                            <div>
                                                <div className="font-semibold">{bond.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {getPaymentFrequencyText(bond.payment_frequency)}
                                                    {bond.grace_period !== "sin_gracia" && " • Con gracia"}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{formatCurrency(bond.nominal_value)}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{formatPercentage(bond.interest_rate)}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {getRateTypeText(bond.rate_type)}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{bond.term_years} años</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {daysToMaturity > 0 ? `${daysToMaturity} días` : "Vencido"}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{formatDate(bond.emission_date)}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/bonos/${bond.id}`}>
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        Ver
                                                    </Link>
                                                </Button>
                                                {showInvestButton && bond.status === "active" && (
                                                    <Button size="sm" asChild>
                                                        <Link href={`/invertir/${bond.id}`}>
                                                            <TrendingUp className="h-4 w-4 mr-1" />
                                                            Invertir
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
