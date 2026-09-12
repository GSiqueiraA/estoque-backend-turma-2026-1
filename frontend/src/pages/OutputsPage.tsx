import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage, type ProductOutput } from "../api";

export default function OutputsPage() {
  const [outputs, setOutputs] = useState<ProductOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOutputs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<ProductOutput[]>("/product-outputs");
      setOutputs(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOutputs();
  }, [fetchOutputs]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Saídas de Produtos</h1>
          <p className="text-muted">
            Acompanhe as saídas cadastradas e abra os detalhes individuais.
          </p>
        </div>
        <Link to="/outputs/new" className="btn btn-primary">
          Nova Saída
        </Link>
      </div>

      <div className="card">
        {loading ? (
          <p className="empty-text">Carregando...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : outputs.length === 0 ? (
          <p className="empty-text">Nenhuma saída cadastrada.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>UUID</th>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Data da Saída</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {outputs.map(output => (
                  <tr key={output.id}>
                    <td>
                      <strong>{output.id}</strong>
                    </td>
                    <td>{output.product.name}</td>
                    <td>{output.outputQuantity}</td>
                    <td>{new Date(output.outputDate).toLocaleString("pt-BR")}</td>
                    <td>
                      <Link
                        to={`/outputs/${encodeURIComponent(output.id)}`}
                        className="btn btn-secondary btn-sm"
                      >
                        Detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
