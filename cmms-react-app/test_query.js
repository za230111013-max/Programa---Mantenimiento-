import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('./.env', 'utf8');
const lines = envContent.split('\n');
let supabaseUrl = '';
let supabaseKey = '';

lines.forEach(line => {
  if (line.trim().startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.trim().startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  }
});

console.log('Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { count: woCount, error: woErr } = await supabase
    .from('work_orders')
    .select('*', { count: 'exact', head: true });
  console.log('Work orders count:', woCount, woErr);

  const { count: assetCount, error: assetErr } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true });
  console.log('Assets count:', assetCount, assetErr);
}
test();
