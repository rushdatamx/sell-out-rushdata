const XLSX = require('xlsx');

const ventasPath = '/Users/jmariopgarcia/Desktop/DELIKOS/MITIENDA/VENTA DELIKOS HEB OFICIAL (2).xlsx';
const ventasWorkbook = XLSX.readFile(ventasPath);

console.log('PESTAÑA COMPLEMENTOS - VENTAS');
console.log('='.repeat(80));

const complementosSheet = ventasWorkbook.Sheets['COMPLEMENTOS'];
const complementosData = XLSX.utils.sheet_to_json(complementosSheet, { header: 1 });

// Mostrar las primeras 15 filas para entender la estructura
complementosData.slice(0, 15).forEach((row, index) => {
  console.log(`Fila ${index}:`, row);
});

console.log('\n\nINVENTARIO - COMPLEMENTOS');
console.log('='.repeat(80));

const invPath = '/Users/jmariopgarcia/Desktop/DELIKOS/MITIENDA/INVENTARIO HEB DELIKOS OFICIAL.xlsx';
const invWorkbook = XLSX.readFile(invPath);
const invComplementosSheet = invWorkbook.Sheets['COMPLEMENTOS'];
const invComplementosData = XLSX.utils.sheet_to_json(invComplementosSheet, { header: 1 });

// Mostrar las primeras 15 filas
invComplementosData.slice(0, 15).forEach((row, index) => {
  console.log(`Fila ${index}:`, row);
});
