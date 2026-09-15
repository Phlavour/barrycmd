import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('account', 'BARRY')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error });
    // Map for frontend
    const mapped = data.map(p => ({
      id: p.id, _supaId: p.id,
      content: p.content, pillar: p.pillar,
      tab: p.tab || 'DRAFT', status: p.status,
      hook_type: p.hook_type, structure: p.structure,
      score: p.score, notes: p.notes,
      day: p.day, source: p.source,
      created_at: p.created_at,
    }));
    return res.json(mapped);
  }

  if (req.method === 'POST') {
    const { content, pillar, tab, status, hook_type, structure, score, notes, day, source } = req.body;
    const { data, error } = await supabase
      .from('posts')
      .insert([{ content, pillar, tab: tab || 'DRAFT', status: status || 'draft', hook_type, structure, score, notes, day, source, account: 'BARRY' }])
      .select();
    if (error) return res.status(500).json({ error });
    return res.json(data[0]);
  }

  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body;
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) return res.status(500).json({ error });
    return res.json(data[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) return res.status(500).json({ error });
    return res.json({ ok: true });
  }

  res.status(405).end();
}
