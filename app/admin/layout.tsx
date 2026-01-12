import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin - RushData',
  description: 'Panel de administración RushData',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <img src="/icono.png" alt="RushData" className="w-8 h-8" />
          <span className="text-lg font-semibold text-gray-900">RushData Admin</span>
        </div>
      </header>
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}
