import { Product } from "../../../src/entities/Product";
import { ProductOrder } from "../../../src/entities/ProductOrder";
import { ProductOrderRepository } from "../../../src/repositories/ProductOrderRepository";
import { ProductRepository } from "../../../src/repositories/ProductRepository";
import { SqliteConnection } from "../../../src/repositories/SqliteConnection";
import { InfrastructureError } from "../../../src/InfrastructureError";

describe("ProductOrderRepository tests", () => {
  const sqliteConnection = new SqliteConnection("db/estoque-test.sqlite");

  beforeEach(() => {
    const connection = sqliteConnection.getConnection();
    connection.exec("DELETE FROM product_inputs");
    connection.exec("DELETE FROM product_orders");
    connection.exec("DELETE FROM products");
  });

  test("should find a product order by id", () => {
    const product = Product.rebuild("1234567890123", "Biscoito Recheado", 100);
    const productRepository = new ProductRepository(sqliteConnection);
    const productOrderRepository = new ProductOrderRepository(sqliteConnection);
    productRepository.create(product);
    const order = ProductOrder.create(
      product,
      20,
      new Date("2024-01-01T12:00:00.000Z"),
    );

    expect(order).toBeInstanceOf(ProductOrder);
    if (order instanceof Error) return;
    productOrderRepository.create(order);

    const result = productOrderRepository.findById(order.getId());

    expect(result).toBeInstanceOf(ProductOrder);
    if (result instanceof ProductOrder) {
      expect(result.getId()).toBe(order.getId());
      expect(result.getProduct().getBarcode()).toBe(product.getBarcode());
      expect(result.getOrderQuantity()).toBe(20);
      expect(result.getOrderDate()).toEqual(order.getOrderDate());
      expect(result.getStatus()).toBe("opened");
    }
  });

  test("should return null when a product order does not exist", () => {
    const result = new ProductOrderRepository(sqliteConnection).findById("missing-id");

    expect(result).toBeNull();
  });

  test("should find all product orders", () => {
    const product = Product.rebuild("111111", "Coca Cola", 10);
    const secondProduct = Product.rebuild("222222", "Pepsi", 5);
    const productRepository = new ProductRepository(sqliteConnection);
    const repository = new ProductOrderRepository(sqliteConnection);
    productRepository.create(product);
    productRepository.create(secondProduct);

    repository.create(ProductOrder.rebuild(
      "order-1", product, 20, new Date("2024-01-01T12:00:00.000Z"), "opened",
    ));
    repository.create(ProductOrder.rebuild(
      "order-2", secondProduct, 30, new Date("2024-01-02T12:00:00.000Z"), "closed",
    ));

    const result = repository.findAll();

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      ProductOrder.rebuild(
        "order-1", Product.rebuild("111111", "Coca Cola", 10), 20,
        new Date("2024-01-01T12:00:00.000Z"), "opened",
      ),
      ProductOrder.rebuild(
        "order-2", Product.rebuild("222222", "Pepsi", 5), 30,
        new Date("2024-01-02T12:00:00.000Z"), "closed",
      ),
    ]);
  });

  test("should return an empty list when no product order exists", () => {
    expect(new ProductOrderRepository(sqliteConnection).findAll()).toEqual([]);
  });

  test("should return an infrastructure error when finding all orders fails", () => {
    const repository = new ProductOrderRepository({
      getConnection: () => ({
        prepare: () => { throw new Error("database unavailable"); },
      }),
    } as any);

    expect(repository.findAll()).toEqual(new InfrastructureError("Database error"));
  });

  test("should return an infrastructure error when creating an order fails", () => {
    const product = Product.rebuild("1234567890123", "Biscoito Recheado", 100);
    const order = ProductOrder.create(
      product,
      20,
      new Date("2024-01-01T12:00:00.000Z"),
    );
    const repository = new ProductOrderRepository({
      getConnection: () => ({
        prepare: () => {
          throw new Error("database unavailable");
        },
      }),
    } as any);

    expect(order).toBeInstanceOf(ProductOrder);
    if (order instanceof Error) return;

    const result = repository.create(order);

    expect(result).toEqual(new InfrastructureError("Failed to create product order"));
  });

  test("should return an infrastructure error when finding an order fails", () => {
    const repository = new ProductOrderRepository({
      getConnection: () => ({
        prepare: () => {
          throw new Error("database unavailable");
        },
      }),
    } as any);

    const result = repository.findById("order-id");

    expect(result).toEqual(new InfrastructureError("Database error"));
  });

  test("should close a product order", () => {
    const product = Product.rebuild("1234567890123", "Biscoito Recheado", 100);
    const productRepository = new ProductRepository(sqliteConnection);
    const repository = new ProductOrderRepository(sqliteConnection);
    productRepository.create(product);
    const order = ProductOrder.create(
      product,
      20,
      new Date("2024-01-01T12:00:00.000Z"),
    );

    expect(order).toBeInstanceOf(ProductOrder);
    if (order instanceof Error) return;
    repository.create(order);

    expect(repository.close(order.getId())).toBeUndefined();
    const result = repository.findById(order.getId());
    expect(result).toBeInstanceOf(ProductOrder);
    if (result instanceof ProductOrder) {
      expect(result.getStatus()).toBe("closed");
    }
  });

  test("should return an infrastructure error when closing an order fails", () => {
    const repository = new ProductOrderRepository({
      getConnection: () => ({
        prepare: () => {
          throw new Error("database unavailable");
        },
      }),
    } as any);

    expect(repository.close("order-id")).toEqual(
      new InfrastructureError("Database error"),
    );
  });

  test("should reopen a closed product order", () => {
    const product = Product.rebuild("1234567890123", "Biscoito Recheado", 100);
    const productRepository = new ProductRepository(sqliteConnection);
    const repository = new ProductOrderRepository(sqliteConnection);
    productRepository.create(product);
    const order = ProductOrder.rebuild(
      "order-id", product, 20, new Date("2024-01-01T12:00:00.000Z"), "closed",
    );
    repository.create(order);

    expect(repository.reopen(order.getId())).toBeUndefined();
    const result = repository.findById(order.getId());
    expect(result).toBeInstanceOf(ProductOrder);
    expect((result as ProductOrder).getStatus()).toBe("opened");
  });

  test("should return an infrastructure error when reopening an order fails", () => {
    const repository = new ProductOrderRepository({
      getConnection: () => ({ prepare: () => { throw new Error("database unavailable"); } }),
    } as any);
    expect(repository.reopen("order-id")).toEqual(new InfrastructureError("Database error"));
  });
});
