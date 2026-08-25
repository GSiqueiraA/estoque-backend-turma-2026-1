import { GetProductOrderController } from "../../src/controllers/GetProductOrderController";
import { Product } from "../../src/entities/Product";
import { ProductOrder } from "../../src/entities/ProductOrder";
import { ProductOrderRepository } from "../../src/repositories/ProductOrderRepository";
import { ProductRepository } from "../../src/repositories/ProductRepository";
import { SqliteConnection } from "../../src/repositories/SqliteConnection";
import { GetProductOrderUsecase } from "../../src/usecases/GetProductOrderUsecase";

describe("GetProductOrder integration tests", () => {
  const sqliteConnection = new SqliteConnection("db/estoque-test.sqlite");
  const productRepository = new ProductRepository(sqliteConnection);
  const productOrderRepository = new ProductOrderRepository(sqliteConnection);
  const usecase = new GetProductOrderUsecase(productOrderRepository);
  const controller = new GetProductOrderController(usecase);

  beforeEach(() => {
    const connection = sqliteConnection.getConnection();
    connection.exec("DELETE FROM product_inputs");
    connection.exec("DELETE FROM product_orders");
    connection.exec("DELETE FROM products");
  });

  const responseMock = () => ({
    statusCode: 0,
    data: null as any,
    status(code: number) { this.statusCode = code; return this; },
    send(data: any) { this.data = data; return this; },
  });

  test("should return a persisted product order", async () => {
    const product = Product.rebuild("111111", "Coca Cola", 10);
    productRepository.create(product);
    productOrderRepository.create(ProductOrder.rebuild(
      "order-1", product, 20, new Date("2024-01-01T12:00:00.000Z"), "opened",
    ));
    const response = responseMock();

    await controller.handle({ params: { id: "order-1" } } as any, response as any);

    expect(response.statusCode).toBe(200);
    expect(response.data).toEqual({
      id: "order-1",
      product: { barcode: "111111", name: "Coca Cola", quantityInStock: 10 },
      orderQuantity: 20,
      orderDate: new Date("2024-01-01T12:00:00.000Z"),
      status: "opened",
    });
  });

  test("should return 404 when the product order does not exist", async () => {
    const response = responseMock();

    await controller.handle({ params: { id: "missing-id" } } as any, response as any);

    expect(response.statusCode).toBe(404);
    expect(response.data).toEqual({ error: "Product order not found" });
  });

  test("should return 500 when the database query fails", async () => {
    const failingConnection = new SqliteConnection("lalala.sqlite");
    const failingRepository = new ProductOrderRepository(failingConnection);
    const failingController = new GetProductOrderController(
      new GetProductOrderUsecase(failingRepository),
    );
    const response = responseMock();

    await failingController.handle({ params: { id: "order-1" } } as any, response as any);

    expect(response.statusCode).toBe(500);
    expect(response.data).toEqual({ error: "Database error" });
  });
});
