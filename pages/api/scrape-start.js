// Apify cheerio-scraper — extracts everything possible from AliExpress HTML.
// AliExpress serves a CSR shell but does embed some data server-side for SEO.

const PAGE_FUNCTION = `async function pageFunction(context) {
  const { $, request } = context;
  const html = $.html() || '';

  // ── TITLE ──
  const title = ($('meta[property="og:title"]').attr('content') || '')
    .replace(/\\s*[-|]\\s*AliExpress.*$/i, '').replace(/\\s*\\d+$/, '').trim();

  // ── OG IMAGE (fallback) ──
  const ogImage = ($('meta[property="og:image"]').attr('content') || '')
    .replace(/_\\d+x\\d+[^.]*/, '').replace(/\\.jpg_.*/, '.jpg').replace(/\\.avif$/, '.jpg');

  // ── IMAGES from imagePathList ──
  let images = [];
  const imgM = html.match(/"imagePathList"\\s*:\\s*(\\[)/);
  if (imgM) {
    const s = html.indexOf(imgM[0]) + imgM[0].length - 1;
    let d = 0, e = -1;
    for (let j = s; j < Math.min(s + 30000, html.length); j++) {
      if (html[j] === '[') d++;
      else if (html[j] === ']') { d--; if (d === 0) { e = j + 1; break; } }
    }
    if (e > 0) {
      try {
        const arr = JSON.parse(html.slice(s, e));
        if (Array.isArray(arr)) images = arr.map(u =>
          (u.startsWith('http') ? u : 'https:' + u)
            .replace(/_\\d+x\\d+[^.]*/, '').replace(/\\.jpg_.*/, '.jpg').replace(/\\.avif$/, '.jpg'));
      } catch(e) {}
    }
  }
  if (images.length === 0 && ogImage) images = [ogImage];

  // ── RATING from meta or JSON ──
  let rating = '';
  // Try og:rating or itemprop
  const ratingMeta = $('meta[itemprop="ratingValue"]').attr('content')
    || $('[itemprop="ratingValue"]').text()
    || '';
  if (ratingMeta) rating = ratingMeta.trim();
  // Try JSON in HTML
  if (!rating) {
    const rm = html.match(/"evarageStar"\\s*:\\s*"?([\\d.]+)"?/);
    if (rm) rating = rm[1];
  }
  if (!rating) {
    const rm = html.match(/"starRating"\\s*:\\s*"?([\\d.]+)"?/);
    if (rm) rating = rm[1];
  }

  // ── REVIEW COUNT ──
  let reviewCount = '';
  const rcm = html.match(/"totalValidNum"\\s*:\\s*(\\d+)/);
  if (rcm) reviewCount = rcm[1];
  if (!reviewCount) {
    const rcm2 = html.match(/"reviewCount"\\s*:\\s*(\\d+)/);
    if (rcm2) reviewCount = rcm2[1];
  }

  // ── ORDERS SOLD ──
  let orders = '';
  const om = html.match(/"formatTradeCount"\\s*:\\s*"([^"]{1,30})"/);
  if (om) orders = om[1];
  if (!orders) {
    const om2 = html.match(/"tradeDesc"\\s*:\\s*"([^"]{1,30})"/);
    if (om2) orders = om2[1];
  }

  // ── PRICE ──
  let price = '';
  const pricePatterns = [
    /"formattedPrice"\\s*:\\s*"([^"]{2,25})"/,
    /"activityAmount"\\s*:\\s*"([^"]{2,20})"/,
    /"minActivityAmount"\\s*:\\s*"([^"]{2,20})"/,
    /"salePrice"\\s*:\\s*"([^"]{2,20})"/,
    /"originalPrice"\\s*:\\s*"([^"]{2,20})"/,
  ];
  for (const pat of pricePatterns) {
    const m = html.match(pat);
    if (m && m[1] && (m[1].includes('$') || m[1].includes('€') || m[1].includes('£') || /^\\d/.test(m[1]))) {
      price = m[1]; break;
    }
  }

  // ── STORE NAME ──
  let store = '';
  const sm = html.match(/"storeName"\\s*:\\s*"([^"]{2,60})"/);
  if (sm) store = sm[1];
  if (!store) {
    const sm2 = html.match(/"sellerName"\\s*:\\s*"([^"]{2,60})"/);
    if (sm2) store = sm2[1];
  }

  // ── STORE URL ──
  let storeUrl = '';
  const sum = html.match(/"storeURL"\\s*:\\s*"([^"]{5,100})"/);
  if (sum) storeUrl = sum[1];
  if (!storeUrl) {
    const sum2 = html.match(/"sellerDetailUrl"\\s*:\\s*"([^"]{5,100})"/);
    if (sum2) storeUrl = sum2[1];
  }

  // ── POSITIVE FEEDBACK RATE ──
  let feedbackRate = '';
  const frm = html.match(/"positiveRate"\\s*:\\s*"([^"]{2,10})"/);
  if (frm) feedbackRate = frm[1];

  // ── DESCRIPTION URL ──
  let descriptionUrl = '';
  const dum = html.match(/"pc_detail_top_gallery:description"\\s*:\\s*"([^"]+)"/);
  if (dum) descriptionUrl = dum[1];
  if (!descriptionUrl) {
    const dum2 = html.match(/"descriptionUrl"\\s*:\\s*"([^"]+)"/);
    if (dum2) descriptionUrl = dum2[1];
  }
  // Standard AliExpress description URL pattern
  if (!descriptionUrl) {
    const loadedUrl = request.loadedUrl || request.url;
    const pidm = loadedUrl.match(/\\/item\\/(\\d+)\\.html/);
    if (pidm) descriptionUrl = 'https://aeproductsourcesite.alicdn.com/product/description/pc/v2/en_US/desc.htm?productId=' + pidm[1];
  }

  // ── BRAND ──
  let brand = '';
  const bm = html.match(/"brandName"\\s*:\\s*"([^"]{1,50})"/);
  if (bm) brand = bm[1];
  if (!brand) {
    const bm2 = $('meta[itemprop="brand"]').attr('content') || '';
    if (bm2) brand = bm2;
  }

  // ── SHIPS FROM ──
  let shipsFrom = '';
  const sfm = html.match(/"sendGoodsCountry"\\s*:\\s*"([^"]{1,30})"/);
  if (sfm) shipsFrom = sfm[1];
  if (!shipsFrom) {
    const sfm2 = html.match(/"serviceLocation"\\s*:\\s*"([^"]{1,30})"/);
    if (sfm2) shipsFrom = sfm2[1];
  }

  return {
    title,
    prices: price ? [price] : [],
    images: [...new Set(images)].slice(0, 12),
    rating,
    reviewCount,
    orders,
    store,
    storeUrl,
    feedbackRate,
    descriptionUrl,
    brand,
    shipsFrom,
    variants: [],
    specs: [],
  };
}`;

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url required' });

  const APIFY_KEY = process.env.APIFY_API_KEY;
  if (!APIFY_KEY) return res.status(500).json({ error: 'APIFY_API_KEY not set' });

  try {
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/apify~cheerio-scraper/runs?token=${APIFY_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [{ url: url.includes('?') ? url + '&language=en' : url + '?language=en' }],
          pageFunction: PAGE_FUNCTION,
          proxyConfiguration: { useApifyProxy: true },
          maxRequestsPerCrawl: 1,
        }),
      }
    );

    if (!startRes.ok) {
      const err = await startRes.text();
      return res.status(500).json({ error: 'Failed to start: ' + err.slice(0, 300) });
    }

    const { data } = await startRes.json();
    return res.status(200).json({ runId: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export const config = { maxDuration: 10 };
