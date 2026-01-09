# Diseño: Sistema de Digest por Email

## Objetivo

Enviar reportes por email a usuarios de RushData con métricas de sell-out, desglosados por retailer.

---

## Configuración Actual

| Retailer | Frecuencia | Método | Horario |
|----------|------------|--------|---------|
| **HEB** | Cada martes | Automático (Vercel Cron) | 9:00 AM CST |
| **FDA** | Manual | Tú decides cuándo | - |
| **Merco** | Manual | Tú decides cuándo | - |

**Sin insights de IA** - Los correos solo muestran datos y métricas.

---

## URLs de Producción

### Enviar Digest Manual

```
# FDA (Farmacias del Ahorro)
https://retail.rushdata.com.mx/api/digest/send?retailer=fda

# Merco
https://retail.rushdata.com.mx/api/digest/send?retailer=merco
```

### Previsualizar Email

```
# Preview FDA
https://retail.rushdata.com.mx/api/digest/preview?tenant_id=c529e450-3708-48c9-90ca-cfb2a01a57ed&retailer_id=5&type=weekly

# Preview Merco
https://retail.rushdata.com.mx/api/digest/preview?tenant_id=c529e450-3708-48c9-90ca-cfb2a01a57ed&retailer_id=4&type=weekly

# Preview HEB
https://retail.rushdata.com.mx/api/digest/preview?tenant_id=c529e450-3708-48c9-90ca-cfb2a01a57ed&retailer_id=1&type=weekly
```

---

## Flujo General

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              AUTOMÁTICO                                     │
├────────────────────────────────────────────────────────────────────────────┤
│  Martes 9:00 AM CST ──► /api/digest/weekly?retailer=heb (solo HEB)         │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                              MANUAL                                         │
├────────────────────────────────────────────────────────────────────────────┤
│  Cuando tú decidas ──► /api/digest/send?retailer=fda                       │
│  Cuando tú decidas ──► /api/digest/send?retailer=merco                     │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Contenido del Email

El email semanal incluye:

| Sección | Descripción |
|---------|-------------|
| **Header** | Logo RushData, título, retailer, período |
| **4 KPIs** | Ventas, Unidades, Tiendas activas, SKUs activos |
| **Alertas Inventario** | Críticas (sin stock) y Advertencias (stock bajo) |
| **Top 5 Productos** | Ranking por ventas con % participación |
| **Top 5 Tiendas** | Ranking por ventas con ciudad |
| **Productos en Movimiento** | Creciendo ▲ y Cayendo ▼ |
| **Ventas por Ciudad** | Top 5 ciudades con % del total |
| **CTA** | Botón "Ver Dashboard Completo" |
| **Footer** | Links de cancelar suscripción y configurar |

---

## Modelo de Datos

### Tabla: `digest_subscriptions`

```sql
CREATE TABLE digest_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  retailer_id INTEGER NOT NULL REFERENCES dim_retailers(id),
  email VARCHAR(255) NOT NULL,
  weekly_enabled BOOLEAN DEFAULT true,
  monthly_enabled BOOLEAN DEFAULT true,
  include_ai_insights BOOLEAN DEFAULT false,  -- Deshabilitado
  include_inventory_alerts BOOLEAN DEFAULT true,
  include_top_products BOOLEAN DEFAULT true,
  include_top_stores BOOLEAN DEFAULT true,
  include_trends BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_weekly_sent_at TIMESTAMPTZ,
  last_monthly_sent_at TIMESTAMPTZ,
  UNIQUE(user_id, retailer_id)
);
```

### Tabla: `digest_logs`

```sql
CREATE TABLE digest_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES digest_subscriptions(id),
  tenant_id UUID NOT NULL,
  retailer_id INTEGER NOT NULL,
  user_id UUID NOT NULL,
  digest_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT now(),
  subject VARCHAR(255),
  metrics_snapshot JSONB,
  error_message TEXT,
  resend_message_id VARCHAR(255),
  email_to VARCHAR(255),
  tokens_used INTEGER DEFAULT 0
);
```

---

## Suscriptores Actuales

| Email | Retailers |
|-------|-----------|
| cs@mira-estels.com | HEB, FDA, Merco |

---

## Configuración Vercel Cron

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/digest/weekly?retailer=heb",
      "schedule": "0 15 * * 2"  // Martes 15:00 UTC = 9:00 AM CST
    }
  ]
}
```

**Nota:** FDA y Merco NO tienen cron - se envían manualmente.

---

## Arquitectura de Archivos

```
app/
├── api/
│   └── digest/
│       ├── weekly/route.ts      # Cron automático (HEB)
│       ├── monthly/route.ts     # No usado actualmente
│       ├── send/route.ts        # Envío manual (FDA, Merco)
│       ├── preview/route.ts     # Preview de email
│       └── unsubscribe/route.ts # Cancelar suscripción

components/
├── emails/
│   ├── weekly-digest.tsx        # Template principal
│   └── shared/
│       ├── email-header.tsx
│       ├── email-footer.tsx
│       ├── kpi-card.tsx
│       ├── section-title.tsx
│       ├── alert-box.tsx
│       └── ranking-table.tsx

lib/
├── digest/
│   ├── types.ts
│   ├── send-email.ts
│   └── index.ts
```

---

## IDs de Retailers

| Retailer | Código URL | ID |
|----------|------------|-----|
| H-E-B | `heb` | 1 |
| Walmart | `walmart` | 2 |
| Soriana | `soriana` | 3 |
| Merco | `merco` | 4 |
| Farmacias del Ahorro | `fda` o `fahorro` | 5 |

---

## Troubleshooting

### El correo no llega
1. Verifica suscripción en `digest_subscriptions`
2. Revisa logs en `digest_logs`
3. En desarrollo usa `onboarding@resend.dev`

### Error "No hay suscripciones activas"
Agregar suscripción:
```sql
INSERT INTO digest_subscriptions (tenant_id, user_id, retailer_id, email, weekly_enabled, monthly_enabled, status)
VALUES (
  'c529e450-3708-48c9-90ca-cfb2a01a57ed',
  (SELECT id FROM auth.users WHERE email = 'nuevo@email.com'),
  5,  -- retailer_id
  'nuevo@email.com',
  true, true, 'active'
);
```

### Ver historial de envíos
```sql
SELECT sent_at, email_to, r.nombre, status, subject
FROM digest_logs dl
JOIN dim_retailers r ON dl.retailer_id = r.id
ORDER BY sent_at DESC LIMIT 20;
```
