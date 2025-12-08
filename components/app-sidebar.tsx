"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Percent,
  Settings,
  Store,
  Moon,
  Sun,
  ShoppingCart,
  DollarSign,
  LineChart,
  Sparkles,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth/auth-context"
import { useTheme } from "next-themes"

// Navegación de RushData Sell-Out
const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Productos",
    url: "/productos",
    icon: Package,
  },
  {
    title: "Tiendas",
    url: "/tiendas",
    icon: Store,
  },
  {
    title: "Inventario",
    url: "/inventario",
    icon: AlertTriangle,
  },
  {
    title: "Reabastecimiento",
    url: "/reabastecimiento",
    icon: ShoppingCart,
  },
  {
    title: "Precios",
    url: "/precios",
    icon: DollarSign,
  },
  {
    title: "Análisis",
    url: "/analisis",
    icon: LineChart,
  },
  {
    title: "Configuración",
    url: "/configuracion",
    icon: Settings,
  },
  {
    title: "IA RushData",
    url: "/ia",
    icon: Sparkles,
  },
]

const rushDataTeam = [
  {
    name: "RushData",
    logo: LayoutDashboard,
    plan: "Sell-Out Intelligence",
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "RD"

  const userData = {
    name: user?.email?.split("@")[0] || "Usuario",
    email: user?.email || "usuario@rushdata.com",
    avatar: userInitials,
  }

  // Marcar item activo basado en pathname
  const navItemsWithActive = navItems.map(item => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(item.url + "/"),
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={rushDataTeam} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItemsWithActive} />
      </SidebarContent>
      <SidebarFooter>
        {/* Theme Toggle */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              tooltip="Cambiar tema"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span>Cambiar tema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser user={userData} onSignOut={signOut} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
