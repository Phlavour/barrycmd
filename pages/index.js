import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { PILLARS, HOOK_TYPES, STRUCTURES, BARRY_VOICE } from '../lib/barry-voice';

const PASSWORD = 'barry12!';

// ─── Theme ────────────────────────────────────────────────────
const T = {
  bg: "#f4f5f7", bg2: "#edeef2", surface: "#ffffff", surfaceAlt: "#f8f8fb",
  card: "#ffffff", border: "#d8dae5", borderHi: "#c0c2d0",
  text: "#1a1a2e", textSoft: "#5c5c7a", textDim: "#9898b0",
  cyan: "#0099cc", cyanDim: "rgba(0,153,204,.07)",
  green: "#16a34a", red: "#dc2626", amber: "#d97706",
  purple: "#7c3aed", blue: "#2563eb",
};

// ─── Content tab structure (matches djangodashboard) ──────────
const TABS = ["DRAFT", "POST", "USED", "DATABASE", "BAD", "SKETCH", "IDEAS"];
const TAB_META = {
  DRAFT:    { color: T.blue,    icon: "✎",  label: "Draft" },
  POST:     { color: T.green,   icon: "◉",  label: "Post" },
  USED:     { color: T.textDim, icon: "✓",  label: "Used" },
  DATABASE: { color: T.purple,  icon: "◈",  label: "Database" },
  BAD:      { color: T.red,     icon: "✕",  label: "Bad" },
  SKETCH:   { color: T.amber,   icon: "💡", label: "Sketch" },
  IDEAS:    { color: T.cyan,    icon: "📝", label: "Ideas" },
};
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const SORT_OPTIONS = [
  { value: "newest",     label: "Newest first" },
  { value: "score-desc", label: "Score ↓" },
  { value: "score-asc",  label: "Score ↑" },
  { value: "pillar",     label: "By pillar" },
  { value: "day",        label: "By day" },
];

const pillarColor = (id) => PILLARS.find(p => p.id === id)?.color || T.textSoft;
const pillarLabel = (id) => PILLARS.find(p => p.id === id)?.label || id;

// ─── Shared styles ────────────────────────────────────────────
const monoFont = "'IBM Plex Mono', monospace";
const sansFont = "'Satoshi', sans-serif";

const inputSx = {
  width: '100%', boxSizing: 'border-box',
  background: T.bg2, border: `1px solid ${T.border}`,
  borderRadius: 6, color: T.text,
  padding: '8px 12px', fontSize: 13,
  fontFamily: sansFont, outline: 'none',
};

// ─── UI Components ────────────────────────────────────────────
function Badge({ children, color }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, color,
      background: color + '18', padding: '2px 7px',
      borderRadius: 4, fontFamily: monoFont,
      letterSpacing: '.02em', textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function Btn({ children, onClick, color = T.cyan, outline, small, disabled, full, style: sx = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? '4px 10px' : '7px 16px',
      fontSize: small ? 10 : 12, fontWeight: 700,
      border: `1px solid ${color}`,
      borderRadius: 5, cursor: disabled ? 'not-allowed' : 'pointer',
      background: outline ? 'transparent' : color,
      color: outline ? color : '#000',
      transition: 'all .15s', opacity: disabled ? .4 : 1,
      fontFamily: monoFont, letterSpacing: '.02em',
      width: full ? '100%' : undefined,
      ...sx,
    }}>{children}</button>
  );
}

function Input({ value, onChange, placeholder, style = {}, ...rest }) {
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...inputSx, ...style }} {...rest} />;
}

function Textarea({ value, onChange, placeholder, rows = 4, style = {} }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...inputSx, resize: 'vertical', lineHeight: 1.6, ...style }} />;
}

function Sel({ value, onChange, options, style = {} }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputSx, cursor: 'pointer', ...style }}>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 12, ...style }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 10, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6, fontFamily: monoFont }}>{children}</div>;
}

function TabBtn({ label, active, onClick, color, count }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 12px', fontSize: 11, fontWeight: active ? 700 : 500,
      background: active ? color + '15' : 'transparent',
      border: `1px solid ${active ? color : T.border}`,
      borderRadius: 6, cursor: 'pointer', color: active ? color : T.textSoft,
      fontFamily: monoFont, letterSpacing: '.04em',
      display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s',
    }}>
      {TAB_META[label]?.icon} {label}
      {count > 0 && <span style={{ fontSize: 9, background: active ? color + '30' : T.border, color: active ? color : T.textDim, padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{count}</span>}
    </button>
  );
}

// ─── Login ────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const submit = () => {
    if (pw === PASSWORD) onLogin();
    else { setErr(true); setTimeout(() => setErr(false), 1500); }
  };
  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: T.text, fontFamily: sansFont }}>barry</div>
        <div style={{ fontSize: 11, color: T.textDim, marginTop: 4, fontFamily: monoFont }}>content dashboard</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 260 }}>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="password"
          style={{ ...inputSx, textAlign: 'center', borderColor: err ? T.red : T.border }} />
        <Btn onClick={submit} full>enter</Btn>
      </div>
    </div>
  );
}

// ─── Content Tab ──────────────────────────────────────────────
function ContentTab() {
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('DRAFT');
  const [sortBy, setSortBy] = useState('newest');

  // Generator
  const [weeklyContext, setWeeklyContext] = useState({ hotTopics: '', personal: '', avoid: '', notes: '', seasonal: '' });
  const [genLoading, setGenLoading] = useState(false);
  const [genCount, setGenCount] = useState(15);

  // New post (manual DRAFT)
  const [newPostText, setNewPostText] = useState('');
  const [newPostPillar, setNewPostPillar] = useState('ai');

  // Sketch
  const [sketchLoading, setSketchLoading] = useState(null);

  // Ideas
  const [newIdea, setNewIdea] = useState('');

  // Edit
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDay, setEditDay] = useState('');
  const [editPillar, setEditPillar] = useState('ai');

  // Rewrite
  const [rewriteId, setRewriteId] = useState(null);
  const [rewriteFeedback, setRewriteFeedback] = useState('');
  const [rewriteLoading, setRewriteLoading] = useState(false);

  // Score
  const [scoringId, setScoringId] = useState(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      setAllPosts(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  // Auto-score post
  const autoScore = async (text, id, pillar) => {
    setScoringId(id);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'score', text, pillar }),
      });
      const data = await res.json();
      const score = parseInt(data.score) || null;
      if (score) {
        setAllPosts(p => p.map(x => x.id === id ? { ...x, score } : x));
        await fetch('/api/posts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: (allPosts.find(x => x.id === id)?._supaId || id), score }),
        });
      }
    } catch (e) { console.error(e); }
    setScoringId(null);
  };

  // Move post between tabs
  const movePost = async (id, to) => {
    const post = allPosts.find(x => x.id === id);
    setAllPosts(p => p.map(x => x.id === id ? { ...x, tab: to } : x));
    if (post?._supaId) {
      await fetch('/api/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post._supaId, tab: to }),
      });
    }
  };

  // Delete post
  const delPost = async (id) => {
    const post = allPosts.find(x => x.id === id);
    setAllPosts(p => p.filter(x => x.id !== id));
    if (post?._supaId) {
      await fetch('/api/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post._supaId }),
      });
    }
  };

  // Add manual post to DRAFT
  const addManual = async () => {
    if (!newPostText.trim()) return;
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newPostText, pillar: newPostPillar, tab: 'DRAFT', status: 'draft', source: 'manual' }),
    });
    const data = await res.json();
    const newPost = { id: Date.now(), _supaId: data?.id, content: newPostText, pillar: newPostPillar, tab: 'DRAFT', source: 'manual' };
    setAllPosts(p => [newPost, ...p]);
    setNewPostText('');
    setTimeout(() => autoScore(newPostText, newPost.id, newPostPillar), 500);
  };

  // Save edit
  const saveEdit = async () => {
    const post = allPosts.find(x => x.id === editId);
    setAllPosts(p => p.map(x => x.id === editId ? { ...x, content: editText, notes: editNotes, day: editDay, pillar: editPillar } : x));
    if (post?._supaId) {
      await fetch('/api/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post._supaId, content: editText, notes: editNotes, day: editDay, pillar: editPillar }),
      });
    }
    setEditId(null);
  };

  // Rewrite post
  const rewritePost = async (post) => {
    if (!rewriteFeedback.trim()) return;
    setRewriteLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rewrite', text: post.content, feedback: rewriteFeedback, pillar: post.pillar }),
      });
      const data = await res.json();
      if (data.post) {
        const newPost = {
          id: Date.now(), content: data.post, pillar: post.pillar,
          tab: 'DRAFT', source: 'rewrite',
          notes: `rewrite of #${post.id}: "${rewriteFeedback.slice(0, 50)}"`,
        };
        const saveRes = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: data.post, pillar: post.pillar, tab: 'DRAFT', notes: newPost.notes }),
        });
        const saved = await saveRes.json();
        newPost._supaId = saved?.id;
        setAllPosts(p => [newPost, ...p]);
        setRewriteId(null);
        setRewriteFeedback('');
        setTimeout(() => autoScore(data.post, newPost.id, post.pillar), 500);
      }
    } catch (e) { console.error(e); }
    setRewriteLoading(false);
  };

  // Generate sketch variants
  const generateFromSketch = async (post) => {
    setSketchLoading(post.id);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sketch', text: post.content, pillar: post.pillar }),
      });
      const data = await res.json();
      const variants = data.variants || [];
      for (const v of variants) {
        const saveRes = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: v.post, pillar: post.pillar || 'ai', tab: 'DRAFT', notes: `from sketch: ${post.content.slice(0,50)}` }),
        });
        const saved = await saveRes.json();
        const newPost = { id: Date.now() + Math.random(), _supaId: saved?.id, content: v.post, pillar: post.pillar || 'ai', tab: 'DRAFT' };
        setAllPosts(p => [newPost, ...p]);
      }
      // Update sketch notes
      setAllPosts(p => p.map(x => x.id === post.id ? { ...x, notes: `✓ ${variants.length} variants → DRAFT` } : x));
      if (post._supaId) {
        await fetch('/api/posts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: post._supaId, notes: `✓ ${variants.length} variants → DRAFT` }) });
      }
    } catch (e) { console.error(e); }
    setSketchLoading(null);
  };

  // Add idea / sketch
  const addIdea = async (tab = 'IDEAS') => {
    if (!newIdea.trim()) return;
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newIdea, pillar: newPostPillar, tab, status: 'draft' }),
    });
    const saved = await res.json();
    setAllPosts(p => [{ id: Date.now(), _supaId: saved?.id, content: newIdea, pillar: newPostPillar, tab }, ...p]);
    setNewIdea('');
  };

  // Batch generate posts
  const generateBatch = async () => {
    setGenLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'batch', count: genCount, weeklyContext }),
      });
      const data = await res.json();
      const posts = data.posts || [];
      for (const p of posts) {
        const saveRes = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: p.post, pillar: p.pillar || 'ai', tab: 'DRAFT', hook_type: p.hook || '', structure: p.structure || '' }),
        });
        const saved = await saveRes.json();
        setAllPosts(prev => [{ id: Date.now() + Math.random(), _supaId: saved?.id, content: p.post, pillar: p.pillar || 'ai', tab: 'DRAFT', hook_type: p.hook, structure: p.structure }, ...prev]);
      }
    } catch (e) { alert('Generation failed'); }
    setGenLoading(false);
  };

  // Compute counts & sorted posts
  const counts = {};
  TABS.forEach(t => { counts[t] = allPosts.filter(p => p.tab === t).length; });
  let tabPosts = allPosts.filter(p => p.tab === activeTab);
  if (sortBy === 'score-desc') tabPosts = [...tabPosts].sort((a, b) => (b.score || 0) - (a.score || 0));
  else if (sortBy === 'score-asc') tabPosts = [...tabPosts].sort((a, b) => (a.score || 0) - (b.score || 0));
  else if (sortBy === 'pillar') tabPosts = [...tabPosts].sort((a, b) => (a.pillar || '').localeCompare(b.pillar || ''));
  else if (sortBy === 'day') tabPosts = [...tabPosts].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day));
  else tabPosts = [...tabPosts].sort((a, b) => (b._supaId || 0) - (a._supaId || 0));

  const isSketch = activeTab === 'SKETCH';
  const isIdeas = activeTab === 'IDEAS';
  const isPost = activeTab === 'POST';
  const isDraft = activeTab === 'DRAFT';
  const isBad = activeTab === 'BAD';

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {TABS.map(t => (
          <TabBtn key={t} label={t} active={activeTab === t} onClick={() => setActiveTab(t)} color={TAB_META[t].color} count={counts[t]} />
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Sel value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} style={{ width: 140, fontSize: 11 }} />
        </div>
      </div>

      {/* DRAFT / POST — generator panel */}
      {(isDraft || activeTab === 'DATABASE') && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <SectionLabel>Hot Topics</SectionLabel>
              <Textarea value={weeklyContext.hotTopics} onChange={v => setWeeklyContext(p => ({...p, hotTopics: v}))} placeholder="what's buzzing on CT..." rows={3} />
            </div>
            <div>
              <SectionLabel>Personal / Narrative</SectionLabel>
              <Textarea value={weeklyContext.personal} onChange={v => setWeeklyContext(p => ({...p, personal: v}))} placeholder="relocation update, trade story..." rows={3} />
            </div>
            <div>
              <SectionLabel>Notes for AI</SectionLabel>
              <Textarea value={weeklyContext.notes} onChange={v => setWeeklyContext(p => ({...p, notes: v}))} placeholder="focus, avoid, style..." rows={3} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Btn onClick={generateBatch} disabled={genLoading} color={T.cyan} style={{ minWidth: 160 }}>
              {genLoading ? '⏳ generating...' : `⚡ Generate ${genCount} Posts`}
            </Btn>
            <input type="number" value={genCount} onChange={e => setGenCount(parseInt(e.target.value)||15)} min={1} max={30} style={{ ...inputSx, width: 70 }} />
            <span style={{ fontSize: 11, color: T.textDim, fontFamily: monoFont }}>posts</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <Input value={newPostText} onChange={setNewPostText} placeholder="Add post manually..." style={{ width: 300 }} onKeyDown={e => e.key === 'Enter' && addManual()} />
              <Sel value={newPostPillar} onChange={setNewPostPillar} options={PILLARS.map(p => ({value: p.id, label: p.label}))} style={{ width: 130 }} />
              <Btn onClick={addManual} outline color={T.cyan} small>add</Btn>
            </div>
          </div>
        </Card>
      )}

      {/* SKETCH — add sketch */}
      {isSketch && (
        <Card style={{ marginBottom: 20 }}>
          <SectionLabel>New Sketch</SectionLabel>
          <div style={{ display: 'flex', gap: 10 }}>
            <Input value={newIdea} onChange={setNewIdea} placeholder="Raw idea, rough draft, angle..." onKeyDown={e => e.key === 'Enter' && addIdea('SKETCH')} />
            <Sel value={newPostPillar} onChange={setNewPostPillar} options={PILLARS.map(p => ({value: p.id, label: p.label}))} style={{ width: 140 }} />
            <Btn onClick={() => addIdea('SKETCH')} color={T.amber}>add sketch</Btn>
          </div>
        </Card>
      )}

      {/* IDEAS — add idea */}
      {isIdeas && (
        <Card style={{ marginBottom: 20 }}>
          <SectionLabel>New Idea</SectionLabel>
          <div style={{ display: 'flex', gap: 10 }}>
            <Input value={newIdea} onChange={setNewIdea} placeholder="Content idea, topic, angle..." onKeyDown={e => e.key === 'Enter' && addIdea('IDEAS')} />
            <Btn onClick={() => addIdea('IDEAS')} color={T.cyan}>add idea</Btn>
          </div>
        </Card>
      )}

      {/* Posts list */}
      {loading && <div style={{ color: T.textDim, fontSize: 13, padding: 20, fontFamily: monoFont }}>loading...</div>}

      {tabPosts.map(post => {
        const pc = pillarColor(post.pillar);
        const isEditing = editId === post.id;
        const isRewrit = rewriteId === post.id;
        const chars = (post.content || '').length;
        const charColor = chars > 600 ? T.amber : chars > 280 ? T.textSoft : T.green;

        return (
          <Card key={post.id} style={{ borderColor: isEditing ? T.cyan + '60' : isBad ? T.red + '20' : T.border }}>
            {isEditing ? (
              <div>
                <Textarea value={editText} onChange={setEditText} rows={6} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 10, color: charColor, textAlign: 'right', marginBottom: 10, fontFamily: monoFont }}>{editText.length} chars</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div><SectionLabel>Pillar</SectionLabel><Sel value={editPillar} onChange={setEditPillar} options={PILLARS.map(p=>({value:p.id,label:p.label}))} /></div>
                  <div><SectionLabel>Day</SectionLabel><Sel value={editDay} onChange={setEditDay} options={[{value:'',label:'— no day —'},...DAYS.map(d=>({value:d,label:d}))]} /></div>
                  <div style={{ gridColumn: 'span 2' }}><SectionLabel>Notes</SectionLabel><Input value={editNotes} onChange={setEditNotes} placeholder="internal notes..." /></div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn onClick={saveEdit} small color={T.cyan}>save</Btn>
                  <Btn onClick={() => setEditId(null)} outline small color={T.textSoft}>cancel</Btn>
                </div>
              </div>
            ) : (
              <div>
                {/* Header */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                  <Badge color={pc}>{pillarLabel(post.pillar)}</Badge>
                  {post.hook_type && <Badge color={T.purple}>{post.hook_type}</Badge>}
                  {post.day && <Badge color={T.blue}>{post.day}</Badge>}
                  {post.source === 'manual' && <Badge color={T.amber}>manual</Badge>}
                  {post.notes?.startsWith('rewrite') && <Badge color={T.textSoft}>rewrite</Badge>}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                    {post.score && (
                      <span style={{ fontSize: 13, fontWeight: 900, color: post.score >= 8 ? T.green : post.score >= 6 ? T.amber : T.red, fontFamily: monoFont }}>
                        {post.score}
                      </span>
                    )}
                    {scoringId === post.id && <span style={{ fontSize: 10, color: T.textDim, fontFamily: monoFont }}>scoring...</span>}
                  </div>
                </div>

                {/* Content */}
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 10, fontFamily: sansFont }}>
                  {post.content}
                </div>

                {post.notes && !post.notes.startsWith('rewrite') && (
                  <div style={{ fontSize: 11, color: T.textDim, fontStyle: 'italic', marginBottom: 8 }}>{post.notes}</div>
                )}

                <div style={{ fontSize: 10, color: charColor, marginBottom: 12, fontFamily: monoFont }}>{chars} chars</div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {/* Move actions */}
                  {isDraft && <Btn onClick={() => movePost(post.id, 'POST')} small color={T.green}>→ POST</Btn>}
                  {isDraft && <Btn onClick={() => movePost(post.id, 'DATABASE')} outline small color={T.purple}>→ DB</Btn>}
                  {isDraft && <Btn onClick={() => movePost(post.id, 'BAD')} outline small color={T.red}>→ BAD</Btn>}
                  {isPost && <Btn onClick={() => movePost(post.id, 'USED')} small color={T.textSoft}>→ USED</Btn>}
                  {isPost && <Btn onClick={() => movePost(post.id, 'DRAFT')} outline small color={T.blue}>← DRAFT</Btn>}
                  {activeTab === 'DATABASE' && <Btn onClick={() => movePost(post.id, 'POST')} small color={T.green}>→ POST</Btn>}
                  {activeTab === 'USED' && <Btn onClick={() => movePost(post.id, 'POST')} outline small color={T.green}>↺ repost</Btn>}
                  {isBad && <Btn onClick={() => movePost(post.id, 'DRAFT')} outline small color={T.blue}>→ DRAFT</Btn>}

                  {/* Edit */}
                  <Btn onClick={() => { setEditId(post.id); setEditText(post.content); setEditNotes(post.notes||''); setEditDay(post.day||''); setEditPillar(post.pillar||'ai'); }} outline small color={T.cyan}>edit</Btn>

                  {/* Day (POST tab) */}
                  {isPost && (
                    <Sel value={post.day || ''} onChange={async v => {
                      setAllPosts(p => p.map(x => x.id === post.id ? {...x, day: v} : x));
                      if (post._supaId) await fetch('/api/posts', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id: post._supaId, day: v}) });
                    }} options={[{value:'',label:'day...'}, ...DAYS.map(d=>({value:d,label:d}))]} style={{ width: 100, fontSize: 10, padding: '3px 6px' }} />
                  )}

                  {/* Copy */}
                  <Btn onClick={() => navigator.clipboard.writeText(post.content)} outline small color={T.textSoft}>copy</Btn>

                  {/* Score */}
                  <Btn onClick={() => autoScore(post.content, post.id, post.pillar)} outline small color={T.amber} disabled={scoringId === post.id}>score</Btn>

                  {/* Rewrite */}
                  <Btn onClick={() => setRewriteId(rewriteId === post.id ? null : post.id)} outline small color={T.purple}>rewrite</Btn>

                  {/* Sketch → generate */}
                  {isSketch && <Btn onClick={() => generateFromSketch(post)} small color={T.amber} disabled={sketchLoading === post.id}>{sketchLoading === post.id ? '⏳...' : '⚡ generate 3'}</Btn>}

                  {/* Delete */}
                  <Btn onClick={() => delPost(post.id)} outline small color={T.red} style={{ marginLeft: 'auto' }}>✕</Btn>
                </div>

                {/* Rewrite panel */}
                {isRewrit && (
                  <div style={{ marginTop: 12, padding: 12, background: T.bg2, borderRadius: 8, border: `1px solid ${T.purple}30` }}>
                    <SectionLabel>Rewrite feedback</SectionLabel>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Input value={rewriteFeedback} onChange={setRewriteFeedback} placeholder="make it shorter, add numbers, change hook..." onKeyDown={e => e.key === 'Enter' && rewritePost(post)} />
                      <Btn onClick={() => rewritePost(post)} small color={T.purple} disabled={rewriteLoading}>{rewriteLoading ? '...' : 'rewrite'}</Btn>
                      <Btn onClick={() => setRewriteId(null)} outline small color={T.textSoft}>✕</Btn>
                    </div>
                  </div>
                )}

                {/* BAD — notes input */}
                {isBad && (
                  <div style={{ marginTop: 10 }}>
                    <Input value={post.notes || ''} onChange={async v => {
                      setAllPosts(p => p.map(x => x.id === post.id ? {...x, notes: v} : x));
                      if (post._supaId) await fetch('/api/posts', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id: post._supaId, notes: v}) });
                    }} placeholder="why didn't this work?" style={{ fontSize: 11 }} />
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {!loading && tabPosts.length === 0 && (
        <div style={{ color: T.textDim, fontSize: 12, textAlign: 'center', padding: 40, fontFamily: monoFont }}>
          no posts in {activeTab}
        </div>
      )}
    </div>
  );
}

// ─── Research Tab ─────────────────────────────────────────────
function ResearchTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [tags, setTags] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/research');
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!topic.trim() || !content.trim()) return;
    await fetch('/api/research', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({topic, content, source, tags}) });
    setTopic(''); setContent(''); setSource(''); setTags('');
    await load();
  };

  const del = async (id) => {
    if (!confirm('Delete?')) return;
    await fetch('/api/research', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id}) });
    await load();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'flex-start' }}>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: sansFont, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.04em' }}>Add Research</div>
        <SectionLabel>Topic</SectionLabel>
        <Input value={topic} onChange={setTopic} placeholder="topic title" style={{ marginBottom: 10 }} />
        <SectionLabel>Content</SectionLabel>
        <Textarea value={content} onChange={setContent} rows={6} placeholder="notes, data, observations..." style={{ marginBottom: 10 }} />
        <SectionLabel>Source</SectionLabel>
        <Input value={source} onChange={setSource} placeholder="url or source" style={{ marginBottom: 10 }} />
        <SectionLabel>Tags</SectionLabel>
        <Input value={tags} onChange={setTags} placeholder="ai, market, onchain..." style={{ marginBottom: 16 }} />
        <Btn onClick={add} full>save research</Btn>
      </Card>
      <div>
        {loading && <div style={{ color: T.textDim, fontSize: 12, fontFamily: monoFont }}>loading...</div>}
        {items.map(item => (
          <Card key={item.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: sansFont }}>{item.topic}</div>
              <span style={{ fontSize: 10, color: T.textDim, fontFamily: monoFont }}>{new Date(item.created_at).toLocaleDateString('en-GB', {day:'numeric',month:'short'})}</span>
            </div>
            {item.tags && (
              <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
                {item.tags.split(',').map(t=>t.trim()).filter(Boolean).map(t => <Badge key={t} color={T.cyan}>{t}</Badge>)}
              </div>
            )}
            <div style={{ fontSize: 13, color: T.textSoft, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 8 }}>{item.content}</div>
            {item.source && <div style={{ fontSize: 11, color: T.textDim }}>source: {item.source}</div>}
            <div style={{ marginTop: 10 }}>
              <Btn onClick={() => del(item.id)} outline small color={T.red}>delete</Btn>
            </div>
          </Card>
        ))}
        {!loading && items.length === 0 && <div style={{ color: T.textDim, fontSize: 12, textAlign: 'center', padding: 40, fontFamily: monoFont }}>no research yet</div>}
      </div>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────
function AnalyticsTab({ posts }) {
  const byPillar = PILLARS.map(p => {
    const pp = posts.filter(x => x.pillar === p.id);
    const scored = pp.filter(x => x.score);
    return { ...p, total: pp.length, posted: pp.filter(x=>x.tab==='USED').length, avg: scored.length ? (scored.reduce((s,x)=>s+x.score,0)/scored.length).toFixed(1) : null };
  }).filter(p => p.total > 0);

  const maxTotal = Math.max(...byPillar.map(p => p.total), 1);
  const topScored = [...posts].filter(p => p.score).sort((a,b) => b.score - a.score).slice(0,5);

  const StatCard = ({ label, val, color }) => (
    <Card style={{ textAlign: 'center', marginBottom: 0 }}>
      <div style={{ fontSize: 10, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8, fontFamily: monoFont }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color, fontFamily: sansFont }}>{val}</div>
    </Card>
  );

  const tabCounts = {};
  TABS.forEach(t => { tabCounts[t] = posts.filter(p => p.tab === t).length; });

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="total" val={posts.length} color={T.text} />
        <StatCard label="in pipeline" val={tabCounts.POST || 0} color={T.green} />
        <StatCard label="posted" val={tabCounts.USED || 0} color={T.textSoft} />
        <StatCard label="drafts" val={tabCounts.DRAFT || 0} color={T.blue} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 16, fontFamily: monoFont, textTransform: 'uppercase', letterSpacing: '.04em' }}>By Pillar</div>
          {byPillar.map(p => (
            <div key={p.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.color, fontFamily: sansFont }}>{p.label}</span>
                  {p.avg && <span style={{ fontSize: 10, color: T.amber, fontFamily: monoFont }}>avg {p.avg}/10</span>}
                </div>
                <span style={{ fontSize: 10, color: T.textDim, fontFamily: monoFont }}>{p.total} total · {p.posted} posted</span>
              </div>
              <div style={{ height: 4, background: T.bg2, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(p.total/maxTotal)*100}%`, background: p.color, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </Card>

        <div>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 16, fontFamily: monoFont, textTransform: 'uppercase', letterSpacing: '.04em' }}>By Tab</div>
            {TABS.map(t => (
              <div key={t} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: TAB_META[t].color }}>{TAB_META[t].icon}</span>
                  <span style={{ fontSize: 12, color: T.textSoft, fontFamily: monoFont }}>{t}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: TAB_META[t].color, fontFamily: monoFont }}>{tabCounts[t] || 0}</span>
              </div>
            ))}
          </Card>

          {topScored.length > 0 && (
            <Card>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 16, fontFamily: monoFont, textTransform: 'uppercase', letterSpacing: '.04em' }}>Top Scored</div>
              {topScored.map(p => (
                <div key={p.id} style={{ display: 'flex', gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: p.score >= 8 ? T.green : p.score >= 6 ? T.amber : T.red, fontFamily: monoFont, minWidth: 28 }}>{p.score}</div>
                  <div>
                    <Badge color={pillarColor(p.pillar)}>{pillarLabel(p.pillar)}</Badge>
                    <div style={{ fontSize: 12, color: T.textSoft, lineHeight: 1.5, marginTop: 5 }}>{(p.content||'').slice(0,100)}...</div>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(false);
  const [tab, setTab] = useState('content');
  const [allPosts, setAllPosts] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('barry_auth')) setAuth(true);
  }, []);

  useEffect(() => {
    if (auth) fetch('/api/posts').then(r => r.json()).then(d => setAllPosts(Array.isArray(d) ? d : [])).catch(()=>{});
  }, [auth, tab]);

  const login = () => { sessionStorage.setItem('barry_auth', '1'); setAuth(true); };

  if (!auth) return (
    <>
      <Head>
        <title>barry — dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Satoshi:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </Head>
      <LoginScreen onLogin={login} />
    </>
  );

  const pipeline = allPosts.filter(p => p.tab === 'POST').length;
  const drafts = allPosts.filter(p => p.tab === 'DRAFT').length;

  return (
    <>
      <Head>
        <title>barry — dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Satoshi:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: sansFont }}>
        <div style={{ borderBottom: `1px solid ${T.border}`, padding: '0 32px', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, background: T.bg, zIndex: 100 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: T.text, marginRight: 32, padding: '15px 0', fontFamily: sansFont }}>barry</div>
          {['content', 'research', 'analytics'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '15px 16px', fontSize: 11, fontWeight: tab === t ? 700 : 400,
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: monoFont,
              color: tab === t ? T.text : T.textDim,
              borderBottom: `2px solid ${tab === t ? T.cyan : 'transparent'}`,
              textTransform: 'uppercase', letterSpacing: '.04em', transition: 'all .15s',
            }}>{t}</button>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 10, color: T.textDim, fontFamily: monoFont }}>
            {pipeline} in pipeline · {drafts} drafts
          </div>
        </div>
        <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
          {tab === 'content' && <ContentTab />}
          {tab === 'research' && <ResearchTab />}
          {tab === 'analytics' && <AnalyticsTab posts={allPosts} />}
        </div>
      </div>
    </>
  );
}
