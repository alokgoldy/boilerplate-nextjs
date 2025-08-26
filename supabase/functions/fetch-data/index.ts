// Deno - Edge Function
import { serve } from "https://deno.land/std@0.193.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


serve(async (req) => {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') ?? '1');
  const perPage = Math.min(100, Number(url.searchParams.get('perPage') ?? '10'));
  const sortBy = url.searchParams.get('sortBy') ?? 'created_at';
  const sortDir = (url.searchParams.get('sortDir') ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
  const search = url.searchParams.get('search')?.trim() ?? '';
  const category = url.searchParams.get('category') ?? '';
  const status = url.searchParams.get('status') ?? '';


  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  // Use the caller's JWT for RLS scope
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });


  let query = supabase.from('items').select('*', { count: 'exact' });
  if (search) query = query.ilike('title', `%${search}%`);
  if (category) query = query.eq('category', category);
  if (status) query = query.eq('status', status);


  const from = (page - 1) * perPage;
  const to = from + perPage - 1;


  // @ts-ignore - order accepts string
  const { data, error, count } = await query.order(sortBy, { ascending: sortDir === 'asc' }).range(from, to);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });


  return new Response(JSON.stringify({ data, page, perPage, total: count ?? 0 }), { headers: { 'Content-Type': 'application/json' } });
});