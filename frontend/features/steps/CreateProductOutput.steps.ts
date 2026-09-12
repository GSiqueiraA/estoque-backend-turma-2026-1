import { After, Before, Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import type { CustomWorld } from "../support/world";

const API = "http://localhost:3000";

let barcode = "";
const productName = `Produto Cucumber`;

Before({ timeout: 30_000 }, async function (this: CustomWorld) {
  await this.init();
});

After(async function (this: CustomWorld) {
  await this.close();
});

Given(
  "que existe um produto com estoque disponível",
  { timeout: 30_000 },
  async function (this: CustomWorld) {
    barcode = Date.now().toString();
    // Produto nasce com estoque 0; cria pedido + entrada para estoque 100
    const productResponse = await fetch(`${API}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode, name: `${productName} ${barcode}` }),
    });
    expect(productResponse.ok).toBeTruthy();

    const orderResponse = await fetch(`${API}/product-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        barcode,
        orderQuantity: 100,
        orderDate: "2026-01-10T10:00:00.000Z",
      }),
    });
    expect(orderResponse.ok).toBeTruthy();
    const order = (await orderResponse.json()) as { id: string };

    const inputResponse = await fetch(`${API}/product-inputs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productOrderId: order.id,
        inputQuantity: 100,
        inputDate: "2026-01-12T10:00:00.000Z",
      }),
    });
    expect(inputResponse.ok).toBeTruthy();
  },
);

When("navego para a tela de nova saída", async function (this: CustomWorld) {
  await this.page!.goto("/outputs/new");
});

When(
  "preencho os dados da saída com o barcode do produto e uma quantidade menor ou igual ao estoque",
  async function (this: CustomWorld) {
    await this.page!
      .getByRole("textbox", { name: "Código de Barras do Produto" })
      .fill(barcode);
    await this.page!.getByRole("spinbutton", { name: "Quantidade" }).fill("30");
    await this.page!.locator("#outputDate").fill("2026-01-15T10:00");
  },
);

When(
  "preencho os dados da saída com o barcode do produto e uma quantidade maior que o estoque",
  async function (this: CustomWorld) {
    await this.page!
      .getByRole("textbox", { name: "Código de Barras do Produto" })
      .fill(barcode);
    await this.page!.getByRole("spinbutton", { name: "Quantidade" }).fill("110");
    await this.page!.locator("#outputDate").fill("2026-01-15T10:00");
  },
);

When("solicito a criação da saída", async function (this: CustomWorld) {
  await this.page!.getByRole("button", { name: "Criar Saída" }).click();
});

Then(
  "devo ver os detalhes da saída criada",
  { timeout: 15_000 },
  async function (this: CustomWorld) {
    await expect(this.page!.getByText("Saída criada com sucesso!")).toBeVisible();
    await expect(this.page!.getByTestId("output-quantity")).toHaveText("30");
  },
);

Then(
  "o estoque do produto deve estar atualizado na saída",
  { timeout: 15_000 },
  async function (this: CustomWorld) {
    await expect(this.page!.getByTestId("product-quantity")).toHaveText("70");
  },
);

Then(
  "devo ver a mensagem de erro de estoque insuficiente",
  { timeout: 15_000 },
  async function (this: CustomWorld) {
    await expect(
      this.page!.getByText("Insufficient stock for the requested output quantity"),
    ).toBeVisible();
  },
);
