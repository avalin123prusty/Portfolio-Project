import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { getAbout, getContent } from '../../lib/api';

export const metadata = { title: 'Experience | Ava Lin Prusty' };

export default async function ExperiencePage() {
  const [about, experience] = await Promise.all([getAbout(), getContent('experience')]);
  return <><SiteHeader name={about?.name} /><main><section className="inner-hero"><p className="eyebrow">EXPERIENCE / THE PATH SO FAR</p><h1>Good work is<br /><em>always a team effort.</em></h1><p>Selected roles and collaborations that have shaped how I work.</p></section><section className="section-wrap timeline-list">{experience.map((item, index) => <article key={item.id}><span className="timeline-index">0{index + 1}</span><div><span className="timeline-period">{item.period}</span><h2>{item.role}</h2><h3>{item.company}{item.location ? ` · ${item.location}` : ''}</h3><p>{item.description}</p></div></article>)}{!experience.length && <p className="empty-content">Experience will appear here as it is added in the CMS.</p>}</section></main><SiteFooter about={about} /></>;
}