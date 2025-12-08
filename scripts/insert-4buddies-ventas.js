require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function insertVentas() {
  console.log('Leyendo archivo de ventas...');
  const ventasData = JSON.parse(fs.readFileSync('/tmp/ventas_4buddies.json', 'utf8'));
  console.log(`Total ventas a insertar: ${ventasData.length}`);

  const BATCH_SIZE = 1000;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < ventasData.length; i += BATCH_SIZE) {
    const batch = ventasData.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('fact_ventas')
      .upsert(batch, {
        onConflict: 'tenant_id,retailer_id,tienda_id,producto_id,fecha',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`Error en lote ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
      errors++;
      // Intentar uno por uno para identificar el problema
      for (const venta of batch) {
        const { error: singleError } = await supabase
          .from('fact_ventas')
          .upsert([venta], { onConflict: 'tenant_id,retailer_id,tienda_id,producto_id,fecha' });
        if (!singleError) inserted++;
      }
    } else {
      inserted += batch.length;
    }

    const progress = Math.round((i + batch.length) / ventasData.length * 100);
    console.log(`Progreso: ${inserted}/${ventasData.length} (${progress}%)`);
  }

  console.log(`\n✅ Inserción completa: ${inserted} ventas insertadas, ${errors} lotes con error`);
}

insertVentas().catch(console.error);
