import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { key } = req.query;
    if (key) {
      const { data } = await supabase.from('settings').select('value').eq('key', key).single();
      return res.json({ value: data?.value || null });
    }
    const { data } = await supabase.from('settings').select('*');
    return res.json(data || []);
  }

  if (req.method === 'POST') {
    const { key, value } = req.body;
    const { data, error } = await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' }).select();
    if (error) return res.status(500).json({ error });
    return res.json(data?.[0] || {});
  }

  res.status(405).end();
}
