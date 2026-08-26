import { Product } from "../../../src/entities/Product";
import { ProductOutput } from "../../../src/entities/ProductOutput";
import { InfrastructureError } from "../../../src/InfrastructureError";
import { ProductOutputRepository } from "../../../src/repositories/ProductOutputRepository";
import { ProductRepository } from "../../../src/repositories/ProductRepository";
import { SqliteConnection } from "../../../src/repositories/SqliteConnection";

describe("ProductOutputRepository tests", () => {
  const sqliteConnection = new SqliteConnection("db/estoque-test.sqlite");

  beforeEach(() => {
    const connection = sqliteConnection.getConnection();
    connection.exec("DELETE FROM product_outputs");
    connection.exec("DELETE FROM product_inputs");
    connection.exec("DELETE FROM product_orders");
    connection.exec("DELETE FROM products");
  });

  test("should create a product output", () => {
    const product = Product.rebuild("1234567890123", "Biscoito Recheado", 100);
    const productRepository = new ProductRepository(sqliteConnection);
    const productOutputRepository = new ProductOutputRepository(sqliteConnection);
    productRepository.create(product);

    const outputDate = new Date("2024-01-02T12:00:00.000Z");
    const productOutput = ProductOutput.create(product, 20, outputDate);

    expect(productOutput).toBeInstanceOf(ProductOutput);
    if (productOutput instanceof Error) return;

    const result = productOutputRepository.create(productOutput);

    expect(result).toBeUndefined();
    const row = sqliteConnection.getConnection()
      .prepare("SELECT * FROM product_outputs WHERE id = ?")
      .get(productOutput.getId()) as {
        id: string;
        product_id: string;
        quantity: number;
        output_date: string;
      };
    expect(row).toEqual({
      id: productOutput.getId(),
      product_id: product.getBarcode(),
      quantity: 20,
      output_date: outputDate.toISOString(),
    });
  });

  test("should return an infrastructure error when creating an output fails", () => {
    const productOutputRepository = new ProductOutputRepository({
      getConnection: () => ({
        prepare: () => {
          throw new Error("database unavailable");
        },
      }),
    } as any);

    const result = productOutputRepository.create({} as ProductOutput);

    expect(result).toEqual(new InfrastructureError("Failed to create product output"));
  });
});
