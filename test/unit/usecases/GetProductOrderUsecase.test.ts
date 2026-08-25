import { InfrastructureError } from "../../../src/InfrastructureError";
import { Product } from "../../../src/entities/Product";
import { ProductOrder } from "../../../src/entities/ProductOrder";
import type { ProductOrderRepositoryInterface } from "../../../src/repositories/ProductOrderRepository";
import { GetProductOrderUsecase } from "../../../src/usecases/GetProductOrderUsecase";

describe("GetProductOrderUsecase tests", () => {
  const product = Product.rebuild("111111", "Coca Cola", 10);
  const order = ProductOrder.rebuild(
    "order-1", product, 20, new Date("2024-01-01T12:00:00.000Z"), "opened",
  );

  const repositoryFor = (
    result: ProductOrder | null | InfrastructureError,
  ): ProductOrderRepositoryInterface => ({
    create: () => undefined,
    findById: () => result,
    findAll: () => [],
    close: () => undefined,
  });

  test("should return a product order as a DTO", () => {
    expect(new GetProductOrderUsecase(repositoryFor(order)).execute("order-1"))
      .toEqual({
        id: "order-1",
        product: { barcode: "111111", name: "Coca Cola", quantityInStock: 10 },
        orderQuantity: 20,
        orderDate: new Date("2024-01-01T12:00:00.000Z"),
        status: "opened",
      });
  });

  test("should reject an empty order id", () => {
    expect(new GetProductOrderUsecase(repositoryFor(order)).execute(""))
      .toEqual(new Error("Order id is required"));
  });

  test("should return null when the order does not exist", () => {
    expect(new GetProductOrderUsecase(repositoryFor(null)).execute("missing-id"))
      .toBeNull();
  });

  test("should return an infrastructure error when repository fails", () => {
    expect(new GetProductOrderUsecase(
      repositoryFor(new InfrastructureError("Database error")),
    ).execute("order-1")).toEqual(new InfrastructureError("Database error"));
  });
});
