require('dotenv').config({ path: '.env.local' });
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// IDs fijos
const TENANT_ID = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'; // DELIKOS
const RETAILER_ID = 1; // HEB

// Rutas de archivos
const VENTAS_PATH = '/Users/jmariopgarcia/Desktop/DELIKOS/MITIENDA/VENTA DELIKOS HEB OFICIAL (2).xlsx';
const INVENTARIO_PATH = '/Users/jmariopgarcia/Desktop/DELIKOS/MITIENDA/INVENTARIO HEB DELIKOS OFICIAL.xlsx';

// Función para convertir fecha serial de Excel a formato YYYY-MM-DD
function excelDateToJSDate(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);

  const year = date_info.getUTCFullYear();
  const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date_info.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// 1. CARGAR TIENDAS
async function loadTiendas() {
  console.log('\n📍 CARGANDO TIENDAS...');

  const workbook = XLSX.readFile(VENTAS_PATH);
  const complementosSheet = workbook.Sheets['COMPLEMENTOS'];
  const data = XLSX.utils.sheet_to_json(complementosSheet, { header: 1 });

  const tiendas = [];

  // Empezar desde la fila 3 (índice 3) donde están los datos de tiendas
  for (let i = 3; i < data.length; i++) {
    const row = data[i];

    if (!row[0]) break; // Si no hay ID_Tienda, terminamos

    tiendas.push({
      tenant_id: TENANT_ID,
      retailer_id: RETAILER_ID,
      codigo_tienda: String(row[0]),
      nombre: row[1] || '',
      ciudad: row[2] || null,
      cluster: row[3] || null,
      activo: true
    });
  }

  console.log(`   Tiendas a insertar: ${tiendas.length}`);

  // Insertar con UPSERT
  const { data: insertedData, error } = await supabase
    .from('dim_tiendas')
    .upsert(tiendas, {
      onConflict: 'tenant_id,retailer_id,codigo_tienda',
      ignoreDuplicates: false
    })
    .select();

  if (error) {
    console.error('❌ Error al insertar tiendas:', error);
    throw error;
  }

  console.log(`   ✅ ${insertedData.length} tiendas cargadas`);
  return insertedData;
}

// 2. CARGAR PRODUCTOS
async function loadProductos() {
  console.log('\n📦 CARGANDO PRODUCTOS...');

  const workbook = XLSX.readFile(INVENTARIO_PATH);
  const complementosSheet = workbook.Sheets['COMPLEMENTOS'];
  const data = XLSX.utils.sheet_to_json(complementosSheet, { header: 1 });

  const productosMap = new Map();

  // Empezar desde la fila 3, columnas 6-7-8 (UPC, Artículo, Gramaje)
  for (let i = 3; i < data.length; i++) {
    const row = data[i];

    const upc = String(row[6] || '').trim();
    if (!upc || upc === 'UPC') continue;

    const articulo = row[7] || '';
    const gramaje = row[8] || null;

    // Extraer SKU y nombre del formato "SKU NOMBRE"
    const articuloParts = articulo.split(' ');
    const sku = articuloParts[0] || '';
    const nombre = articuloParts.slice(1).join(' ') || articulo;

    if (!productosMap.has(upc)) {
      productosMap.set(upc, {
        tenant_id: TENANT_ID,
        upc: upc,
        sku_fabricante: sku,
        nombre: nombre.substring(0, 255), // Limitar a 255 caracteres
        descripcion_corta: gramaje ? `${nombre.substring(0, 80)} (${gramaje})` : nombre.substring(0, 100),
        categoria: 'Botanas', // Categoría genérica, puedes ajustar
        marca: 'DELIKOS',
        activo: true
      });
    }
  }

  const productos = Array.from(productosMap.values());
  console.log(`   Productos únicos a insertar: ${productos.length}`);

  // Insertar con UPSERT
  const { data: insertedData, error } = await supabase
    .from('dim_productos')
    .upsert(productos, {
      onConflict: 'tenant_id,upc',
      ignoreDuplicates: false
    })
    .select();

  if (error) {
    console.error('❌ Error al insertar productos:', error);
    throw error;
  }

  console.log(`   ✅ ${insertedData.length} productos cargados`);
  return insertedData;
}

// 3. CARGAR VENTAS
async function loadVentas(tiendasMap, productosMap) {
  console.log('\n💰 CARGANDO VENTAS...');

  const workbook = XLSX.readFile(VENTAS_PATH);
  const ventasSheet = workbook.Sheets['VENTAS'];
  const data = XLSX.utils.sheet_to_json(ventasSheet);

  console.log(`   Total registros en archivo: ${data.length}`);

  const ventas = [];
  let skipped = 0;

  for (const row of data) {
    const codigoTienda = String(row['ID Tienda']);
    const upc = String(row['UPC']);
    const fecha = excelDateToJSDate(row['Día']);

    const tienda = tiendasMap.get(codigoTienda);
    const producto = productosMap.get(upc);

    if (!tienda || !producto) {
      skipped++;
      continue;
    }

    ventas.push({
      tenant_id: TENANT_ID,
      retailer_id: RETAILER_ID,
      tienda_id: tienda.id,
      producto_id: producto.id,
      fecha: fecha,
      unidades: row['Unidades'] || 0,
      venta_pesos: row['Ventas'] || 0,
      precio_unitario: row['Precio Promedio'] || null
    });
  }

  console.log(`   Registros a insertar: ${ventas.length}`);
  console.log(`   Registros omitidos (sin match): ${skipped}`);

  // Insertar en lotes de 500
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < ventas.length; i += BATCH_SIZE) {
    const batch = ventas.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('fact_ventas')
      .upsert(batch, {
        onConflict: 'tenant_id,retailer_id,tienda_id,producto_id,fecha',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`❌ Error en lote ${i / BATCH_SIZE + 1}:`, error);
      throw error;
    }

    inserted += batch.length;
    console.log(`   Progreso: ${inserted}/${ventas.length} (${Math.round(inserted / ventas.length * 100)}%)`);
  }

  console.log(`   ✅ ${inserted} registros de venta cargados`);
}

// 4. CARGAR INVENTARIO
async function loadInventario(tiendasMap, productosMap) {
  console.log('\n📊 CARGANDO INVENTARIO...');

  const workbook = XLSX.readFile(INVENTARIO_PATH);
  const invSheet = workbook.Sheets['INV'];
  const data = XLSX.utils.sheet_to_json(invSheet);

  console.log(`   Total registros en archivo: ${data.length}`);

  const inventarios = [];
  let skipped = 0;

  for (const row of data) {
    const codigoTienda = String(row['ID_Tienda']);
    const upc = String(row['UPC']);
    const fecha = excelDateToJSDate(row['Fecha']);

    const tienda = tiendasMap.get(codigoTienda);
    const producto = productosMap.get(upc);

    if (!tienda || !producto) {
      skipped++;
      continue;
    }

    inventarios.push({
      tenant_id: TENANT_ID,
      retailer_id: RETAILER_ID,
      tienda_id: tienda.id,
      producto_id: producto.id,
      fecha: fecha,
      inventario_unidades: row['Inventario'] || 0
    });
  }

  console.log(`   Registros a insertar: ${inventarios.length}`);
  console.log(`   Registros omitidos (sin match): ${skipped}`);

  // Insertar en lotes de 500
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < inventarios.length; i += BATCH_SIZE) {
    const batch = inventarios.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('fact_inventario')
      .upsert(batch, {
        onConflict: 'tenant_id,retailer_id,tienda_id,producto_id,fecha',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`❌ Error en lote ${i / BATCH_SIZE + 1}:`, error);
      throw error;
    }

    inserted += batch.length;
    console.log(`   Progreso: ${inserted}/${inventarios.length} (${Math.round(inserted / inventarios.length * 100)}%)`);
  }

  console.log(`   ✅ ${inserted} registros de inventario cargados`);
}

// FUNCIÓN PRINCIPAL
async function main() {
  console.log('='.repeat(80));
  console.log('🚀 CARGA DE DATOS HEB → SUPABASE');
  console.log('='.repeat(80));
  console.log(`Tenant: DELIKOS (${TENANT_ID})`);
  console.log(`Retailer: HEB (ID: ${RETAILER_ID})`);

  try {
    // 1. Cargar tiendas
    const tiendas = await loadTiendas();
    const tiendasMap = new Map(tiendas.map(t => [t.codigo_tienda, t]));

    // 2. Cargar productos
    const productos = await loadProductos();
    const productosMap = new Map(productos.map(p => [p.upc, p]));

    // 3. Cargar ventas
    await loadVentas(tiendasMap, productosMap);

    // 4. Cargar inventario
    await loadInventario(tiendasMap, productosMap);

    console.log('\n' + '='.repeat(80));
    console.log('✅ CARGA COMPLETA');
    console.log('='.repeat(80));
    console.log(`📍 Tiendas: ${tiendas.length}`);
    console.log(`📦 Productos: ${productos.length}`);
    console.log('💰 Ventas: Ver log arriba');
    console.log('📊 Inventario: Ver log arriba');

  } catch (error) {
    console.error('\n❌ ERROR EN LA CARGA:', error);
    process.exit(1);
  }
}

// Ejecutar
main();
