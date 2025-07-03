import { ProfileForm } from "@/components/profile-form"
import { getCurrentUser } from "@/lib/supabase/queries.client"
import { getProfile } from "@/lib/supabase/queries.client"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/login")
    }

    const profile = await getProfile(user.id)

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Perfil de Usuario</h2>
                <p className="text-muted-foreground">Administra tu información personal y configuración de cuenta</p>
            </div>
            <ProfileForm initialProfile={profile} userRole={user.role} />
        </div>
    )
}
