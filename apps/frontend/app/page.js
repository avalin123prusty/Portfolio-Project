import Link from 'next/link';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import { getAbout, getContent } from '../lib/api';

const projectArtwork = [
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1600&q=82'
];

export default async function HomePage() {
  const [about, projects, skills, experience, testimonials, services, blogs] = await Promise.all([
    getAbout(), getContent('projects'), getContent('skills'), getContent('experience'),
    getContent('testimonials'), getContent('services'), getContent('blogs')
  ]);
  const featuredProjects = projects.filter((item) => item.featured !== false).slice(0, 3);

  return <><SiteHeader name={about?.name} /><main>
    <section className="hero-shell">
      <div className="hero-grid">
        <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line" /> INDEPENDENT DEVELOPER · {about?.location || 'INDIA'}</p><h1>{about?.name || 'Ava Lin Prusty'}<span className="hero-period">.</span></h1><p className="hero-title">{about?.title || 'Full-stack developer & digital product builder'}</p><p className="hero-summary">{about?.summary || about?.bio || 'I make thoughtful, useful digital experiences from the first sketch to the final deploy.'}</p><div className="hero-actions"><Link href="/projects" className="button button-dark">Explore selected work <span>↗</span></Link><Link href="/contact" className="quiet-link">Start a conversation <span>↗</span></Link></div></div>
        <div className="hero-art" aria-label="Abstract portfolio artwork"><div className="art-ring ring-one" /><div className="art-ring ring-two" /><div className="art-orbit"><span className="orbit-dot" /></div><span className="art-stamp">DESIGN<br />THINKING<br />× CODE</span><span className="art-caption">A PRACTICE IN PROGRESS<br />EST. 2021</span></div>
      </div>
      <div className="hero-bottom"><span>SCROLL TO EXPLORE</span><span className="scroll-mark">↓</span><span>01 / 04</span></div>
    </section>

    <section className="section-wrap selected-section" id="work"><div className="section-heading"><div><p className="eyebrow">01 — SELECTED WORK</p><h2>Made to make<br />a difference.</h2></div><Link className="underlined-link" href="/projects">All projects <span>↗</span></Link></div><div className="project-grid">{featuredProjects.map((project, index) => <article className={`project-card project-card-${index + 1}`} key={project.id}><Link href="/projects" className="project-image" aria-label={`View ${project.title}`}><img src={project.image || projectArtwork[index % projectArtwork.length]} alt={`${project.title} project preview`} /><span className="project-arrow">↗</span></Link><div className="project-card-copy"><div><h3>{project.title}</h3><p>{project.description}</p></div><span className="project-card-index">0{index + 1}</span></div><div className="tag-list">{(project.stack || []).map((tag) => <span key={tag}>{tag}</span>)}</div></article>)}</div>{!featuredProjects.length && <p className="empty-content">Projects will appear here as they are published in the CMS.</p>}</section>

    <section className="about-band"><div className="section-wrap about-band-inner"><p className="eyebrow">02 — A LITTLE ABOUT ME</p><div><h2>{about?.summary || 'Curious by nature. Careful by design.'}</h2><p>{about?.bio || 'I partner with people who care about the details, building clear and dependable digital products that make everyday work feel easier.'}</p><Link className="underlined-link" href="/about">More about my practice <span>↗</span></Link></div></div></section>

    <section className="section-wrap capability-section"><div className="section-heading"><div><p className="eyebrow">03 — HOW I CAN HELP</p><h2>Good ideas,<br />well made.</h2></div><p className="section-intro">I work across product strategy, interaction design, and engineering to take ambitious ideas from concept to launch.</p></div><div className="service-grid">{(services.length ? services : [{ id: 'web', title: 'Web development', description: 'Fast, accessible websites and products built to grow.' }, { id: 'systems', title: 'CMS & content systems', description: 'Purpose-built tools that make publishing simple.' }]).slice(0, 3).map((service, index) => <article key={service.id} className="service-item"><span>0{index + 1}</span><h3>{service.title}</h3><p>{service.description}</p></article>)}</div><div className="skill-strip"><span>ALWAYS LEARNING</span>{skills.slice(0, 8).map((skill) => <span key={skill.id}>{skill.name}</span>)}</div></section>

    {experience.length > 0 && <section className="experience-band"><div className="section-wrap experience-inner"><div><p className="eyebrow">04 — THE PATH SO FAR</p><h2>Experience<br />with intention.</h2><Link className="underlined-link" href="/experience">Explore experience <span>↗</span></Link></div><div className="experience-list">{experience.slice(0, 3).map((item) => <article key={item.id}><div><h3>{item.role}</h3><p>{item.company}{item.location ? ` · ${item.location}` : ''}</p></div><span>{item.period}</span></article>)}</div></div></section>}

    {testimonials.length > 0 && <section className="section-wrap quote-section"><p className="eyebrow">A FEW KIND WORDS</p>{testimonials.slice(0, 1).map((item) => <blockquote key={item.id}><span className="quote-mark">“</span><p>{item.quote}</p><footer>{item.name}<span>{item.role}</span></footer></blockquote>)}</section>}

    {blogs.length > 0 && <section className="journal-band"><div className="section-wrap journal-inner"><div><p className="eyebrow">THE JOURNAL</p><h2>Notes from<br />the work.</h2></div><div className="journal-list">{blogs.slice(0, 2).map((item) => <Link key={item.id} href={`/blog/${item.slug || item.id}`}><span>{item.date || 'Journal'}</span><strong>{item.title}</strong><span>↗</span></Link>)}<Link href="/blog" className="journal-all">Visit the journal ↗</Link></div></div></section>}

    <section className="closing-cta"><div className="section-wrap closing-inner"><p className="eyebrow">HAVE SOMETHING GOOD IN MIND?</p><h2>Let’s make it<br /><em>matter.</em></h2><Link href="/contact" className="button button-light">Tell me about it <span>↗</span></Link></div><span className="closing-decoration" aria-hidden="true">✳</span></section>
  </main><SiteFooter about={about} /></>;
}
