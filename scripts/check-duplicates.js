const fs = require('fs');
const lines = fs.readFileSync('/Users/jmariopgarcia/Desktop/4BUDDIES HEB/inventario_4buddies.csv', 'utf8').split('\n');
const keys = new Set();
let duplicates = 0;
const seen = {};

lines.slice(1).forEach(line => {
  if (!line.trim()) return;
  const parts = line.split(',');
  const key = parts.slice(0, 5).join('|'); // tenant,retailer,tienda,producto,fecha
  if (keys.has(key)) {
    duplicates++;
    seen[key] = (seen[key] || 1) + 1;
  }
  keys.add(key);
});

console.log('Total duplicados:', duplicates);
console.log('Ejemplos:');
Object.entries(seen).slice(0, 5).forEach(([k, v]) => console.log(k, '->', v, 'veces'));
