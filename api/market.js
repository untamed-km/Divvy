// Finnhub proxy — keeps the API key server-side (env: FINNHUB_API_KEY).
// GET /api/market?fn=quote&symbol=AAPL
// GET /api/market?fn=candle&symbol=AAPL&resolution=D&from=...&to=...
// GET /api/market?fn=news
export const config = {
  runtime: 'edge',
};

const ALLOWED = { quote: 'quote', candle: 'stock/candle', news: 'news' };
const PASS_PARAMS = ['symbol', 'resolution', 'from', 'to', 'category', 'minId'];

export default async function handler(req) {
  const url = new URL(req.url);
  const fn = url.searchParams.get('fn');
  const path = ALLOWED[fn];
  if (!path) return json({ error: 'Unknown fn' }, 400);

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return json({ error: 'Market API key not configured' }, 500);

  const upstream = new URL('https://finnhub.io/api/v1/' + path);
  PASS_PARAMS.forEach((p) => {
    const v = url.searchParams.get(p);
    if (v !== null) upstream.searchParams.set(p, v);
  });
  if (fn === 'news' && !upstream.searchParams.get('category')) {
    upstream.searchParams.set('category', 'general');
  }
  upstream.searchParams.set('token', apiKey);

  try {
    const r = await fetch(upstream.toString());
    const body = await r.text();
    return new Response(body, {
      status: r.status,
      headers: {
        'Content-Type': 'application/json',
        // CDN-cache so all users share one upstream call per window
        'Cache-Control':
          fn === 'news'
            ? 's-maxage=600, stale-while-revalidate=300'
            : 's-maxage=45, stale-while-revalidate=30',
      },
    });
  } catch (e) {
    return json({ error: 'Upstream error' }, 502);
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
