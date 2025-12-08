"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { motion } from "framer-motion"
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Gradient Background - Left Side */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div
          className="absolute inset-0 animate-gradient-shift"
          style={{
            background: `
              linear-gradient(
                -45deg,
                hsl(217, 91%, 50%),
                hsl(217, 91%, 60%),
                hsl(220, 9%, 35%),
                hsl(217, 91%, 45%),
                hsl(220, 9%, 25%),
                hsl(217, 91%, 55%)
              )
            `,
            backgroundSize: '400% 400%',
          }}
        />

        {/* Animated mesh blobs for depth */}
        <motion.div
          className="absolute top-0 left-0 w-[600px] h-[600px] bg-[hsl(217,91%,65%)]/30 rounded-full blur-[100px]"
          animate={{
            x: [-100, 100, -100],
            y: [-50, 100, -50],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[hsl(220,9%,40%)]/40 rounded-full blur-[100px]"
          animate={{
            x: [50, -100, 50],
            y: [50, -50, 50],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[hsl(217,91%,70%)]/20 rounded-full blur-[80px]"
          animate={{
            x: [-200, 0, -200],
            y: [-100, 100, -100],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Logo text */}
        <div className="absolute top-8 left-8 z-10">
          <h1 className="text-3xl font-bold text-white">RushData</h1>
          <p className="text-white/80 text-sm mt-1">Sell-Out Intelligence</p>
        </div>
      </div>

      {/* Login Form - Right Side */}
      <div className="flex-1 flex items-center justify-center bg-background p-8 lg:p-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold">RushData</h1>
              <p className="text-sm text-muted-foreground">Sell-Out Intelligence</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Inicia sesión en tu cuenta
              </h1>
              <p className="text-sm text-muted-foreground">
                Ingresa tus credenciales para acceder al portal
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-[hsl(217,91%,97%)] border-[hsl(217,91%,85%)] focus:border-[hsl(217,91%,50%)] focus:ring-2 focus:ring-[hsl(217,91%,50%)]/20"
                  placeholder="tu@email.com"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Contraseña
                  </Label>
                  <Link
                    href="#"
                    className="text-sm text-[hsl(217,91%,50%)] hover:text-[hsl(217,91%,45%)] font-medium"
                  >
                    ¿No recuerdas la contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 bg-[hsl(217,91%,97%)] border-[hsl(217,91%,85%)] focus:border-[hsl(217,91%,50%)] focus:ring-2 focus:ring-[hsl(217,91%,50%)]/20 pr-10"
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="border-[hsl(217,91%,70%)] data-[state=checked]:bg-[hsl(217,91%,50%)] data-[state=checked]:border-[hsl(217,91%,50%)]"
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Recordarme en este dispositivo
                </Label>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,55%)] text-white font-medium rounded-lg shadow-lg shadow-[hsl(217,91%,50%)]/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground mt-8">
              © RushData • Privacidad y condiciones
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
