import './globals.css';

export const metadata = {
  title: 'Portfolio | Ava Lin Prusty',
  description: 'Modern portfolio and content platform powered by a custom CMS.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Ava Lin Prusty | Portfolio',
    description: 'Thoughtful digital products, built with care.',
    type: 'website'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
