import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '../../components/SiteHeader';
import SiteFooter from '../../components/SiteFooter';
import { formatDate, getAbout, getContent } from '../../../lib/api';

export async function generateMetadata({ params }) {
  const post = (await getContent('blogs')).find((item) => item.slug === params.slug || item.id === params.slug);
  return { title: post ? `${post.title} | Journal` : 'Journal | Ava Lin Prusty', description: post?.excerpt };
}

export default async function BlogPostPage({ params }) {
  const [about, blogs] = await Promise.all([getAbout(), getContent('blogs')]);
  const post = blogs.find((item) => item.slug === params.slug || item.id === params.slug);
  if (!post) notFound();
  return <><SiteHeader name={about?.name} /><main><article className="article-page"><Link href="/blog" className="underlined-link">← Back to journal</Link><header><p className="eyebrow">JOURNAL / {formatDate(post.date)}</p><h1>{post.title}</h1>{post.excerpt && <p>{post.excerpt}</p>}<span>{post.readTime || 'A short read'}</span></header><div className="article-content">{post.content.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></article></main><SiteFooter about={about} /></>;
}