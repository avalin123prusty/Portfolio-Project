import Link from 'next/link';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { getAbout, getContent } from '../../lib/api';

const projectArtwork = [
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1600&q=82'
];

export const metadata = { title: 'Selected Work | Ava Lin Prusty', description: 'Selected product and web projects.' };

export default async function ProjectsPage() {
  const [about, projects] = await Promise.all([getAbout(), getContent('projects')]);
  return <><SiteHeader name={about?.name} /><main><section className="inner-hero"><p className="eyebrow">SELECTED WORK / 2021—NOW</p><h1>Useful things,<br /><em>made thoughtfully.</em></h1><p>A selection of products, platforms, and experiments built with care.</p></section><section className="section-wrap projects-page-grid">{projects.map((project, index) => <article className="project-card" key={project.id}><div className={`project-image project-image-${index % 3 + 1}`}><img src={project.image || projectArtwork[index % projectArtwork.length]} alt={`${project.title} project preview`} /></div><div className="project-card-copy"><div><p className="eyebrow">PROJECT / {String(index + 1).padStart(2, '0')}</p><h2>{project.title}</h2><p>{project.description}</p></div></div><div className="tag-list">{(project.stack || []).map((tag) => <span key={tag}>{tag}</span>)}</div><div className="project-links">{project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer">Visit project ↗</a>}{project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer">Source code ↗</a>}</div></article>)}{!projects.length && <p className="empty-content">New work is being prepared. Please check back soon.</p>}</section><section className="closing-cta compact-cta"><div className="section-wrap closing-inner"><p className="eyebrow">HAVE A PROJECT IN MIND?</p><h2>Let’s talk<br /><em>possibilities.</em></h2><Link href="/contact" className="button button-light">Get in touch <span>↗</span></Link></div></section></main><SiteFooter about={about} /></>;
}