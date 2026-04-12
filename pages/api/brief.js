export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { productData, brand, selections, regenNote } = req.body;
  if (!productData) return res.status(400).json({ error: 'Product data required' });
  if (!brand) return res.status(400).json({ error: 'Brand profile required' });

  const CLAUDE_KEY = process.env.CLAUDE_API_KEY;
  if (!CLAUDE_KEY) return res.status(500).json({ error: 'CLAUDE_API_KEY not set' });

  // Which sections to generate
  const toGenerate = selections && selections.length > 0 ? selections : ['productName','pricing','copy','faq','imagePrompts'];

  // Build output format based on selections
  const outputFields = {};
  if (toGenerate.includes('productName')) {
    outputFields.productName = 'Branded product name';
    outputFields.painPoint   = '1-2 sentences on the core pain this product solves';
  }
  if (toGenerate.includes('pricing')) {
    outputFields.pricing = {
      aliExpressPrice:    `Estimated AliExpress price in ${brand.currency || 'AUD'}`,
      suggestedRetail:    `Recommended retail price in ${brand.currency || 'AUD'}`,
      suggestedSalePrice: '20-30% off retail',
      reasoning:          'Brief explanation of pricing logic',
    };
  }
  if (toGenerate.includes('copy')) {
    outputFields.copy = {
      subtitle:         'One punchy line under the product name',
      shortDescription: '2-3 sentences. Lead with the customer pain. End with the outcome.',
      overview:         '3-4 short paragraphs in brand tone.',
      materials:        'Bullet list of materials/specs',
      care:             'Simple care or usage instructions',
    };
  }
  if (toGenerate.includes('faq')) {
    outputFields.faq = [
      { q: 'Customer question', a: 'Objection-killing answer' },
      { q: 'Customer question', a: 'Objection-killing answer' },
      { q: 'Customer question', a: 'Objection-killing answer' },
      { q: 'Customer question', a: 'Objection-killing answer' },
      { q: 'Customer question', a: 'Objection-killing answer' },
    ];
  }
  if (toGenerate.includes('imagePrompts')) {
    outputFields.imagePrompts = {
      shot1: 'Lifestyle shot — pure emotion, no text. Full Lovart prompt.',
      shot2: 'Clean product hero — brand background. Full Lovart prompt.',
      shot3: 'Anatomy/mechanism explainer. Full Lovart prompt.',
      shot4: 'Benefit callout with labeled arrows. Full Lovart prompt.',
      shot5: 'Size/scale overhead with dimension arrows. Full Lovart prompt.',
      shot6: 'Before/after or secondary lifestyle. Full Lovart prompt.',
    };
    outputFields.googleShoppingPrompt = 'Full Lovart prompt for Google Shopping ad image.';
  }

  const systemPrompt = `You are a product copywriter for ${brand.name}${brand.tagline ? ` — ${brand.tagline}` : ''}.

${brand.story ? `BRAND STORY:\n${brand.story}\n` : ''}
BRAND TONE:
${brand.tone || 'Professional, clear, benefit-focused'}

TARGET CUSTOMER:
${brand.targetCustomer || 'General consumer'}

NICHE / PRODUCT CATEGORIES:
${brand.niche || 'General ecommerce'}

${brand.keyBenefits ? `KEY BRAND BENEFITS — always weave these in:\n${brand.keyBenefits}\n` : ''}
${brand.alwaysEmphasise ? `ALWAYS EMPHASISE — mention these in every piece of copy:\n${brand.alwaysEmphasise}\n` : ''}
${brand.copyRules ? `COPY RULES — follow strictly:\n${brand.copyRules}\n` : ''}
${brand.forbiddenWords ? `FORBIDDEN WORDS — never use any of these:\n${brand.forbiddenWords}\n` : ''}
${brand.competitorContext ? `COMPETITOR CONTEXT:\n${brand.competitorContext}\n` : ''}

PRICING RULES:
- Currency: ${brand.currency || 'AUD'}
- Retail price = ~${brand.priceMultiplier || 4}x the AliExpress cost price
${brand.priceMin ? `- Minimum retail price: ${brand.currency || 'AUD'} ${brand.priceMin}` : ''}
${brand.priceMax ? `- Maximum retail price: ${brand.currency || 'AUD'} ${brand.priceMax}` : ''}
- Sale price = 20-30% off retail. Never fake 50%+ discounts.

${brand.imageStyle ? `IMAGE / VISUAL STYLE:\n${brand.imageStyle}\n` : ''}

LOVART IMAGE PROMPT RULES — apply to every image prompt:
- Always start every prompt with: "IMPORTANT: Use the uploaded product reference image. Recreate that exact product — do not change any feature of the product."
- For lifestyle/person shots: "The person must be visibly using and enjoying the product in a natural, relaxed way"
- Text overlays: bold, modern sans-serif — NEVER thin grey text
- No irrelevant props or clutter. No white studio backgrounds unless that's the brand style.
- Consistent brand colours throughout all shots.
- All shots: 1080x1080px square format.

OUTPUT FORMAT — respond ONLY with valid JSON. Only include the fields listed below. No extra fields, no markdown.
${JSON.stringify(outputFields, null, 2)}`;

  const regenInstruction = regenNote
    ? `\n\nIMPORTANT — This is a REGENERATION request. The user is unhappy with the previous output and has given this feedback:\n"${regenNote}"\nFix the issues described. Only output the requested section(s).`
    : '';

  const userMessage = `Generate ${brand.name} content for this AliExpress product.

PRODUCT TITLE: ${productData.title || 'Unknown product'}
IMAGES AVAILABLE: ${(productData.images || []).length} product images
EXTRA NOTES / CONTEXT: ${productData.notes || 'None'}
SECTIONS TO GENERATE: ${toGenerate.join(', ')}${regenInstruction}

Respond with valid JSON only.`;

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
