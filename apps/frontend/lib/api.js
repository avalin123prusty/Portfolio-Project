const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export async function getContent(resource) {
  try {
    const response = await fetch(`${API_URL}/api/${resource}`, { cache: 'no-store' });
    if (!response.ok) return [];
    const items = await response.json();
    return Array.isArray(items) ? items.filter((item) => item.status !== 'draft') : [];
  } catch {
    return [];
  }
}

export async function getAbout() {
  try {
    const response = await fetch(`${API_URL}/api/about`, { cache: 'no-store' });
    return response.ok ? response.json() : null;
  } catch {
    return null;
  }
}

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}