/**
 * Script para cargar ventas de HEB a staging y fact tables
 *
 * Uso:
 *   node scripts/load-heb-ventas.js --tenant=4buddies --file=ventas_4buddies_muestra.csv
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Faltan variables de entorno SUPABASE');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Mapeo de tenants
const TENANTS = {
  'delikos': 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4',
  '4buddies': 'c529e450-3708-48c9-90ca-cfb2a01a57ed',
};

// Retailer HEB
const HEB_RETAILER_ID = 1;

// Directorio de datos
const DATA_DIR = path.join(process.env.HOME, 'Desktop', 'DIMENSIONES HEB');

/**
 * Parsea fecha DD/MM/YY a YYYY-MM-DD
 */
function parseDate(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;

  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  let year = parts[2];

  // Convertir año de 2 dígitos a 4
  if (year.length === 2) {
    year = parseInt(year) > 50 ? '19' + year : '20' + year;
  }

  return `${year}-${month}-${day}`;
}

/**
 * Parsea un CSV simple
 */
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = headerLine.split(',').map(h => h.trim());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < 6) continue; // Ignorar líneas incompletas

    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

/**
 * Carga ventas al staging
 */
async function loadVentasToStaging(tenantId, fileName) {
  console.log('\n📊 Cargando ventas a staging...');

  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.error(`  ❌ No se encontró: ${filePath}`);
    return 0;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);
  console.log(`  📄 Leídas ${rows.length} filas del CSV`);

  const ventas = rows.map(row => {
    const upc = String(row['UPC']).trim();
    const fecha = parseDate(row['TPO_DFecha']);

    return {
      tenant_id: tenantId,
      periodo: row['TPO_CPeriodo'] || null,
      fecha: fecha,
      tienda_codigo: String(row['UNG_KUnidadNegocio']).trim(),
      upc: upc,
      venta_sin_iva: parseFloat(row['VTA_IVentasSinIva']) || 0,
      unidades: parseInt(row['VTA_IUnidades']) || 0,
      precio_promedio: parseFloat(row['PrecioPromedio']) || 0,
    };
  }).filter(v => v.fecha && v.upc && v.tienda_codigo);

  console.log(`  📝 Registros válidos: ${ventas.length}`);

  // Upsert en lotes
  let inserted = 0;
  const batchSize = 100;

  for (let i = 0; i < ventas.length; i += batchSize) {
    const batch = ventas.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('heb_staging_ventas')
      .upsert(batch, {
        onConflict: 'tenant_id,fecha,tienda_codigo,upc',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error(`  ❌ Error en lote ${i}: ${error.message}`);
    } else {
      inserted += data?.length || 0;
      process.stdout.write(`\r  ⏳ Insertados: ${inserted}/${ventas.length}`);
    }
  }

  console.log(`\n  ✅ Staging completado: ${inserted} registros`);
  return inserted;
}

/**
 * Transforma staging a fact_ventas
 */
async function transformToFacts(tenantId) {
  console.log('\n🔄 Transformando staging a fact_ventas...');

  // Ejecutar transformación via SQL
  const { data, error } = await supabase.rpc('transform_heb_ventas_to_facts', {
    p_tenant_id: tenantId
  });

  if (error) {
    // Si la función no existe, hacemos la transformación inline
    console.log('  ⚠️  Función RPC no encontrada, transformando inline...');

    const { error: insertError } = await supabase.from('fact_ventas').upsert(
      await supabase.from('heb_staging_ventas')
        .select(`
          tenant_id,
          fecha,
          tienda_codigo,
          upc,
          unidades,
          venta_sin_iva,
          precio_promedio
        `)
        .eq('tenant_id', tenantId)
        .then(async ({ data: stagingData }) => {
          if (!stagingData) return [];

          // Obtener mapeo de tiendas
          const { data: tiendas } = await supabase
            .from('dim_tiendas')
            .select('id, codigo_tienda')
            .eq('tenant_id', tenantId);

          const tiendaMap = {};
          (tiendas || []).forEach(t => {
            tiendaMap[t.codigo_tienda] = t.id;
          });

          // Obtener mapeo de productos
          const { data: productos } = await supabase
            .from('dim_productos')
            .select('id, upc')
            .eq('tenant_id', tenantId);

          const productoMap = {};
          (productos || []).forEach(p => {
            productoMap[p.upc] = p.id;
          });

          // Transformar
          return stagingData
            .filter(s => tiendaMap[s.tienda_codigo] && productoMap[s.upc])
            .map(s => ({
              tenant_id: s.tenant_id,
              retailer_id: HEB_RETAILER_ID,
              tienda_id: tiendaMap[s.tienda_codigo],
              producto_id: productoMap[s.upc],
              fecha: s.fecha,
              unidades: s.unidades,
              venta_pesos: s.venta_sin_iva,
              precio_unitario: s.precio_promedio,
            }));
        }),
      { onConflict: 'tenant_id,retailer_id,tienda_id,producto_id,fecha' }
    );

    if (insertError) {
      console.error(`  ❌ Error transformando: ${insertError.message}`);
      return;
    }
  }

  // Contar registros en fact_ventas
  const { count } = await supabase
    .from('fact_ventas')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  console.log(`  ✅ fact_ventas tiene ${count} registros`);
}

/**
 * Main
 */
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  CARGA DE VENTAS HEB');
  console.log('═══════════════════════════════════════════');

  // Parsear argumentos
  const args = process.argv.slice(2);
  let tenantName = '4buddies';
  let fileName = 'ventas_4buddies_muestra.csv';

  for (const arg of args) {
    if (arg.startsWith('--tenant=')) {
      tenantName = arg.split('=')[1].toLowerCase();
    }
    if (arg.startsWith('--file=')) {
      fileName = arg.split('=')[1];
    }
  }

  const tenantId = TENANTS[tenantName];
  if (!tenantId) {
    console.error(`❌ Tenant desconocido: ${tenantName}`);
    process.exit(1);
  }

  console.log(`\n🏢 Tenant: ${tenantName}`);
  console.log(`📁 Archivo: ${fileName}`);

  // Cargar a staging
  const stagingCount = await loadVentasToStaging(tenantId, fileName);

  if (stagingCount > 0) {
    // Transformar a facts
    await transformToFacts(tenantId);
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('  COMPLETADO');
  console.log('═══════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
