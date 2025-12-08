"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  User,
  Lock,
  Bell,
  Palette,
  Save,
  Camera,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Check,
  Loader2,
  Moon,
  Sun,
  Monitor,
  AlertTriangle,
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { useTheme } from "next-themes"
import { supabase } from "@/lib/supabase/client"

// ============================================================================
// TYPES
// ============================================================================

interface UserProfile {
  nombre: string
  email: string
  telefono: string
  avatarUrl: string | null
}

interface NotificationSettings {
  emailAlerts: boolean
  stockAlerts: boolean
  predictionAlerts: boolean
  weeklyReport: boolean
}


// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ConfiguracionPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    nombre: user?.email?.split("@")[0] || "",
    email: user?.email || "",
    telefono: "",
    avatarUrl: null,
  })

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailAlerts: true,
    stockAlerts: true,
    predictionAlerts: true,
    weeklyReport: false,
  })

  // Loading states
  const [saving, setSaving] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  // Handlers
  const handleSaveProfile = async () => {
    setSaving("profile")
    // Simular guardado - aquí conectarías con Supabase
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(null)
    setSaveSuccess("profile")
    setTimeout(() => setSaveSuccess(null), 3000)
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return
    }

    setSaving("password")
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (error) throw error

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setSaveSuccess("password")
    } catch (error) {
      console.error("Error changing password:", error)
    } finally {
      setSaving(null)
      setTimeout(() => setSaveSuccess(null), 3000)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving("notifications")
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(null)
    setSaveSuccess("notifications")
    setTimeout(() => setSaveSuccess(null), 3000)
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Preview local
    const reader = new FileReader()
    reader.onloadend = () => {
      setProfile(prev => ({ ...prev, avatarUrl: reader.result as string }))
    }
    reader.readAsDataURL(file)

    // Aquí subirías a Supabase Storage
    // const { data, error } = await supabase.storage
    //   .from('avatars')
    //   .upload(`${user?.id}/${file.name}`, file)
  }

  const userInitials = profile.nombre
    ? profile.nombre.substring(0, 2).toUpperCase()
    : profile.email?.substring(0, 2).toUpperCase() || "RD"

  return (
    <div className="min-h-screen">
      <div className="max-w-[1200px] mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-semibold text-foreground">
            Configuración
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra tu cuenta, preferencias y configuración del sistema
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Tabs defaultValue="perfil" className="w-full">
            <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap gap-1">
              <TabsTrigger
                value="perfil"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm gap-2"
              >
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger
                value="seguridad"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm gap-2"
              >
                <Lock className="h-4 w-4" />
                Seguridad
              </TabsTrigger>
              <TabsTrigger
                value="apariencia"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm gap-2"
              >
                <Palette className="h-4 w-4" />
                Apariencia
              </TabsTrigger>
              <TabsTrigger
                value="notificaciones"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm gap-2"
              >
                <Bell className="h-4 w-4" />
                Notificaciones
              </TabsTrigger>
            </TabsList>

            {/* Tab: Perfil */}
            <TabsContent value="perfil" className="mt-6">
              <Card className="border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Información del Perfil
                  </CardTitle>
                  <CardDescription>
                    Actualiza tu información personal y foto de perfil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                        <AvatarImage src={profile.avatarUrl || undefined} />
                        <AvatarFallback className="bg-[hsl(217,91%,50%)] text-white text-2xl font-bold">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{profile.nombre || "Usuario"}</h3>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        Administrador
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Form Fields */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre completo</Label>
                      <Input
                        id="nombre"
                        placeholder="Tu nombre"
                        value={profile.nombre}
                        onChange={(e) => setProfile(prev => ({ ...prev, nombre: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          className="pl-9"
                          value={profile.email}
                          disabled
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        El correo no se puede cambiar
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono (opcional)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="telefono"
                          type="tel"
                          className="pl-9"
                          placeholder="+52 55 1234 5678"
                          value={profile.telefono}
                          onChange={(e) => setProfile(prev => ({ ...prev, telefono: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving === "profile"}
                      className="bg-[hsl(217,91%,50%)] hover:bg-[hsl(217,91%,45%)] text-white"
                    >
                      {saving === "profile" ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : saveSuccess === "profile" ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saveSuccess === "profile" ? "Guardado" : "Guardar cambios"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Seguridad */}
            <TabsContent value="seguridad" className="mt-6">
              <Card className="border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Cambiar Contraseña
                  </CardTitle>
                  <CardDescription>
                    Actualiza tu contraseña para mantener tu cuenta segura
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="max-w-md space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Contraseña actual</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? "text" : "password"}
                          placeholder="••••••••"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        >
                          {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nueva contraseña</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          placeholder="••••••••"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Mínimo 8 caracteres
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          placeholder="••••••••"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {passwordForm.newPassword && passwordForm.confirmPassword &&
                       passwordForm.newPassword !== passwordForm.confirmPassword && (
                        <p className="text-xs text-[hsl(220,9%,30%)] flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Las contraseñas no coinciden
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleChangePassword}
                      disabled={
                        saving === "password" ||
                        !passwordForm.newPassword ||
                        passwordForm.newPassword !== passwordForm.confirmPassword ||
                        passwordForm.newPassword.length < 8
                      }
                      className="bg-[hsl(217,91%,50%)] hover:bg-[hsl(217,91%,45%)] text-white"
                    >
                      {saving === "password" ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : saveSuccess === "password" ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <Lock className="h-4 w-4 mr-2" />
                      )}
                      {saveSuccess === "password" ? "Contraseña actualizada" : "Cambiar contraseña"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Apariencia */}
            <TabsContent value="apariencia" className="mt-6">
              <Card className="border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Tema de la Aplicación
                  </CardTitle>
                  <CardDescription>
                    Personaliza la apariencia del portal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div
                      onClick={() => setTheme("light")}
                      className={cn(
                        "cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-[hsl(217,91%,50%)]",
                        theme === "light" ? "border-[hsl(217,91%,50%)] bg-[hsl(217,91%,97%)]" : "border-border"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-white border border-border flex items-center justify-center">
                          <Sun className="h-5 w-5 text-[hsl(217,91%,50%)]" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Claro</p>
                          <p className="text-xs text-muted-foreground">Tema claro</p>
                        </div>
                      </div>
                      {/* Preview */}
                      <div className="rounded-md border border-border bg-white p-2 space-y-1">
                        <div className="h-2 w-16 rounded bg-gray-200" />
                        <div className="h-2 w-24 rounded bg-gray-100" />
                        <div className="h-2 w-20 rounded bg-gray-100" />
                      </div>
                    </div>

                    <div
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-[hsl(217,91%,50%)]",
                        theme === "dark" ? "border-[hsl(217,91%,50%)] bg-[hsl(217,91%,97%)]" : "border-border"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center">
                          <Moon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Oscuro</p>
                          <p className="text-xs text-muted-foreground">Tema oscuro</p>
                        </div>
                      </div>
                      {/* Preview */}
                      <div className="rounded-md border border-gray-700 bg-gray-900 p-2 space-y-1">
                        <div className="h-2 w-16 rounded bg-gray-700" />
                        <div className="h-2 w-24 rounded bg-gray-800" />
                        <div className="h-2 w-20 rounded bg-gray-800" />
                      </div>
                    </div>

                    <div
                      onClick={() => setTheme("system")}
                      className={cn(
                        "cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-[hsl(217,91%,50%)]",
                        theme === "system" ? "border-[hsl(217,91%,50%)] bg-[hsl(217,91%,97%)]" : "border-border"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-white to-gray-900 border border-border flex items-center justify-center">
                          <Monitor className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Sistema</p>
                          <p className="text-xs text-muted-foreground">Automático</p>
                        </div>
                      </div>
                      {/* Preview */}
                      <div className="rounded-md border border-border bg-gradient-to-r from-white to-gray-900 p-2 space-y-1">
                        <div className="h-2 w-16 rounded bg-gradient-to-r from-gray-200 to-gray-700" />
                        <div className="h-2 w-24 rounded bg-gradient-to-r from-gray-100 to-gray-800" />
                        <div className="h-2 w-20 rounded bg-gradient-to-r from-gray-100 to-gray-800" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Notificaciones */}
            <TabsContent value="notificaciones" className="mt-6">
              <Card className="border border-border/40 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Preferencias de Notificaciones
                  </CardTitle>
                  <CardDescription>
                    Configura qué notificaciones deseas recibir
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Alertas por correo</Label>
                        <p className="text-xs text-muted-foreground">
                          Recibe un resumen de alertas importantes por email
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailAlerts}
                        onCheckedChange={(checked) =>
                          setNotifications(prev => ({ ...prev, emailAlerts: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Alertas de stock bajo</Label>
                        <p className="text-xs text-muted-foreground">
                          Notificación cuando un producto está por agotarse
                        </p>
                      </div>
                      <Switch
                        checked={notifications.stockAlerts}
                        onCheckedChange={(checked) =>
                          setNotifications(prev => ({ ...prev, stockAlerts: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Alertas de predicciones</Label>
                        <p className="text-xs text-muted-foreground">
                          Aviso cuando un cliente está atrasado en su compra esperada
                        </p>
                      </div>
                      <Switch
                        checked={notifications.predictionAlerts}
                        onCheckedChange={(checked) =>
                          setNotifications(prev => ({ ...prev, predictionAlerts: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Reporte semanal</Label>
                        <p className="text-xs text-muted-foreground">
                          Recibe un resumen semanal de tu negocio cada lunes
                        </p>
                      </div>
                      <Switch
                        checked={notifications.weeklyReport}
                        onCheckedChange={(checked) =>
                          setNotifications(prev => ({ ...prev, weeklyReport: checked }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveNotifications}
                      disabled={saving === "notifications"}
                      className="bg-[hsl(217,91%,50%)] hover:bg-[hsl(217,91%,45%)] text-white"
                    >
                      {saving === "notifications" ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : saveSuccess === "notifications" ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saveSuccess === "notifications" ? "Guardado" : "Guardar preferencias"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
