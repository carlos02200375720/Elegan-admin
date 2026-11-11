export default function HomePage() {
  return (
    <main className="page">
      <section className="welcome">
        <p className="eyebrow">ELEGAN · ADMINISTRACIÓN</p>
        <h1>Panel administrativo</h1>
        <p className="muted">
          Base independiente del panel web. La conexión con la API se configurará
          mediante variables de entorno y endpoints administrativos protegidos.
        </p>
        <div className="status">
          <span className="dot" />
          Interfaz inicial preparada
        </div>
      </section>
    </main>
  );
}
