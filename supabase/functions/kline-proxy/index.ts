import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXCHANGE_URLS = {
  mexc: 'https://api.mexc.com',
  gate: 'https://api.gateio.ws',
  binance: 'https://api.binance.com',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const exchange = url.searchParams.get('exchange');
    const endpoint = url.searchParams.get('endpoint');
    
    if (!exchange || !endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing exchange or endpoint parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = EXCHANGE_URLS[exchange as keyof typeof EXCHANGE_URLS];
    if (!baseUrl) {
      return new Response(
        JSON.stringify({ error: 'Invalid exchange' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the full URL with query parameters
    const targetUrl = `${baseUrl}${endpoint}`;
    console.log(`Proxying request to: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    return new Response(
      JSON.stringify(data),
      { 
        status: response.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Proxy error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
