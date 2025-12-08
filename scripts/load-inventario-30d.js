require('dotenv').config({ path: '.env.local' });
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// IDs fijos
const TENANT_ID = 'ae32c9d2-2cc0-4eef-a715-7ea7626aefa4'; // DELIKOS
const RETAILER_ID = 1; // HEB

// Ruta del archivo
const INVENTARIO_PATH = '/Users/jmariopgarcia/Desktop/DELIKOS/MITIENDA/INVENTARIO ÚLTIMOS 30 DIAS.xlsx';

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

async function main() {
  console.log('='.repeat(80));
  console.log('🚀 CARGA DE INVENTARIO 30 DÍAS → SUPABASE');
  console.log('='.repeat(80));
  console.log(`Tenant: DELIKOS (${TENANT_ID})`);
  console.log(`Retailer: HEB (ID: ${RETAILER_ID})`);

  try {
    // 1. Cargar tiendas existentes
    console.log('\n📍 Obteniendo tiendas...');
    const { data: tiendas, error: tiendasError } = await supabase
      .from('dim_tiendas')
      .select('id, codigo_tienda')
      .eq('tenant_id', TENANT_ID)
      .eq('retailer_id', RETAILER_ID);

    if (tiendasError) throw tiendasError;

    const tiendasMap = new Map(tiendas.map(t => [t.codigo_tienda, t]));
    console.log(`   ✅ ${tiendas.length} tiendas encontradas`);

    // 2. Cargar productos existentes
    console.log('\n📦 Obteniendo productos...');
    const { data: productos, error: productosError } = await supabase
      .from('dim_productos')
      .select('id, upc')
      .eq('tenant_id', TENANT_ID);

    if (productosError) throw productosError;

    const productosMap = new Map(productos.map(p => [p.upc, p]));
    console.log(`   ✅ ${productos.length} productos encontrados`);

    // 3. Leer archivo de inventario
    console.log('\n📊 Leyendo archivo de inventario...');
    const workbook = XLSX.readFile(INVENTARIO_PATH);
    const sheet = workbook.Sheets['Sheet1'];
    const data = XLSX.utils.sheet_to_json(sheet);

    console.log(`   Total registros en archivo: ${data.length}`);

    // 4. Preparar registros
    const inventarios = [];
    let skipped = 0;
    const fechasSet = new Set();

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

      fechasSet.add(fecha);

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
    console.log(`   Fechas únicas: ${fechasSet.size}`);

    // 5. Borrar inventario anterior de este período (si existe)
    const fechas = Array.from(fechasSet).sort();
    const minFecha = fechas[0];
    const maxFecha = fechas[fechas.length - 1];

    console.log(`   Rango: ${minFecha} → ${maxFecha}`);

    console.log(`\n🗑️  Limpiando inventario anterior del período ${minFecha} → ${maxFecha}...`);
    const { error: deleteError } = await supabase
      .from('fact_inventario')
      .delete()
      .eq('tenant_id', TENANT_ID)
      .eq('retailer_id', RETAILER_ID)
      .gte('fecha', minFecha)
      .lte('fecha', maxFecha);

    if (deleteError) {
      console.error('❌ Error al limpiar:', deleteError);
      throw deleteError;
    }

    console.log('   ✅ Limpieza completada');

    // 6. Insertar en lotes de 500
    console.log('\n💾 Insertando registros...');
    const BATCH_SIZE = 500;
    let inserted = 0;

    for (let i = 0; i < inventarios.length; i += BATCH_SIZE) {
      const batch = inventarios.slice(i, i + BATCH_SIZE);

      const { error } = await supabase
        .from('fact_inventario')
        .insert(batch);

      if (error) {
        console.error(`❌ Error en lote ${i / BATCH_SIZE + 1}:`, error);
        throw error;
      }

      inserted += batch.length;
      console.log(`   Progreso: ${inserted}/${inventarios.length} (${Math.round(inserted / inventarios.length * 100)}%)`);
    }

    console.log(`   ✅ ${inserted} registros insertados`);

    // 7. Refrescar vista materializada
    console.log('\n🔄 Refrescando vista materializada...');
    const { error: refreshError } = await supabase.rpc('refresh_mv_metricas');

    if (refreshError) {
      console.error('❌ Error al refrescar vista:', refreshError);
      throw refreshError;
    }

    console.log('   ✅ Vista materializada actualizada');

    console.log('\n' + '='.repeat(80));
    console.log('✅ CARGA COMPLETA');
    console.log('='.repeat(80));
    console.log(`📊 Registros insertados: ${inserted}`);
    console.log(`📅 Días de inventario: ${fechasSet.size}`);
    console.log(`📍 Tiendas: ${tiendas.length}`);
    console.log(`📦 Productos: ${productos.length}`);

  } catch (error) {
    console.error('\n❌ ERROR EN LA CARGA:', error);
    process.exit(1);
  }
}

// Ejecutar
main();
