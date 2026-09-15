import { BARRY_VOICE, PILLARS, HOOK_TYPES, STRUCTURES } from '../../lib/barry-voice';

const claude = async (prompt, max_tokens = 2000) => {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || '';
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { action, text, pillar, feedback, count, weeklyContext, topic, notes, hook_type, structure, length } = req.body;

  try {
    // ─── Score post ───────────────────────────────────────────
    if (action === 'score') {
      const prompt = `${BARRY_VOICE}

Score this Barry post 1-10. Consider: authentic voice, no hedging, failure embedded, concrete numbers, hook quality.

POST:
${text}

Respond ONLY with a single number 1-10. Nothing else.`;
      const result = await claude(prompt, 10);
      const score = parseInt(result.trim());
      return res.json({ score: isNaN(score) ? null : Math.min(10, Math.max(1, score)) });
    }

    // ─── Rewrite post ─────────────────────────────────────────
    if (action === 'rewrite') {
      const prompt = `${BARRY_VOICE}

Rewrite this Barry post based on the feedback. Keep the same pillar and topic but apply the feedback.

ORIGINAL POST:
${text}

FEEDBACK:
${feedback}

Write ONLY the rewritten post. No preamble.`;
      const result = await claude(prompt);
      return res.json({ post: result.trim() });
    }

    // ─── Generate from sketch ─────────────────────────────────
    if (action === 'sketch') {
      const pillarLabel = PILLARS.find(p => p.id === pillar)?.label || pillar;
      const prompt = `${BARRY_VOICE}

Turn this raw sketch/idea into 3 polished Barry posts. Each should be distinct (different angle, hook, length).

SKETCH:
${text}

PILLAR: ${pillarLabel}

Respond ONLY with valid JSON (no markdown):
[
  {"post": "...", "hook": "N", "structure": "Single Insight"},
  {"post": "...", "hook": "H", "structure": "Story → Lesson"},
  {"post": "...", "hook": "A", "structure": "Contrarian Take"}
]`;
      const result = await claude(prompt, 2000);
      try {
        const clean = result.replace(/```json|```/g, '').trim();
        const variants = JSON.parse(clean);
        return res.json({ variants });
      } catch { return res.json({ variants: [{ post: result.trim() }] }); }
    }

    // ─── Batch generate ───────────────────────────────────────
    if (action === 'batch') {
      const n = Math.min(count || 15, 30);
      const ctx = weeklyContext || {};

      // Pillar distribution matching Barry's content strategy
      const distribution = [
        { pillar: 'ai',              count: Math.ceil(n * 0.25) },
        { pillar: 'market_analysis', count: Math.ceil(n * 0.15) },
        { pillar: 'mindset',         count: Math.ceil(n * 0.15) },
        { pillar: 'pnl_shares',      count: Math.ceil(n * 0.12) },
        { pillar: 'lifestyle',       count: Math.ceil(n * 0.12) },
        { pillar: 'current',         count: Math.ceil(n * 0.10) },
        { pillar: 'articles',        count: Math.ceil(n * 0.06) },
        { pillar: 'monthly_summary', count: Math.ceil(n * 0.05) },
      ];

      const prompt = `${BARRY_VOICE}

Generate ${n} Barry posts for this week. Distribute across pillars:
${distribution.map(d => `- ${d.pillar}: ${d.count} posts`).join('\n')}

WEEKLY CONTEXT:
${ctx.hotTopics ? `Hot Topics: ${ctx.hotTopics}` : ''}
${ctx.personal ? `Personal/Narrative: ${ctx.personal}` : ''}
${ctx.notes ? `Notes: ${ctx.notes}` : ''}

Rules:
- Mix of short (<280 chars), medium (280-600), and 2-3 teacher posts (600-1500 with > bullets)
- Every post must embed failure or limitation — no pure win framing
- Use different hooks (N, H, E1, A, D, L, I, E2) across posts
- Vary structures
- Some posts should call back to the China→Thailand relocation narrative
- Some posts about The Wokers community

Respond ONLY with valid JSON (no markdown):
[
  {"post": "...", "pillar": "ai", "hook": "N", "structure": "Single Insight"},
  ...
]`;

      const result = await claude(prompt, 6000);
      try {
        const clean = result.replace(/```json|```/g, '').trim();
        const posts = JSON.parse(clean);
        return res.json({ posts: Array.isArray(posts) ? posts : [] });
      } catch {
        // Fallback: try to extract any valid array
        const match = result.match(/\[[\s\S]*\]/);
        if (match) {
          try { return res.json({ posts: JSON.parse(match[0]) }); } catch {}
        }
        return res.json({ posts: [] });
      }
    }

    // ─── Single post generate ─────────────────────────────────
    const pillarLabel = PILLARS.find(p => p.id === pillar)?.label || pillar;
    const lenGuide = length === 'short' ? 'Under 280 characters. One punchy insight. No bullets.' :
      length === 'teacher' ? '600-1500 characters. Use > bullets. Actionable steps. End with CTA.' :
      '280-600 characters. Standard post with context.';

    const prompt = `${BARRY_VOICE}

Generate a Barry post:
- Pillar: ${pillarLabel}
- Hook type: ${hook_type}
- Structure: ${structure}
- Length: ${lenGuide}
- Topic: ${topic || 'choose relevant topic for this pillar'}
- Notes: ${notes || 'none'}

Write ONLY the post.`;

    const result = await claude(prompt);
    return res.json({ post: result.trim() });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Generation failed' });
  }
}
