const XLSX = require('xlsx');
const fs = require('fs');

// === CONFIGURACIÓN - MODIFICAR SEGÚN EL DÍA ===
const VENTAS_PATH = '/Users/jmariopgarcia/Desktop/4BUDDIES HEB/HEB SUPABASE/VENTAS_NUEVAS.xlsx';
const OUTPUT_PATH = '/Users/jmariopgarcia/Desktop/4BUDDIES HEB/ventas_diarias.csv';

// Configuración fija del cliente 4BUDDIES
const TENANT_ID = 'c529e450-3708-48c9-90ca-cfb2a01a57ed';
const RETAILER_ID = 3;

// Mapeos de tiendas (código HEB -> ID Supabase)
const tiendasMap = {
  '2992': 29, '2913': 30, '2985': 31, '2928': 32, '2918': 33, '2937': 34, '2907': 35, '2984': 36,
  '2930': 37, '2962': 38, '2927': 39, '2924': 40, '2926': 41, '2945': 42, '2951': 43, '2952': 44,
  '2959': 45, '2950': 46, '2975': 47, '2996': 48, '2946': 49, '2978': 50, '2981': 51, '2935': 52,
  '2943': 53, '2953': 54, '2961': 55, '2963': 56, '2979': 57, '2980': 58, '9108': 59, '2929': 60,
  '2957': 61, '2958': 62, '2965': 63, '2967': 64, '2974': 65, '2976': 66, '2977': 67, '9106': 68,
  '2968': 69, '2971': 70, '2915': 71, '2919': 72, '2997': 73, '2982': 74, '9100': 75, '9105': 76,
  '2960': 77, '2987': 78, '2954': 79, '2993': 80, '2989': 81, '2912': 82, '2922': 83, '2986': 84,
  '2940': 85, '2936': 86, '2964': 87, '2973': 88, '2934': 89, '2933': 90, '2970': 91
};

// Mapeos de productos (UPC -> ID Supabase)
const productosMap = {
  '7500462417826': 20, '7500462417833': 21, '7500462417819': 22, '7500462860004': 23,
  '7500462417802': 24, '7500462860042': 25, '7503028921317': 26, '7503028921133': 27,
  '7503028921003': 28, '7503028921010': 29, '7500462860066': 30, '7500462860011': 31,
  '7500462860035': 32, '7503028921324': 33
};

function excelDateToString(serial) {
  if (typeof serial === 'string') return serial;
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

console.log('=== Procesando ventas 4BUDDIES ===\n');
console.log(`Archivo: ${VENTAS_PATH}\n`);

const wb = XLSX.readFile(VENTAS_PATH);
const sheetName = wb.SheetNames.find(n => n.toUpperCase().includes('VENTA')) || wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

console.log(`Hoja: ${sheetName}`);
console.log(`Registros en archivo: ${data.length}`);

let ventas = [];
let skipped = 0;
const skippedDetails = { tienda: new Set(), producto: new Set() };

data.forEach(row => {
  const tiendaCodigo = String(row['ID Tienda'] || row['ID_Tienda'] || '');
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

  ventas.push({
    tenant_id: TENANT_ID,
    retailer_id: RETAILER_ID,
    tienda_id: tiendaId,
    producto_id: productoId,
    fecha: excelDateToString(row['Fecha'] || row['Día']),
    unidades: row['Unidades'] || 0,
    venta_pesos: row['Ventas'] || row['Venta'] || 0,
    precio_unitario: row['Precio'] || row['Precio Promedio'] || 0
  });
});

console.log(`\nVentas válidas: ${ventas.length}`);
console.log(`Omitidas: ${skipped}`);

if (skippedDetails.tienda.size > 0) {
  console.log(`\nTiendas no encontradas: ${[...skippedDetails.tienda].join(', ')}`);
}
if (skippedDetails.producto.size > 0) {
  console.log(`Productos no encontrados: ${[...skippedDetails.producto].join(', ')}`);
}

// Mostrar rango de fechas
const fechas = ventas.map(v => v.fecha).sort();
if (fechas.length > 0) {
  console.log(`\nRango de fechas: ${fechas[0]} a ${fechas[fechas.length - 1]}`);
}

// Generar CSV
let csv = 'tenant_id,retailer_id,tienda_id,producto_id,fecha,unidades,venta_pesos,precio_unitario\n';
ventas.forEach(v => {
  csv += `${v.tenant_id},${v.retailer_id},${v.tienda_id},${v.producto_id},${v.fecha},${v.unidades || 0},${v.venta_pesos || 0},${v.precio_unitario || 0}\n`;
});

fs.writeFileSync(OUTPUT_PATH, csv);
console.log(`\n✓ CSV guardado en: ${OUTPUT_PATH}`);
console.log('\nSiguiente paso: Importar en Supabase > Table Editor > fact_ventas');
