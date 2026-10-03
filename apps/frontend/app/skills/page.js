import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { getAbout, getContent } from '../../lib/api';

export const metadata = { title: 'Skills | Ava Lin Prusty' };

export default async function SkillsPage() {
  const [about, skills] = await Promise.all([getAbout(), getContent('skills')]);
  return <><SiteHeader name={about?.name} /><main><section className="inner-hero"><p className="eyebrow">PRACTICE / TOOLS & METHODS</p><h1>Always learning.<br /><em>Always building.</em></h1><p>A flexible toolkit shaped by the problem, not the trend.</p></section><section className="section-wrap skill-grid skill-grid-page">{skills.map((skill, index) => <article key={skill.id}><span>{skill.category || `AREA ${String(index + 1).padStart(2, '0')}`}</span><strong>{skill.name}</strong>{skill.level != null && <div className="skill-meter"><i style={{ width: `${Math.min(100, Math.max(0, Number(skill.level)))}%` }} /></div>}</article>)}{!skills.length && <p className="empty-content">Skills will appear here as they are added in the CMS.</p>}</section></main><SiteFooter about={about} /></>;
}