import { BARRY_VOICE } from '../../lib/barry-voice';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { topic, pillar, hook_type, structure, notes, length } = req.body;

  const lengthGuide =
    length === 'short'   ? 'Under 280 characters. One punchy insight.' :
    length === 'medium'  ? '280-600 characters. Standard post with context.' :
    length === 'teacher' ? '600-1500 characters. Teacher post with ">" bullet list and CTA at end.' :
    '280-600 characters.';

  const prompt = `${BARRY_VOICE}

Generate a Barry post with these specs:
- Pillar: ${pillar}
- Hook type: ${hook_type} 
- Structure: ${structure}
- Length: ${lengthGuide}
- Topic/notes: ${topic || notes || 'choose relevant topic for this pillar'}

Write ONLY the post. No explanations, no "here's the post:", no quotes around it. Just the raw post text.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    res.json({ post: text });
  } catch (err) {
    res.status(500).json({ error: 'Generation failed' });
  }
}
