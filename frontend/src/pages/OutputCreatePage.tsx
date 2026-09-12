import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  api,
  getErrorMessage,
  type CreateProductOutputResponse,
} from "../api";

export default function OutputCreatePage() {
  const navigate = useNavigate();
  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [outputDate, setOutputDate] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const { data } = await api.post<CreateProductOutputResponse>(
        "/product-outputs",
        {
          barcode,
          quantity: Number(quantity),
          outputDate: new Date(outputDate).toISOString(),
        },
      );
      navigate(`/outputs/${encodeURIComponent(data.productOutputId)}`, {
        state: { created: true },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nova Saída</h1>
          <p className="text-muted">
            Cadastre uma saída e veja os detalhes após salvar.
          </p>
        </div>
        <Link to="/outputs" className="btn btn-secondary">
          Voltar para Saídas
        </Link>
      </div>

      <div className="card form-card">
        <h2>Dados da Saída</h2>
        <form onSubmit={handleCreate} className="form" noValidate>
          <div className="field">
            <label htmlFor="barcode">Código de Barras do Produto</label>
            <input
              id="barcode"
              type="text"
              value={barcode}
              onChange={event => setBarcode(event.target.value)}
              placeholder="Ex: 1234567890123"
            />
          </div>

          <div className="field">
            <label htmlFor="quantity">Quantidade</label>
            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={event => setQuantity(event.target.value)}
              placeholder="Ex: 10"
            />
          </div>

          <div className="field">
            <label htmlFor="outputDate">Data da Saída</label>
            <input
              id="outputDate"
              type="datetime-local"
              value={outputDate}
              onChange={event => setOutputDate(event.target.value)}
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Criando..." : "Criar Saída"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
