import { Product } from "../../../src/entities/Product";
import { ProductOutput } from "../../../src/entities/ProductOutput";
import { InfrastructureError } from "../../../src/InfrastructureError";
import type { ProductOutputRepositoryInterface } from "../../../src/repositories/ProductOutputRepository";
import type { ProductRepositoryInterface } from "../../../src/repositories/ProductRepository";
import { CreateProductOutputUsecase } from "../../../src/usecases/CreateProductOutputUsecase";

abstract class ProductRepositoryMockBase implements ProductRepositoryInterface {
  create(): void {}

  findAll(): Product[] {
    return [];
  }

  updateStock(): void {}

  abstract findByBarcode(
    barcode: string,
  ): Product | null | InfrastructureError;
}

describe("CreateProductOutputUsecase tests", () => {
  test("should create an output for an existing product", () => {
    const product = Product.rebuild("1234567890123", "Biscoito Recheado", 100);

    class ProductRepositoryMock extends ProductRepositoryMockBase {
      findByBarcode(barcode: string): Product | null | InfrastructureError {
        return barcode === product.getBarcode() ? product : null;
      }

      updateStock(barcode: string, quantityInStock: number): void | InfrastructureError {
        expect(barcode).toBe(product.getBarcode());
        expect(quantityInStock).toBe(80);
      }
    }

    class ProductOutputRepositoryMock implements ProductOutputRepositoryInterface {
      createdOutput: ProductOutput | null = null;

      create(productOutput: ProductOutput): void | InfrastructureError {
        this.createdOutput = productOutput;
      }
    }

    const productOutputRepository = new ProductOutputRepositoryMock();
    const usecase = new CreateProductOutputUsecase(
      new ProductRepositoryMock(),
      productOutputRepository,
    );
    const outputDate = new Date("2024-01-02T12:00:00.000Z");

    const result = usecase.execute(product.getBarcode(), 20, outputDate);

    expect(result).not.toBeInstanceOf(Error);
    if (!(result instanceof Error)) {
      expect(result.productOutputId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(result.productOutputQuantity).toBe(20);
      expect(result.productOutputDate).toBe(outputDate);
      expect(result.productBarcode).toBe(product.getBarcode());
      expect(result.productName).toBe(product.getName());
      expect(result.productStock).toBe(80);
    }
    expect(productOutputRepository.createdOutput?.getProduct()).toBe(product);
  });

  test("should return an error when the product does not exist", () => {
    class ProductRepositoryMock extends ProductRepositoryMockBase {
      findByBarcode(): Product | null {
        return null;
      }
    }

    class ProductOutputRepositoryMock implements ProductOutputRepositoryInterface {
      create(): void {}
    }

    const usecase = new CreateProductOutputUsecase(
      new ProductRepositoryMock(),
      new ProductOutputRepositoryMock(),
    );

    const result = usecase.execute("missing-barcode", 20, new Date());

    expect(result).toEqual(new Error("Product not found"));
  });

  test("should return an infrastructure error when finding the product fails", () => {
    const databaseError = new InfrastructureError("Database error");

    class ProductRepositoryMock extends ProductRepositoryMockBase {
      findByBarcode(): Product | null | InfrastructureError {
        return databaseError;
      }
    }

    class ProductOutputRepositoryMock implements ProductOutputRepositoryInterface {
      create(): void {}
    }

    const usecase = new CreateProductOutputUsecase(
      new ProductRepositoryMock(),
      new ProductOutputRepositoryMock(),
    );

    const result = usecase.execute("1234567890123", 20, new Date());

    expect(result).toBe(databaseError);
  });

  test("should return an error when the output entity rejects the quantity", () => {
    const product = Product.rebuild("1234567890123", "Biscoito Recheado", 100);

    class ProductRepositoryMock extends ProductRepositoryMockBase {
      findByBarcode(): Product {
        return product;
      }
    }

    class ProductOutputRepositoryMock implements ProductOutputRepositoryInterface {
      create(): void {}
    }

    const usecase = new CreateProductOutputUsecase(
      new ProductRepositoryMock(),
      new ProductOutputRepositoryMock(),
    );

    const result = usecase.execute(product.getBarcode(), 0, new Date());

    expect(result).toEqual(new Error("Quantity must be a positive integer"));
  });

  test("should return an error when the output quantity exceeds the product stock", () => {
    const product = Product.rebuild("1234567890123", "Biscoito Recheado", 10);
    let createCalled = false;

    class ProductRepositoryMock extends ProductRepositoryMockBase {
      findByBarcode(): Product {
        return product;
      }
    }

    class ProductOutputRepositoryMock implements ProductOutputRepositoryInterface {
      create(): void {
        createCalled = true;
      }
    }

    const usecase = new CreateProductOutputUsecase(
      new ProductRepositoryMock(),
      new ProductOutputRepositoryMock(),
    );

    const result = usecase.execute(product.getBarcode(), 11, new Date());

    expect(result).toEqual(
      new Error("Insufficient stock for the requested output quantity"),
    );
    expect(createCalled).toBe(false);
  });

  test("should return an infrastructure error when creating the output fails", () => {
    const product = Product.rebuild("1234567890123", "Biscoito Recheado", 100);
    const databaseError = new InfrastructureError("Failed to create product output");
    let updatedStock = false;

    class ProductRepositoryMock extends ProductRepositoryMockBase {
      findByBarcode(): Product {
        return product;
      }

      updateStock(): void {
        updatedStock = true;
      }
    }

    class ProductOutputRepositoryMock implements ProductOutputRepositoryInterface {
      create(): void | InfrastructureError {
        return databaseError;
      }
    }

    const usecase = new CreateProductOutputUsecase(
      new ProductRepositoryMock(),
      new ProductOutputRepositoryMock(),
    );

    const result = usecase.execute(
      product.getBarcode(),
      20,
      new Date("2024-01-02T12:00:00.000Z"),
    );

    expect(result).toBe(databaseError);
    expect(updatedStock).toBe(false);
  });

  test("should stop when updating the product stock fails", () => {
    const product = Product.rebuild("1234567890123", "Biscoito Recheado", 100);
    const databaseError = new InfrastructureError("Database error");
    let createCalled = false;

    class ProductRepositoryMock extends ProductRepositoryMockBase {
      findByBarcode(): Product {
        return product;
      }

      updateStock(): InfrastructureError {
        return databaseError;
      }
    }

    class ProductOutputRepositoryMock implements ProductOutputRepositoryInterface {
      create(): void {
        createCalled = true;
      }
    }

    const result = new CreateProductOutputUsecase(
      new ProductRepositoryMock(),
      new ProductOutputRepositoryMock(),
    ).execute(
      product.getBarcode(),
      20,
      new Date("2024-01-02T12:00:00.000Z"),
    );

    expect(result).toBe(databaseError);
    expect(createCalled).toBe(true);
  });
});
