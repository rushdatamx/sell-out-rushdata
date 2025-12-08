const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('/Users/jmariopgarcia/Desktop/4BUDDIES HEB/HEB SUPABASE/INVENTARIO 30 DÍAS.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

const TENANT_ID = 'c529e450-3708-48c9-90ca-cfb2a01a57ed';
const RETAILER_ID = 3;

const tiendasMap = {
  '2992': 29, '2913': 30, '2904': 31, '2781': 32, '2762': 33, '2725': 34, '2723': 35,
  '2712': 36, '2637': 37, '2635': 38, '2626': 39, '2621': 40, '2618': 41, '2604': 42,
  '2603': 43, '2601': 44, '2572': 45, '2568': 46, '2550': 47, '2542': 48, '2541': 49,
  '2521': 50, '2520': 51, '2507': 52, '2506': 53, '2498': 54, '2480': 55, '2479': 56,
  '2476': 57, '2474': 58, '2438': 59, '2429': 60, '2413': 61, '2405': 62, '2400': 63,
  '2397': 64, '2380': 65, '2378': 66, '2374': 67, '2358': 68, '2351': 69, '2344': 70,
  '2340': 71, '2335': 72, '2332': 73, '2329': 74, '2328': 75, '2298': 76, '2283': 77,
  '2271': 78, '2253': 79, '2239': 80, '2218': 81, '2200': 82, '2177': 83, '2173': 84,
  '2172': 85, '2160': 86, '2154': 87, '2152': 88, '2121': 89, '2112': 90, '2970': 91
};

const productosMap = {
  '7500462417826': 20, '7500462417819': 21, '7500462417833': 22, '7500462681266': 23,
  '7500462417857': 24, '7500462417864': 25, '7500462544010': 26, '7500462417802': 27,
  '7500462681259': 28, '7500462681211': 29, '7500462417840': 30, '7500462544027': 31,
  '7500462544034': 32, '7503028921324': 33
};

function excelDateToString(serial) {
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

let inventario = [];
let skipped = 0;

data.forEach(row => {
  const tiendaId = tiendasMap[String(row.ID_Tienda)];
  const productoId = productosMap[String(row.UPC)];

  if (!tiendaId || !productoId) {
    skipped++;
    return;
  }

  inventario.push({
    tenant_id: TENANT_ID,
    retailer_id: RETAILER_ID,
    tienda_id: tiendaId,
    producto_id: productoId,
    fecha: excelDateToString(row.Fecha),
    unidades_inventario: row.Inventario || 0
  });
});

console.log('Registros procesados:', inventario.length);
console.log('Registros omitidos:', skipped);

fs.writeFileSync('/tmp/inventario_4buddies.json', JSON.stringify(inventario));
console.log('JSON guardado en /tmp/inventario_4buddies.json');
