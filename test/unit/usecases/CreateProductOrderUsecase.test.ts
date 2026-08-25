import { Product } from "../../../src/entities/Product";
import { ProductOrder } from "../../../src/entities/ProductOrder";
import { InfrastructureError } from "../../../src/InfrastructureError";
import type { ProductOrderRepositoryInterface } from "../../../src/repositories/ProductOrderRepository";
import type { ProductRepositoryInterface } from "../../../src/repositories/ProductRepository";
import { CreateProductOrderUsecase } from "../../../src/usecases/CreateProductOrderUsecase";

describe("CreateProductOrderUsecase tests", () => {

    test("should create a product order successfully when the product exists", () => {
        class ProductRepositoryMock implements ProductRepositoryInterface {
            create(product: Product): void | InfrastructureError {
                return;
            }
            findByBarcode(barcode: string): Product | null | InfrastructureError {
                return Product.rebuild(barcode, "Coca Cola 2L", 10);
            }
        }

        class ProductOrderRepositoryMock implements ProductOrderRepositoryInterface {
            create(productOrder: ProductOrder): void | InfrastructureError {
                return;
            }
            findAll(): ProductOrder[] | InfrastructureError {
                return [];
            }
            findById(): ProductOrder | null | InfrastructureError {
                return null;
            }
            close(): void | InfrastructureError {
                return;
            }
        }

        const usecase = new CreateProductOrderUsecase(
            new ProductRepositoryMock(),
            new ProductOrderRepositoryMock()
        );

        const barcode = "123456789";
        const orderQuantity = 5;
        const orderDate = new Date("2026-01-01T12:00:00Z");

        const result = usecase.execute(barcode, orderQuantity, orderDate);

        expect(result).not.toBeInstanceOf(Error);
        if (!(result instanceof Error)) {
            expect(result.id).toBeDefined();
            expect(result.product.barcode).toBe(barcode);
            expect(result.orderQuantity).toBe(orderQuantity);
            expect(result.orderDate).toBe(orderDate);
            expect(result.status).toBe("opened");
        }
    });

    test("should return an Error when the product does not exist", () => {
        class ProductRepositoryMock implements ProductRepositoryInterface {
            create(product: Product): void | InfrastructureError {
                return;
            }
            findByBarcode(barcode: string): Product | null | InfrastructureError {
                return null;
            }
        }

        class ProductOrderRepositoryMock implements ProductOrderRepositoryInterface {
            create(productOrder: ProductOrder): void | InfrastructureError {
                return;
            }
            findAll(): ProductOrder[] | InfrastructureError {
                return [];
            }
            findById(): ProductOrder | null | InfrastructureError {
                return null;
            }
            close(): void | InfrastructureError {
                return;
            }
        }

        const usecase = new CreateProductOrderUsecase(
            new ProductRepositoryMock(),
            new ProductOrderRepositoryMock()
        );

        const result = usecase.execute("123456789", 5, new Date());

        expect(result).toBeInstanceOf(Error);
        expect((result as Error).message).toBe("Product does not exist");
    });

    test("should return an InfrastructureError when finding the product fails", () => {
        class ProductRepositoryMock implements ProductRepositoryInterface {
            create(product: Product): void | InfrastructureError {
                return;
            }
            findByBarcode(barcode: string): Product | null | InfrastructureError {
                return new InfrastructureError("Database error");
            }
        }

        class ProductOrderRepositoryMock implements ProductOrderRepositoryInterface {
            create(productOrder: ProductOrder): void | InfrastructureError {
                return;
            }
            findAll(): ProductOrder[] | InfrastructureError {
                return [];
            }
            findById(): ProductOrder | null | InfrastructureError {
                return null;
            }
            close(): void | InfrastructureError {
                return;
            }
        }

        const usecase = new CreateProductOrderUsecase(
            new ProductRepositoryMock(),
            new ProductOrderRepositoryMock()
        );

        const result = usecase.execute("123456789", 5, new Date());

        expect(result).toBeInstanceOf(InfrastructureError);
        expect((result as InfrastructureError).message).toBe("Database error");
    });

    test("should return an Error when the product order entity returns an error", () => {
        class ProductRepositoryMock implements ProductRepositoryInterface {
            create(product: Product): void | InfrastructureError {
                return;
            }
            findByBarcode(barcode: string): Product | null | InfrastructureError {
                return Product.rebuild(barcode, "Coca Cola 2L", 10);
            }
        }

        class ProductOrderRepositoryMock implements ProductOrderRepositoryInterface {
            create(productOrder: ProductOrder): void | InfrastructureError {
                return;
            }
            findAll(): ProductOrder[] | InfrastructureError {
                return [];
            }
            findById(): ProductOrder | null | InfrastructureError {
                return null;
            }
            close(): void | InfrastructureError {
                return;
            }
        }

        const usecase = new CreateProductOrderUsecase(
            new ProductRepositoryMock(),
            new ProductOrderRepositoryMock()
        );

        const result = usecase.execute("123456789", 0, new Date());

        expect(result).toBeInstanceOf(Error);
        expect((result as Error).message).toBe("A quantidade do pedido deve ser maior que zero.");
    });

    test("should return an InfrastructureError when creating the product order fails", () => {
        class ProductRepositoryMock implements ProductRepositoryInterface {
            create(product: Product): void | InfrastructureError {
                return;
            }
            findByBarcode(barcode: string): Product | null | InfrastructureError {
                return Product.rebuild(barcode, "Coca Cola 2L", 10);
            }
        }

        class ProductOrderRepositoryMock implements ProductOrderRepositoryInterface {
            create(productOrder: ProductOrder): void | InfrastructureError {
                return new InfrastructureError("Database error");
            }
            findAll(): ProductOrder[] | InfrastructureError {
                return [];
            }
            findById(): ProductOrder | null | InfrastructureError {
                return null;
            }
            close(): void | InfrastructureError {
                return;
            }
        }

        const usecase = new CreateProductOrderUsecase(
            new ProductRepositoryMock(),
            new ProductOrderRepositoryMock()
        );

        const result = usecase.execute("123456789", 5, new Date());

        expect(result).toBeInstanceOf(InfrastructureError);
        expect((result as InfrastructureError).message).toBe("Database error");
    });
});
