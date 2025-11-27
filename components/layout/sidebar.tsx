"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Package,
  TrendingUp,
  BarChart3,
  AlertCircle,
  Settings,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-context"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Productos", href: "/productos", icon: Package },
  { name: "Venta Perdida", href: "/ventas", icon: TrendingUp },
  { name: "Inventario", href: "/dashboard/inventario", icon: BarChart3 },
  { name: "Predicciones", href: "/dashboard/predicciones", icon: AlertCircle },
  { name: "Configuración", href: "/dashboard/configuracion", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <Image
            src="/logo.png"
            alt="RushData"
            width={140}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          isActive
                            ? "bg-[#007BFF]/10 text-[#007BFF]"
                            : "text-gray-600 hover:text-[#007BFF] hover:bg-gray-50",
                          "group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-bold transition-all"
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive ? "text-[#007BFF]" : "text-gray-400 group-hover:text-[#007BFF]",
                            "h-5 w-5 shrink-0"
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </li>

            {/* User Info & Logout */}
            <li className="mt-auto">
              <div className="border-t border-gray-200 pt-4 -mx-2">
                {/* User Info */}
                <div className="px-4 py-3 mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Usuario</p>
                  <p className="text-sm font-bold text-gray-900 mt-1 truncate">{user?.email}</p>
                </div>

                {/* Logout Button */}
                <button
                  onClick={signOut}
                  className="w-full text-gray-600 hover:text-red-600 hover:bg-red-50 group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-bold transition-all"
                >
                  <LogOut
                    className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-red-600"
                    aria-hidden="true"
                  />
                  Cerrar sesión
                </button>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  )
}
