export default function HomePage() {
  return (
    <main className="page">
      <section className="welcome">
        <p className="eyebrow">ELEGAN · ADMINISTRACIÓN</p>
        <h1>Panel administrativo</h1>
        <p className="muted">
          Administra el catálogo de Elegan y controla qué productos y categorías
          están publicados en la aplicación móvil.
        </p>
        <div className="status">
          <span className="dot" />
          Panel administrativo conectado a la API
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 22, marginTop: 28 }}>
          <a href="/productos" style={{ color: "#17191d", fontWeight: 700 }}>
            Administrar productos →
          </a>
          <a href="/categorias" style={{ color: "#17191d", fontWeight: 700 }}>
            Administrar categorías →
          </a>
        </div>
      </section>
    </main>
  );
}
