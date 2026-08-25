import { GetAllProductOrdersController } from "../../src/controllers/GetAllProductOrdersController";
import { Product } from "../../src/entities/Product";
import { ProductOrder } from "../../src/entities/ProductOrder";
import { ProductOrderRepository } from "../../src/repositories/ProductOrderRepository";
import { ProductRepository } from "../../src/repositories/ProductRepository";
import { SqliteConnection } from "../../src/repositories/SqliteConnection";
import { GetAllProductOrdersUsecase } from "../../src/usecases/GetAllProductOrdersUsecase";

describe("GetAllProductOrders integration tests", () => {
  const sqliteConnection = new SqliteConnection("db/estoque-test.sqlite");
  const productRepository = new ProductRepository(sqliteConnection);
  const productOrderRepository = new ProductOrderRepository(sqliteConnection);
  const usecase = new GetAllProductOrdersUsecase(productOrderRepository);
  const controller = new GetAllProductOrdersController(usecase);

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

  test("should list persisted product orders", async () => {
    const firstProduct = Product.rebuild("111111", "Coca Cola", 10);
    const secondProduct = Product.rebuild("222222", "Pepsi", 5);
    productRepository.create(firstProduct);
    productRepository.create(secondProduct);
    productOrderRepository.create(ProductOrder.rebuild(
      "order-1", firstProduct, 20, new Date("2024-01-01T12:00:00.000Z"), "opened",
    ));
    productOrderRepository.create(ProductOrder.rebuild(
      "order-2", secondProduct, 30, new Date("2024-01-02T12:00:00.000Z"), "closed",
    ));
    const response = responseMock();

    await controller.handle({} as any, response as any);

    expect(response.statusCode).toBe(200);
    expect(response.data).toEqual([
      {
        id: "order-1",
        product: { barcode: "111111", name: "Coca Cola", quantityInStock: 10 },
        orderQuantity: 20,
        orderDate: new Date("2024-01-01T12:00:00.000Z"),
        status: "opened",
      },
      {
        id: "order-2",
        product: { barcode: "222222", name: "Pepsi", quantityInStock: 5 },
        orderQuantity: 30,
        orderDate: new Date("2024-01-02T12:00:00.000Z"),
        status: "closed",
      },
    ]);
  });

  test("should return an empty list when no order is persisted", async () => {
    const response = responseMock();

    await controller.handle({} as any, response as any);

    expect(response.statusCode).toBe(200);
    expect(response.data).toEqual([]);
  });

  test("should return 500 when the database query fails", async () => {
    const failingConnection = new SqliteConnection("lalala.sqlite");
    const failingRepository = new ProductOrderRepository(failingConnection);
    const failingController = new GetAllProductOrdersController(
      new GetAllProductOrdersUsecase(failingRepository),
    );
    const response = responseMock();

    await failingController.handle({} as any, response as any);

    expect(response.statusCode).toBe(500);
    expect(response.data).toEqual({ error: "Database error" });
  });
});
