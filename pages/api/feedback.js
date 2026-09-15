import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { post_id } = req.query;
    const query = supabase.from('barry_feedback').select('*').order('created_at', { ascending: false });
    if (post_id) query.eq('post_id', post_id);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error });
    return res.json(data);
  }

  if (req.method === 'POST') {
    const { post_id, note, rating } = req.body;
    const { data, error } = await supabase
      .from('barry_feedback')
      .insert([{ post_id, note, rating }])
      .select();
    if (error) return res.status(500).json({ error });
    return res.json(data[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    const { error } = await supabase.from('barry_feedback').delete().eq('id', id);
    if (error) return res.status(500).json({ error });
    return res.json({ ok: true });
  }

  res.status(405).end();
}
