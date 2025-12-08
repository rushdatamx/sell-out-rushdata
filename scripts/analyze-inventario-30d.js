const XLSX = require('xlsx');

const path = '/Users/jmariopgarcia/Desktop/DELIKOS/MITIENDA/INVENTARIO ÚLTIMOS 30 DIAS.xlsx';
const workbook = XLSX.readFile(path);

console.log('='.repeat(80));
console.log('ARCHIVO: INVENTARIO ÚLTIMOS 30 DIAS');
console.log('='.repeat(80));
console.log('Pestañas:', workbook.SheetNames);
console.log('');

// Analizar cada pestaña
workbook.SheetNames.forEach((sheetName) => {
  console.log(`\n--- Pestaña: ${sheetName} ---`);
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (data.length > 0) {
    console.log('Columnas:', Object.keys(data[0]));
    console.log(`Total filas: ${data.length}`);
    console.log('Primera fila:', data[0]);
    console.log('Segunda fila:', data[1]);
    console.log('Última fila:', data[data.length - 1]);

    // Ver si hay columna de fecha
    if (data[0]['Fecha']) {
      const fechas = [...new Set(data.map(r => r['Fecha']))];
      console.log(`Fechas únicas: ${fechas.length}`);
      console.log('Rango de fechas:', Math.min(...fechas), '->', Math.max(...fechas));
    }
  }
});
