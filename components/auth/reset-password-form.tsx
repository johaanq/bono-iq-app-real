"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { validateEmail } from "@/lib/utils"
import type { ResetPasswordForm as ResetPasswordFormType } from "@/lib/types"

export function ResetPasswordForm() {
    const [formData, setFormData] = useState<ResetPasswordFormType>({
        email: "",
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    const handleInputChange = (field: keyof ResetPasswordFormType, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        if (error) setError(null)
    }

    const validateForm = (): boolean => {
        if (!formData.email.trim()) {
            setError("El email es requerido")
            return false
        }

        if (!validateEmail(formData.email)) {
            setError("Por favor ingresa un email válido")
            return false
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setIsLoading(true)
        setError(null)

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(formData.email, {
                redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
            })

            if (resetError) {
                if (resetError.message.includes("User not found")) {
                    setError("No existe una cuenta con este email")
                } else {
                    setError("Error al enviar el email. Inténtalo de nuevo.")
                }
                return
            }

            setSuccess(true)
        } catch (error) {
            console.error("Reset password error:", error)
            setError("Error inesperado. Inténtalo de nuevo.")
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <Card className="w-full">
                <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-green-700">¡Email enviado!</h3>
                            <p className="text-sm text-gray-600 mt-2">
                                Hemos enviado un enlace para restablecer tu contraseña a{" "}
                                <span className="font-medium">{formData.email}</span>
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                Revisa tu bandeja de entrada y sigue las instrucciones del email.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Button onClick={() => router.push("/login")} className="w-full">
                                Volver al Login
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSuccess(false)
                                    setFormData({ email: "" })
                                }}
                                className="w-full"
                            >
                                Enviar otro email
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Restablecer Contraseña</CardTitle>
                <CardDescription className="text-center">
                    Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                value={formData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                className="pl-10"
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500">Te enviaremos un enlace para restablecer tu contraseña</p>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando email...
                            </>
                        ) : (
                            "Enviar Enlace de Restablecimiento"
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al login
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
