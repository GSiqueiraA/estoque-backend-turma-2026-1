import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api, getErrorMessage, type ProductOutput } from "../api";

export default function OutputDetailsPage() {
  const { id = "" } = useParams<{ id: string }>();
  const location = useLocation();
  const [output, setOutput] = useState<ProductOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const state = location.state as { created?: boolean } | null;
    if (state?.created) {
      setSuccessMessage("Saída criada com sucesso!");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    let cancelled = false;

    async function fetchOutput() {
      try {
        const { data } = await api.get<ProductOutput>(
          `/product-outputs/${encodeURIComponent(id)}`,
        );
        if (!cancelled) {
          setOutput(data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchOutput();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Detalhes da Saída</h1>
        <Link to="/outputs" className="btn btn-secondary">
          Voltar para Saídas
        </Link>
      </div>

      {successMessage && (
        <p className="success-text" role="status">
          {successMessage}
        </p>
      )}

      {loading ? (
        <div className="card">
          <p className="empty-text">Carregando saída...</p>
        </div>
      ) : error ? (
        <div className="card">
          <p className="error-text">{error}</p>
        </div>
      ) : output ? (
        <div className="card detail-card">
          <div className="detail-list">
            <div className="detail-item">
              <span className="detail-label">UUID</span>
              <strong>
                <div data-testid="output-uuid">{output.id}</div>
              </strong>
            </div>
            <div className="detail-item">
              <span className="detail-label">Produto</span>
              <strong>
                <div data-testid="output-product">{output.product.name}</div>
              </strong>
            </div>
            <div className="detail-item">
              <span className="detail-label">Quantidade</span>
              <strong>
                <div data-testid="output-quantity">{output.outputQuantity}</div>
              </strong>
            </div>
            <div className="detail-item">
              <span className="detail-label">Data da Saída</span>
              <strong>
                <div data-testid="output-date">
                  {new Date(output.outputDate).toLocaleString("pt-BR")}
                </div>
              </strong>
            </div>
            <div className="detail-item">
              <span className="detail-label">Estoque Atual do Produto</span>
              <strong>
                <div data-testid="product-quantity">
                  {output.product.quantityInStock}
                </div>
              </strong>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
