// Polls an Apify run and returns mapped results.

function cleanImg(u) {
  if (!u) return '';
  return u.replace(/_\d+x\d+[^.]*/, '').replace(/\.jpg_.*/, '.jpg').replace(/\.avif$/, '.jpg');
}

function mapItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    title: raw.title || '',
    prices: Array.isArray(raw.prices) ? raw.prices.filter(Boolean) : (raw.prices ? [raw.prices] : []),
    images: Array.isArray(raw.images) ? raw.images.map(i => typeof i === 'string' ? cleanImg(i) : cleanImg(i?.url)).filter(Boolean) : [],
    variants: Array.isArray(raw.variants) ? raw.variants : [],
    specs: Array.isArray(raw.specs) ? raw.specs : [],
    rating: String(raw.rating || ''),
    orderText: String(raw.orderText || ''),
    descriptionUrl: raw.descriptionUrl || '',
  };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { runId } = req.body || {};
  if (!runId) return res.status(400).json({ error: 'runId required' });

  const APIFY_KEY = process.env.APIFY_API_KEY;
  if (!APIFY_KEY) return res.status(500).json({ error: 'APIFY_API_KEY not set' });

  try {
    const poll = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_KEY}`);
    if (!poll.ok) return res.status(200).json({ status: 'RUNNING' });
    const { data: run } = await poll.json();

    if (run.status === 'SUCCEEDED') {
      const itemsRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_KEY}`);
      const items = await itemsRes.json();
      const raw = Array.isArray(items) ? items[0] : items;
      const mapped = mapItem(raw);
      if (!mapped) return res.status(200).json({ status: 'FAILED' });
      return res.status(200).json({ status: 'SUCCEEDED', data: mapped, raw });
    }

    if (run.status === 'FAILED' || run.status === 'ABORTED') {
      return res.status(200).json({ status: run.status });
    }

    return res.status(200).json({ status: 'RUNNING' });
  } catch (err) {
    return res.status(200).json({ status: 'RUNNING' });
  }
}

export const config = { maxDuration: 10 };
