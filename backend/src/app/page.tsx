export default function ApiRootPage() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>Allo Inventory API</h1>
      <p>REST endpoints are under <code>/api/*</code></p>
      <ul>
        <li>
          <a href="/api/health">GET /api/health</a>
        </li>
        <li>
          <a href="/api/products">GET /api/products</a>
        </li>
      </ul>
    </main>
  );
}
