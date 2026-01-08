"use client"

import * as React from "react"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Percent,
  Calendar,
  Rocket,
  Check,
} from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  MultiSelectFilter,
  type FilterOption,
} from "@/components/ui/multi-select-filter"
import { DateRangePickerNotion } from "@/components/ui/date-range-picker-notion"

import { WIZARD_STEPS, TIPOS_PROMOCION, DIAS_RETENCION_DEFAULT } from "@/lib/promociones/constants"
import { calcularFechasBaseline, validarConfigPromocion } from "@/hooks/use-promociones"
import type {
  PromocionConfig,
  PromocionFiltros,
  TipoPromocion,
  PromocionParametros,
} from "@/lib/promociones/types"

interface PromocionWizardProps {
  filtros: PromocionFiltros | undefined
  isLoadingFiltros: boolean
  onAnalizar: (config: PromocionConfig) => void
}

export function PromocionWizard({
  filtros,
  isLoadingFiltros,
  onAnalizar,
}: PromocionWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(1)

  // Step 1: Productos
  const [productosSeleccionados, setProductosSeleccionados] = React.useState<string[]>([])
  const [analizarComoGrupo, setAnalizarComoGrupo] = React.useState(false)
  const [nombreGrupo, setNombreGrupo] = React.useState("")

  // Step 2: Tipo de promoción
  const [tipoPromocion, setTipoPromocion] = React.useState<TipoPromocion | null>(null)
  const [parametros, setParametros] = React.useState<Partial<PromocionParametros>>({})

  // Step 3: Períodos
  const [periodoPromo, setPeriodoPromo] = React.useState<DateRange | undefined>()
  const [periodoBaseline, setPeriodoBaseline] = React.useState<DateRange | undefined>()
  const [baselineAuto, setBaselineAuto] = React.useState(true)
  const [diasPostPromo, setDiasPostPromo] = React.useState(DIAS_RETENCION_DEFAULT)
  const [ciudadesSeleccionadas, setCiudadesSeleccionadas] = React.useState<string[]>([])
  const [tiendasSeleccionadas, setTiendasSeleccionadas] = React.useState<string[]>([])

  // Opciones para filtros
  const productoOptions: FilterOption[] = React.useMemo(
    () =>
      filtros?.productos?.map((p) => ({
        value: p.id.toString(),
        label: p.nombre,
        sublabel: p.upc,
      })) || [],
    [filtros?.productos]
  )

  const ciudadOptions: FilterOption[] = React.useMemo(
    () =>
      filtros?.ciudades?.map((c) => ({
        value: c,
        label: c,
      })) || [],
    [filtros?.ciudades]
  )

  const tiendaOptions: FilterOption[] = React.useMemo(
    () =>
      filtros?.tiendas?.map((t) => ({
        value: t.id.toString(),
        label: t.nombre,
        sublabel: t.ciudad,
      })) || [],
    [filtros?.tiendas]
  )

  // Obtener categoría del primer producto seleccionado
  const categoriaSeleccionada = React.useMemo(() => {
    if (productosSeleccionados.length === 0) return null
    const productoId = parseInt(productosSeleccionados[0])
    const producto = filtros?.productos?.find((p) => p.id === productoId)
    return producto?.categoria || null
  }, [productosSeleccionados, filtros?.productos])

  // Calcular baseline automático cuando cambia el período promo
  React.useEffect(() => {
    if (baselineAuto && periodoPromo?.from && periodoPromo?.to) {
      const { inicio, fin } = calcularFechasBaseline(
        periodoPromo.from,
        periodoPromo.to
      )
      setPeriodoBaseline({ from: inicio, to: fin })
    }
  }, [baselineAuto, periodoPromo])

  // Validaciones por paso
  const canProceedStep1 = productosSeleccionados.length > 0
  const canProceedStep2 = tipoPromocion !== null && isParametrosValidos()
  const canProceedStep3 = periodoPromo?.from && periodoPromo?.to && periodoBaseline?.from && periodoBaseline?.to

  function isParametrosValidos(): boolean {
    if (!tipoPromocion) return false

    switch (tipoPromocion) {
      case "descuento_porcentaje":
        return (parametros as { porcentaje?: number }).porcentaje !== undefined &&
          (parametros as { porcentaje?: number }).porcentaje! > 0 &&
          (parametros as { porcentaje?: number }).porcentaje! <= 100
      case "precio_especial":
        return (parametros as { precio?: number }).precio !== undefined &&
          (parametros as { precio?: number }).precio! > 0
      case "multicompra_nx1":
        return (parametros as { compra?: number; lleva?: number }).compra !== undefined &&
          (parametros as { compra?: number; lleva?: number }).lleva !== undefined &&
          (parametros as { compra?: number; lleva?: number }).compra! > (parametros as { compra?: number; lleva?: number }).lleva!
      case "multicompra_nxprecio":
        return (parametros as { cantidad?: number; precio?: number }).cantidad !== undefined &&
          (parametros as { cantidad?: number; precio?: number }).precio !== undefined &&
          (parametros as { cantidad?: number; precio?: number }).cantidad! > 0 &&
          (parametros as { cantidad?: number; precio?: number }).precio! > 0
      case "bundle":
        return (parametros as { precioBundle?: number }).precioBundle !== undefined &&
          (parametros as { precioBundle?: number }).precioBundle! > 0
      default:
        return false
    }
  }

  // Construir configuración final
  function buildConfig(): PromocionConfig | null {
    if (!periodoPromo?.from || !periodoPromo?.to || !periodoBaseline?.from || !periodoBaseline?.to) {
      return null
    }
    if (!tipoPromocion) return null

    const config: PromocionConfig = {
      productoIds: productosSeleccionados.map((id) => parseInt(id)),
      productoGrupo: analizarComoGrupo ? nombreGrupo : undefined,
      analizarComoGrupo,
      tipo: tipoPromocion,
      parametros: { tipo: tipoPromocion, ...parametros } as PromocionParametros,
      fechaInicioPromo: format(periodoPromo.from, "yyyy-MM-dd"),
      fechaFinPromo: format(periodoPromo.to, "yyyy-MM-dd"),
      fechaInicioBaseline: format(periodoBaseline.from, "yyyy-MM-dd"),
      fechaFinBaseline: format(periodoBaseline.to, "yyyy-MM-dd"),
      diasPostPromo,
      tiendaIds: tiendasSeleccionadas.length > 0 ? tiendasSeleccionadas.map((id) => parseInt(id)) : undefined,
      ciudades: ciudadesSeleccionadas.length > 0 ? ciudadesSeleccionadas : undefined,
      categoria: categoriaSeleccionada || undefined,
    }

    return config
  }

  function handleAnalizar() {
    const config = buildConfig()
    if (config) {
      const { valido, errores } = validarConfigPromocion(config)
      if (valido) {
        onAnalizar(config)
      } else {
        console.error("Errores de validación:", errores)
      }
    }
  }

  // Renderizar parámetros según tipo de promoción
  function renderParametros() {
    if (!tipoPromocion) return null

    switch (tipoPromocion) {
      case "descuento_porcentaje":
        return (
          <div className="space-y-2">
            <Label htmlFor="porcentaje">Porcentaje de descuento</Label>
            <div className="flex items-center gap-2">
              <Input
                id="porcentaje"
                type="number"
                min={1}
                max={100}
                placeholder="20"
                value={(parametros as { porcentaje?: number }).porcentaje || ""}
                onChange={(e) =>
                  setParametros({ porcentaje: parseFloat(e.target.value) || 0 })
                }
                className="w-24"
              />
              <span className="text-muted-foreground">%</span>
            </div>
          </div>
        )

      case "precio_especial":
        return (
          <div className="space-y-2">
            <Label htmlFor="precio">Precio promocional</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                id="precio"
                type="number"
                min={0.01}
                step={0.01}
                placeholder="18.00"
                value={(parametros as { precio?: number }).precio || ""}
                onChange={(e) =>
                  setParametros({ precio: parseFloat(e.target.value) || 0 })
                }
                className="w-32"
              />
              <span className="text-muted-foreground">MXN</span>
            </div>
          </div>
        )

      case "multicompra_nx1":
        return (
          <div className="flex gap-6">
            <div className="space-y-2">
              <Label htmlFor="compra">Compra</Label>
              <Input
                id="compra"
                type="number"
                min={2}
                placeholder="3"
                value={(parametros as { compra?: number }).compra || ""}
                onChange={(e) =>
                  setParametros({
                    ...parametros,
                    compra: parseInt(e.target.value) || 0,
                  })
                }
                className="w-20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lleva">Lleva</Label>
              <Input
                id="lleva"
                type="number"
                min={1}
                placeholder="2"
                value={(parametros as { lleva?: number }).lleva || ""}
                onChange={(e) =>
                  setParametros({
                    ...parametros,
                    lleva: parseInt(e.target.value) || 0,
                  })
                }
                className="w-20"
              />
            </div>
          </div>
        )

      case "multicompra_nxprecio":
        return (
          <div className="flex gap-6">
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                id="cantidad"
                type="number"
                min={2}
                placeholder="2"
                value={(parametros as { cantidad?: number }).cantidad || ""}
                onChange={(e) =>
                  setParametros({
                    ...parametros,
                    cantidad: parseInt(e.target.value) || 0,
                  })
                }
                className="w-20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio">Por $</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  id="precio"
                  type="number"
                  min={0.01}
                  step={0.01}
                  placeholder="29"
                  value={(parametros as { precio?: number }).precio || ""}
                  onChange={(e) =>
                    setParametros({
                      ...parametros,
                      precio: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-24"
                />
              </div>
            </div>
          </div>
        )

      case "bundle":
        return (
          <div className="space-y-2">
            <Label htmlFor="precioBundle">Precio del bundle</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                id="precioBundle"
                type="number"
                min={0.01}
                step={0.01}
                placeholder="99.00"
                value={(parametros as { precioBundle?: number }).precioBundle || ""}
                onChange={(e) =>
                  setParametros({ precioBundle: parseFloat(e.target.value) || 0 })
                }
                className="w-32"
              />
              <span className="text-muted-foreground">MXN</span>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Resumen para paso 4
  function renderResumen() {
    const productosNames = productosSeleccionados
      .map((id) => filtros?.productos?.find((p) => p.id === parseInt(id))?.nombre)
      .filter(Boolean)

    const tipoConfig = TIPOS_PROMOCION.find((t) => t.value === tipoPromocion)

    let parametrosTexto = ""
    if (tipoPromocion === "descuento_porcentaje") {
      parametrosTexto = `${(parametros as { porcentaje?: number }).porcentaje}% de descuento`
    } else if (tipoPromocion === "precio_especial") {
      parametrosTexto = `Precio especial: $${(parametros as { precio?: number }).precio}`
    } else if (tipoPromocion === "multicompra_nx1") {
      parametrosTexto = `${(parametros as { compra?: number }).compra}x${(parametros as { lleva?: number }).lleva}`
    } else if (tipoPromocion === "multicompra_nxprecio") {
      parametrosTexto = `${(parametros as { cantidad?: number }).cantidad} x $${(parametros as { precio?: number }).precio}`
    } else if (tipoPromocion === "bundle") {
      parametrosTexto = `Bundle: $${(parametros as { precioBundle?: number }).precioBundle}`
    }

    const diasPromo = periodoPromo?.from && periodoPromo?.to
      ? differenceInDays(periodoPromo.to, periodoPromo.from) + 1
      : 0

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Productos</p>
            <p className="font-medium">
              {productosNames.length} producto{productosNames.length !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {productosNames.slice(0, 2).join(", ")}
              {productosNames.length > 2 && ` +${productosNames.length - 2} más`}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tipo</p>
            <p className="font-medium">{tipoConfig?.label}</p>
            <p className="text-xs text-muted-foreground">{parametrosTexto}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Período promoción</p>
            <p className="font-medium">
              {periodoPromo?.from && format(periodoPromo.from, "d MMM", { locale: es })}
              {" - "}
              {periodoPromo?.to && format(periodoPromo.to, "d MMM yyyy", { locale: es })}
            </p>
            <p className="text-xs text-muted-foreground">{diasPromo} días</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Período baseline</p>
            <p className="font-medium">
              {periodoBaseline?.from && format(periodoBaseline.from, "d MMM", { locale: es })}
              {" - "}
              {periodoBaseline?.to && format(periodoBaseline.to, "d MMM yyyy", { locale: es })}
            </p>
          </div>
        </div>
        {(ciudadesSeleccionadas.length > 0 || tiendasSeleccionadas.length > 0) && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">Filtros adicionales</p>
            <p className="text-xs">
              {ciudadesSeleccionadas.length > 0 && `${ciudadesSeleccionadas.length} ciudades`}
              {ciudadesSeleccionadas.length > 0 && tiendasSeleccionadas.length > 0 && ", "}
              {tiendasSeleccionadas.length > 0 && `${tiendasSeleccionadas.length} tiendas`}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress steps */}
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                currentStep >= step.id
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
              onClick={() => {
                if (step.id < currentStep) setCurrentStep(step.id)
              }}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all",
                  currentStep > step.id
                    ? "bg-primary border-primary text-primary-foreground"
                    : currentStep === step.id
                      ? "border-primary text-primary"
                      : "border-muted-foreground/30"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{step.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {step.descripcion}
                </p>
              </div>
            </div>
            {index < WIZARD_STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-4",
                  currentStep > step.id ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          {/* Step 1: Productos */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Seleccionar Productos
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Elige los productos que estuvieron en promoción
                </p>
              </div>

              <MultiSelectFilter
                title="Productos"
                icon={<Package className="h-4 w-4" />}
                options={productoOptions}
                selectedValues={productosSeleccionados}
                onSelectionChange={setProductosSeleccionados}
                searchPlaceholder="Buscar producto..."
                maxDisplay={3}
              />

              {productosSeleccionados.length > 1 && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Checkbox
                    id="analizarGrupo"
                    checked={analizarComoGrupo}
                    onCheckedChange={(checked) =>
                      setAnalizarComoGrupo(checked === true)
                    }
                  />
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="analizarGrupo" className="cursor-pointer">
                      Analizar como grupo
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Los productos se analizarán en conjunto en lugar de
                      individualmente
                    </p>
                    {analizarComoGrupo && (
                      <Input
                        placeholder="Nombre del grupo (opcional)"
                        value={nombreGrupo}
                        onChange={(e) => setNombreGrupo(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>
              )}

              {productosSeleccionados.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {productosSeleccionados.length} producto
                  {productosSeleccionados.length !== 1 ? "s" : ""} seleccionado
                  {productosSeleccionados.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Tipo de Promoción */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Percent className="h-5 w-5 text-primary" />
                  Tipo de Promoción
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Selecciona el tipo de promoción y configura los parámetros
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {TIPOS_PROMOCION.map((tipo) => {
                  const IconComponent = tipo.icono
                  const isSelected = tipoPromocion === tipo.value
                  return (
                    <button
                      key={tipo.value}
                      onClick={() => {
                        setTipoPromocion(tipo.value)
                        setParametros({})
                      }}
                      className={cn(
                        "p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${tipo.color}20` }}
                        >
                          <IconComponent
                            className="h-5 w-5"
                            style={{ color: tipo.color }}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{tipo.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {tipo.descripcion}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            Ej: {tipo.ejemplo}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {tipoPromocion && (
                <div className="pt-4 border-t">{renderParametros()}</div>
              )}
            </div>
          )}

          {/* Step 3: Períodos */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Configurar Períodos
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Define las fechas de la promoción y el período de comparación
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Período de Promoción</Label>
                  <DateRangePickerNotion
                    dateRange={periodoPromo}
                    onDateRangeChange={setPeriodoPromo}
                    minDate={filtros?.fecha_min ? new Date(filtros.fecha_min) : undefined}
                    maxDate={filtros?.fecha_max ? new Date(filtros.fecha_max) : undefined}
                  />
                  {periodoPromo?.from && periodoPromo?.to && (
                    <p className="text-xs text-muted-foreground">
                      {differenceInDays(periodoPromo.to, periodoPromo.from) + 1} días
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Período Baseline (comparación)</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="baselineAuto"
                        checked={baselineAuto}
                        onCheckedChange={(checked) =>
                          setBaselineAuto(checked === true)
                        }
                      />
                      <Label
                        htmlFor="baselineAuto"
                        className="text-xs cursor-pointer"
                      >
                        Auto
                      </Label>
                    </div>
                  </div>
                  <DateRangePickerNotion
                    dateRange={periodoBaseline}
                    onDateRangeChange={setPeriodoBaseline}
                    minDate={filtros?.fecha_min ? new Date(filtros.fecha_min) : undefined}
                    maxDate={periodoPromo?.from ? periodoPromo.from : undefined}
                  />
                  {periodoBaseline?.from && periodoBaseline?.to && (
                    <p className="text-xs text-muted-foreground">
                      {differenceInDays(periodoBaseline.to, periodoBaseline.from) + 1} días
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diasPostPromo">
                  Días post-promoción para retención
                </Label>
                <Input
                  id="diasPostPromo"
                  type="number"
                  min={7}
                  max={60}
                  value={diasPostPromo}
                  onChange={(e) =>
                    setDiasPostPromo(parseInt(e.target.value) || DIAS_RETENCION_DEFAULT)
                  }
                  className="w-24"
                />
                <p className="text-xs text-muted-foreground">
                  Se analizará la retención de ventas {diasPostPromo} días
                  después de terminar la promoción
                </p>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-sm">Filtros opcionales</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <MultiSelectFilter
                    title="Ciudades"
                    options={ciudadOptions}
                    selectedValues={ciudadesSeleccionadas}
                    onSelectionChange={setCiudadesSeleccionadas}
                    searchPlaceholder="Buscar ciudad..."
                  />
                  <MultiSelectFilter
                    title="Tiendas"
                    options={tiendaOptions}
                    selectedValues={tiendasSeleccionadas}
                    onSelectionChange={setTiendasSeleccionadas}
                    searchPlaceholder="Buscar tienda..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmar */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  Confirmar y Analizar
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Revisa la configuración antes de ejecutar el análisis
                </p>
              </div>

              <div className="p-4 rounded-xl bg-muted/50">{renderResumen()}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        {currentStep < 4 ? (
          <Button
            onClick={() => setCurrentStep((s) => Math.min(4, s + 1))}
            disabled={
              (currentStep === 1 && !canProceedStep1) ||
              (currentStep === 2 && !canProceedStep2) ||
              (currentStep === 3 && !canProceedStep3)
            }
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleAnalizar} className="gap-2">
            <Rocket className="h-4 w-4" />
            Analizar Promoción
          </Button>
        )}
      </div>
    </div>
  )
}
