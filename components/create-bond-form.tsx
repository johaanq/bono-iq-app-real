"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn, validateRequired, validatePositiveNumber, validatePercentage } from "@/lib/utils"
import { getCurrentUser } from "@/lib/supabase/queries.client"
import { createBond } from "@/lib/supabase/queries.client"
import type { RateType, GracePeriod, PaymentFrequency } from "@/lib/types"

export function CreateBondForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        nominal_value: 0,
        interest_rate: 0,
        discount_rate: 0,
        rate_type: "efectiva" as RateType,
        grace_period: "sin_gracia" as GracePeriod,
        emission_expenses: 0,
        placement_expenses: 0,
        structuring_expenses: 0,
        cavali_expenses: 0.2,
        emission_date: new Date(),
        term_years: 1,
        payment_frequency: "semestral" as PaymentFrequency,
    })

    const handleInputChange = (
        field: string,
        value: string | number | Date | RateType | GracePeriod | PaymentFrequency,
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        if (error) setError(null)
    }

    const validateForm = (): string | null => {
        if (!validateRequired(formData.name)) {
            return "El nombre del bono es requerido"
        }

        if (!validatePositiveNumber(formData.nominal_value)) {
            return "El valor nominal debe ser mayor a 0"
        }

        if (!validatePercentage(formData.interest_rate)) {
            return "La tasa de interés debe estar entre 0 y 100%"
        }

        if (!validatePercentage(formData.discount_rate)) {
            return "La tasa de descuento debe estar entre 0 y 100%"
        }

        if (formData.term_years < 1 || formData.term_years > 50) {
            return "El plazo debe estar entre 1 y 50 años"
        }

        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const validationError = validateForm()
            if (validationError) {
                setError(validationError)
                return
            }

            // Get current user to get emisor_id
            const user = await getCurrentUser()
            if (!user) {
                setError("Usuario no autenticado")
                return
            }

            const bondData = {
                ...formData,
                emission_date: format(formData.emission_date, "yyyy-MM-dd"),
                status: "inactive" as const,
            }

            await createBond(bondData, user.id)
            setSuccess(true)

            setTimeout(() => {
                router.push("/mis-bonos")
            }, 2000)
        } catch (error) {
            console.error("Error creating bond:", error)
            setError(error instanceof Error ? error.message : "Error al crear el bono")
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl">¡Bono Creado Exitosamente!</CardTitle>
                        <CardDescription>Tu bono ha sido creado y guardado como borrador</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <div className="rounded-lg bg-green-50 p-4 mb-4">
                            <p className="text-sm text-green-700">Serás redirigido a tus bonos en unos segundos...</p>
                        </div>
                        <Button onClick={() => router.push("/mis-bonos")} className="w-full">
                            Ver Mis Bonos
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Crear Nuevo Bono</h2>
                <p className="text-muted-foreground">Completa la información para crear un nuevo bono con método americano</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Información General */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información General</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre del bono *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    placeholder="Ej: Bono Corporativo 2024"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nominal_value">Valor nominal (S/) *</Label>
                                <Input
                                    id="nominal_value"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.nominal_value || ""}
                                    onChange={(e) => handleInputChange("nominal_value", Number.parseFloat(e.target.value) || 0)}
                                    placeholder="1000"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="term_years">Plazo (años) *</Label>
                                <Input
                                    id="term_years"
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={formData.term_years}
                                    onChange={(e) => handleInputChange("term_years", Number.parseInt(e.target.value) || 1)}
                                    placeholder="5"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fechas */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Fecha de Emisión</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Fecha de emisión *</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !formData.emission_date && "text-muted-foreground",
                                            )}
                                            disabled={isLoading}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.emission_date ? (
                                                format(formData.emission_date, "PPP", { locale: es })
                                            ) : (
                                                <span>Seleccionar fecha</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={formData.emission_date}
                                            onSelect={(date) => handleInputChange("emission_date", date || new Date())}
                                            initialFocus
                                            locale={es}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tasas */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tasas de Interés</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="interest_rate">Tasa de interés (%) *</Label>
                                <Input
                                    id="interest_rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={formData.interest_rate || ""}
                                    onChange={(e) => handleInputChange("interest_rate", Number.parseFloat(e.target.value) || 0)}
                                    placeholder="8.5"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="discount_rate">Tasa de descuento (%) *</Label>
                                <Input
                                    id="discount_rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={formData.discount_rate || ""}
                                    onChange={(e) => handleInputChange("discount_rate", Number.parseFloat(e.target.value) || 0)}
                                    placeholder="7.5"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rate_type">Tipo de tasa *</Label>
                                <Select
                                    value={formData.rate_type}
                                    onValueChange={(value: RateType) => handleInputChange("rate_type", value)}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="efectiva">Efectiva (TEA)</SelectItem>
                                        <SelectItem value="nominal">Nominal (TNA)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Configuración de Pagos */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración de Pagos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="payment_frequency">Frecuencia de pago *</Label>
                                <Select
                                    value={formData.payment_frequency}
                                    onValueChange={(value: PaymentFrequency) => handleInputChange("payment_frequency", value)}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="anual">Anual</SelectItem>
                                        <SelectItem value="semestral">Semestral</SelectItem>
                                        <SelectItem value="trimestral">Trimestral</SelectItem>
                                        <SelectItem value="mensual">Mensual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="grace_period">Período de gracia *</Label>
                                <Select
                                    value={formData.grace_period}
                                    onValueChange={(value: GracePeriod) => handleInputChange("grace_period", value)}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sin_gracia">Sin gracia</SelectItem>
                                        <SelectItem value="gracia_parcial">Gracia parcial</SelectItem>
                                        <SelectItem value="gracia_total">Gracia total</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gastos */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Gastos y Comisiones</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="emission_expenses">Gastos de emisión (%)</Label>
                                <Input
                                    id="emission_expenses"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.emission_expenses || ""}
                                    onChange={(e) => handleInputChange("emission_expenses", Number.parseFloat(e.target.value) || 0)}
                                    placeholder="0.5"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="placement_expenses">Gastos de colocación (%)</Label>
                                <Input
                                    id="placement_expenses"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.placement_expenses || ""}
                                    onChange={(e) => handleInputChange("placement_expenses", Number.parseFloat(e.target.value) || 0)}
                                    placeholder="1.0"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="structuring_expenses">Gastos de estructuración (%)</Label>
                                <Input
                                    id="structuring_expenses"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.structuring_expenses || ""}
                                    onChange={(e) => handleInputChange("structuring_expenses", Number.parseFloat(e.target.value) || 0)}
                                    placeholder="0.75"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cavali_expenses">Gastos Cavali (%)</Label>
                                <Input id="cavali_expenses" type="number" step="0.01" value="0.2" disabled className="bg-muted" />
                                <p className="text-xs text-muted-foreground">Fijo: 0.2%</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => router.push("/dashboard")} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creando...
                            </>
                        ) : (
                            "Crear Bono"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
