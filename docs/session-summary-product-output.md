# Saída do Produto (ProductOutput) — Resumo da Sessão

Apresentação do trabalho realizado no backend do Sistema de Controle de Estoque.

---

## 1. Contexto da tarefa

Lista do que deve ser feito:

- ✅ **Criar uma saída** — já estava pronto no backend (não foi alterado).
- ✅ **Implementar no backend**: listar todas as saídas e listar uma saída específica (com testes unitários e de integração).
- ✅ **Frontend**: páginas de listar todas as saídas, cadastrar saída e listar uma saída específica (Vite + React).
- ✅ **Playwright**: teste para cadastrar uma saída (`frontend/tests/e2e/`).
- ✅ **Cucumber**: 2 cenários — caminho feliz e caminho com erro (`frontend/features/`).

---

## 2. Correção de erro em `CreateProductOutputUsecase.test.ts`

O arquivo de teste estava com **erros de compilação TypeScript**:

### Problema 1 — assinatura incompatível no mock base

O mock abstrato de `ProductRepositoryInterface` declarava:

```ts
updateStock(): void {}
```

Mas a interface real exige dois parâmetros:

```ts
updateStock(barcode: string, quantityInStock: number): void | InfrastructureError;
```

TypeScript rejeita: *"Target signature provides too few arguments. Expected 2 or more, but got 0."*

**Correção** — mock base passou a aceitar os parâmetros:

```ts
updateStock(barcode: string, quantityInStock: number): void {
  void barcode;
  void quantityInStock;
}
```

### Problema 2 — mocks incompletos após nova funcionalidade

Ao adicionar `findAll()` na interface `ProductOutputRepositoryInterface` (item 3), todos os mocks do teste passaram a não compilar (*"Property 'findAll' is missing"*). Cada `ProductOutputRepositoryMock` recebeu o stub:

```ts
findAll(): ProductOutput[] {
  return [];
}
```

### Observação sobre o regex do UUID (linhas 64–65)

```ts
expect(result.productOutputId).toMatch(
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
);
```

O regex valida que o `id` gerado pela entidade é um **UUID v4**:
- `4` na 3ª posição → versão 4 (aleatório);
- `[89ab]` na 4ª posição → variante RFC 4122;
- `crypto.randomUUID()` (usado em `ProductOutput.create`) sempre gera UUID v4.

---

## 3. Nova funcionalidade: listar saídas

Seguindo a arquitetura em camadas do projeto (Clean Architecture):

```
Rota (index.ts) → Controller → Usecase → Repository → SQLite
```

### 3.1 Repositório — `src/repositories/ProductOutputRepository.ts`

- Interface `ProductOutputRepositoryInterface` ganhou `findAll()`.
- Implementação com `JOIN` para trazer o produto junto da saída:

```sql
SELECT po.id, po.quantity, po.output_date,
       p.barcode, p.name, p.quantity_in_stock
  FROM product_outputs po
  JOIN products p ON p.barcode = po.product_id
```

- Erro de infraestrutura: `InfrastructureError("Failed to list product outputs")`.

### 3.2 Usecases

**`GetAllProductOutputsUsecase.ts`** — lista todas as saídas como DTOs:

```ts
export interface ProductOutputDTO {
    id: string;
    product: { barcode: string; name: string; quantityInStock: number };
    outputQuantity: number;
    outputDate: Date;
}
```

**`GetProductOutputUsecase.ts`** — busca uma saída por `id`:
- id vazio → `Error("Output id is required")`;
- não encontrada → `null` (controller responde 404);
- erro de banco → `InfrastructureError` (controller responde 500).

### 3.3 Controllers

- `GetAllProductOutputsController.ts` — 200 com a lista / 500 em erro de infra.
- `GetProductOutputController.ts` — 200 / 400 (params inválidos ou id vazio) / 404 / 500.

### 3.4 Rotas — `src/index.ts`

```ts
app.get("/product-outputs", ...);        // lista todas
app.get("/product-outputs/:id", ...);    // lista uma específica
```

(Rotas já existentes mantidas: `POST /product-outputs` e `DELETE /product-outputs/:id`.)

---

## 4. Testes criados

### 4.1 Unitários

| Arquivo | Cenários |
|---|---|
| `test/unit/usecases/GetAllProductOutputsUsecase.test.ts` | lista DTOs; lista vazia; erro de infra |
| `test/unit/usecases/GetProductOutputUsecase.test.ts` | DTO correto; id vazio; não encontrada (null); erro de infra |
| `test/unit/controllers/GetProductOutputController.test.ts` | 200; 400 (params undefined/não-objeto); 400 (id vazio); 404; 500 |

### 4.2 Integração (SQLite real em `db/estoque-test.sqlite`)

| Arquivo | Cenários |
|---|---|
| `test/integration/GetAllProductOutputs.test.ts` | lista saídas persistidas; lista vazia; 500 com conexão quebrada |
| `test/integration/GetProductOutput.test.ts` | saída persistida retornada; 404; 500 com conexão quebrada |

Os testes de integração usam o padrão do projeto: `responseMock` simulando o `FastifyReply` e limpeza das tabelas no `beforeEach`.

---

## 5. Resultados

```
Test Suites: 12 passed, 12 total
Tests:       65 passed, 65 total
```

Cobertura dos arquivos novos/alterados: **100%** em statements, branches, funções e linhas:

- `ProductOutputRepository.ts`
- `GetAllProductOutputsUsecase.ts`
- `GetProductOutputUsecase.ts`
- `GetAllProductOutputsController.ts`
- `GetProductOutputController.ts`
- `CreateProductOutputUsecase.ts`

---

## 6. Frontend (Vite + React)

Criado o app em `frontend/` (monorepo minimalista, sem Docker — tudo roda local com Node + SQLite):

```
frontend/
  src/
    pages/OutputsPage.tsx        # listar todas as saídas
    pages/OutputCreatePage.tsx   # cadastrar saída
    pages/OutputDetailsPage.tsx  # detalhes de uma saída específica
    api.ts                       # axios + tipagem das rotas de saída
  tests/e2e/                     # Playwright
  features/                      # Cucumber (feature + steps + world)
  playwright.config.ts
  cucumber.mjs
```

### Páginas implementadas

| Rota | Página | Consome |
|---|---|---|
| `/outputs` | Listar todas as saídas (tabela com UUID, produto, quantidade, data) | `GET /product-outputs` |
| `/outputs/new` | Formulário de nova saída (barcode, quantidade, data) | `POST /product-outputs` |
| `/outputs/:id` | Detalhes da saída (com `data-testid` para os testes) | `GET /product-outputs/:id` |

- Erros da API exibidos na UI (ex.: "Insufficient stock..."); sucesso navega para os detalhes com "Saída criada com sucesso!".
- O Vite faz proxy de `/api` → `localhost:3000` (configurado em `vite.config.ts`).
- Stack: React 19, react-router-dom 7, axios, CSS puro.

### Detalhe importante do backend aproveitado no frontend

Produto criado via API nasce com **estoque 0**. Para ter estoque é preciso o fluxo pedido → entrada: `POST /product-orders` (gera o UUID do pedido) e depois `POST /product-inputs` com esse UUID. Os testes E2E usam esse fluxo pela API antes de exercitar a saída pela UI.

---

## 7. Teste Playwright (E2E)

`frontend/tests/e2e/create-product-output.e2e.spec.ts`

Fluxo testado (Chromium real):

1. Cria produto + pedido + entrada via API (estoque 100).
2. Navega para `/outputs/new`.
3. Preenche barcode, quantidade 20 e data.
4. Submete com "Criar Saída".
5. Valida "Saída criada com sucesso!", `output-quantity` = 20 e estoque atualizado (`product-quantity` = 80).

O `playwright.config.ts` sobe frontend e backend automaticamente (`webServer`), reutilizando servidores já ativos (`reuseExistingServer`).

---

## 8. Cucumber (BDD)

`frontend/features/CreateProductOutput.feature` — 2 cenários:

```gherkin
Scenario: Saída criada com sucesso
  Given que existe um produto com estoque disponível
  When navego para a tela de nova saída
  And preencho os dados da saída com o barcode do produto e uma quantidade menor ou igual ao estoque
  And solicito a criação da saída
  Then devo ver os detalhes da saída criada
  And o estoque do produto deve estar atualizado na saída

Scenario: Erro ao criar a saída quando a quantidade é maior que o estoque
  Given que existe um produto com estoque disponível
  When navego para a tela de nova saída
  And preencho os dados da saída com o barcode do produto e uma quantidade maior que o estoque
  And solicito a criação da saída
  Then devo ver a mensagem de erro de estoque insuficiente
```

- Steps em `features/steps/CreateProductOutput.steps.ts` usam Playwright como driver do navegador (expect do `@playwright/test`) com `CustomWorld` (`features/support/world.ts`) que abre/fecha o Chromium por cenário.
- Caminho feliz: quantidade 30 → valida detalhes e estoque 70.
- Caminho com erro: quantidade 110 → valida "Insufficient stock for the requested output quantity" na UI.
- Resultado: **2 scenarios (2 passed), 15 steps (15 passed)**.

---

## 9. Orquestração de scripts (raiz)

`concurrently` na raiz (padrão monorepo, como no VPtelecom):

| Comando | O que faz |
|---|---|
| `npm run dev:all` | backend (:3000) + frontend (:5173) juntos, com prefixos coloridos |
| `npm run dev:backend` / `dev:frontend` | cada servidor isolado |
| `npm run test` | Jest do backend (65 testes) |
| `npm run test:e2e` | Playwright |
| `npm run cucumber` | Cucumber |
| `npm run build:all` | build backend + frontend |

**Docker: não é necessário** — backend é Node + SQLite (arquivo local) e frontend é Vite; tudo roda com npm.

---

## 10. Pendências restantes

Nenhuma — todos os itens do enunciado foram concluídos.

Possíveis melhorias futuras:
- Deploy (aí sim avaliar Docker/nginx).
- Deletar saída na UI (endpoint já existe: `DELETE /product-outputs/:id`).

---

## Como rodar tudo

```powershell
cd C:\Users\gabri\estoque-backend-turma-2026-1
npm run dev:all          # backend :3000 + frontend :5173

# testes (em outro terminal)
npm run test             # Jest backend (65 testes)
npm run test:e2e         # Playwright
npm run cucumber         # Cucumber (2 cenários)
```

