// Shot type instructions for Claude
const SHOT_INSTRUCTIONS = {
  auto:        'Choose the most impactful shot type for this slot based on the product.',
  lifestyle:   'Lifestyle shot — person visibly using and enjoying the product in a natural, relaxed setting. Pure emotion, no text overlays.',
  hero:        'Clean product hero shot — product centred on brand background colour, minimal props, no clutter.',
  mockup:      'Styled scene or flat lay mockup — product arranged with complementary props that match brand aesthetic.',
  infographic: 'Benefit callout infographic — product with labeled arrows pointing to key features. Bold sans-serif text in brand colours.',
  beforeafter: 'Before/after split image — left side shows the problem, right side shows the product solving it.',
  sizescale:   'Size & scale overhead — product from above with dimension arrows and measurements clearly labeled.',
  detail:      'Macro detail close-up — extreme close-up of the most impressive material, texture, or mechanism.',
  packaging:   'Packaging & unboxing shot — product in or next to its branded packaging, premium feel.',
  ugc:         'UGC-style authentic shot — casual, phone-shot aesthetic with real hands or a natural environment. No polish.',
  shopping:    'Google Shopping ad image — pure white background, product perfectly centred, no text, ad-ready.',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { productData, brand, selections, regenNote, shotConfig } = req.body;
  if (!productData) return res.status(400).json({ error: 'Product data required' });
  if (!brand) return res.status(400).json({ error: 'Brand profile required' });

  const CLAUDE_KEY = process.env.CLAUDE_API_KEY;
  if (!CLAUDE_KEY) return res.status(500).json({ error: 'CLAUDE_API_KEY not set' });

  const { selectedSections } = req.body; // array of template section IDs user checked

  // Which sections to generate
  const toGenerate = selections && selections.length > 0 ? selections : ['productName','pageContent','imagePrompts'];

  // Helper: turn section name into JSON key
  const toKey = (name) => name.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');

  // Build output format based on selections
  const outputFields = {};
  if (toGenerate.includes('productName')) {
    outputFields.productName = 'Branded product name — make it memorable and on-brand';
    outputFields.painPoint   = '1-2 sentences on the core pain this product solves';
  }

  // Page template content — dynamic per brand's template
  if (toGenerate.includes('pageContent') && brand.pageTemplate && brand.pageTemplate.length > 0) {
    const activeSections = selectedSections && selectedSections.length > 0
      ? brand.pageTemplate.filter(s => selectedSections.includes(s.id))
      : brand.pageTemplate;

    if (activeSections.length > 0) {
      outputFields.pageContent = {};
      for (const sec of activeSections) {
        const key = toKey(sec.name);
        const faqCount = brand.faqCount || 5;
        if (sec.type === 'faq') {
          outputFields.pageContent[key] = Array(faqCount).fill(null).map(() => ({ q: 'Customer question', a: 'Objection-killing answer' }));
        } else if (sec.type === 'bullets') {
          outputFields.pageContent[key] = ['Bullet point', 'Bullet point', 'Bullet point'];
        } else {
          outputFields.pageContent[key] = sec.description || `Write the ${sec.name} section in brand tone`;
        }
      }
    }
  }

  if (toGenerate.includes('imagePrompts')) {
    // Build shot list from shotConfig or fallback to 6 auto shots
    const shots = shotConfig && shotConfig.length > 0
      ? shotConfig
      : [1,2,3,4,5,6].map(slot => ({ slot, type: 'auto' }));
    outputFields.imagePrompts = shots.map(s => ({
      type: s.type === 'auto' ? '(type Claude chose)' : s.type,
      prompt: `Full Lovart prompt for shot ${s.slot} — ${SHOT_INSTRUCTIONS[s.type] || SHOT_INSTRUCTIONS.auto}`,
    }));
  }

  // Build page template instructions for the system prompt
  const activeSections = (brand.pageTemplate || []).filter(s =>
    !selectedSections || selectedSections.length === 0 || selectedSections.includes(s.id)
  );
  const templateBlock = activeSections.length > 0
    ? `\nPRODUCT PAGE TEMPLATE — generate content for each section exactly as specified:\n${activeSections.map((s, i) => {
        const faqCount = brand.faqCount || 5;
        const typeNote = s.type === 'faq' ? `(${faqCount} Q&A pairs)` : s.type === 'bullets' ? '(bullet list)' : s.type === 'textarea' ? '(multi-paragraph copy)' : '(short text)';
        return `${i+1}. "${s.name}" ${typeNote}\n   Instructions: ${s.description || 'Write in brand tone'}`;
      }).join('\n')}\n`
    : '';

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
${brand.competitorContext ? `COMPETITOR CONTEXT:\n${brand.competitorContext}\n` : ''}${templateBlock}
PRICING RULES:
- Currency: ${brand.currency || 'AUD'}
- Retail price = ~${brand.priceMultiplier || 4}x the AliExpress cost price
${brand.priceMin ? `- Minimum retail price: ${brand.currency || 'AUD'} ${brand.priceMin}` : ''}
${brand.priceMax ? `- Maximum retail price: ${brand.currency || 'AUD'} ${brand.priceMax}` : ''}
- Sale price = 20-30% off retail. Never fake 50%+ discounts.

${brand.imageStyle ? `IMAGE / VISUAL STYLE:\n${brand.imageStyle}\n` : ''}

BRAND COLORS — use these consistently in every Lovart prompt:
- Background color: ${brand.colorBg || '#ffffff'}
- Accent / Primary color: ${brand.colorAccent || '#000000'}
- Text color: ${brand.colorText || '#000000'}

LOVART IMAGE PROMPT RULES — apply to every image prompt:
- Always start every prompt with: "IMPORTANT: Use the uploaded product reference image. Recreate that exact product — do not change any feature of the product."
- For lifestyle/person shots: the person must be visibly using and enjoying the product in a natural, relaxed way
- Text overlays: bold, modern sans-serif in ${brand.colorText || 'brand text color'} — NEVER thin grey text
- Background should use ${brand.colorBg || 'brand background color'} where applicable
- Accent elements and highlights should use ${brand.colorAccent || 'brand accent color'}
- No irrelevant props or clutter. No white studio backgrounds unless that matches the brand color.
- Consistent brand colours throughout all shots.
- All shots: 1080x1080px square format.
- imagePrompts output is an ARRAY of objects: [{ "type": "shot type name", "prompt": "full Lovart prompt" }, ...]
- For "auto" type shots: pick the best shot type yourself and set "type" to what you chose (e.g. "lifestyle")
- Write a genuinely detailed, actionable Lovart prompt for each shot — not a placeholder.

OUTPUT FORMAT — respond ONLY with valid JSON. Only include the fields listed below. No extra fields, no markdown.
${JSON.stringify(outputFields, null, 2)}`;

  const regenInstruction = regenNote
    ? `\n\nIMPORTANT — This is a REGENERATION request. The user is unhappy with the previous output and has given this feedback:\n"${regenNote}"\nFix the issues described. Only output the requested section(s).`
    : '';

  const shotSummary = shotConfig && shotConfig.length > 0
    ? shotConfig.map(s => `Shot ${s.slot}: ${s.type} — ${SHOT_INSTRUCTIONS[s.type] || 'auto pick'}`).join('\n')
    : null;

  const userMessage = `Generate ${brand.name} content for this AliExpress product.

PRODUCT TITLE: ${productData.title || 'Unknown product'}
IMAGES AVAILABLE: ${(productData.images || []).length} product images
EXTRA NOTES / CONTEXT: ${productData.notes || 'None'}
SECTIONS TO GENERATE: ${toGenerate.join(', ')}${shotSummary ? `\n\nIMAGE PROMPT SHOT LIST (generate exactly these shots in this order):\n${shotSummary}` : ''}${regenInstruction}

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
