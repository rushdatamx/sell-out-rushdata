"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import Image from "next/image"
import { motion } from "framer-motion"
import { Mail, Lock, ArrowRight, Sparkles, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { GradientText } from "@/components/ui/gradient-text"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black,transparent)]" />

      <div className="w-full max-w-md relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-2xl backdrop-blur-sm bg-card/80">
            <CardContent className="p-8">
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex justify-center mb-8"
              >
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full bg-gradient-primary opacity-20 blur-xl" />
                  <Image
                    src="/logo.png"
                    alt="RushData Logo"
                    width={160}
                    height={48}
                    className="h-10 w-auto relative"
                    priority
                  />
                </div>
              </motion.div>

              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center mb-8"
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.3, type: "spring" }}
                    className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/25"
                  >
                    <Sparkles className="h-4 w-4 text-white" />
                  </motion.div>
                  <GradientText as="h1" className="text-2xl">
                    Bienvenido
                  </GradientText>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ingresa tus credenciales para acceder a tu portal
                </p>
              </motion.div>

              {/* Form */}
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Email */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold text-foreground flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Correo electrónico
                  </label>
                  <div className="relative group">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 pl-4 pr-4 bg-secondary/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="tu@email.com"
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-primary opacity-0 group-focus-within:opacity-10 transition-opacity pointer-events-none" />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-foreground flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Contraseña
                  </label>
                  <div className="relative group">
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 pl-4 pr-4 bg-secondary/50 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="••••••••"
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-primary opacity-0 group-focus-within:opacity-10 transition-opacity pointer-events-none" />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm"
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full h-12 font-bold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      Iniciar sesión
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </motion.form>

              {/* Demo Credentials */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10"
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">
                      Credenciales de demostración
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Email: <span className="font-mono text-foreground">demo@galletasdelnorte.mx</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </Card>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center text-xs text-muted-foreground mt-6"
          >
            RushData v2.0 • Powered by AI
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
