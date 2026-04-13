const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-proxy-secret',
}

const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions'
const MAX_BODY_SIZE = 50 * 1024 // 50 KB

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Auth check — use x-proxy-secret header
  const secret = Deno.env.get('EDGE_FUNCTION_SECRET')
  const token = req.headers.get('x-proxy-secret') || ''
  console.log(`auth-debug secret-set=${!!secret} secret-len=${secret?.length || 0} token-len=${token.length} match=${token === secret}`)


  if (!secret || token !== secret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Read body
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Size check
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_SIZE) {
    return new Response(JSON.stringify({ error: 'Payload too large (max 50KB)' }), {
      status: 413,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Parse to check for stream
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (parsed.stream === true) {
    return new Response(JSON.stringify({ error: 'Streaming not supported yet' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Proxy to AI Gateway
  const start = Date.now()
  const bodySize = new TextEncoder().encode(rawBody).byteLength

  try {
    const lovableKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableKey) {
      console.error('LOVABLE_API_KEY not configured')
      return new Response(JSON.stringify({ error: 'Gateway configuration error' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const gatewayResp = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: rawBody,
    })

    const duration = Date.now() - start
    console.log(`llm-proxy status=${gatewayResp.status} size=${bodySize}B duration=${duration}ms`)

    const responseBody = await gatewayResp.text()

    return new Response(responseBody, {
      status: gatewayResp.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const duration = Date.now() - start
    console.error(`llm-proxy error duration=${duration}ms size=${bodySize}B err=${(err as Error).message}`)

    return new Response(JSON.stringify({ error: 'AI Gateway unavailable' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
