"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  ArrowLeft,
  LayoutDashboard,
  Package,
  Store,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  LineChart,
  Target,
  Sparkles,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth/auth-context"
import { useActiveRetailer } from "@/components/retailer/retailer-context"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function RetailerSidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const { retailer, config } = useActiveRetailer()

  // Construir items de navegación basados en el retailer actual
  const retailerCode = retailer?.codigo || ""

  const navItems = [
    {
      title: "Dashboard",
      url: `/${retailerCode}/dashboard`,
      icon: LayoutDashboard,
      enabled: config?.modulos.dashboard ?? true,
    },
    {
      title: "Productos",
      url: `/${retailerCode}/productos`,
      icon: Package,
      enabled: config?.modulos.productos ?? true,
    },
    {
      title: "Tiendas",
      url: `/${retailerCode}/tiendas`,
      icon: Store,
      enabled: config?.modulos.tiendas ?? true,
    },
    {
      title: "Inventario",
      url: `/${retailerCode}/inventario`,
      icon: AlertTriangle,
      enabled: config?.modulos.inventario ?? true,
    },
    {
      title: "Reabastecimiento",
      url: `/${retailerCode}/reabastecimiento`,
      icon: ShoppingCart,
      enabled: config?.modulos.reabastecimiento ?? true,
    },
    {
      title: "Precios",
      url: `/${retailerCode}/precios`,
      icon: DollarSign,
      enabled: config?.modulos.precios ?? true,
    },
    {
      title: "Análisis",
      url: `/${retailerCode}/analisis`,
      icon: LineChart,
      enabled: config?.modulos.analisis ?? true,
    },
    {
      title: "Promociones",
      url: `/${retailerCode}/promociones`,
      icon: Target,
      enabled: config?.modulos.promociones ?? false,
    },
  ].filter((item) => item.enabled)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg">
            <Image
              src="/icono.png"
              alt="RushData"
              width={28}
              height={28}
              className="rounded"
            />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">RushData</span>
            <span className="text-xs text-muted-foreground">Sell-Out Intelligence</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Botón para volver al Hub */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Volver al Hub">
                  <Link href="/hub" className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Hub</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Badge del retailer */}
        {retailer && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-2 py-1.5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <Badge
                  variant="outline"
                  className="w-full justify-center py-1.5 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:rounded-full"
                  style={{
                    borderColor: retailer.color_hex,
                    color: retailer.color_hex,
                  }}
                >
                  <span className="group-data-[collapsible=icon]:hidden">
                    {retailer.nombre}
                  </span>
                  <span className="hidden group-data-[collapsible=icon]:inline text-xs font-bold">
                    {retailer.nombre.charAt(0)}
                  </span>
                </Badge>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Navegación del retailer */}
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* IA RushData */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/ia"}
                  tooltip="IA RushData"
                >
                  <Link href="/ia">
                    <Sparkles className="h-4 w-4" />
                    <span>IA RushData</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser
          user={{
            name: user?.email?.split("@")[0] || "Usuario",
            email: user?.email || "",
            avatar: "",
          }}
          onSignOut={signOut}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
