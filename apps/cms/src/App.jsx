import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const PORTFOLIO_URL = import.meta.env.VITE_PORTFOLIO_URL || 'http://localhost:3000';
const TOKEN_KEY = 'portfolio-cms-token';
const REFRESH_TOKEN_KEY = 'portfolio-cms-refresh-token';

const sections = [
  { path: '/', label: 'Overview', icon: '01' },
  { path: '/about', label: 'About', icon: '02' },
  { path: '/projects', label: 'Projects', icon: '03' },
  { path: '/skills', label: 'Skills', icon: '04' },
  { path: '/experience', label: 'Experience', icon: '05' },
  { path: '/blogs', label: 'Journal', icon: '06' },
  { path: '/testimonials', label: 'Testimonials', icon: '07' },
  { path: '/services', label: 'Services', icon: '08' },
  { path: '/messages', label: 'Messages', icon: '09' },
  { path: '/media', label: 'Media library', icon: '10' }
];

const schemas = {
  projects: {
    title: 'Projects', singular: 'project', fields: [
      { name: 'title', label: 'Project name', required: true },
      { name: 'slug', label: 'URL slug' },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'image', label: 'Cover image URL' },
      { name: 'stack', label: 'Technology stack', type: 'array', hint: 'Separate items with commas' },
      { name: 'liveUrl', label: 'Live URL', type: 'url' },
      { name: 'githubUrl', label: 'Repository URL', type: 'url' },
      { name: 'featured', label: 'Feature on homepage', type: 'checkbox' },
      { name: 'status', label: 'Publication status', type: 'select', options: ['published', 'draft'] }
    ]
  },
  skills: {
    title: 'Skills', singular: 'skill', fields: [
      { name: 'name', label: 'Skill name', required: true },
      { name: 'category', label: 'Category' },
      { name: 'level', label: 'Proficiency', type: 'number', min: 0, max: 100 },
      { name: 'featured', label: 'Feature on homepage', type: 'checkbox' }
    ]
  },
  experience: {
    title: 'Experience', singular: 'experience entry', fields: [
      { name: 'role', label: 'Role', required: true },
      { name: 'company', label: 'Company', required: true },
      { name: 'period', label: 'Period' },
      { name: 'location', label: 'Location' },
      { name: 'description', label: 'Description', type: 'textarea' }
    ]
  },
  blogs: {
    title: 'Journal', singular: 'article', fields: [
      { name: 'title', label: 'Article title', required: true },
      { name: 'slug', label: 'URL slug' },
      { name: 'excerpt', label: 'Excerpt', type: 'textarea' },
      { name: 'content', label: 'Article content', type: 'textarea', required: true },
      { name: 'date', label: 'Publication date', type: 'date' },
      { name: 'readTime', label: 'Reading time' },
      { name: 'coverImage', label: 'Cover image URL' },
      { name: 'status', label: 'Publication status', type: 'select', options: ['published', 'draft'] }
    ]
  },
  testimonials: {
    title: 'Testimonials', singular: 'testimonial', fields: [
      { name: 'name', label: 'Client name', required: true },
      { name: 'role', label: 'Role or organization' },
      { name: 'quote', label: 'Quote', type: 'textarea', required: true }
    ]
  },
  services: {
    title: 'Services', singular: 'service', fields: [
      { name: 'title', label: 'Service name', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true }
    ]
  }
};

function token() {
  return window.localStorage.getItem(TOKEN_KEY);
}

async function apiRequest(path, options = {}) {
  const send = (accessToken) => {
    const headers = new Headers(options.headers || {});
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
    return fetch(`${API_URL}${path}`, { ...options, headers });
  };

  let response = await send(token());
  if (response.status === 401 && !path.includes('/api/auth/')) {
    const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      const refreshed = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (refreshed.ok) {
        const credentials = await refreshed.json();
        saveCredentials(credentials);
        response = await send(credentials.token);
      } else {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    }
  }
  const result = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.message || `Request failed (${response.status})`);
  return result;
}

function saveCredentials(credentials) {
  window.localStorage.setItem(TOKEN_KEY, credentials.token);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, credentials.refreshToken);
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('admin@portfolio.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      saveCredentials(result);
      onLogin(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-panel">
        <div className="brand-mark">AP<span>/</span>CMS</div>
        <p className="eyebrow">CONTENT STUDIO · PRIVATE ACCESS</p>
        <h1>Welcome<br />back.</h1>
        <p className="muted">Sign in to shape the portfolio.</p>
        <form onSubmit={submit} className="form-stack">
          <label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <p className="notice error" role="alert">{error}</p>}
          <button className="button primary full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <span aria-hidden="true">↗</span></button>
        </form>
      </section>
      <aside className="login-art"><span className="art-label">AVA LIN PRUSTY<br />DIGITAL PORTFOLIO</span><span className="art-number">01—14</span></aside>
    </main>
  );
}

function AuthGate({ user, children }) {
  return user ? children : <Navigate to="/login" replace />;
}

function AdminShell({ user, onLogout, children }) {
  const location = useLocation();
  const current = sections.find((section) => section.path === location.pathname);
  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <Link className="brand-mark" to="/">AP<span>/</span>CMS</Link>
        <p className="sidebar-label">WORKSPACE</p>
        <nav aria-label="CMS navigation">
          {sections.map((section) => (
            <NavLink key={section.path} to={section.path} end={section.path === '/'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <span className="nav-index">{section.icon}</span>{section.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href={PORTFOLIO_URL} target="_blank" rel="noreferrer">Open portfolio ↗</a>
          <button className="logout-button" onClick={onLogout}>Sign out</button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="topbar">
          <div><span className="topbar-kicker">PORTFOLIO / CMS</span><span className="topbar-page">{current?.label || 'Content studio'}</span></div>
          <div className="account-chip"><span className="status-dot" />{user.email}</div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

function PageHeading({ kicker, title, description, action }) {
  return (
    <div className="page-heading">
      <div><p className="eyebrow">{kicker}</p><h1>{title}</h1>{description && <p className="muted">{description}</p>}</div>
      {action}
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    apiRequest('/api/admin/analytics').then(setData).catch((requestError) => setError(requestError.message));
  }, []);

  const totals = data?.totals || {};
  const metrics = [
    ['Projects', totals.projects ?? '—', 'Selected work'],
    ['Journal', totals.blogs ?? '—', 'Published stories'],
    ['Skills', totals.skills ?? '—', 'Areas of practice'],
    ['Messages', totals.messages ?? '—', `${data?.recentMessages ?? 0} this month`]
  ];
  return (
    <>
      <PageHeading kicker="MONDAY, YOUR WORKSPACE" title="Good work starts here." description="A clear view of what is live across your portfolio." action={<span className="live-tag"><span className="status-dot" /> API connected</span>} />
      {error && <p className="notice error">{error}</p>}
      <section className="metric-grid" aria-label="Portfolio metrics">
        {metrics.map(([label, value, note], index) => <article className={`metric metric-${index + 1}`} key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}
      </section>
      <div className="dashboard-grid">
        <section className="content-panel">
          <div className="panel-heading"><div><p className="eyebrow">CONTENT</p><h2>Manage the portfolio</h2></div><span className="panel-count">06 TYPES</span></div>
          <div className="shortcut-list">{Object.entries(schemas).map(([path, schema]) => <Link to={`/${path}`} key={path}><span>{schema.title}</span><span aria-hidden="true">↗</span></Link>)}</div>
        </section>
        <section className="content-panel messages-panel">
          <div className="panel-heading"><div><p className="eyebrow">INBOX</p><h2>Latest messages</h2></div><Link to="/messages" className="text-link">View all ↗</Link></div>
          {data?.latestMessages?.length ? data.latestMessages.slice(0, 3).map((message) => <article className="message-preview" key={message.id}><strong>{message.name}</strong><span>{message.email}</span><p>{message.message}</p></article>) : <p className="empty-state">No messages yet. New inquiries will appear here.</p>}
        </section>
      </div>
    </>
  );
}

function AboutEditor() {
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState('');
  const fields = [
    ['name', 'Name'], ['title', 'Professional title'], ['email', 'Contact email'], ['phone', 'Phone'], ['location', 'Location'],
    ['summary', 'Short introduction'], ['bio', 'Biography', 'textarea'], ['socialGithub', 'GitHub URL'], ['socialLinkedin', 'LinkedIn URL'], ['socialTwitter', 'Other social URL']
  ];
  useEffect(() => {
    apiRequest('/api/about').then((about) => setForm({ ...about, socialGithub: about.socialLinks?.github, socialLinkedin: about.socialLinks?.linkedin, socialTwitter: about.socialLinks?.twitter })).catch((error) => setNotice(error.message)).finally(() => setBusy(false));
  }, []);
  async function save(event) {
    event.preventDefault();
    setNotice('');
    try {
      const { socialGithub, socialLinkedin, socialTwitter, ...about } = form;
      await apiRequest('/api/about', { method: 'PUT', body: JSON.stringify({ ...about, socialLinks: { github: socialGithub, linkedin: socialLinkedin, twitter: socialTwitter } }) });
      setNotice('Profile saved.');
    } catch (error) { setNotice(error.message); }
  }
  return <><PageHeading kicker="PROFILE" title="About you" description="Your identity and contact details, shared across the portfolio." />{busy ? <p className="muted">Loading profile…</p> : <form className="editor-panel form-grid" onSubmit={save}>{fields.map(([name, label, type]) => <label className={type === 'textarea' ? 'span-2' : ''} key={name}>{label}{type === 'textarea' ? <textarea rows="6" value={form[name] || ''} onChange={(event) => setForm({ ...form, [name]: event.target.value })} /> : <input value={form[name] || ''} onChange={(event) => setForm({ ...form, [name]: event.target.value })} />}</label>)}<div className="span-2 form-actions"><p className="muted" role="status">{notice}</p><button className="button primary">Save profile</button></div></form>}</>;
}

function emptyForm(schema) {
  return Object.fromEntries(schema.fields.map((field) => [field.name, field.type === 'checkbox' ? false : field.type === 'array' ? [] : field.type === 'select' ? (field.options?.[0] || '') : '']));
}

function valueForInput(value, field) {
  if (field.type === 'array') return Array.isArray(value) ? value.join(', ') : value || '';
  return value ?? (field.type === 'checkbox' ? false : '');
}

function formPayload(form, schema) {
  return Object.fromEntries(schema.fields.map((field) => {
    let value = form[field.name];
    if (field.type === 'array') value = String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
    if (field.type === 'number') value = value === '' ? 0 : Number(value);
    return [field.name, value];
  }));
}

function ContentManager({ resource }) {
  const schema = schemas[resource];
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm(schema));
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setBusy(true);
    try { setItems(await apiRequest(`/api/${resource}`)); setError(''); }
    catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }
  useEffect(() => { load(); }, [resource]);

  function beginEdit(item) {
    setEditing(item.id);
    setForm(Object.fromEntries(schema.fields.map((field) => [field.name, valueForInput(item[field.name], field)])));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function resetForm() { setEditing(null); setForm(emptyForm(schema)); }
  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = formPayload(form, schema);
    if (resource === 'blogs' && !payload.slug) payload.slug = payload.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      await apiRequest(editing ? `/api/${resource}/${editing}` : `/api/${resource}`, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      resetForm();
      await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }
  async function remove(item) {
    if (!window.confirm(`Delete “${item.title || item.name || item.role || item.company}”? This cannot be undone.`)) return;
    try { await apiRequest(`/api/${resource}/${item.id}`, { method: 'DELETE' }); await load(); }
    catch (requestError) { setError(requestError.message); }
  }

  return <>
    <PageHeading kicker="CONTENT COLLECTION" title={schema.title} description={`${items.length} ${schema.singular}${items.length === 1 ? '' : 's'} in your portfolio.`} />
    {error && <p className="notice error" role="alert">{error}</p>}
    <form className="editor-panel manager-form" onSubmit={save}>
      <div className="panel-heading"><div><p className="eyebrow">{editing ? 'EDIT ITEM' : 'NEW ITEM'}</p><h2>{editing ? 'Update content' : `Add ${schema.singular}`}</h2></div>{editing && <button type="button" className="text-button" onClick={resetForm}>Cancel edit</button>}</div>
      <div className="form-grid">{schema.fields.map((field) => <label className={field.type === 'textarea' ? 'span-2' : ''} key={field.name}>{field.label}{field.type === 'textarea' ? <textarea rows="4" required={field.required} value={form[field.name] || ''} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} /> : field.type === 'select' ? <select value={form[field.name]} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}>{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : field.type === 'checkbox' ? <span className="checkbox-row"><input type="checkbox" checked={Boolean(form[field.name])} onChange={(event) => setForm({ ...form, [field.name]: event.target.checked })} /> Enabled</span> : <input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text'} min={field.min} max={field.max} required={field.required} value={form[field.name] ?? ''} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} />}{field.hint && <small className="field-hint">{field.hint}</small>}</label>)}</div>
      <div className="form-actions"><span className="muted">Drafts remain unpublished on the portfolio.</span><button className="button primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : `Add ${schema.singular}`}</button></div>
    </form>
    <section className="collection-list" aria-label={`${schema.title} collection`}>
      {busy ? <p className="muted">Loading content…</p> : items.length ? items.map((item) => <article className="collection-row" key={item.id}><div className="row-mark">{String(item.title || item.name || item.role || item.company || '?').slice(0, 1).toUpperCase()}</div><div className="row-copy"><strong>{item.title || item.name || item.role || item.company}</strong><span>{item.description || item.quote || item.period || item.category || 'Portfolio content'}</span></div><span className={`status-label ${item.status === 'draft' ? 'draft' : ''}`}>{item.status || 'live'}</span><div className="row-actions"><button aria-label={`Edit ${schema.singular}`} onClick={() => beginEdit(item)}>Edit</button><button className="danger-button" aria-label={`Delete ${schema.singular}`} onClick={() => remove(item)}>Delete</button></div></article>) : <p className="empty-state">Nothing here yet. Add your first {schema.singular} above.</p>}
    </section>
  </>;
}

function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function load() { setLoading(true); try { setMessages(await apiRequest('/api/messages')); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  async function remove(message) {
    if (!window.confirm(`Delete the message from ${message.name}?`)) return;
    try { await apiRequest(`/api/messages/${message.id}`, { method: 'DELETE' }); await load(); } catch (requestError) { setError(requestError.message); }
  }
  return <><PageHeading kicker="INBOX" title="Messages" description="Contact form submissions are private to the admin workspace." />{error && <p className="notice error">{error}</p>}{loading ? <p className="muted">Loading messages…</p> : messages.length ? <div className="message-list">{[...messages].reverse().map((message) => <article className="message-card" key={message.id}><div className="message-meta"><strong>{message.name}</strong><a href={`mailto:${message.email}`}>{message.email}</a><time>{message.createdAt ? new Date(message.createdAt).toLocaleString() : ''}</time></div><p>{message.message}</p><button className="danger-button" onClick={() => remove(message)}>Delete message</button></article>)}</div> : <p className="empty-state">Your inbox is clear.</p>}</>;
}

function MediaLibrary() {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  async function load() { setLoading(true); try { setFiles(await apiRequest('/api/media')); } catch (error) { setNotice(error.message); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  async function upload(event) {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    setNotice('');
    const form = new FormData();
    form.append('image', file);
    try { await apiRequest('/api/upload/image', { method: 'POST', body: form }); setFile(null); event.currentTarget.reset(); setNotice('Image uploaded.'); await load(); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  }
  async function remove(item) {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    try { await apiRequest(`/api/media/${item.id}`, { method: 'DELETE' }); await load(); } catch (error) { setNotice(error.message); }
  }
  return <><PageHeading kicker="ASSETS" title="Media library" description="Upload and reuse portfolio images. JPEG, PNG, WEBP, and GIF up to 5 MB." /><form className="upload-panel" onSubmit={upload}><label className="file-picker">Choose an image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label><span className="muted">{file ? file.name : 'No file selected'}</span><button className="button primary" disabled={!file || busy}>{busy ? 'Uploading…' : 'Upload image'}</button></form>{notice && <p className="notice" role="status">{notice}</p>}{loading ? <p className="muted">Loading media…</p> : files.length ? <div className="media-grid">{files.map((item) => <article className="media-item" key={item.id}><img src={item.url} alt={item.name} /><div><strong>{item.name}</strong><small>{Math.ceil(item.size / 1024)} KB</small><button className="danger-button" onClick={() => remove(item)}>Delete</button></div></article>)}</div> : <p className="empty-state">No uploaded images yet.</p>}</>;
}

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(window.localStorage.getItem(TOKEN_KEY)));
  useEffect(() => {
    if (!token()) return;
    apiRequest('/api/admin/me').then((result) => setUser(result.user)).catch(() => window.localStorage.removeItem(TOKEN_KEY)).finally(() => setChecking(false));
  }, []);
  async function logout() {
    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: window.localStorage.getItem(REFRESH_TOKEN_KEY) })
      });
    } catch {}
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
  }
  if (checking) return <main className="loading-screen">Opening content studio…</main>;
  const authenticated = (page) => <AuthGate user={user}><AdminShell user={user} onLogout={logout}>{page}</AdminShell></AuthGate>;
  return <Routes>
    <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage onLogin={setUser} />} />
    <Route path="/" element={authenticated(<Dashboard />)} />
    <Route path="/about" element={authenticated(<AboutEditor />)} />
    {Object.keys(schemas).map((resource) => <Route key={resource} path={`/${resource}`} element={authenticated(<ContentManager resource={resource} />)} />)}
    <Route path="/messages" element={authenticated(<MessagesPage />)} />
    <Route path="/media" element={authenticated(<MediaLibrary />)} />
    <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
  </Routes>;
}

export default App;
