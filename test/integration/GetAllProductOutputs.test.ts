import { GetAllProductOutputsController } from "../../src/controllers/GetAllProductOutputsController";
import { Product } from "../../src/entities/Product";
import { ProductOutput } from "../../src/entities/ProductOutput";
import { ProductOutputRepository } from "../../src/repositories/ProductOutputRepository";
import { ProductRepository } from "../../src/repositories/ProductRepository";
import { SqliteConnection } from "../../src/repositories/SqliteConnection";
import { GetAllProductOutputsUsecase } from "../../src/usecases/GetAllProductOutputsUsecase";

describe("GetAllProductOutputs integration tests", () => {
  const sqliteConnection = new SqliteConnection("db/estoque-test.sqlite");
  const productRepository = new ProductRepository(sqliteConnection);
  const productOutputRepository = new ProductOutputRepository(sqliteConnection);
  const usecase = new GetAllProductOutputsUsecase(productOutputRepository);
  const controller = new GetAllProductOutputsController(usecase);

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

  test("should list persisted product outputs", async () => {
    const firstProduct = Product.rebuild("111111", "Coca Cola", 10);
    const secondProduct = Product.rebuild("222222", "Pepsi", 5);
    productRepository.create(firstProduct);
    productRepository.create(secondProduct);
    productOutputRepository.create(ProductOutput.rebuild(
      "output-1", firstProduct, 3, new Date("2024-01-01T12:00:00.000Z"),
    ));
    productOutputRepository.create(ProductOutput.rebuild(
      "output-2", secondProduct, 2, new Date("2024-01-02T12:00:00.000Z"),
    ));
    const response = responseMock();

    await controller.handle({} as any, response as any);

    expect(response.statusCode).toBe(200);
    expect(response.data).toEqual([
      {
        id: "output-1",
        product: { barcode: "111111", name: "Coca Cola", quantityInStock: 10 },
        outputQuantity: 3,
        outputDate: new Date("2024-01-01T12:00:00.000Z"),
      },
      {
        id: "output-2",
        product: { barcode: "222222", name: "Pepsi", quantityInStock: 5 },
        outputQuantity: 2,
        outputDate: new Date("2024-01-02T12:00:00.000Z"),
      },
    ]);
  });

  test("should return an empty list when no output is persisted", async () => {
    const response = responseMock();

    await controller.handle({} as any, response as any);

    expect(response.statusCode).toBe(200);
    expect(response.data).toEqual([]);
  });

  test("should return 500 when the database query fails", async () => {
    const failingConnection = new SqliteConnection("lalala.sqlite");
    const failingRepository = new ProductOutputRepository(failingConnection);
    const failingController = new GetAllProductOutputsController(
      new GetAllProductOutputsUsecase(failingRepository),
    );
    const response = responseMock();

    await failingController.handle({} as any, response as any);

    expect(response.statusCode).toBe(500);
    expect(response.data).toEqual({ error: "Failed to list product outputs" });
  });
});
