import { GetProductOutputController } from "../../src/controllers/GetProductOutputController";
import { Product } from "../../src/entities/Product";
import { ProductOutput } from "../../src/entities/ProductOutput";
import { ProductOutputRepository } from "../../src/repositories/ProductOutputRepository";
import { ProductRepository } from "../../src/repositories/ProductRepository";
import { SqliteConnection } from "../../src/repositories/SqliteConnection";
import { GetProductOutputUsecase } from "../../src/usecases/GetProductOutputUsecase";

describe("GetProductOutput integration tests", () => {
  const sqliteConnection = new SqliteConnection("db/estoque-test.sqlite");
  const productRepository = new ProductRepository(sqliteConnection);
  const productOutputRepository = new ProductOutputRepository(sqliteConnection);
  const usecase = new GetProductOutputUsecase(productOutputRepository);
  const controller = new GetProductOutputController(usecase);

  beforeEach(() => {
    const connection = sqliteConnection.getConnection();
    connection.exec("DELETE FROM product_inputs");
    connection.exec("DELETE FROM product_outputs");
    connection.exec("DELETE FROM products");
  });

  const responseMock = () => ({
    statusCode: 0,
    data: null as any,
    status(code: number) { this.statusCode = code; return this; },
    send(data: any) { this.data = data; return this; },
  });

  test("should return a persisted product output", async () => {
    const product = Product.rebuild("111111", "Coca Cola", 10);
    productRepository.create(product);
    productOutputRepository.create(ProductOutput.rebuild(
      "output-1", product, 3, new Date("2024-01-01T12:00:00.000Z"),
    ));
    const response = responseMock();

    await controller.handle({ params: { id: "output-1" } } as any, response as any);

    expect(response.statusCode).toBe(200);
    expect(response.data).toEqual({
      id: "output-1",
      product: { barcode: "111111", name: "Coca Cola", quantityInStock: 10 },
      outputQuantity: 3,
      outputDate: new Date("2024-01-01T12:00:00.000Z"),
    });
  });

  test("should return 404 when the product output does not exist", async () => {
    const response = responseMock();

    await controller.handle({ params: { id: "missing-id" } } as any, response as any);

    expect(response.statusCode).toBe(404);
    expect(response.data).toEqual({ error: "Product output not found" });
  });

  test("should return 500 when the database query fails", async () => {
    const failingConnection = new SqliteConnection("lalala.sqlite");
    const failingRepository = new ProductOutputRepository(failingConnection);
    const failingController = new GetProductOutputController(
      new GetProductOutputUsecase(failingRepository),
    );
    const response = responseMock();

    await failingController.handle({ params: { id: "output-1" } } as any, response as any);

    expect(response.statusCode).toBe(500);
    expect(response.data).toEqual({ error: "Failed to find product output" });
  });
});
