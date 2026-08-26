import { Product } from "../../../src/entities/Product";
import { ProductOutput } from "../../../src/entities/ProductOutput";

describe("testing ProductOutput entity", () => {
  test("should create an output linked to a product with a UUID", () => {
    const product = Product.rebuild("1234567890123", "Biscoito Recheado", 100);
    const outputDate = new Date("2024-01-02T12:00:00.000Z");
    const productOutput = ProductOutput.create(product, 20, outputDate);

    expect(productOutput).toBeInstanceOf(ProductOutput);
    if (productOutput instanceof Error) return;

    expect(productOutput.getId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(productOutput.getProduct()).toBe(product);
    expect(productOutput.getProduct().getBarcode()).toBe("1234567890123");
    expect(productOutput.getQuantity()).toBe(20);
    expect(productOutput.getOutputDate()).toBe(outputDate);
  });

  test("should reject a missing product", () => {
    const result = ProductOutput.create(null as any, 20, new Date());

    expect(result).toEqual(new Error("Product is required"));
  });

  test("should reject a non-positive output quantity", () => {
    const result = ProductOutput.create(
      Product.rebuild("1234567890123", "Biscoito Recheado", 100),
      0,
      new Date(),
    );

    expect(result).toEqual(new Error("Quantity must be a positive integer"));
  });

  test("should reject a non-integer output quantity", () => {
    const result = ProductOutput.create(
      Product.rebuild("1234567890123", "Biscoito Recheado", 100),
      1.5,
      new Date(),
    );

    expect(result).toEqual(new Error("Quantity must be a positive integer"));
  });

  test("should reject an output quantity greater than the product stock", () => {
    const result = ProductOutput.create(
      Product.rebuild("1234567890123", "Biscoito Recheado", 10),
      11,
      new Date(),
    );

    expect(result).toEqual(
      new Error("Insufficient stock for the requested output quantity"),
    );
  });

  test("should reject a missing output date", () => {
    const result = ProductOutput.create(
      Product.rebuild("1234567890123", "Biscoito Recheado", 100),
      20,
      null as any,
    );

    expect(result).toEqual(new Error("Invalid output date"));
  });

  test("should reject an invalid output date", () => {
    const result = ProductOutput.create(
      Product.rebuild("1234567890123", "Biscoito Recheado", 100),
      20,
      new Date("invalid"),
    );

    expect(result).toEqual(new Error("Invalid output date"));
  });
});
