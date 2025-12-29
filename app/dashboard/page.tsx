import { redirect } from "next/navigation"

// Este dashboard legacy redirige al nuevo Hub
// Las rutas por retailer ahora son: /[retailer]/dashboard
export default function LegacyDashboardPage() {
  redirect("/hub")
}
