import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error });
    return res.json(data);
  }

  if (req.method === 'POST') {
    const { content, pillar, hook_type, structure, score, notes, status } = req.body;
    const { data, error } = await supabase
      .from('posts')
      .insert([{ content, pillar, hook_type, structure, score, notes, status: status || 'draft', account: 'BARRY' }])
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
