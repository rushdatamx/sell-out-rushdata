const XLSX = require('xlsx');
const fs = require('fs');

// === CONFIGURACIÓN - MODIFICAR SEGÚN EL DÍA ===
const INVENTARIO_PATH = '/Users/jmariopgarcia/Desktop/4BUDDIES HEB/HEB SUPABASE/INVENTARIO_NUEVO.xlsx';
const OUTPUT_PATH = '/Users/jmariopgarcia/Desktop/4BUDDIES HEB/inventario_diario.csv';

// Configuración fija del cliente 4BUDDIES
const TENANT_ID = 'c529e450-3708-48c9-90ca-cfb2a01a57ed';
const RETAILER_ID = 3;

// Mapeos de tiendas (código HEB -> ID Supabase)
// Nota: 2160 y 2936 mapean al mismo ID 86
const tiendasMap = {
  '2907': 35, '2912': 82, '2913': 30, '2915': 71, '2918': 33, '2919': 72, '2922': 83,
  '2924': 40, '2926': 41, '2927': 39, '2928': 32, '2929': 60, '2930': 37, '2933': 90,
  '2934': 89, '2935': 52, '2936': 86, '2937': 34, '2940': 85, '2943': 53, '2945': 42,
  '2946': 49, '2950': 46, '2951': 43, '2952': 44, '2953': 54, '2954': 79, '2957': 61,
  '2958': 62, '2959': 45, '2960': 77, '2961': 55, '2962': 38, '2963': 56, '2964': 87,
  '2965': 63, '2967': 64, '2968': 69, '2970': 91, '2971': 70, '2973': 88, '2974': 65,
  '2975': 47, '2976': 66, '2977': 67, '2978': 50, '2979': 57, '2980': 58, '2981': 51,
  '2982': 74, '2984': 36, '2985': 31, '2986': 84, '2987': 78, '2989': 81, '2992': 29,
  '2993': 80, '2996': 48, '2997': 73, '9100': 75, '9105': 76, '9106': 68, '9108': 59,
  '2160': 86
};

// Mapeos de productos (UPC -> ID Supabase)
const productosMap = {
  '7500462417802': 24, '7500462417819': 22, '7500462417826': 20, '7500462417833': 21,
  '7500462860004': 23, '7500462860011': 31, '7500462860035': 32, '7500462860042': 25,
  '7500462860066': 30, '7503028921003': 28, '7503028921010': 29, '7503028921133': 27,
  '7503028921317': 26, '7503028921324': 33
};

function excelDateToString(serial) {
  if (typeof serial === 'string') return serial;
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

console.log('=== Procesando inventario 4BUDDIES ===\n');
console.log(`Archivo: ${INVENTARIO_PATH}\n`);

const wb = XLSX.readFile(INVENTARIO_PATH);
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

console.log(`Registros en archivo: ${data.length}`);

// Deduplicar para evitar errores de unique constraint
const inventarioMap = new Map();
let skipped = 0;
let duplicates = 0;
const skippedDetails = { tienda: new Set(), producto: new Set() };

data.forEach(row => {
  const tiendaCodigo = String(row['ID_Tienda'] || row['ID Tienda'] || '');
  const upc = String(row['UPC'] || '');

  const tiendaId = tiendasMap[tiendaCodigo];
  const productoId = productosMap[upc];

  if (!tiendaId) {
    skippedDetails.tienda.add(tiendaCodigo);
    skipped++;
    return;
  }
  if (!productoId) {
    skippedDetails.producto.add(upc);
    skipped++;
    return;
  }

  const fecha = excelDateToString(row['Fecha']);
  const key = `${tiendaId}|${productoId}|${fecha}`;
  const inventario = row['Inventario'] || 0;

  if (inventarioMap.has(key)) {
    const existing = inventarioMap.get(key);
    existing.inventario_unidades = Math.max(existing.inventario_unidades, inventario);
    duplicates++;
  } else {
    inventarioMap.set(key, {
      tenant_id: TENANT_ID,
      retailer_id: RETAILER_ID,
      tienda_id: tiendaId,
      producto_id: productoId,
      fecha: fecha,
      inventario_unidades: inventario
    });
  }
});

const inventario = Array.from(inventarioMap.values());

console.log(`\nRegistros únicos: ${inventario.length}`);
console.log(`Omitidos: ${skipped}`);
console.log(`Duplicados fusionados: ${duplicates}`);

if (skippedDetails.tienda.size > 0) {
  console.log(`\nTiendas no encontradas: ${[...skippedDetails.tienda].join(', ')}`);
}
if (skippedDetails.producto.size > 0) {
  console.log(`Productos no encontrados: ${[...skippedDetails.producto].join(', ')}`);
}

// Mostrar rango de fechas
const fechas = inventario.map(i => i.fecha).sort();
if (fechas.length > 0) {
  console.log(`\nRango de fechas: ${fechas[0]} a ${fechas[fechas.length - 1]}`);
}

// Generar CSV (nombre de columna correcto: inventario_unidades)
let csv = 'tenant_id,retailer_id,tienda_id,producto_id,fecha,inventario_unidades\n';
inventario.forEach(i => {
  csv += `${i.tenant_id},${i.retailer_id},${i.tienda_id},${i.producto_id},${i.fecha},${i.inventario_unidades}\n`;
});

fs.writeFileSync(OUTPUT_PATH, csv);
console.log(`\n✓ CSV guardado en: ${OUTPUT_PATH}`);
console.log('\nSiguiente paso: Importar en Supabase > Table Editor > fact_inventario');
