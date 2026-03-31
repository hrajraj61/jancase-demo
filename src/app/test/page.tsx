export default function TestPage() {
  return (
    <div style={{ padding: "20px", backgroundColor: "#0f172a", color: "#e2e8f0", minHeight: "100vh" }}>
      <h1>✅ JanCase Test Page</h1>
      <p>If you can see this, the basic Next.js app is working.</p>
      <p>Current time: {new Date().toLocaleString()}</p>
      
      <h2>Environment Check:</h2>
      <ul>
        <li>Node ENV: {process.env.NODE_ENV}</li>
        <li>Vercel Region: {process.env.VERCEL_REGION || "Not on Vercel"}</li>
      </ul>
      
      <h2>Navigation Test:</h2>
      <ul>
        <li><a href="/" style={{ color: "#60a5fa" }}>← Back to Home</a></li>
        <li><a href="/api/debug" style={{ color: "#60a5fa" }}>API Debug →</a></li>
      </ul>
    </div>
  );
}