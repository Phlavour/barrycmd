import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('research')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error });
    return res.json(data);
  }

  if (req.method === 'POST') {
    const { topic, content, source, tags } = req.body;
    const { data, error } = await supabase
      .from('research')
      .insert([{ topic, content, source, tags }])
      .select();
    if (error) return res.status(500).json({ error });
    return res.json(data[0]);
  }

  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body;
    const { data, error } = await supabase.from('research').update(updates).eq('id', id).select();
    if (error) return res.status(500).json({ error });
    return res.json(data[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    const { error } = await supabase.from('research').delete().eq('id', id);
    if (error) return res.status(500).json({ error });
    return res.json({ ok: true });
  }

  res.status(405).end();
}
