import { serve } from "https://deno.land/std@0.193.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;


  const authHeader = req.headers.get('Authorization') ?? '';
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });


  const { data: userRes } = await client.auth.getUser();
  const me = userRes?.user;
  if (!me) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });


  // Check admin
  const { data: myRole } = await client.from('user_roles').select('role').eq('user_id', me.id).single();
  if (myRole?.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });


  const { user_id, role } = await req.json();
  if (!user_id || !role) return new Response(JSON.stringify({ error: 'user_id & role required' }), { status: 400 });


  const { error } = await client.from('user_roles').upsert({ user_id, role });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });


  return new Response(JSON.stringify({ ok: true }));
});