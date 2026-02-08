const features = [
  { icon: '⚡', title: 'Fast Refresh', desc: 'See changes instantly without losing state' },
  { icon: '🧩', title: 'App Router', desc: 'File-based routing with layouts and loading UI' },
  { icon: '🌐', title: 'Server Components', desc: 'Render on the server, stream to the client' },
  { icon: '📦', title: 'Zero Config', desc: 'Automatic compilation and bundling' },
];

export default function Home() {
  return (
    <main style={styles.main}>
      <div style={styles.hero}>
        <h1 style={styles.heading}>
          Next.js <span style={styles.accent}>Playground</span>
        </h1>
        <p style={styles.subtitle}>
          A minimal starter to explore the latest Next.js features.
        </p>
        <div style={styles.badges}>
          <span style={styles.badge}>Next.js 15</span>
          <span style={styles.badge}>React 19</span>
          <span style={styles.badge}>TypeScript</span>
        </div>
      </div>

      <div style={styles.grid}>
        {features.map((f) => (
          <div key={f.title} style={styles.card}>
            <span style={styles.cardIcon}>{f.icon}</span>
            <h3 style={styles.cardTitle}>{f.title}</h3>
            <p style={styles.cardDesc}>{f.desc}</p>
          </div>
        ))}
      </div>

      <footer style={styles.footer}>
        <a href="https://nextjs.org/docs" style={styles.link} target="_blank" rel="noopener noreferrer">
          Docs
        </a>
        <span style={styles.dot}>·</span>
        <a href="https://nextjs.org/learn" style={styles.link} target="_blank" rel="noopener noreferrer">
          Learn
        </a>
        <span style={styles.dot}>·</span>
        <a href="https://vercel.com/templates" style={styles.link} target="_blank" rel="noopener noreferrer">
          Templates
        </a>
      </footer>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)',
    color: '#e0e0e0',
    padding: '2rem',
  },
  hero: { textAlign: 'center', marginBottom: '3rem' },
  heading: { fontSize: '3rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' },
  accent: { color: '#0070f3' },
  subtitle: { fontSize: '1.1rem', color: '#888', marginTop: '0.75rem' },
  badges: { display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' },
  badge: {
    padding: '0.3rem 0.75rem',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    fontSize: '0.8rem',
    color: '#aaa',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.25rem',
    maxWidth: '900px',
    width: '100%',
  },
  card: {
    padding: '1.5rem',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    transition: 'border-color 0.2s',
  },
  cardIcon: { fontSize: '1.5rem' },
  cardTitle: { fontSize: '1rem', fontWeight: 600, margin: '0.75rem 0 0.25rem' },
  cardDesc: { fontSize: '0.85rem', color: '#888', margin: 0, lineHeight: 1.5 },
  footer: { marginTop: '3rem', display: 'flex', gap: '0.5rem', alignItems: 'center' },
  link: { color: '#0070f3', textDecoration: 'none', fontSize: '0.9rem' },
  dot: { color: '#444' },
};
