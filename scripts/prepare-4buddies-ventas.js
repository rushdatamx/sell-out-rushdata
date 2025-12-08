const XLSX = require('xlsx');
const fs = require('fs');

const VENTAS_PATH = '/Users/jmariopgarcia/Desktop/4BUDDIES HEB/HEB SUPABASE/DATA VENTA 4BUDDIES HEB 2024-2025.xlsx';
const TENANT_ID = 'c529e450-3708-48c9-90ca-cfb2a01a57ed';
const RETAILER_ID = 3;

// Mapas de tiendas y productos (IDs de la BD)
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

const productosMap = {
  '7500462417826': 20, '7500462417833': 21, '7500462417819': 22, '7500462860004': 23,
  '7500462417802': 24, '7500462860042': 25, '7503028921317': 26, '7503028921133': 27,
  '7503028921003': 28, '7503028921010': 29, '7500462860066': 30, '7500462860011': 31,
  '7500462860035': 32, '7503028921324': 33
};

function excelDateToString(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  const year = date_info.getUTCFullYear();
  const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date_info.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

console.log('Leyendo archivo de ventas...');
const wb = XLSX.readFile(VENTAS_PATH);
const ventas = wb.Sheets['VENTA'];
const data = XLSX.utils.sheet_to_json(ventas);

console.log(`Total registros en archivo: ${data.length}`);

let validCount = 0;
let skipped = 0;
const ventasValidas = [];

for (const row of data) {
  const tiendaId = tiendasMap[String(row['ID Tienda'])];
  const productoId = productosMap[String(row['UPC'])];

  if (!tiendaId || !productoId) {
    skipped++;
    continue;
  }

  const fecha = excelDateToString(row['Día']);
  ventasValidas.push({
    tenant_id: TENANT_ID,
    retailer_id: RETAILER_ID,
    tienda_id: tiendaId,
    producto_id: productoId,
    fecha: fecha,
    unidades: row['Unidades'] || 0,
    venta_pesos: row['Ventas'] || 0,
    precio_unitario: row['Precio Promedio'] || null
  });
  validCount++;
}

console.log(`Ventas válidas: ${validCount}`);
console.log(`Ventas omitidas (sin match): ${skipped}`);

// Guardar en archivo JSON
fs.writeFileSync('/tmp/ventas_4buddies.json', JSON.stringify(ventasValidas));
console.log('\nArchivo guardado en /tmp/ventas_4buddies.json');

// Mostrar rango de fechas
const fechas = ventasValidas.map(v => v.fecha).sort();
console.log(`Rango de fechas: ${fechas[0]} a ${fechas[fechas.length - 1]}`);
