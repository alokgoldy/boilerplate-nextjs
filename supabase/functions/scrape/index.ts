import { serve } from "https://deno.land/std@0.193.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const { url } = await req.json().catch(() => ({ url: '' }));
  if (!url) return new Response(JSON.stringify({ error: 'url required' }), { status: 400 });


  // Simple demo scrape: fetch title and length
  try {
    const res = await fetch(url);
    const html = await res.text();
    const title = (html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? '').trim();


    // Optionally store a record in items (requires auth)
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });


    // Example: create an item noting the scrape (owner comes from JWT via RLS)
    await supabase.from('items').insert({
      title: title || `Scraped: ${url}`,
      category: 'web',
      status: 'active'
    });


    return new Response(JSON.stringify({ title, length: html.length }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});