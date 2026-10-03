import Link from 'next/link';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { formatDate, getAbout, getContent } from '../../lib/api';

export const metadata = { title: 'Journal | Ava Lin Prusty', description: 'Notes on product design, engineering, and creative work.' };

export default async function BlogPage() {
  const [about, blogs] = await Promise.all([getAbout(), getContent('blogs')]);
  return <><SiteHeader name={about?.name} /><main><section className="inner-hero"><p className="eyebrow">FIELD NOTES / IDEAS IN PROGRESS</p><h1>A journal for<br /><em>the curious.</em></h1><p>Notes and observations from the practice of making digital things.</p></section><section className="section-wrap journal-page-list">{blogs.map((post) => <article key={post.id}><span>{formatDate(post.date)}</span><div><h2><Link href={`/blog/${post.slug || post.id}`}>{post.title}</Link></h2><p>{post.excerpt}</p></div><Link className="journal-arrow" href={`/blog/${post.slug || post.id}`} aria-label={`Read ${post.title}`}>↗</Link></article>)}{!blogs.length && <p className="empty-content">New writing is on the way.</p>}</section></main><SiteFooter about={about} /></>;
}