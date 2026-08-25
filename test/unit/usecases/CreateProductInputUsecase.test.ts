import { Product } from "../../../src/entities/Product";
import { ProductInput } from "../../../src/entities/ProductInput";
import { ProductOrder } from "../../../src/entities/ProductOrder";
import { InfrastructureError } from "../../../src/InfrastructureError";
import type { ProductInputRepositoryInterface } from "../../../src/repositories/ProductInputRepository";
import type { ProductStockRepositoryInterface } from "../../../src/repositories/ProductRepository";
import type { ProductOrderRepositoryInterface } from "../../../src/repositories/ProductOrderRepository";
import { CreateProductInputUsecase } from "../../../src/usecases/CreateProductInputUsecase";

abstract class ProductOrderRepositoryMockBase
  implements ProductOrderRepositoryInterface
{
  create(): void {}

  findAll(): ProductOrder[] {
    return [];
  }

  abstract findById(
    id: string,
  ): ProductOrder | null | InfrastructureError;

  close(): void {}
}

describe("CreateProductInputUsecase tests", () => {
  test("should create an input for an existing product order", () => {
    const product = Product.rebuild("1234567890123", "Biscoito Recheado", 100);
    const order = ProductOrder.create(
      product,
      20,
      new Date("2024-01-01T12:00:00.000Z"),
    );

    expect(order).toBeInstanceOf(ProductOrder);
    if (order instanceof Error) return;

    class ProductOrderRepositoryMock extends ProductOrderRepositoryMockBase {
      findById(id: string): ProductOrder | null | InfrastructureError {
        return id === order.getId() ? order : null;
      }
    }

    class ProductInputRepositoryMock implements ProductInputRepositoryInterface {
      createdInput: ProductInput | null = null;

      create(productInput: ProductInput): void | InfrastructureError {
        this.createdInput = productInput;
      }
    }

    const productInputRepository = new ProductInputRepositoryMock();
    const usecase = new CreateProductInputUsecase(
      new ProductOrderRepositoryMock() as any,
      productInputRepository,
    );
    const inputDate = new Date("2024-01-02T12:00:00.000Z");

    const result = usecase.execute(order.getId(), 20, inputDate);

    expect(result).not.toBeInstanceOf(Error);
    if (!(result instanceof Error)) {
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(result.productOrder).toBe(order);
      expect(result.inputQuantity).toBe(20);
      expect(result.inputDate).toBe(inputDate);
    }
    expect(productInputRepository.createdInput?.getProductOrder()).toBe(order);
  });

  test("should return an error when the product order does not exist", () => {
    class ProductOrderRepositoryMock extends ProductOrderRepositoryMockBase {
      findById(): ProductOrder | null {
        return null;
      }
    }

    class ProductInputRepositoryMock implements ProductInputRepositoryInterface {
      create(): void {}
    }

    const usecase = new CreateProductInputUsecase(
      new ProductOrderRepositoryMock(),
      new ProductInputRepositoryMock(),
    );

    const result = usecase.execute("missing-order", 20, new Date());

    expect(result).toEqual(new Error("Product order does not exist"));
  });

  test("should return an infrastructure error when finding the product order fails", () => {
    const databaseError = new InfrastructureError("Database error");

    class ProductOrderRepositoryMock extends ProductOrderRepositoryMockBase {
      findById(): ProductOrder | null | InfrastructureError {
        return databaseError;
      }
    }

    class ProductInputRepositoryMock implements ProductInputRepositoryInterface {
      create(): void {}
    }

    const usecase = new CreateProductInputUsecase(
      new ProductOrderRepositoryMock(),
      new ProductInputRepositoryMock(),
    );

    const result = usecase.execute("order-id", 20, new Date());

    expect(result).toBe(databaseError);
  });

  test("should return an error when the input entity rejects the quantity", () => {
    const product = Product.rebuild("1234567890123", "Biscoito Recheado", 100);
    const order = ProductOrder.create(
      product,
      20,
      new Date("2024-01-01T12:00:00.000Z"),
    );

    expect(order).toBeInstanceOf(ProductOrder);
    if (order instanceof Error) return;

    class ProductOrderRepositoryMock extends ProductOrderRepositoryMockBase {
      findById(): ProductOrder {
        return order;
      }
    }

    class ProductInputRepositoryMock implements ProductInputRepositoryInterface {
      create(): void {}
    }

    const usecase = new CreateProductInputUsecase(
      new ProductOrderRepositoryMock(),
      new ProductInputRepositoryMock(),
    );

    const result = usecase.execute(order.getId(), 0, new Date());

    expect(result).toEqual(new Error("Input quantity must be a positive integer"));
  });

  test("should return an infrastructure error when creating the input fails", () => {
    const product = Product.rebuild("1234567890123", "Biscoito Recheado", 100);
    const order = ProductOrder.create(
      product,
      20,
      new Date("2024-01-01T12:00:00.000Z"),
    );
    const databaseError = new InfrastructureError("Failed to create product input");

    expect(order).toBeInstanceOf(ProductOrder);
    if (order instanceof Error) return;

    class ProductOrderRepositoryMock extends ProductOrderRepositoryMockBase {
      findById(): ProductOrder {
        return order;
      }
    }

    class ProductInputRepositoryMock implements ProductInputRepositoryInterface {
      create(): void | InfrastructureError {
        return databaseError;
      }
    }

    const usecase = new CreateProductInputUsecase(
      new ProductOrderRepositoryMock(),
      new ProductInputRepositoryMock(),
    );

    const result = usecase.execute(
      order.getId(),
      20,
      new Date("2024-01-02T12:00:00.000Z"),
    );

    expect(result).toBe(databaseError);
  });

  test("should reject an input when the product order is not open", () => {
    const product = Product.rebuild("1234567890123", "Biscoito Recheado", 100);
    const closedOrder = ProductOrder.rebuild(
      "closed-order",
      product,
      20,
      new Date("2024-01-01T12:00:00.000Z"),
      "closed",
    );
    let createCalled = false;

    class ProductOrderRepositoryMock extends ProductOrderRepositoryMockBase {
      findById(): ProductOrder {
        return closedOrder;
      }
    }

    class ProductInputRepositoryMock implements ProductInputRepositoryInterface {
      create(): void {
        createCalled = true;
      }
    }

    const result = new CreateProductInputUsecase(
      new ProductOrderRepositoryMock(),
      new ProductInputRepositoryMock(),
    ).execute("closed-order", 20, new Date("2024-01-02T12:00:00.000Z"));

    expect(result).toEqual(new Error("Product order is not in opened status"));
    expect(createCalled).toBe(false);
  });

  test("should reject an input dated before the product order", () => {
    const product = Product.rebuild("1234567890123", "Biscoito Recheado", 100);
    const order = ProductOrder.rebuild(
      "order-id",
      product,
      20,
      new Date("2024-01-02T12:00:00.000Z"),
      "opened",
    );
    let createCalled = false;

    class ProductOrderRepositoryMock extends ProductOrderRepositoryMockBase {
      findById(): ProductOrder {
        return order;
      }
    }

    class ProductInputRepositoryMock implements ProductInputRepositoryInterface {
      create(): void {
        createCalled = true;
      }
    }

    const result = new CreateProductInputUsecase(
      new ProductOrderRepositoryMock(),
      new ProductInputRepositoryMock(),
    ).execute("order-id", 20, new Date("2024-01-01T12:00:00.000Z"));

    expect(result).toEqual(
      new Error("Input date cannot be before the product order date"),
    );
    expect(createCalled).toBe(false);
  });

  test("should stop when updating the product stock fails", () => {
    const product = Product.rebuild("1234567890123", "Biscoito Recheado", 100);
    const order = ProductOrder.rebuild(
      "order-id",
      product,
      20,
      new Date("2024-01-01T12:00:00.000Z"),
      "opened",
    );
    const databaseError = new InfrastructureError("Database error");
    let closeCalled = false;

    class ProductOrderRepositoryMock extends ProductOrderRepositoryMockBase {
      findById(): ProductOrder {
        return order;
      }

      close(): void {
        closeCalled = true;
      }
    }

    class ProductInputRepositoryMock implements ProductInputRepositoryInterface {
      create(): void {}
    }

    class ProductRepositoryMock implements ProductStockRepositoryInterface {
      updateStock(): InfrastructureError {
        return databaseError;
      }
    }

    const result = new CreateProductInputUsecase(
      new ProductOrderRepositoryMock(),
      new ProductInputRepositoryMock(),
      new ProductRepositoryMock(),
    ).execute("order-id", 20, new Date("2024-01-02T12:00:00.000Z"));

    expect(result).toBe(databaseError);
    expect(closeCalled).toBe(false);
  });

  test("should stop when closing the product order fails", () => {
    const product = Product.rebuild("1234567890123", "Biscoito Recheado", 100);
    const order = ProductOrder.rebuild(
      "order-id",
      product,
      20,
      new Date("2024-01-01T12:00:00.000Z"),
      "opened",
    );
    const databaseError = new InfrastructureError("Database error");
    let updatedStock = false;

    class ProductOrderRepositoryMock extends ProductOrderRepositoryMockBase {
      findById(): ProductOrder {
        return order;
      }

      close(): InfrastructureError {
        return databaseError;
      }
    }

    class ProductInputRepositoryMock implements ProductInputRepositoryInterface {
      create(): void {}
    }

    class ProductRepositoryMock implements ProductStockRepositoryInterface {
      updateStock(): void {
        updatedStock = true;
      }
    }

    const result = new CreateProductInputUsecase(
      new ProductOrderRepositoryMock(),
      new ProductInputRepositoryMock(),
      new ProductRepositoryMock(),
    ).execute("order-id", 20, new Date("2024-01-02T12:00:00.000Z"));

    expect(result).toBe(databaseError);
    expect(updatedStock).toBe(true);
  });
});
