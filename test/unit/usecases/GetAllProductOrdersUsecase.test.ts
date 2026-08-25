import { InfrastructureError } from "../../../src/InfrastructureError";
import { Product } from "../../../src/entities/Product";
import { ProductOrder } from "../../../src/entities/ProductOrder";
import type { ProductOrderRepositoryInterface } from "../../../src/repositories/ProductOrderRepository";
import { GetAllProductOrdersUsecase } from "../../../src/usecases/GetAllProductOrdersUsecase";

describe("GetAllProductOrdersUsecase tests", () => {
  test("should return all product orders as DTOs", () => {
    const product = Product.rebuild("111111", "Coca Cola", 10);
    const order = ProductOrder.rebuild(
      "order-1", product, 20, new Date("2024-01-01T12:00:00.000Z"), "opened",
    );
    const repository: ProductOrderRepositoryInterface = {
      create: () => undefined,
      findById: () => null,
      findAll: () => [order],
      close: () => undefined,
    };

    const result = new GetAllProductOrdersUsecase(repository).execute();

    expect(result).toEqual([{
      id: "order-1",
      product: { barcode: "111111", name: "Coca Cola", quantityInStock: 10 },
      orderQuantity: 20,
      orderDate: new Date("2024-01-01T12:00:00.000Z"),
      status: "opened",
    }]);
  });

  test("should return an infrastructure error when repository fails", () => {
    const repository: ProductOrderRepositoryInterface = {
      create: () => undefined,
      findById: () => null,
      findAll: () => new InfrastructureError("Database error"),
      close: () => undefined,
    };

    expect(new GetAllProductOrdersUsecase(repository).execute())
      .toEqual(new InfrastructureError("Database error"));
  });
});
