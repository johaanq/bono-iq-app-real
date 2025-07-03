"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, User, Mail, Lock, Building, Loader2, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { validateEmail, validatePassword, validateRUC } from "@/lib/utils"
import type { SignUpForm as SignUpFormType } from "@/lib/types"

export function SignUpForm() {
  const [formData, setFormData] = useState<SignUpFormType>({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: "",
    rol: "inversionista",
    ruc: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  const handleInputChange = (field: keyof SignUpFormType, value: string) => {
    if(field === "ruc") {
      value = value.replace(/\D/g, "").slice(0, 11)
    }
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  const validateForm = (): boolean => {
    if (!formData.nombre.trim()) {
      setError("El nombre es requerido")
      return false
    }

    if (!formData.apellido.trim()) {
      setError("El apellido es requerido")
      return false
    }

    if (!formData.email.trim()) {
      setError("El email es requerido")
      return false
    }

    if (!validateEmail(formData.email)) {
      setError("Por favor ingresa un email válido")
      return false
    }

    if (!formData.password) {
      setError("La contraseña es requerida")
      return false
    }

    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0])
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return false
    }

    if (formData.rol === "emisor") {
      if (!formData.ruc?.trim()) {
        setError("El RUC es requerido para emisores")
        return false
      }

      if (!/^\d{11}$/.test(formData.ruc)) {
        setError("El RUC debe tener exactamente 11 dígitos numéricos")
        return false
      }

      if (!validateRUC(formData.ruc)) {
        setError("Por favor ingresa un RUC válido")
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nombre: formData.nombre,
            apellido: formData.apellido,
            rol: formData.rol,
            ruc: formData.rol === "emisor" ? formData.ruc : undefined
          },
          emailRedirectTo: `${location.origin}/auth/callback`
        }
      });

      if (error) {
        throw error;
      }

      // Verificación adicional para manejar casos donde el usuario existe pero no está confirmado
      if (data.user?.identities?.length === 0) {
        throw new Error('Ya existe un usuario con este email. Por favor verifica tu correo.');
      }

      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
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
                <h3 className="text-lg font-semibold text-green-700">¡Cuenta creada exitosamente!</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Hemos enviado un enlace de confirmación a tu email. Por favor revisa tu bandeja de entrada y confirma tu
                  cuenta.
                </p>
              </div>
              <div className="text-xs text-gray-500">Serás redirigido al login en unos segundos...</div>
            </div>
          </CardContent>
        </Card>
    )
  }

  return (
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Crear Cuenta</CardTitle>
          <CardDescription className="text-center">Completa la información para crear tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                      id="nombre"
                      type="text"
                      placeholder="Juan"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange("nombre", e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                      required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                    id="apellido"
                    type="text"
                    placeholder="Pérez"
                    value={formData.apellido}
                    onChange={(e) => handleInputChange("apellido", e.target.value)}
                    disabled={isLoading}
                    required
                />
              </div>
            </div>

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
            </div>

            <div className="space-y-2">
              <Label htmlFor="rol">Tipo de cuenta</Label>
              <Select
                  value={formData.rol}
                  onValueChange={(value) => handleInputChange("rol", value)}
                  disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inversionista">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Inversionista - Quiero invertir en bonos</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="emisor">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4" />
                      <span>Emisor - Quiero emitir bonos</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.rol === "emisor" && (
                <div className="space-y-2">
                  <Label htmlFor="ruc">RUC de la empresa</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        id="ruc"
                        type="text"
                        placeholder="12345678901"
                        value={formData.ruc || ""}
                        onChange={(e) => handleInputChange("ruc", e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                        required
                        maxLength={11}
                        inputMode="numeric"
                        pattern="\d{11}"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Ingresa el RUC de tu empresa (13 dígitos)</p>
                </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tu contraseña"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                    required
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                >
                  {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirma tu contraseña"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                    required
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                >
                  {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            {formData.password && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Fortaleza de la contraseña:</div>
                  <div className="space-y-1">
                    {[
                      { test: formData.password.length >= 8, text: "Al menos 8 caracteres" },
                      { test: /[A-Z]/.test(formData.password), text: "Una letra mayúscula" },
                      { test: /[a-z]/.test(formData.password), text: "Una letra minúscula" },
                      { test: /\d/.test(formData.password), text: "Un número" },
                      { test: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password), text: "Un carácter especial" },
                    ].map((requirement, index) => (
                        <div
                            key={index}
                            className={`text-xs flex items-center space-x-2 ${
                                requirement.test ? "text-green-600" : "text-red-600"
                            }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${requirement.test ? "bg-green-600" : "bg-red-600"}`} />
                          <span>{requirement.text}</span>
                        </div>
                    ))}
                  </div>
                </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
              ) : (
                  "Crear Cuenta"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">¿Ya tienes una cuenta? </span>
            <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
              Inicia sesión aquí
            </Link>
          </div>
        </CardContent>
      </Card>
  )
}
