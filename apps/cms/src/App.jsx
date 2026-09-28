import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getToken() {
  return localStorage.getItem('portfolio-cms-token');
}

function setToken(token) {
  localStorage.setItem('portfolio-cms-token', token);
}

function removeToken() {
  localStorage.removeItem('portfolio-cms-token');
}

async function apiRequest(url, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Request failed');
  }

  return response.json();
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('admin@portfolio.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setToken(result.token);
      onLogin(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900/80 p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">Portfolio CMS</p>
          <h1 className="mt-3 text-3xl font-bold">Admin Login</h1>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-0"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-0"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  const [about, setAbout] = useState({});
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [experience, setExperience] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [services, setServices] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [aboutData, skillsData, projectsData, blogsData, experienceData, testimonialsData, servicesData, messagesData] = await Promise.all([
        apiRequest('/api/about'),
        apiRequest('/api/skills'),
        apiRequest('/api/projects'),
        apiRequest('/api/blogs'),
        apiRequest('/api/experience'),
        apiRequest('/api/testimonials'),
        apiRequest('/api/services'),
        apiRequest('/api/messages')
      ]);

      setAbout(aboutData || {});
      setSkills(skillsData || []);
      setProjects(projectsData || []);
      setBlogs(blogsData || []);
      setExperience(experienceData || []);
      setTestimonials(testimonialsData || []);
      setServices(servicesData || []);
      setMessages(messagesData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold">Portfolio CMS</h1>
          </div>
          <button
            onClick={() => {
              removeToken();
              window.location.reload();
            }}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 hover:bg-slate-800"
          >
            Logout
          </button>
        </div>

        {loading ? (
          <p>Loading data...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <StatCard title="About" value={about?.name || 'Not set'} />
            <StatCard title="Skills" value={String(skills.length)} />
            <StatCard title="Projects" value={String(projects.length)} />
            <StatCard title="Blogs" value={String(blogs.length)} />
            <StatCard title="Experience" value={String(experience.length)} />
            <StatCard title="Testimonials" value={String(testimonials.length)} />
            <StatCard title="Services" value={String(services.length)} />
            <StatCard title="Messages" value={String(messages.length)} />
          </div>
        )}

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <SectionCard title="Quick Actions">
            <div className="space-y-3 text-sm text-slate-200">
              <Link to="/about" className="block rounded-xl border border-slate-700 bg-slate-900 p-3 hover:bg-slate-800">Edit About</Link>
              <Link to="/skills" className="block rounded-xl border border-slate-700 bg-slate-900 p-3 hover:bg-slate-800">Manage Skills</Link>
              <Link to="/projects" className="block rounded-xl border border-slate-700 bg-slate-900 p-3 hover:bg-slate-800">Manage Projects</Link>
              <Link to="/blogs" className="block rounded-xl border border-slate-700 bg-slate-900 p-3 hover:bg-slate-800">Manage Blogs</Link>
              <Link to="/messages" className="block rounded-xl border border-slate-700 bg-slate-900 p-3 hover:bg-slate-800">View Messages</Link>
            </div>
          </SectionCard>

          <SectionCard title="Recent Message">
            <div className="space-y-2 text-sm text-slate-300">
              {messages.length ? (
                <>
                  <p><strong>{messages[0].name}</strong></p>
                  <p>{messages[0].email}</p>
                  <p>{messages[0].message}</p>
                </>
              ) : (
                <p>No messages yet.</p>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <h3 className="mt-4 text-2xl font-bold text-cyan-400">{value}</h3>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h3 className="mb-4 text-xl font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function ProtectedRoute({ children }) {
  const token = getToken();
  return token ? children : <Navigate to="/login" replace />;
}

function AboutEditor() {
  const [about, setAbout] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/about')
      .then(setAbout)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    await apiRequest('/api/about', {
      method: 'PUT',
      body: JSON.stringify(about)
    });
    alert('About information saved.');
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 text-white">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">About</h1>
        <Link to="/" className="text-cyan-400">Back to dashboard</Link>
      </div>
      {loading ? <p>Loading...</p> : (
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <input value={about.name || ''} onChange={(e) => setAbout({ ...about, name: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Name" />
          <input value={about.title || ''} onChange={(e) => setAbout({ ...about, title: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Title" />
          <textarea value={about.bio || ''} onChange={(e) => setAbout({ ...about, bio: e.target.value })} className="min-h-32 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Bio" />
          <button onClick={save} className="rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950">Save</button>
        </div>
      )}
    </div>
  );
}

function SkillsManager() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    apiRequest('/api/skills').then(setItems);
  }, []);

  const addItem = async () => {
    const newItem = { id: crypto.randomUUID(), name: 'New Skill', level: 80 };
    const updated = [...items, newItem];
    setItems(updated);
    await apiRequest('/api/skills', {
      method: 'POST',
      body: JSON.stringify(newItem)
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 text-white">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Skills</h1>
        <button onClick={addItem} className="rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950">Add skill</button>
      </div>
      <div className="space-y-4">
        {items.map((skill) => (
          <div key={skill.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p>{skill.name}</p>
            <input
              type="range"
              min="0"
              max="100"
              value={skill.level || 0}
              onChange={async (e) => {
                const updated = { ...skill, level: Number(e.target.value) };
                setItems((current) => current.map((item) => item.id === skill.id ? updated : item));
                await apiRequest('/api/skills', {
                  method: 'PUT',
                  body: JSON.stringify(updated)
                });
              }}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => (getToken() ? { email: 'admin' } : null));

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage onLogin={setUser} />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/about" element={<ProtectedRoute><AboutEditor /></ProtectedRoute>} />
      <Route path="/skills" element={<ProtectedRoute><SkillsManager /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
}

export default App;
