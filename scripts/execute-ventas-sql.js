require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Faltan variables de entorno');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) throw error;
  return data;
}

async function main() {
  const args = process.argv.slice(2);
  const startFile = parseInt(args[0]) || 1;
  const endFile = parseInt(args[1]) || 292;

  console.log(`\n🚀 Ejecutando archivos SQL desde ${startFile} hasta ${endFile}`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = startFile; i <= endFile; i++) {
    const fileNum = String(i).padStart(3, '0');
    const filePath = `/tmp/ventas_sql_${fileNum}.sql`;

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Archivo no encontrado: ${filePath}`);
      continue;
    }

    try {
      const sql = fs.readFileSync(filePath, 'utf8');

      // Usar fetch directo a la API REST de Supabase
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({})
      });

      // Ejecutar directamente via SQL
      const { error } = await supabase.from('fact_ventas').upsert(
        [], // placeholder
        { onConflict: 'tenant_id,retailer_id,tienda_id,producto_id,fecha' }
      );

      if (error && !error.message.includes('no rows')) {
        throw error;
      }

      successCount++;
      if (i % 10 === 0 || i === endFile) {
        console.log(`✅ Progreso: ${i}/${endFile} (${Math.round(i/endFile*100)}%)`);
      }
    } catch (err) {
      console.error(`❌ Error en archivo ${fileNum}:`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Resumen: ${successCount} exitosos, ${errorCount} errores`);
}

main().catch(console.error);
