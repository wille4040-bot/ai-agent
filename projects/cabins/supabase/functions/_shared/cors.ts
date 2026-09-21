// CORS-headers för anrop från webbappen. Sätt ALLOW_ORIGIN till din domän
// i produktion (t.ex. https://sommen-huetten.example) istället för '*'.
const allowOrigin = Deno.env.get('ALLOW_ORIGIN') ?? '*'

export const corsHeaders = {
  'Access-Control-Allow-Origin': allowOrigin,
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
