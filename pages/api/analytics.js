import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  const { type } = req.query;

  if (req.method === 'GET') {
    if (type === 'daily') {
      const { data } = await supabase.from('analytics_daily').select('*').eq('account', 'BARRY').order('date', { ascending: false }).limit(365);
      return res.json(data || []);
    }
    if (type === 'posts') {
      const { data } = await supabase.from('analytics_posts').select('*').eq('account', 'BARRY').order('date', { ascending: false }).limit(500);
      return res.json(data || []);
    }
    if (type === 'weekly_context') {
      const { data } = await supabase.from('weekly_context').select('*').order('week_start', { ascending: false }).limit(10);
      return res.json(data || []);
    }
  }

  if (req.method === 'POST') {
    const { rows, table } = req.body;
    if (!rows?.length) return res.json({ ok: true });
    const results = [];
    for (const row of rows) {
      if (table === 'analytics_daily') {
        const existing = await supabase.from('analytics_daily').select('id').eq('account', 'BARRY').eq('date', row.date).single();
        if (existing.data) {
          await supabase.from('analytics_daily').update(row).eq('id', existing.data.id);
        } else {
          const { data } = await supabase.from('analytics_daily').insert(row).select();
          results.push(data?.[0]);
        }
      }
      if (table === 'analytics_posts') {
        const existing = await supabase.from('analytics_posts').select('id').eq('account', 'BARRY').eq('post_id', row.post_id).single();
        if (existing.data) {
          await supabase.from('analytics_posts').update(row).eq('id', existing.data.id);
        } else {
          const { data } = await supabase.from('analytics_posts').insert(row).select();
          results.push(data?.[0]);
        }
      }
      if (table === 'weekly_context') {
        const { data } = await supabase.from('weekly_context').insert(row).select();
        results.push(data?.[0]);
      }
    }
    return res.json({ ok: true, count: results.length });
  }

  res.status(405).end();
}
