const fs = require('fs');

const ventas = JSON.parse(fs.readFileSync('/tmp/ventas_4buddies.json', 'utf8'));

// Generar SQL para inserción masiva
const BATCH_SIZE = 500;
let sqlFiles = [];

for (let i = 0; i < ventas.length; i += BATCH_SIZE) {
  const batch = ventas.slice(i, i + BATCH_SIZE);
  const fileNum = Math.floor(i / BATCH_SIZE) + 1;

  const values = batch.map(v => {
    const precioUnit = v.precio_unitario !== null ? v.precio_unitario : 'NULL';
    return `('${v.tenant_id}', ${v.retailer_id}, ${v.tienda_id}, ${v.producto_id}, '${v.fecha}', ${v.unidades}, ${v.venta_pesos}, ${precioUnit})`;
  }).join(',\n');

  const sql = `INSERT INTO fact_ventas (tenant_id, retailer_id, tienda_id, producto_id, fecha, unidades, venta_pesos, precio_unitario)
VALUES
${values}
ON CONFLICT (tenant_id, retailer_id, tienda_id, producto_id, fecha)
DO UPDATE SET unidades = EXCLUDED.unidades, venta_pesos = EXCLUDED.venta_pesos, precio_unitario = EXCLUDED.precio_unitario;`;

  const filename = `/tmp/ventas_sql_${String(fileNum).padStart(3, '0')}.sql`;
  fs.writeFileSync(filename, sql);
  sqlFiles.push(filename);
}

console.log(`Generados ${sqlFiles.length} archivos SQL`);
console.log(`Archivos: /tmp/ventas_sql_001.sql ... /tmp/ventas_sql_${String(sqlFiles.length).padStart(3, '0')}.sql`);

// Guardar lista de archivos
fs.writeFileSync('/tmp/ventas_sql_files.json', JSON.stringify(sqlFiles));
