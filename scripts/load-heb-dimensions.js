/**
 * Script para cargar dimensiones de HEB (tiendas y productos)
 *
 * Uso:
 *   node scripts/load-heb-dimensions.js --tenant=4buddies
 *
 * Archivos esperados en ~/Desktop/DIMENSIONES HEB/:
 *   - dim_tiendas.csv
 *   - dim_productos_4buddies.csv
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
 * Parsea un CSV simple (sin comillas con comas dentro)
 */
function parseCSV(content) {
  const lines = content.trim().split('\n');
  // Limpiar BOM si existe
  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = headerLine.split(',').map(h => h.trim());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

/**
 * Carga tiendas desde dim_tiendas.csv
 */
async function loadTiendas(tenantId) {
  console.log('\n📍 Cargando tiendas...');

  const filePath = path.join(DATA_DIR, 'dim_tiendas.csv');
  if (!fs.existsSync(filePath)) {
    console.error(`  ❌ No se encontró: ${filePath}`);
    return 0;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);
  console.log(`  📄 Leídas ${rows.length} filas del CSV`);

  const tiendas = rows.map(row => ({
    tenant_id: tenantId,
    retailer_id: HEB_RETAILER_ID,
    codigo_tienda: String(row['ID_Tienda']).trim(),
    nombre: row['Tienda'] || `Tienda ${row['ID_Tienda']}`,
    ciudad: row['Ciudad'] || null,
    formato: row['Formato'] || null,
    cluster: row['Cluster'] || null,
    activo: true,
  }));

  // Upsert en lotes de 50
  let inserted = 0;
  let updated = 0;
  const batchSize = 50;

  for (let i = 0; i < tiendas.length; i += batchSize) {
    const batch = tiendas.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('dim_tiendas')
      .upsert(batch, {
        onConflict: 'tenant_id,retailer_id,codigo_tienda',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error(`  ❌ Error en lote ${i}: ${error.message}`);
    } else {
      inserted += data?.length || 0;
    }
  }

  console.log(`  ✅ Tiendas cargadas: ${inserted}`);
  return inserted;
}

/**
 * Carga productos desde dim_productos_4buddies.csv
 */
async function loadProductos(tenantId) {
  console.log('\n📦 Cargando productos...');

  const filePath = path.join(DATA_DIR, 'dim_productos_4buddies.csv');
  if (!fs.existsSync(filePath)) {
    console.error(`  ❌ No se encontró: ${filePath}`);
    return 0;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);
  console.log(`  📄 Leídos ${rows.length} filas del CSV`);

  const productos = rows.map(row => {
    // IMPORTANTE: UPC siempre como string, nunca convertir a número
    let upc = String(row['UPC']).trim();
    // Asegurar que tenga 13 dígitos (padStart si es necesario)
    if (upc.length < 13 && !isNaN(upc)) {
      upc = upc.padStart(13, '0');
    }

    return {
      tenant_id: tenantId,
      upc: upc,
      nombre: row['Articulo_Corto'] || row['Articulo'] || `Producto ${upc}`,
      descripcion_corta: row['Articulo_Corto'] || null,
      categoria: row['Familia'] || null,
      subcategoria: row['Subfamilia'] || null,
      marca: row['Marca'] || null,
      activo: true,
    };
  });

  // Upsert en lotes
  let inserted = 0;
  const batchSize = 50;

  for (let i = 0; i < productos.length; i += batchSize) {
    const batch = productos.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('dim_productos')
      .upsert(batch, {
        onConflict: 'tenant_id,upc',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error(`  ❌ Error en lote ${i}: ${error.message}`);
      console.error(`  Detalle:`, JSON.stringify(batch[0], null, 2));
    } else {
      inserted += data?.length || 0;
    }
  }

  console.log(`  ✅ Productos cargados: ${inserted}`);
  return inserted;
}

/**
 * Main
 */
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  CARGA DE DIMENSIONES HEB');
  console.log('═══════════════════════════════════════════');

  // Parsear argumentos
  const args = process.argv.slice(2);
  let tenantName = '4buddies'; // default

  for (const arg of args) {
    if (arg.startsWith('--tenant=')) {
      tenantName = arg.split('=')[1].toLowerCase();
    }
  }

  const tenantId = TENANTS[tenantName];
  if (!tenantId) {
    console.error(`❌ Tenant desconocido: ${tenantName}`);
    console.error(`   Tenants válidos: ${Object.keys(TENANTS).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🏢 Tenant: ${tenantName} (${tenantId})`);
  console.log(`📂 Directorio: ${DATA_DIR}`);

  // Verificar directorio
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`❌ No existe el directorio: ${DATA_DIR}`);
    process.exit(1);
  }

  // Cargar dimensiones
  const tiendasCount = await loadTiendas(tenantId);
  const productosCount = await loadProductos(tenantId);

  console.log('\n═══════════════════════════════════════════');
  console.log('  RESUMEN');
  console.log('═══════════════════════════════════════════');
  console.log(`  📍 Tiendas:   ${tiendasCount}`);
  console.log(`  📦 Productos: ${productosCount}`);
  console.log('═══════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
