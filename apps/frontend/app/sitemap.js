import { getContent } from '../lib/api';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap() {
  const blogs = await getContent('blogs');
  const staticRoutes = ['', '/about', '/projects', '/skills', '/experience', '/blog', '/contact'];
  return [
    ...staticRoutes.map((route) => ({ url: `${siteUrl}${route}`, lastModified: new Date() })),
    ...blogs.map((post) => ({ url: `${siteUrl}/blog/${post.slug || post.id}`, lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date() }))
  ];
}