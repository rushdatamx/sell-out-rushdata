# Manual de Envío de Digest

Este documento explica cómo enviar los correos de resumen (digest) a los usuarios suscritos.

---

## Configuración Actual

| Retailer | Frecuencia | Método |
|----------|------------|--------|
| **HEB** | Automático cada martes 9am CST | Vercel Cron |
| **FDA** | Manual | Tú decides cuándo |
| **Merco** | Manual | Tú decides cuándo |

---

## Enviar Digest Manual (FDA / Merco)

### Desde el navegador

Simplemente abre una de estas URLs:

```
# Para FDA (Farmacias del Ahorro)
https://retail.rushdata.com.mx/api/digest/send?retailer=fda

# Para Merco
https://retail.rushdata.com.mx/api/digest/send?retailer=merco
```

**En desarrollo (localhost):**
```
http://localhost:3000/api/digest/send?retailer=fda
http://localhost:3000/api/digest/send?retailer=merco
```

### Respuesta esperada

```json
{
  "message": "Digest de FDA enviado",
  "sent": 1,
  "failed": 0,
  "results": [
    {
      "email": "cs@mira-estels.com",
      "retailer": "Farmacias del Ahorro",
      "status": "sent"
    }
  ]
}
```

---

## Previsualizar antes de enviar

Si quieres ver cómo se verá el correo antes de enviarlo:

```
# Preview FDA
https://retail.rushdata.com.mx/api/digest/preview?tenant_id=c529e450-3708-48c9-90ca-cfb2a01a57ed&retailer_id=5&type=weekly

# Preview Merco
https://retail.rushdata.com.mx/api/digest/preview?tenant_id=c529e450-3708-48c9-90ca-cfb2a01a57ed&retailer_id=4&type=weekly

# Preview HEB
https://retail.rushdata.com.mx/api/digest/preview?tenant_id=c529e450-3708-48c9-90ca-cfb2a01a57ed&retailer_id=1&type=weekly
```

---

## Retailers y sus IDs

| Retailer | Código URL | ID |
|----------|------------|-----|
| H-E-B | `heb` | 1 |
| Walmart | `walmart` | 2 |
| Soriana | `soriana` | 3 |
| Merco | `merco` | 4 |
| Farmacias del Ahorro | `fda` o `fahorro` | 5 |

---

## Suscriptores Actuales

| Email | Retailers |
|-------|-----------|
| cs@mira-estels.com | HEB, FDA, Merco |

---

## Verificar historial de envíos

Para ver los correos enviados, consulta la tabla `digest_logs` en Supabase:

```sql
SELECT
  sent_at,
  email_to,
  r.nombre as retailer,
  status,
  subject
FROM digest_logs dl
JOIN dim_retailers r ON dl.retailer_id = r.id
ORDER BY sent_at DESC
LIMIT 20;
```

---

## Troubleshooting

### El correo no llega
1. Verifica que el usuario esté suscrito en `digest_subscriptions`
2. Revisa los logs en Vercel o en la tabla `digest_logs`
3. En desarrollo, los correos se envían desde `onboarding@resend.dev` (límite de Resend free tier)

### Error "No hay suscripciones activas"
El usuario no está suscrito a ese retailer. Agrega la suscripción:

```sql
INSERT INTO digest_subscriptions (tenant_id, user_id, retailer_id, email, weekly_enabled, monthly_enabled, status)
VALUES (
  'c529e450-3708-48c9-90ca-cfb2a01a57ed',  -- tenant 4BUDDIES
  (SELECT id FROM auth.users WHERE email = 'nuevo@email.com'),
  5,  -- retailer_id (5=FDA, 4=Merco)
  'nuevo@email.com',
  true,
  true,
  'active'
);
```

---

## Resumen rápido

```
┌───────────────────────────────────────────────────────────────┐
│  ENVIAR DIGEST FDA                                            │
│  → retail.rushdata.com.mx/api/digest/send?retailer=fda       │
├───────────────────────────────────────────────────────────────┤
│  ENVIAR DIGEST MERCO                                          │
│  → retail.rushdata.com.mx/api/digest/send?retailer=merco     │
└───────────────────────────────────────────────────────────────┘
```
