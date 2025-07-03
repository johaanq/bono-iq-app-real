import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { AuthProvider } from "@/components/auth-provider"

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    return (
        <AuthProvider>
            <SidebarProvider>
                <div className="flex min-h-screen w-full">
                    <AppSidebar />
                    <div className="flex flex-1 flex-col">
                        <SiteHeader />
                        <main className="flex-1 overflow-auto">
                            <div className="container mx-auto p-6">{children}</div>
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        </AuthProvider>
    )
}
