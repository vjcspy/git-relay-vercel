export const metadata = {
  title: 'Next.js Playground',
  description: 'A simple Next.js demo application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
