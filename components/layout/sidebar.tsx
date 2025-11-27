"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  Package,
  TrendingUp,
  BarChart3,
  Sparkles,
  Settings,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-context"
import { ThemeToggleSimple } from "@/components/ui/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Vista general" },
  { name: "Clientes", href: "/clientes", icon: Users, description: "Gestión de clientes" },
  { name: "Productos", href: "/productos", icon: Package, description: "Catálogo de productos" },
  { name: "Venta Perdida", href: "/ventas", icon: TrendingUp, description: "Análisis de ventas" },
  { name: "Inventario", href: "/dashboard/inventario", icon: BarChart3, description: "Control de stock" },
  { name: "Predicciones", href: "/dashboard/predicciones", icon: Sparkles, description: "IA y predicciones" },
  { name: "Configuración", href: "/dashboard/configuracion", icon: Settings, description: "Ajustes" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPinned, setIsPinned] = useState(false)

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "RD"

  const showExpanded = isExpanded || isPinned

  const handleTogglePin = () => {
    if (isPinned) {
      // Si está fijado, lo desfijamos y colapsamos
      setIsPinned(false)
      setIsExpanded(false)
    } else {
      // Si no está fijado, lo fijamos
      setIsPinned(true)
    }
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: showExpanded ? 280 : 80 }}
      transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
      onMouseEnter={() => !isPinned && setIsExpanded(true)}
      onMouseLeave={() => !isPinned && setIsExpanded(false)}
      className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col"
    >
      <div className="flex grow flex-col gap-y-4 overflow-hidden bg-card border-r border-border px-3 pb-4">
        {/* Logo Section */}
        <div className="flex h-16 shrink-0 items-center justify-between px-2">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-1 rounded-lg bg-gradient-primary opacity-20 blur-sm group-hover:opacity-40 transition-opacity" />
              <AnimatePresence mode="wait">
                {showExpanded ? (
                  <motion.div
                    key="full-logo"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Image
                      src="/logo.png"
                      alt="RushData"
                      width={130}
                      height={36}
                      className="h-8 w-auto relative"
                      priority
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="icon-logo"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center"
                  >
                    <span className="text-white font-bold text-lg">R</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Link>

          {/* Pin/Collapse button - only show when expanded */}
          <AnimatePresence>
            {showExpanded && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                onClick={handleTogglePin}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title={isPinned ? "Colapsar sidebar" : "Fijar sidebar"}
              >
                {isPinned ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4" />
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-6">
            <li>
              <AnimatePresence>
                {showExpanded && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3"
                  >
                    Menu
                  </motion.p>
                )}
              </AnimatePresence>
              <ul role="list" className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <li key={item.name} className="relative group">
                      <Link
                        href={item.href}
                        className={cn(
                          "relative flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                          !showExpanded && "justify-center"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5 shrink-0 transition-transform duration-200",
                            !isActive && "group-hover:scale-110"
                          )}
                          aria-hidden="true"
                        />

                        <AnimatePresence>
                          {showExpanded && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: "auto" }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.2 }}
                              className="whitespace-nowrap overflow-hidden"
                            >
                              {item.name}
                            </motion.span>
                          )}
                        </AnimatePresence>

                        {/* Hover arrow - only when expanded */}
                        {showExpanded && (
                          <ChevronRight
                            className={cn(
                              "ml-auto h-4 w-4 transition-all duration-200",
                              isActive
                                ? "opacity-100"
                                : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                            )}
                          />
                        )}
                      </Link>

                      {/* Custom Tooltip - only when collapsed */}
                      {!showExpanded && (
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </li>

            {/* User Section */}
            <li className="mt-auto">
              <div className="border-t border-border pt-4">
                {/* Theme Toggle */}
                <div className={cn(
                  "flex items-center mb-3",
                  showExpanded ? "justify-between px-3" : "justify-center"
                )}>
                  <AnimatePresence>
                    {showExpanded && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Tema
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <ThemeToggleSimple />
                </div>

                {/* User Info */}
                <div className={cn(
                  "rounded-xl bg-secondary/50 p-3 mb-2 relative group",
                  !showExpanded && "flex justify-center"
                )}>
                  <div className={cn(
                    "flex items-center",
                    showExpanded ? "gap-3" : ""
                  )}>
                    <Avatar className={cn(
                      "border-2 border-primary/20 shrink-0",
                      showExpanded ? "h-9 w-9" : "h-10 w-10"
                    )}>
                      <AvatarFallback className="bg-gradient-primary text-white font-bold text-sm">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <AnimatePresence>
                      {showExpanded && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="flex-1 min-w-0 overflow-hidden"
                        >
                          <p className="text-[10px] font-medium text-muted-foreground">
                            Sesion activa
                          </p>
                          <p className="text-xs font-semibold text-foreground truncate">
                            {user?.email}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Custom Tooltip for User - only when collapsed */}
                  {!showExpanded && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                      <p className="font-medium text-sm">{user?.email}</p>
                      <p className="text-xs text-muted-foreground">Sesion activa</p>
                    </div>
                  )}
                </div>

                {/* Logout Button */}
                <div className="relative group">
                  <button
                    onClick={signOut}
                    className={cn(
                      "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                      !showExpanded && "justify-center"
                    )}
                  >
                    <LogOut
                      className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5"
                      aria-hidden="true"
                    />
                    <AnimatePresence>
                      {showExpanded && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          Cerrar sesion
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>

                  {/* Custom Tooltip for Logout - only when collapsed */}
                  {!showExpanded && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                      <p className="text-sm">Cerrar sesion</p>
                    </div>
                  )}
                </div>
              </div>
            </li>
          </ul>
        </nav>

        {/* Version Badge - only when expanded */}
        <AnimatePresence>
          {showExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center"
            >
              <span className="text-[10px] font-medium text-muted-foreground/50 tracking-wider">
                RushData v2.0
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}
