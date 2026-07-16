// Client error beacon sink — errors show up in Vercel → Logs.
// The client rate-limits to 5 reports per session.
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  try {
    const b = await req.json();
    console.error(
      '[client-error]',
      JSON.stringify({
        m: String(b.message || '').slice(0, 500),
        s: String(b.source || '').slice(0, 200),
        l: b.line || 0,
        v: String(b.version || '?').slice(0, 20),
        ua: String(b.ua || '').slice(0, 120),
        ts: b.ts || null,
      })
    );
  } catch (e) {
    /* malformed body — ignore */
  }
  return new Response(null, { status: 204 });
}
