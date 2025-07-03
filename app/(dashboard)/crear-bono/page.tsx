import { CreateBondForm } from "@/components/create-bond-form"
import { getCurrentUser } from "@/lib/supabase/queries.client"
import { redirect } from "next/navigation"

export default async function CreateBondPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/login")
    }

    if (user.role !== "emisor") {
        redirect("/dashboard")
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Crear Nuevo Bono</h2>
                <p className="text-muted-foreground">Completa la información para crear un nuevo bono con método americano</p>
            </div>
            <CreateBondForm />
        </div>
    )
}
