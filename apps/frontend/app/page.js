async function getData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/about`, {
    cache: 'no-store'
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export default async function HomePage() {
  const about = await getData();

  return (
    <main className="min-h-screen">
      <section className="container py-24">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-cyan-400">Portfolio</p>
          <h1 className="text-5xl font-black leading-tight md:text-7xl">
            {about?.name || 'Your Name'}
          </h1>
          <p className="mt-6 text-xl text-slate-300 md:text-2xl">
            {about?.title || 'Full-Stack Developer & Digital Product Builder'}
          </p>
          <p className="mt-6 max-w-2xl text-lg text-slate-400">
            {about?.bio || 'I build digital experiences that combine design, performance, and strategy.'}
          </p>
          <div className="mt-8 flex gap-4">
            <a href="#projects" className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950">See Projects</a>
            <a href="mailto:hello@avalin.dev" className="rounded-full border border-slate-700 px-6 py-3 font-semibold text-white">Contact Me</a>
          </div>
        </div>
      </section>

      <section id="projects" className="container py-16">
        <h2 className="mb-8 text-3xl font-bold">Featured Projects</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <ProjectCard title="Portfolio Platform" description="A polished portfolio experience built for modern brands." />
          <ProjectCard title="CMS Dashboard" description="A custom content system for managing portfolio data and media." />
        </div>
      </section>
    </main>
  );
}

function ProjectCard({ title, description }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
      <h3 className="mb-3 text-xl font-semibold">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}
