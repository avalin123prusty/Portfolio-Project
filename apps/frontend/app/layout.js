import './globals.css';

export const metadata = {
  title: 'Portfolio | Ava Lin Prusty',
  description: 'Modern portfolio and content platform powered by a custom CMS.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
