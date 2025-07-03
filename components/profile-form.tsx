"use client"
import type { User, Profile } from "@/lib/types"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, UserIcon } from "lucide-react"
import { validateRequired, validatePhone, validateRUC } from "@/lib/utils"
import { getCurrentUser } from "@/lib/supabase/queries.server"
import { getProfile, updateProfile } from "@/lib/supabase/queries.client"

type FormData = {
    first_name: string
    last_name: string
    phone: string
    address: string
    city: string
    country: string
    birth_date: string | null
    ruc: string
    company_name: string
    position: string
    website: string
    bio: string
    avatar_url: string
}

interface ProfileFormProps {
    initialProfile: Profile | null
    userRole: string
}

export function ProfileForm({ initialProfile, userRole }: ProfileFormProps) {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(initialProfile)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<boolean>(false)

    const [formData, setFormData] = useState<FormData>({
        first_name: initialProfile?.first_name || "",
        last_name: initialProfile?.last_name || "",
        phone: initialProfile?.phone || "",
        address: initialProfile?.address || "",
        city: initialProfile?.city || "",
        country: initialProfile?.country || "",
        birth_date: initialProfile?.birth_date ?? null,
        ruc: initialProfile?.ruc || "",
        company_name: initialProfile?.company_name || "",
        position: initialProfile?.position || "",
        website: initialProfile?.website || "",
        bio: initialProfile?.bio || "",
        avatar_url: initialProfile?.avatar_url || "",
    })

    useEffect(() => {
        const loadUserData = async () => {
            setIsLoading(true)
            try {
                const userData = await getCurrentUser()
                if (!userData) {
                    router.push("/login")
                    return
                }
                setUser(userData as User)
                if (!initialProfile) {
                    const profileData = await getProfile(userData.id)
                    if (profileData) {
                        setProfile(profileData as Profile)
                        setFormData({
                            first_name: profileData.first_name || "",
                            last_name: profileData.last_name || "",
                            phone: profileData.phone || "",
                            address: profileData.address || "",
                            city: profileData.city || "",
                            country: profileData.country || "",
                            birth_date: profileData.birth_date ?? null,
                            ruc: profileData.ruc || "",
                            company_name: profileData.company_name || "",
                            position: profileData.position || "",
                            website: profileData.website || "",
                            bio: profileData.bio || "",
                            avatar_url: profileData.avatar_url || "",
                        })
                    }
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                setError("Error al cargar los datos del usuario")
            } finally {
                setIsLoading(false)
            }
        }
        loadUserData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router])

    const handleInputChange = (field: keyof FormData, value: string | null) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        if (error) setError(null)
        if (success) setSuccess(false)
    }

    const validateForm = (): string | null => {
        if (!validateRequired(formData.first_name)) {
            return "El nombre es requerido"
        }
        if (!validateRequired(formData.last_name)) {
            return "El apellido es requerido"
        }
        if (formData.phone && !validatePhone(formData.phone)) {
            return "El formato del teléfono no es válido"
        }
        if (formData.ruc && !validateRUC(formData.ruc)) {
            return "El formato del RUC no es válido"
        }
        return null
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!user) return

        setIsSaving(true)
        setError(null)

        try {
            const validationError = validateForm()
            if (validationError) {
                setError(validationError)
                return
            }

            await updateProfile(user.id, formData)
            setSuccess(true)

            // Recargar perfil
            const updatedProfile = await getProfile(user.id)
            if (updatedProfile) {
                setProfile(updatedProfile as Profile)
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "Error al actualizar el perfil")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="mt-2 text-sm text-muted-foreground">Cargando perfil...</p>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="text-center py-12">
                <UserIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No se pudo cargar el perfil</h3>
                <p className="mt-2 text-sm text-muted-foreground">Hubo un problema al cargar los datos del usuario.</p>
                <Button onClick={() => router.refresh()} className="mt-4">
                    Intentar de nuevo
                </Button>
            </div>
        )
    }

    const bioLength = formData.bio?.length || 0
    const maxBioLength = 500

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Mi Perfil</h2>
                <p className="text-muted-foreground">Administra tu información personal y configuración de cuenta</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Información Personal */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información Personal</CardTitle>
                            <CardDescription>Datos básicos de tu perfil</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">Nombre *</Label>
                                    <Input
                                        id="first_name"
                                        value={formData.first_name}
                                        onChange={(e) => handleInputChange("first_name", e.target.value)}
                                        placeholder="Tu nombre"
                                        required
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Apellido *</Label>
                                    <Input
                                        id="last_name"
                                        value={formData.last_name}
                                        onChange={(e) => handleInputChange("last_name", e.target.value)}
                                        placeholder="Tu apellido"
                                        required
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone || ""}
                                    onChange={(e) => handleInputChange("phone", e.target.value)}
                                    placeholder="+51 999 999 999"
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                                <Input
                                    id="birth_date"
                                    type="date"
                                    value={formData.birth_date || ""}
                                    onChange={(e) => handleInputChange("birth_date", e.target.value || null)}
                                    disabled={isSaving}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Información de Contacto */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información de Contacto</CardTitle>
                            <CardDescription>Dirección y datos de contacto</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="address">Dirección</Label>
                                <Input
                                    id="address"
                                    value={formData.address || ""}
                                    onChange={(e) => handleInputChange("address", e.target.value)}
                                    placeholder="Tu dirección completa"
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="city">Ciudad</Label>
                                    <Input
                                        id="city"
                                        value={formData.city || ""}
                                        onChange={(e) => handleInputChange("city", e.target.value)}
                                        placeholder="Lima"
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="country">País</Label>
                                    <Input
                                        id="country"
                                        value={formData.country || ""}
                                        onChange={(e) => handleInputChange("country", e.target.value)}
                                        placeholder="Perú"
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="website">Sitio Web</Label>
                                <Input
                                    id="website"
                                    type="url"
                                    value={formData.website || ""}
                                    onChange={(e) => handleInputChange("website", e.target.value)}
                                    placeholder="https://tu-sitio-web.com"
                                    disabled={isSaving}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Información Empresarial */}
                    {userRole === "emisor" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Información Empresarial</CardTitle>
                                <CardDescription>Datos de tu empresa (solo para emisores)</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="company_name">Nombre de la Empresa</Label>
                                    <Input
                                        id="company_name"
                                        value={formData.company_name || ""}
                                        onChange={(e) => handleInputChange("company_name", e.target.value)}
                                        placeholder="Nombre de tu empresa"
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ruc">RUC</Label>
                                    <Input
                                        id="ruc"
                                        value={formData.ruc || ""}
                                        onChange={(e) => handleInputChange("ruc", e.target.value)}
                                        placeholder="20123456789"
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="position">Cargo</Label>
                                    <Input
                                        id="position"
                                        value={formData.position || ""}
                                        onChange={(e) => handleInputChange("position", e.target.value)}
                                        placeholder="CEO, CFO, etc."
                                        disabled={isSaving}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Biografía */}
                    <Card className={userRole === "emisor" ? "" : "lg:col-span-2"}>
                        <CardHeader>
                            <CardTitle>Biografía</CardTitle>
                            <CardDescription>Cuéntanos un poco sobre ti</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="bio">Biografía</Label>
                                <Textarea
                                    id="bio"
                                    value={formData.bio || ""}
                                    onChange={(e) => handleInputChange("bio", e.target.value)}
                                    placeholder="Escribe una breve descripción sobre ti..."
                                    rows={4}
                                    maxLength={maxBioLength}
                                    disabled={isSaving}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Máximo {maxBioLength} caracteres</span>
                                    <span>
                                        {bioLength}/{maxBioLength}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert>
                        <AlertDescription>Perfil actualizado exitosamente</AlertDescription>
                    </Alert>
                )}

                <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => router.push("/dashboard")} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar Cambios
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}