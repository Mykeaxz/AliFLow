export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { productData, brand } = req.body;
  if (!productData) return res.status(400).json({ error: 'Product data required' });
  if (!brand) return res.status(400).json({ error: 'Brand profile required' });

  const CLAUDE_KEY = process.env.CLAUDE_API_KEY;
  if (!CLAUDE_KEY) return res.status(500).json({ error: 'CLAUDE_API_KEY not set' });

  const systemPrompt = `You are a product copywriter for ${brand.name}${brand.tagline ? ` — ${brand.tagline}` : ''}.

BRAND TONE:
${brand.tone || 'Professional, clear, benefit-focused'}

TARGET CUSTOMER:
${brand.targetCustomer || 'General consumer'}

NICHE / PRODUCT CATEGORIES:
${brand.niche || 'General ecommerce'}

${brand.copyRules ? `COPY RULES — follow strictly:\n${brand.copyRules}` : ''}

${brand.forbiddenWords ? `FORBIDDEN WORDS — never use these:\n${brand.forbiddenWords}` : ''}

PRICING RULE:
${brand.priceMultiplier ? `Retail price = ~${brand.priceMultiplier}x the AliExpress price. Sale price = 20-30% off retail. Never fake 50%+ discounts.` : 'Set a fair retail price based on value. Sale price = 20-30% off retail.'}

${brand.imageStyle ? `IMAGE STYLE:\n${brand.imageStyle}` : ''}

LOVART IMAGE PROMPT RULES — apply to every image prompt:
- Always start with: "IMPORTANT: Use the uploaded product reference image. Recreate that exact product — do not change any feature of the product."
- For any lifestyle/person shot: "The person must be visibly using and enjoying the product in a natural, relaxed way"
- Text overlays: bold, modern sans-serif, on-brand colors — NEVER thin grey
- No irrelevant props or clutter
- Consistent brand colours throughout
- 1080x1080px all shots

6-SHOT IMAGE FRAMEWORK:
- Shot 1: Lifestyle — pure emotion, no text
- Shot 2: Clean product hero — clean background matching brand palette
- Shot 3: Anatomy/mechanism explainer — how it works
- Shot 4: Benefit callout with labeled arrows
- Shot 5: Size and scale overhead with dimension arrows
- Shot 6: Before/after or secondary lifestyle

OUTPUT FORMAT — respond ONLY with valid JSON, exactly this structure:
{
  "productName": "Branded product name",
  "painPoint": "1-2 sentences on the core pain this product solves",
  "pricing": {
    "aliExpressPrice": "estimated price",
    "suggestedRetail": "recommended retail price",
    "suggestedSalePrice": "20-30% off retail",
    "reasoning": "brief explanation"
  },
  "copy": {
    "subtitle": "One punchy line under the product name",
    "shortDescription": "2-3 sentences. Pain first. Outcome second.",
    "overview": "3-4 short paragraphs. On-brand tone.",
    "materials": "Clean bullet list of materials",
    "care": "Simple care instructions"
  },
  "faq": [
    { "q": "question", "a": "answer that kills the objection" },
    { "q": "question", "a": "answer that kills the objection" },
    { "q": "question", "a": "answer that kills the objection" },
    { "q": "question", "a": "answer that kills the objection" },
    { "q": "question", "a": "answer that kills the objection" }
  ],
  "imagePrompts": {
    "shot1": "Full Lovart prompt for Shot 1",
    "shot2": "Full Lovart prompt for Shot 2",
    "shot3": "Full Lovart prompt for Shot 3",
    "shot4": "Full Lovart prompt for Shot 4",
    "shot5": "Full Lovart prompt for Shot 5",
    "shot6": "Full Lovart prompt for Shot 6"
  },
  "googleShoppingPrompt": "Full image prompt for Google Shopping ad"
}`;

  const userMessage = `Here is the AliExpress product data. Generate a complete ${brand.name} product brief.

PRODUCT TITLE: ${productData.title || 'N/A'}
IMAGES FOUND: ${(productData.images || []).length} images
NOTES / EXTRA INFO: ${productData.notes || 'None'}

Generate the full brief as valid JSON now.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: `Claude API error: ${err}` });
    }

    const data = await response.json();
    const text = data.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Unexpected Claude response. Try again.' });

    return res.status(200).json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export const config = { maxDuration: 60 };
