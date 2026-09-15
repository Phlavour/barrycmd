import { useState, useEffect, useCallback } from 'react';
import { PILLARS, HOOK_TYPES, STRUCTURES } from '../lib/barry-voice';

const PASSWORD = 'barry12!';

// ─── Colors ──────────────────────────────────────────────────
const C = {
  bg:       '#0a0a0a',
  bg2:      '#111111',
  bg3:      '#1a1a1a',
  border:   '#222222',
  text:     '#e8e8e8',
  soft:     '#999999',
  dim:      '#555555',
  cyan:     '#00d4ff',
  green:    '#22c55e',
  red:      '#ef4444',
  amber:    '#f59e0b',
  purple:   '#8b5cf6',
};

const STATUS_COLORS = {
  draft:     C.dim,
  ready:     C.amber,
  posted:    C.green,
  archived:  C.dim,
};

// ─── Utility ─────────────────────────────────────────────────
const pillarColor = (id) => PILLARS.find(p => p.id === id)?.color || C.soft;
const pillarLabel = (id) => PILLARS.find(p => p.id === id)?.label || id;

function charCount(text) {
  return text?.length || 0;
}

// ─── Components ──────────────────────────────────────────────
function Tag({ label, color }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '.04em',
      color, background: color + '18',
      padding: '2px 8px', borderRadius: 4,
      textTransform: 'uppercase',
    }}>{label}</span>
  );
}

function Btn({ children, onClick, color = C.cyan, outline, small, disabled, style = {} }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: small ? '5px 12px' : '8px 18px',
        fontSize: small ? 11 : 13,
        fontWeight: 700,
        border: `1px solid ${color}`,
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: outline
          ? (hover ? color + '18' : 'transparent')
          : (hover ? color + 'cc' : color),
        color: outline ? color : '#000',
        transition: 'all .15s',
        opacity: disabled ? .5 : 1,
        fontFamily: 'inherit',
        ...style,
      }}
    >{children}</button>
  );
}

function Input({ value, onChange, placeholder, multiline, rows = 4, style = {} }) {
  const base = {
    width: '100%', boxSizing: 'border-box',
    background: C.bg2, border: `1px solid ${C.border}`,
    borderRadius: 6, color: C.text,
    padding: '8px 12px', fontSize: 13,
    fontFamily: 'inherit', outline: 'none',
    resize: 'vertical',
    ...style,
  };
  return multiline
    ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={base} />
    : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...base, resize: undefined }} />;
}

function Select({ value, onChange, options, style = {} }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: C.bg2, border: `1px solid ${C.border}`,
        borderRadius: 6, color: C.text,
        padding: '8px 12px', fontSize: 13,
        fontFamily: 'inherit', outline: 'none',
        cursor: 'pointer', ...style,
      }}
    >
      {options.map(o => (
        <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
      ))}
    </select>
  );
}

// ─── Login Screen ────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);

  const submit = () => {
    if (pw === PASSWORD) { onLogin(); }
    else { setErr(true); setTimeout(() => setErr(false), 1500); }
  };

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 24,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: '-.02em' }}>barry</div>
        <div style={{ fontSize: 13, color: C.dim, marginTop: 4 }}>content dashboard</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="password"
          style={{
            background: C.bg2, border: `1px solid ${err ? C.red : C.border}`,
            borderRadius: 8, color: C.text, padding: '10px 14px',
            fontSize: 14, fontFamily: 'inherit', outline: 'none',
            textAlign: 'center', transition: 'border-color .2s',
          }}
        />
        <Btn onClick={submit}>enter</Btn>
      </div>
    </div>
  );
}

// ─── Content Tab ─────────────────────────────────────────────
function ContentTab() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters
  const [filterPillar, setFilterPillar] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Generator
  const [genTopic, setGenTopic] = useState('');
  const [genPillar, setGenPillar] = useState('ai');
  const [genHook, setGenHook] = useState('N');
  const [genStructure, setGenStructure] = useState('Single Insight');
  const [genLength, setGenLength] = useState('medium');
  const [genNotes, setGenNotes] = useState('');
  const [generated, setGenerated] = useState('');

  // Edit
  const [editId, setEditId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editStatus, setEditStatus] = useState('draft');
  const [editScore, setEditScore] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Feedback
  const [feedbackPostId, setFeedbackPostId] = useState(null);
  const [feedbacks, setFeedbacks] = useState({});
  const [newFeedback, setNewFeedback] = useState('');
  const [newRating, setNewRating] = useState(0);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/posts');
    const data = await res.json();
    setPosts(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const generate = async () => {
    setGenerating(true);
    setGenerated('');
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: genTopic, pillar: genPillar, hook_type: genHook, structure: genStructure, length: genLength, notes: genNotes }),
    });
    const data = await res.json();
    setGenerated(data.post || '');
    setGenerating(false);
  };

  const savePost = async () => {
    if (!generated.trim()) return;
    setSaving(true);
    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: generated, pillar: genPillar, hook_type: genHook, structure: genStructure, status: 'draft' }),
    });
    setGenerated('');
    await loadPosts();
    setSaving(false);
  };

  const updatePost = async (id, updates) => {
    await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    await loadPosts();
  };

  const deletePost = async (id) => {
    if (!confirm('Delete this post?')) return;
    await fetch('/api/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await loadPosts();
  };

  const startEdit = (post) => {
    setEditId(post.id);
    setEditContent(post.content);
    setEditStatus(post.status);
    setEditScore(post.score || '');
    setEditNotes(post.notes || '');
  };

  const saveEdit = async () => {
    await updatePost(editId, { content: editContent, status: editStatus, score: editScore ? parseInt(editScore) : null, notes: editNotes });
    setEditId(null);
  };

  const loadFeedback = async (postId) => {
    if (feedbackPostId === postId) { setFeedbackPostId(null); return; }
    const res = await fetch(`/api/feedback?post_id=${postId}`);
    const data = await res.json();
    setFeedbacks(p => ({ ...p, [postId]: Array.isArray(data) ? data : [] }));
    setFeedbackPostId(postId);
    setNewFeedback('');
    setNewRating(0);
  };

  const addFeedback = async (postId) => {
    if (!newFeedback.trim()) return;
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, note: newFeedback, rating: newRating || null }),
    });
    const res = await fetch(`/api/feedback?post_id=${postId}`);
    const data = await res.json();
    setFeedbacks(p => ({ ...p, [postId]: Array.isArray(data) ? data : [] }));
    setNewFeedback('');
    setNewRating(0);
  };

  const deleteFeedback = async (fbId, postId) => {
    await fetch('/api/feedback', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: fbId }),
    });
    setFeedbacks(p => ({ ...p, [postId]: (p[postId] || []).filter(f => f.id !== fbId) }));
  };

  const filtered = posts.filter(p => {
    if (filterPillar !== 'all' && p.pillar !== filterPillar) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    return true;
  });

  const card = { background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, marginBottom: 12 };
  const label = { fontSize: 10, color: C.dim, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6, display: 'block' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'flex-start' }}>

      {/* LEFT — Generator */}
      <div>
        <div style={{ ...card }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 16 }}>generate post</div>

          <span style={label}>pillar</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {PILLARS.map(p => (
              <button key={p.id} onClick={() => setGenPillar(p.id)} style={{
                padding: '4px 10px', fontSize: 11, fontWeight: 700,
                border: `1px solid ${genPillar === p.id ? p.color : C.border}`,
                borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit',
                background: genPillar === p.id ? p.color + '20' : 'transparent',
                color: genPillar === p.id ? p.color : C.soft,
              }}>{p.label}</button>
            ))}
          </div>

          <span style={label}>hook</span>
          <Select value={genHook} onChange={setGenHook} options={HOOK_TYPES.map(h => ({ value: h.id, label: h.label }))} style={{ width: '100%', marginBottom: 14 }} />

          <span style={label}>structure</span>
          <Select value={genStructure} onChange={setGenStructure} options={STRUCTURES} style={{ width: '100%', marginBottom: 14 }} />

          <span style={label}>length</span>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {[['short', '< 280'], ['medium', '280–600'], ['teacher', '600–1500']].map(([v, l]) => (
              <button key={v} onClick={() => setGenLength(v)} style={{
                flex: 1, padding: '6px 4px', fontSize: 11, fontWeight: 700,
                border: `1px solid ${genLength === v ? C.cyan : C.border}`,
                borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit',
                background: genLength === v ? C.cyan + '20' : 'transparent',
                color: genLength === v ? C.cyan : C.soft,
              }}>{l}</button>
            ))}
          </div>

          <span style={label}>topic / context</span>
          <Input value={genTopic} onChange={setGenTopic} placeholder="what's this post about?" style={{ marginBottom: 10 }} />
          <Input value={genNotes} onChange={setGenNotes} placeholder="extra notes, angles, data..." style={{ marginBottom: 16 }} />

          <Btn onClick={generate} disabled={generating} style={{ width: '100%' }}>
            {generating ? 'generating...' : '⚡ generate'}
          </Btn>

          {generated && (
            <div style={{ marginTop: 16 }}>
              <div style={{ position: 'relative' }}>
                <textarea
                  value={generated}
                  onChange={e => setGenerated(e.target.value)}
                  rows={8}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: C.bg3, border: `1px solid ${C.cyan}40`,
                    borderRadius: 8, color: C.text,
                    padding: '12px 14px', fontSize: 13,
                    fontFamily: 'inherit', outline: 'none',
                    resize: 'vertical', lineHeight: 1.6,
                  }}
                />
                <div style={{ fontSize: 10, color: charCount(generated) > 280 ? charCount(generated) > 600 ? C.amber : C.soft : C.green, textAlign: 'right', marginTop: 4 }}>
                  {charCount(generated)} chars
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <Btn onClick={generate} outline small color={C.soft} style={{ flex: 1 }} disabled={generating}>↺ regenerate</Btn>
                <Btn onClick={savePost} small disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'saving...' : '💾 save draft'}
                </Btn>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — Posts list */}
      <div>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select value={filterPillar} onChange={setFilterPillar} options={[{ value: 'all', label: 'all pillars' }, ...PILLARS.map(p => ({ value: p.id, label: p.label }))]} />
          <Select value={filterStatus} onChange={setFilterStatus} options={['all', 'draft', 'ready', 'posted', 'archived'].map(s => ({ value: s, label: s }))} />
          <span style={{ fontSize: 12, color: C.dim, marginLeft: 'auto' }}>{filtered.length} posts</span>
        </div>

        {loading && <div style={{ color: C.dim, fontSize: 13 }}>loading...</div>}

        {filtered.map(post => (
          <div key={post.id} style={{ ...card, borderColor: editId === post.id ? C.cyan + '60' : C.border }}>
            {editId === post.id ? (
              /* Edit mode */
              <div>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={6}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: C.bg3, border: `1px solid ${C.border}`,
                    borderRadius: 6, color: C.text, padding: '10px 12px',
                    fontSize: 13, fontFamily: 'inherit', outline: 'none',
                    resize: 'vertical', marginBottom: 10,
                  }}
                />
                <div style={{ fontSize: 10, color: C.soft, textAlign: 'right', marginBottom: 10 }}>{charCount(editContent)} chars</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 10, marginBottom: 10 }}>
                  <div>
                    <span style={label}>status</span>
                    <Select value={editStatus} onChange={setEditStatus} options={['draft', 'ready', 'posted', 'archived']} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <span style={label}>notes</span>
                    <Input value={editNotes} onChange={setEditNotes} placeholder="internal notes..." />
                  </div>
                  <div>
                    <span style={label}>score</span>
                    <Input value={editScore} onChange={setEditScore} placeholder="1-10" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn onClick={saveEdit} small>save</Btn>
                  <Btn onClick={() => setEditId(null)} outline small color={C.soft}>cancel</Btn>
                </div>
              </div>
            ) : (
              /* View mode */
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                  <Tag label={pillarLabel(post.pillar)} color={pillarColor(post.pillar)} />
                  {post.hook_type && <Tag label={post.hook_type} color={C.purple} />}
                  <Tag label={post.status} color={STATUS_COLORS[post.status] || C.dim} />
                  {post.score && <Tag label={`${post.score}/10`} color={post.score >= 7 ? C.green : C.amber} />}
                  <span style={{ fontSize: 10, color: C.dim, marginLeft: 'auto' }}>
                    {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.65, whiteSpace: 'pre-wrap', marginBottom: 12 }}>
                  {post.content}
                </div>

                {post.notes && (
                  <div style={{ fontSize: 11, color: C.dim, fontStyle: 'italic', marginBottom: 10 }}>
                    note: {post.notes}
                  </div>
                )}

                <div style={{ fontSize: 10, color: C.dim, marginBottom: 10 }}>{charCount(post.content)} chars</div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Btn onClick={() => startEdit(post)} outline small color={C.cyan}>edit</Btn>
                  <Btn onClick={() => updatePost(post.id, { status: 'ready' })} outline small color={C.amber} style={{ display: post.status === 'ready' ? 'none' : undefined }}>mark ready</Btn>
                  <Btn onClick={() => updatePost(post.id, { status: 'posted' })} outline small color={C.green} style={{ display: post.status === 'posted' ? 'none' : undefined }}>mark posted</Btn>
                  <Btn onClick={() => { navigator.clipboard.writeText(post.content); }} outline small color={C.soft}>copy</Btn>
                  <Btn onClick={() => loadFeedback(post.id)} outline small color={C.purple}>
                    {feedbackPostId === post.id ? 'close feedback' : `feedback${(feedbacks[post.id] || []).length ? ` (${feedbacks[post.id].length})` : ''}`}
                  </Btn>
                  <Btn onClick={() => deletePost(post.id)} outline small color={C.red}>delete</Btn>
                </div>

                {/* Feedback panel */}
                {feedbackPostId === post.id && (
                  <div style={{ marginTop: 14, padding: 14, background: C.bg3, borderRadius: 8, border: `1px solid ${C.purple}30` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.purple, marginBottom: 10 }}>barry feedback</div>
                    {(feedbacks[post.id] || []).map(fb => (
                      <div key={fb.id} style={{ marginBottom: 8, padding: '8px 10px', background: C.bg2, borderRadius: 6, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        {fb.rating && <span style={{ fontSize: 11, fontWeight: 700, color: C.amber }}>{fb.rating}/10</span>}
                        <span style={{ flex: 1, fontSize: 12, color: C.text, lineHeight: 1.5 }}>{fb.note}</span>
                        <button onClick={() => deleteFeedback(fb.id, post.id)} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 11 }}>✕</button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <input
                        value={newRating}
                        onChange={e => setNewRating(e.target.value)}
                        placeholder="score"
                        style={{ width: 54, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 5, color: C.text, padding: '6px 8px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                      />
                      <input
                        value={newFeedback}
                        onChange={e => setNewFeedback(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addFeedback(post.id)}
                        placeholder="add feedback note..."
                        style={{ flex: 1, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 5, color: C.text, padding: '6px 10px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                      />
                      <Btn onClick={() => addFeedback(post.id)} small>add</Btn>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div style={{ color: C.dim, fontSize: 13, textAlign: 'center', padding: 40 }}>no posts yet</div>
        )}
      </div>
    </div>
  );
}

// ─── Research Tab ────────────────────────────────────────────
function ResearchTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [tags, setTags] = useState('');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

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
    await fetch('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, content, source, tags }),
    });
    setTopic(''); setContent(''); setSource(''); setTags('');
    await load();
  };

  const del = async (id) => {
    if (!confirm('Delete?')) return;
    await fetch('/api/research', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await load();
  };

  const saveEdit = async () => {
    await fetch('/api/research', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editId, ...editData }),
    });
    setEditId(null);
    await load();
  };

  const card = { background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, marginBottom: 12 };
  const label = { fontSize: 10, color: C.dim, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.06em', marginBottom: 6, display: 'block' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, alignItems: 'flex-start' }}>
      <div>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 16 }}>add research</div>
          <span style={label}>topic</span>
          <Input value={topic} onChange={setTopic} placeholder="topic title" style={{ marginBottom: 10 }} />
          <span style={label}>content</span>
          <Input value={content} onChange={setContent} multiline rows={6} placeholder="notes, data, observations..." style={{ marginBottom: 10 }} />
          <span style={label}>source</span>
          <Input value={source} onChange={setSource} placeholder="url or source name" style={{ marginBottom: 10 }} />
          <span style={label}>tags</span>
          <Input value={tags} onChange={setTags} placeholder="ai, market, onchain..." style={{ marginBottom: 16 }} />
          <Btn onClick={add} style={{ width: '100%' }}>save research</Btn>
        </div>
      </div>
      <div>
        {loading && <div style={{ color: C.dim, fontSize: 13 }}>loading...</div>}
        {items.map(item => (
          <div key={item.id} style={card}>
            {editId === item.id ? (
              <div>
                <Input value={editData.topic} onChange={v => setEditData(p => ({ ...p, topic: v }))} placeholder="topic" style={{ marginBottom: 8 }} />
                <Input value={editData.content} onChange={v => setEditData(p => ({ ...p, content: v }))} multiline rows={5} style={{ marginBottom: 8 }} />
                <Input value={editData.source} onChange={v => setEditData(p => ({ ...p, source: v }))} placeholder="source" style={{ marginBottom: 8 }} />
                <Input value={editData.tags} onChange={v => setEditData(p => ({ ...p, tags: v }))} placeholder="tags" style={{ marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn onClick={saveEdit} small>save</Btn>
                  <Btn onClick={() => setEditId(null)} outline small color={C.soft}>cancel</Btn>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.topic}</div>
                  <span style={{ fontSize: 10, color: C.dim }}>{new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </div>
                {item.tags && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    {item.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                      <span key={t} style={{ fontSize: 10, color: C.cyan, background: C.cyan + '15', padding: '2px 8px', borderRadius: 4 }}>{t}</span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 13, color: C.soft, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 10 }}>{item.content}</div>
                {item.source && <div style={{ fontSize: 11, color: C.dim }}>source: {item.source}</div>}
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  <Btn onClick={() => { setEditId(item.id); setEditData({ topic: item.topic, content: item.content, source: item.source || '', tags: item.tags || '' }); }} outline small color={C.cyan}>edit</Btn>
                  <Btn onClick={() => del(item.id)} outline small color={C.red}>delete</Btn>
                </div>
              </div>
            )}
          </div>
        ))}
        {!loading && items.length === 0 && <div style={{ color: C.dim, fontSize: 13, textAlign: 'center', padding: 40 }}>no research yet</div>}
      </div>
    </div>
  );
}

// ─── Analytics Tab ───────────────────────────────────────────
function AnalyticsTab({ posts }) {
  const byPillar = PILLARS.map(p => ({
    ...p,
    total:  posts.filter(x => x.pillar === p.id).length,
    posted: posts.filter(x => x.pillar === p.id && x.status === 'posted').length,
    ready:  posts.filter(x => x.pillar === p.id && x.status === 'ready').length,
    draft:  posts.filter(x => x.pillar === p.id && x.status === 'draft').length,
    avgScore: (() => {
      const scored = posts.filter(x => x.pillar === p.id && x.score);
      return scored.length ? (scored.reduce((s, x) => s + x.score, 0) / scored.length).toFixed(1) : null;
    })(),
  })).filter(p => p.total > 0);

  const totalPosted = posts.filter(p => p.status === 'posted').length;
  const totalReady  = posts.filter(p => p.status === 'ready').length;
  const totalDraft  = posts.filter(p => p.status === 'draft').length;

  const card = { background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, marginBottom: 16 };
  const statCard = (label, val, color) => (
    <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: C.dim, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 900, color }}>{val}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {statCard('total posts', posts.length, C.text)}
        {statCard('posted', totalPosted, C.green)}
        {statCard('ready', totalReady, C.amber)}
        {statCard('drafts', totalDraft, C.dim)}
      </div>

      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 16 }}>by pillar</div>
        {byPillar.map(p => (
          <div key={p.id} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.label}</span>
                {p.avgScore && <span style={{ fontSize: 10, color: C.amber }}>avg {p.avgScore}/10</span>}
              </div>
              <span style={{ fontSize: 11, color: C.dim }}>{p.posted} posted · {p.ready} ready · {p.draft} draft</span>
            </div>
            <div style={{ height: 6, background: C.bg3, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(p.total / Math.max(...byPillar.map(x => x.total))) * 100}%`, background: p.color, borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Top scored posts */}
      {posts.filter(p => p.score).length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 16 }}>top scored</div>
          {[...posts].filter(p => p.score).sort((a, b) => b.score - a.score).slice(0, 5).map(p => (
            <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: p.score >= 8 ? C.green : p.score >= 6 ? C.amber : C.red, minWidth: 36 }}>{p.score}</div>
              <div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: pillarColor(p.pillar), fontWeight: 700 }}>{pillarLabel(p.pillar)}</span>
                </div>
                <div style={{ fontSize: 12, color: C.soft, lineHeight: 1.5 }}>{p.content.slice(0, 120)}...</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(false);
  const [tab, setTab] = useState('content');
  const [allPosts, setAllPosts] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('barry_auth')) setAuth(true);
  }, []);

  useEffect(() => {
    if (auth) {
      fetch('/api/posts').then(r => r.json()).then(d => setAllPosts(Array.isArray(d) ? d : []));
    }
  }, [auth, tab]);

  const login = () => {
    sessionStorage.setItem('barry_auth', '1');
    setAuth(true);
  };

  if (!auth) return <LoginScreen onLogin={login} />;

  const navItems = [
    { id: 'content',   label: 'content' },
    { id: 'research',  label: 'research' },
    { id: 'analytics', label: 'analytics' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Nav */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '0 32px', display: 'flex', alignItems: 'center', gap: 0, position: 'sticky', top: 0, background: C.bg, zIndex: 100 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: C.text, marginRight: 32, padding: '16px 0', letterSpacing: '-.01em' }}>barry</div>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{
            padding: '16px 18px', fontSize: 13, fontWeight: tab === n.id ? 700 : 400,
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            color: tab === n.id ? C.text : C.dim,
            borderBottom: `2px solid ${tab === n.id ? C.cyan : 'transparent'}`,
          }}>{n.label}</button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 10, color: C.dim, padding: '16px 0' }}>
          {allPosts.filter(p => p.status === 'posted').length} posted · {allPosts.filter(p => p.status === 'ready').length} ready
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>
        {tab === 'content'   && <ContentTab />}
        {tab === 'research'  && <ResearchTab />}
        {tab === 'analytics' && <AnalyticsTab posts={allPosts} />}
      </div>
    </div>
  );
}
