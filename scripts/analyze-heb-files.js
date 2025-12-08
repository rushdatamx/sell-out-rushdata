const XLSX = require('xlsx');

// Leer archivo de Ventas
const ventasPath = '/Users/jmariopgarcia/Desktop/DELIKOS/MITIENDA/VENTA DELIKOS HEB OFICIAL (2).xlsx';
const ventasWorkbook = XLSX.readFile(ventasPath);

console.log('='.repeat(80));
console.log('ARCHIVO DE VENTAS');
console.log('='.repeat(80));
console.log('Pestañas:', ventasWorkbook.SheetNames);
console.log('');

// Analizar cada pestaña
ventasWorkbook.SheetNames.forEach((sheetName) => {
  console.log(`\n--- Pestaña: ${sheetName} ---`);
  const sheet = ventasWorkbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (data.length > 0) {
    console.log('Columnas:', Object.keys(data[0]));
    console.log(`Total filas: ${data.length}`);
    console.log('Primera fila:', data[0]);
  }
});

console.log('\n');
console.log('='.repeat(80));
console.log('ARCHIVO DE INVENTARIO');
console.log('='.repeat(80));

// Leer archivo de Inventario
const inventarioPath = '/Users/jmariopgarcia/Desktop/DELIKOS/MITIENDA/INVENTARIO HEB DELIKOS OFICIAL.xlsx';
const inventarioWorkbook = XLSX.readFile(inventarioPath);

console.log('Pestañas:', inventarioWorkbook.SheetNames);
console.log('');

// Analizar cada pestaña
inventarioWorkbook.SheetNames.forEach((sheetName) => {
  console.log(`\n--- Pestaña: ${sheetName} ---`);
  const sheet = inventarioWorkbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (data.length > 0) {
    console.log('Columnas:', Object.keys(data[0]));
    console.log(`Total filas: ${data.length}`);
    console.log('Primera fila:', data[0]);
  }
});
