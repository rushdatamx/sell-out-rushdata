'use client'

import { useState, useEffect } from 'react'
import { Mail, Eye, Send, CheckCircle, XCircle, Loader2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Retailer {
  id: number
  codigo: string
  nombre: string
}

interface Tenant {
  id: string
  nombre: string
  email: string
  retailers: Retailer[]
}

interface SendResult {
  email: string
  status: 'sent' | 'failed'
  error?: string
}

export default function AdminDigestPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoadingTenants, setIsLoadingTenants] = useState(true)

  const [selectedTenant, setSelectedTenant] = useState<string>('')
  const [selectedRetailer, setSelectedRetailer] = useState<string>('')
  const [emails, setEmails] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [results, setResults] = useState<SendResult[] | null>(null)

  // Cargar tenants al montar
  useEffect(() => {
    async function loadTenants() {
      try {
        const res = await fetch('/api/admin/tenants')
        const data = await res.json()
        if (data.tenants) {
          setTenants(data.tenants)
        }
      } catch (error) {
        console.error('Error loading tenants:', error)
      } finally {
        setIsLoadingTenants(false)
      }
    }
    loadTenants()
  }, [])

  const tenant = tenants.find((t) => t.id === selectedTenant)
  const retailer = tenant?.retailers.find((r) => r.id.toString() === selectedRetailer)

  // Resetear retailer cuando cambia el tenant
  useEffect(() => {
    setSelectedRetailer('')
    setShowPreview(false)
    setResults(null)
  }, [selectedTenant])

  // Auto-llenar email del tenant
  useEffect(() => {
    if (tenant && !emails) {
      setEmails(tenant.email)
    }
  }, [tenant, emails])

  const handlePreview = () => {
    if (!selectedTenant || !selectedRetailer) {
      alert('Selecciona un tenant y retailer primero')
      return
    }
    setShowPreview(true)
    setResults(null)
  }

  const handleSend = async () => {
    if (!selectedTenant || !selectedRetailer) {
      alert('Selecciona un tenant y retailer primero')
      return
    }

    const emailList = emails
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0)

    if (emailList.length === 0) {
      alert('Escribe al menos un email')
      return
    }

    // Validar formato de emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emailList.filter((e) => !emailRegex.test(e))
    if (invalidEmails.length > 0) {
      alert(`Emails inválidos: ${invalidEmails.join(', ')}`)
      return
    }

    const confirmed = confirm(
      `¿Enviar digest de ${retailer?.nombre} (${tenant?.nombre}) a ${emailList.length} email(s)?\n\n${emailList.join('\n')}`
    )
    if (!confirmed) return

    setIsSending(true)
    setResults(null)

    try {
      const response = await fetch('/api/digest/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: selectedTenant,
          retailer: retailer?.codigo,
          emails: emailList,
        }),
      })

      const data = await response.json()

      if (data.results) {
        setResults(data.results)
      } else if (data.error) {
        setResults([{ email: 'Error general', status: 'failed', error: data.error }])
      }
    } catch (error) {
      setResults([
        {
          email: 'Error',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Error desconocido',
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  // Determinar tipo de digest según retailer
  const digestType = selectedRetailer === '1' ? 'weekly' : 'monthly'

  const previewUrl =
    selectedTenant && selectedRetailer
      ? `/api/digest/preview?tenant_id=${selectedTenant}&retailer_id=${selectedRetailer}&type=${digestType}&insights=false`
      : ''

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Envío de Digest</h1>
          <p className="text-sm text-gray-500">Envía reportes por email a tus clientes</p>
        </div>
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Configurar envío</CardTitle>
          <CardDescription>Selecciona el cliente, retailer y destinatarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selector de Tenant */}
          <div className="space-y-2">
            <Label htmlFor="tenant">
              <Building2 className="w-4 h-4 inline mr-2" />
              Cliente (Tenant)
            </Label>
            <Select
              value={selectedTenant}
              onValueChange={setSelectedTenant}
              disabled={isLoadingTenants}
            >
              <SelectTrigger id="tenant">
                <SelectValue
                  placeholder={isLoadingTenants ? 'Cargando...' : 'Selecciona un cliente'}
                />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de Retailer */}
          <div className="space-y-2">
            <Label htmlFor="retailer">Retailer</Label>
            <Select
              value={selectedRetailer}
              onValueChange={setSelectedRetailer}
              disabled={!selectedTenant}
            >
              <SelectTrigger id="retailer">
                <SelectValue
                  placeholder={!selectedTenant ? 'Primero selecciona un cliente' : 'Selecciona un retailer'}
                />
              </SelectTrigger>
              <SelectContent>
                {tenant?.retailers.map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    {r.nombre} {r.id === 1 ? '(Semanal)' : '(Mensual)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRetailer && (
              <p className="text-xs text-gray-500">
                {selectedRetailer === '1'
                  ? 'HEB: Últimos 7 días desde la fecha más reciente'
                  : 'Último mes registrado vs mes anterior'}
              </p>
            )}
          </div>

          {/* Emails */}
          <div className="space-y-2">
            <Label htmlFor="emails">Emails destinatarios</Label>
            <Textarea
              id="emails"
              placeholder="email1@ejemplo.com, email2@ejemplo.com"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-gray-500">
              Separar múltiples emails con coma o salto de línea
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={!selectedTenant || !selectedRetailer}
            >
              <Eye className="w-4 h-4 mr-2" />
              Previsualizar
            </Button>
            <Button
              onClick={handleSend}
              disabled={!selectedTenant || !selectedRetailer || !emails.trim() || isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && selectedTenant && selectedRetailer && (
        <Card>
          <CardHeader>
            <CardTitle>Vista previa del email</CardTitle>
            <CardDescription>
              Digest {digestType === 'weekly' ? 'semanal' : 'mensual'} de {retailer?.nombre} para{' '}
              {tenant?.nombre}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden bg-white">
              <iframe
                src={previewUrl}
                className="w-full h-[600px]"
                title="Preview del digest"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados del envío</CardTitle>
            <CardDescription>
              {results.filter((r) => r.status === 'sent').length} enviados,{' '}
              {results.filter((r) => r.status === 'failed').length} fallidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    result.status === 'sent' ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  {result.status === 'sent' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        result.status === 'sent' ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      {result.email}
                    </p>
                    {result.error && <p className="text-sm text-red-600">{result.error}</p>}
                  </div>
                  <span
                    className={`text-sm ${
                      result.status === 'sent' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {result.status === 'sent' ? 'Enviado' : 'Fallido'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
