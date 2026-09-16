// Server-side only — API key never exposed to browser
const claude = async (prompt, max_tokens = 4000) => {
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
  if (data.error) throw new Error(data.error.message);
  return data.content?.[0]?.text || '';
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { action, prompt, text, pillar, feedback, posts, context, count, weeklyContext, brandVoice, weeklyNotes, lastAnalysis, badFeedback, category, subtopics, structures, advisor } = req.body;

  try {
    // ─── Score single post ────────────────────────────────────
    if (action === 'score') {
      const result = await claude(`Score this Barry (@Barry_x0) post 1-10.

Post: "${text}"
Category: ${pillar || 'unknown'}

CRITERIA:
- Zero em-dashes, separator lines, "haha", "I guess"? (violation = max 6)
- Every claim has a concrete number?
- Min 1 failure or limitation embedded?
- First line creates tension, not explanation?
- Peer-level tone, never guru?

9-10: exceptional · 7-8: solid · 5-6: generic · 1-4: violates rules

JSON only: {"score": 7.5, "notes": "one sentence why + one fix"}`, 200);
      const parsed = JSON.parse(result.replace(/```json|```/g, '').trim());
      return res.json({ score: parsed.score, notes: parsed.notes });
    }

    // ─── Rewrite post ─────────────────────────────────────────
    if (action === 'rewrite') {
      const result = await claude(`You are Barry (@Barry_x0). Rewrite this post based on feedback.

ORIGINAL: "${text}"
FEEDBACK: ${feedback}

BARRY'S RULES:
- Zero em-dashes, separator lines, "haha", "I guess", "basically"
- Every claim needs a concrete number
- Min 1 failure or limitation
- First person, direct, fragments
- Peer-level always

JSON only: {"post": "rewritten text", "structure": "Structure Name"}`, 800);
      const parsed = JSON.parse(result.replace(/```json|```/g, '').trim());
      return res.json(parsed);
    }

    // ─── Fix post ─────────────────────────────────────────────
    if (action === 'fix') {
      const result = await claude(`You are Barry. Fix this post.

ORIGINAL: "${text}"

Remove: em-dashes, separator lines, "haha", "I guess", "basically"
Add concrete numbers if vague. Embed 1 failure if missing.
Keep same length. Polished version, not a rewrite.

JSON only: {"post": "fixed text", "changes": "brief note"}`, 600);
      const parsed = JSON.parse(result.replace(/```json|```/g, '').trim());
      return res.json(parsed);
    }

    // ─── Ask Claude (explain post) ────────────────────────────
    if (action === 'explain') {
      const result = await claude(`You are Barry's content strategist. Analyze this post.

Post: "${text}"
Category: ${pillar || 'unknown'}

Check Barry's rules: zero em-dashes, concrete numbers, min 1 failure, tension in first line, peer-level.
Be specific. 2-4 sentences max.

JSON only: {"notes": "your analysis"}`, 400);
      const parsed = JSON.parse(result.replace(/```json|```/g, '').trim());
      return res.json(parsed);
    }

    // ─── Define structure ─────────────────────────────────────
    if (action === 'define_structure') {
      const STRUCTURES = ['APAG (Attention-Problem-Advantage-Guide)', 'Single Insight', 'Story → Lesson', 'Case Study (with technical details)', 'Contrarian Take', 'Before/After', 'Question → Answer', 'List (3-5 points)', 'Framework / System', 'Shared Enemy', 'Data + Interpretation', 'Building in Public update'];
      const result = await claude(`Analyze this Barry post and determine its structure.

Post: "${text}"

KNOWN STRUCTURES: ${STRUCTURES.join(', ')}

If it matches, respond with EXACTLY that name.
If not, respond with a short new name on line 1, then "NEW: description" on line 2.

Respond ONLY with the structure name.`, 100);
      return res.json({ structure: result.trim().split('\n')[0] });
    }

    // ─── Generate from Sketch ─────────────────────────────────
    if (action === 'sketch') {
      const bv = (brandVoice || '').slice(0, 3000);
      const result = await claude(`You are Barry (@Barry_x0). Turn this sketch into 3 polished posts.

${bv ? `BRAND VOICE:\n${bv}\n` : ''}

SKETCH: "${text}"
Category: ${pillar || 'ai'}

Rules: zero em-dashes, concrete numbers, min 1 failure, peer-level, fragments.
Variants: one SHORT (<280 chars), one MEDIUM (280-600), one LONG (600-1500, APAG).

JSON only: [{"post":"text","hook_type":"N","structure":"Single Insight","score":8}]`, 2000);
      const variants = JSON.parse(result.replace(/```json|```/g, '').trim());
      return res.json({ variants });
    }

    // ─── Score batch ──────────────────────────────────────────
    if (action === 'score_batch') {
      const postsText = (posts || []).map((p, i) => `${i+1}. [${p.category}] "${(p.post||'').slice(0, 200)}"`).join('\n');
      const result = await claude(`Score these Barry posts 1-10.

CRITERIA: zero em-dashes/separator lines/"haha"/"I guess" (violation=max 6), concrete numbers, min 1 failure, tension in first line, peer-level.

9-10 exceptional · 7-8 solid · 5-6 generic · 1-4 violates rules

POSTS:
${postsText}

JSON only, one per post: [{"score":7.5,"feedback":"one sentence why + one fix"}]`, 2000);
      const scores = JSON.parse(result.replace(/```json|```/g, '').trim());
      return res.json({ scores });
    }

    // ─── AI classify posts (for analytics) ────────────────────
    if (action === 'classify') {
      const BARRY_CATEGORIES = ['ai','on-chain','trading-psychology','eu-asia','building','tachyo','articles','monthly-summary','market-analysis','current','mindset','pnl-shares','lifestyle'];
      const result = await claude(`Classify these Barry (@Barry_x0) posts.

PILLARS: ${BARRY_CATEGORIES.join(', ')}

POSTS:
${(posts||[]).map((p,i) => `${i+1}. [${p.id}] "${(p.text||'').slice(0,120)}"`).join('\n')}

JSON only: [{"id":"post_id","pillar":"pillar_name","structure":"structure_name","aiScore":7}]`, 2000);
      const classified = JSON.parse(result.replace(/```json|```/g, '').trim());
      return res.json({ classified });
    }

    // ─── Generate AI analysis report ──────────────────────────
    if (action === 'report') {
      const result = await claude(prompt, 1500);
      return res.json({ report: result });
    }

    // ─── Generate batch of posts ──────────────────────────────
    if (action === 'batch') {
      const bv = (brandVoice || '').slice(0, 6000);
      const ctx = weeklyNotes || '';
      const bad = badFeedback || '';
      const last = (lastAnalysis || '').slice(0, 1000);

      const batchPrompt = `You are Barry (@Barry_x0) — crypto trader, co-founder WOK Labs, EU-Asia bridge builder.

YOUR BRAND VOICE:
${bv}

${ctx ? `═══ WEEKLY CONTEXT ═══\n${ctx}\n` : ''}
${bad ? `═══ POSTS THAT FAILED (avoid) ═══\n${bad}\n` : ''}
${last ? `═══ LAST ANALYSIS (apply insights) ═══\n${last}\n` : ''}

═══ CATEGORY: ${category} ═══

SUBTOPICS (rotate — each post different):
${(subtopics||[]).map((s,i) => `${i+1}. ${s}`).join('\n')}

STRUCTURES (vary):
${(structures||[]).map((s,i) => `${i+1}. ${s}`).join('\n')}

═══ ADVISOR ═══
${advisor || ''}

═══ TASK ═══
Generate exactly ${count} posts for "${category}".

HOOK TYPES: H=Helpful | E1=Emotion | A=Ask | D=Do/Don't | L=List | I=Inspire | N=Numbers | E2=Empathy
First line = hook, max 15 words, tension not explanation, vary types.

BARRY'S NON-NEGOTIABLE RULES:
- Zero em-dashes "—", separator lines "---", "haha", "I guess", "basically"
- Every claim = concrete number (42K, 80%, 30 tools, 32GB)
- Min 1 failure or limitation per post
- First person, direct, fragments over full sentences
- Peer-level always — never guru positioning
- LENGTH: ~30% short (<280, no "read more"), ~40% medium (280-600), ~30% long (600-1500, APAG)

JSON only: [{"post":"text","structure":"Name","subtopic":"used","hook_type":"N","length":"short/medium/long"}]`;

      const result = await claude(batchPrompt, 4000);
      const generatedPosts = JSON.parse(result.replace(/```json|```/g, '').trim());
      return res.json({ posts: generatedPosts });
    }

    // ─── Generic prompt ───────────────────────────────────────
    if (prompt) {
      const result = await claude(prompt, 1000);
      return res.json({ text: result });
    }

    return res.status(400).json({ error: 'Unknown action' });

  } catch (err) {
    console.error('Generate error:', err);
    return res.status(500).json({ error: err.message || 'Generation failed' });
  }
}
