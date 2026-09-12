import { Link, Route, Routes } from "react-router-dom";
import OutputsPage from "./pages/OutputsPage";
import OutputCreatePage from "./pages/OutputCreatePage";
import OutputDetailsPage from "./pages/OutputDetailsPage";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          Controle de Estoque
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link">
            Início
          </Link>
          <Link to="/outputs" className="nav-link">
            Saídas
          </Link>
          <Link to="/outputs/new" className="nav-link">
            Nova Saída
          </Link>
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/outputs" element={<OutputsPage />} />
          <Route path="/outputs/new" element={<OutputCreatePage />} />
          <Route path="/outputs/:id" element={<OutputDetailsPage />} />
        </Routes>
      </main>
    </div>
  );
}

function Home() {
  return (
    <div className="page">
      <h1 className="page-title">Sistema de Controle de Estoque</h1>
      <p className="text-muted">
        Use o menu para gerenciar as saídas de produtos.
      </p>
      <Link to="/outputs" className="btn btn-primary">
        Ver Saídas
      </Link>
    </div>
  );
}
