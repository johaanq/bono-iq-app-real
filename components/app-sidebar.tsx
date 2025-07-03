"use client"

import * as React from "react"
import { Home, Coins, BarChart3, Settings, HelpCircle, Search, Building2, Plus } from 'lucide-react'
import Link from "next/link"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/client"
import type { Profile, User } from "@/lib/types"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<User | null>(null)
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [loading, setLoading] = React.useState(true)
  const pathname = usePathname()

  React.useEffect(() => {
    async function getUser() {
      const supabase = createClient()

      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser()

      if (error || !authUser) {
        setLoading(false)
        return
      }

      // Get user data
      const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single()

      if (userError || !userData) {
        setLoading(false)
        return
      }

      // Get profile data
      const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", authUser.id).single()

      setUser(userData)
      setProfile(profileData || null)
      setLoading(false)
    }

    getUser()
  }, [])

  if (loading) {
    return (
        <Sidebar {...props}>
          <SidebarContent>
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </SidebarContent>
        </Sidebar>
    )
  }

  // Navigation items based on user role
  const getNavItems = () => {
    const baseItems = [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
        isActive: pathname === "/dashboard",
      },
    ]

    if (user?.role === "emisor") {
      return [
        ...baseItems,
        {
          title: "Bonos",
          url: "/bonos",
          icon: Coins,
          isActive: pathname.startsWith("/bonos"),
          items: [
            {
              title: "Bonos Disponibles",
              url: "/bonos",
            },
            {
              title: "Mis Bonos",
              url: "/mis-bonos",
            },
          ],
        },
        {
          title: "Tabla Amortización",
          url: "/tabla-amortizacion",
          icon: BarChart3,
          isActive: pathname === "/tabla-amortizacion",
        },
      ]
    } else {
      return [
        ...baseItems,
        {
          title: "Bonos",
          url: "/bonos",
          icon: Coins,
          isActive: pathname.startsWith("/bonos"),
          items: [
            {
              title: "Bonos Disponibles",
              url: "/bonos",
            },
            {
              title: "Mis Inversiones",
              url: "/mis-inversiones",
            },
          ],
        },
        {
          title: "Tabla Amortización",
          url: "/tabla-amortizacion",
          icon: BarChart3,
          isActive: pathname === "/tabla-amortizacion",
        },
      ]
    }
  }

  const navSecondary = [
    {
      title: "Configuración",
      url: "/profile",
      icon: Settings,
    },
    {
      title: "Ayuda",
      url: "/help",
      icon: HelpCircle,
    },
    {
      title: "Buscar",
      url: "/search",
      icon: Search,
    },
  ]

  return (
      <Sidebar variant="inset" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Building2 className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">BonoIQ</span>
                    <span className="truncate text-xs">Gestión de Bonos</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* Botón Crear Bono para emisores */}
          {user?.role === "emisor" && (
              <div className="px-3 py-2">
                <Button asChild className="w-full" size="sm">
                  <Link href="/crear-bono">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Bono
                  </Link>
                </Button>
              </div>
          )}
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={getNavItems()} />
          <NavSecondary items={navSecondary} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
            {user && profile && (
                <NavUser profile={profile} />
            )}
      </SidebarFooter>
      </Sidebar>
  )
}
