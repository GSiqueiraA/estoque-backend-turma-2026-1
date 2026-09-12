import { expect, test } from "@playwright/test";

const API = "http://localhost:3000";

// Teste E2E: cadastrar uma saída de produto.
// O Playwright sobe frontend (5173) e backend (3000) via webServer do
// playwright.config.ts. Como o backend não expõe endpoint para definir o
// estoque inicial, o teste cria produto -> pedido -> entrada (estoque 100)
// pela API e depois faz o fluxo de saída pela UI.

test("deve cadastrar uma saída de produto com sucesso", async ({ page, request }) => {
  const barcode = Date.now().toString();
  const productName = `Produto E2E ${barcode}`;

  // 1. Preparar produto com estoque 100 via API
  const productResponse = await request.post(`${API}/products`, {
    data: { barcode, name: productName },
  });
  expect(productResponse.ok()).toBeTruthy();

  const orderResponse = await request.post(`${API}/product-orders`, {
    data: {
      barcode,
      orderQuantity: 100,
      orderDate: "2026-01-10T10:00:00.000Z",
    },
  });
  expect(orderResponse.ok()).toBeTruthy();
  const order = (await orderResponse.json()) as { id: string };

  const inputResponse = await request.post(`${API}/product-inputs`, {
    data: {
      productOrderId: order.id,
      inputQuantity: 100,
      inputDate: "2026-01-12T10:00:00.000Z",
    },
  });
  expect(inputResponse.ok()).toBeTruthy();

  // 2. Navegar para o formulário de nova saída
  await page.goto("/outputs/new");

  // 3. Preencher o formulário
  await page
    .getByRole("textbox", { name: "Código de Barras do Produto" })
    .fill(barcode);
  await page.getByRole("spinbutton", { name: "Quantidade" }).fill("20");
  await page.locator("#outputDate").fill("2026-01-15T10:00");

  // 4. Submeter
  await page.getByRole("button", { name: "Criar Saída" }).click();

  // 5. Ver detalhes da saída criada
  await expect(page.getByText("Saída criada com sucesso!")).toBeVisible();
  await expect(page.getByTestId("output-quantity")).toHaveText("20");
  await expect(page.getByTestId("product-quantity")).toHaveText("80");
});
