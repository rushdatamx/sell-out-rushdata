const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('/Users/jmariopgarcia/Desktop/4BUDDIES HEB/HEB SUPABASE/INVENTARIO 30 DÍAS.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

const TENANT_ID = 'c529e450-3708-48c9-90ca-cfb2a01a57ed';
const RETAILER_ID = 3;

// Mapeos actualizados desde Supabase
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
  '2160': 86 // Este estaba en el mapeo anterior - NOTA: 2936 también mapea a 86, esto causa duplicados
};

const productosMap = {
  '7500462417802': 24, '7500462417819': 22, '7500462417826': 20, '7500462417833': 21,
  '7500462860004': 23, '7500462860011': 31, '7500462860035': 32, '7500462860042': 25,
  '7500462860066': 30, '7503028921003': 28, '7503028921010': 29, '7503028921133': 27,
  '7503028921317': 26, '7503028921324': 33
};

function excelDateToString(serial) {
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

// Usar un Map para deduplicar, sumando inventario cuando hay duplicados
const inventarioMap = new Map();
let skipped = 0;
let duplicatesFound = 0;

data.forEach(row => {
  const tiendaId = tiendasMap[String(row.ID_Tienda)];
  const productoId = productosMap[String(row.UPC)];

  if (!tiendaId || !productoId) {
    skipped++;
    return;
  }

  const fecha = excelDateToString(row.Fecha);
  const key = `${TENANT_ID}|${RETAILER_ID}|${tiendaId}|${productoId}|${fecha}`;
  const inventario = row.Inventario || 0;

  if (inventarioMap.has(key)) {
    // Si ya existe, tomamos el máximo valor (o podrías sumar)
    const existing = inventarioMap.get(key);
    existing.inventario_unidades = Math.max(existing.inventario_unidades, inventario);
    duplicatesFound++;
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

console.log('Registros únicos procesados:', inventario.length);
console.log('Registros omitidos (sin mapeo):', skipped);
console.log('Duplicados encontrados y fusionados:', duplicatesFound);

// Generar CSV con nombre de columna correcto
let csv = 'tenant_id,retailer_id,tienda_id,producto_id,fecha,inventario_unidades\n';
inventario.forEach(i => {
  csv += `${i.tenant_id},${i.retailer_id},${i.tienda_id},${i.producto_id},${i.fecha},${i.inventario_unidades}\n`;
});

fs.writeFileSync('/Users/jmariopgarcia/Desktop/4BUDDIES HEB/inventario_4buddies.csv', csv);
console.log('CSV guardado en /Users/jmariopgarcia/Desktop/4BUDDIES HEB/inventario_4buddies.csv');
