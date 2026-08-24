import { CreateProductOutputController } from "../../src/controllers/CreateProductOutputController";
import { Product } from "../../src/entities/Product";
import { ProductOutputRepository } from "../../src/repositories/ProductOutputRepository";
import { ProductRepository } from "../../src/repositories/ProductRepository";
import { SqliteConnection } from "../../src/repositories/SqliteConnection";
import { CreateProductOutputUsecase } from "../../src/usecases/CreateProductOutputUsecase";

describe("CreateProductOutput integration tests", () => {
    const sqliteConnection = new SqliteConnection("db/estoque-test.sqlite");
    const productRepository = new ProductRepository(sqliteConnection);
    const productOutputRepository = new ProductOutputRepository(sqliteConnection);
    const createProductOutputUsecase = new CreateProductOutputUsecase(
        productRepository,
        productOutputRepository,
    );
    const createProductOutputController = new CreateProductOutputController(createProductOutputUsecase);

    beforeEach(() => {
        const connection = sqliteConnection.getConnection();
        connection.exec("DELETE FROM product_outputs");
        connection.exec("DELETE FROM product_inputs");
        connection.exec("DELETE FROM product_orders");
        connection.exec("DELETE FROM products");
    });

    test("should create a product output successfully", async () => {
        const product = Product.rebuild('123456', 'Coca Cola 350ml', 100);
        productRepository.create(product);

        const outputDate = new Date("2026-08-20T12:00:00.000Z");

        const requestMock: any = {
            body: {
                barcode: '123456',
                quantity: 10,
                outputDate: outputDate.toISOString(),
            }
        };

        const responseMock: any = {
            statusCode: 0,
            data: null,
            status(code: number) {
                this.statusCode = code;
                return this;
            },
            send(data: any) {
                this.data = data;
                return this;
            }
        };

        await createProductOutputController.handle(requestMock, responseMock);

        expect(responseMock.statusCode).toBe(201);
        expect(responseMock.data).toHaveProperty('productOutputId', expect.any(String));
        expect(responseMock.data).toHaveProperty('productOutputQuantity', 10);
        expect(responseMock.data).toHaveProperty('productOutputDate', outputDate);
        expect(responseMock.data).toHaveProperty('productBarcode', '123456');
        expect(responseMock.data).toHaveProperty('productName', 'Coca Cola 350ml');
        expect(responseMock.data).toHaveProperty('productStock', 90);

        const persistedOutput = sqliteConnection.getConnection()
            .prepare("SELECT product_id, quantity, output_date FROM product_outputs WHERE id = ?")
            .get((responseMock.data as { productOutputId: string }).productOutputId) as {
                product_id: string;
                quantity: number;
                output_date: string;
            };
        expect(persistedOutput).toEqual({
            product_id: "123456",
            quantity: 10,
            output_date: outputDate.toISOString(),
        });

        const persistedProduct = sqliteConnection.getConnection()
            .prepare("SELECT quantity_in_stock FROM products WHERE barcode = ?")
            .get("123456") as { quantity_in_stock: number };
        expect(persistedProduct.quantity_in_stock).toBe(90);
    });

    test("should return 404 if product is not found", async () => {
        const requestMock: any = {
            body: {
                barcode: "missing",
                quantity: 1,
                outputDate: "2026-08-20"
            }
        };

        const responseMock: any = {
            statusCode: 0,
            data: null,
            status(code: number) {
                this.statusCode = code;
                return this;
            },
            send(data: any) {
                this.data = data;
                return this;
            }
        };

        await createProductOutputController.handle(requestMock, responseMock);

        expect(responseMock.statusCode).toBe(404);
        expect(responseMock.data).toEqual({ error: "Product not found" });
    });

    test("should return 400 if output quantity is greater than stock", async () => {
        productRepository.create(Product.rebuild("123456", "Coca Cola 350ml", 5));

        const requestMock: any = {
            body: {
                barcode: "123456",
                quantity: 6,
                outputDate: "2026-08-20"
            }
        };

        const responseMock: any = {
            statusCode: 0,
            data: null,
            status(code: number) {
                this.statusCode = code;
                return this;
            },
            send(data: any) {
                this.data = data;
                return this;
            }
        };

        await createProductOutputController.handle(requestMock, responseMock);

        expect(responseMock.statusCode).toBe(400);
        expect(responseMock.data).toEqual({
            error: "Insufficient stock for the requested output quantity",
        });
        expect(sqliteConnection.getConnection()
            .prepare("SELECT COUNT(*) AS count FROM product_outputs")
            .get()).toEqual({ count: 0 });
    });

    test("should return 400 if barcode is not provided", async () => {
        const requestMock: any = {
            body: {
                barcode: "",
                quantity: 1,
                outputDate: "2026-08-20"
            }
        };

        const responseMock: any = {
            statusCode: 0,
            data: null,
            status(code: number) {
                this.statusCode = code;
                return this;
            },
            send(data: any) {
                this.data = data;
                return this;
            }
        };

        await createProductOutputController.handle(requestMock, responseMock);

        expect(responseMock.statusCode).toBe(400);
        expect(responseMock.data).toEqual({ error: "Barcode is required" });
    });

    test("should return 400 if quantity is not positive", async () => {
        const requestMock: any = {
            body: {
                barcode: "123456",
                quantity: 0,
                outputDate: "2026-08-20"
            }
        };

        const responseMock: any = {
            statusCode: 0,
            data: null,
            status(code: number) {
                this.statusCode = code;
                return this;
            },
            send(data: any) {
                this.data = data;
                return this;
            }
        };

        await createProductOutputController.handle(requestMock, responseMock);

        expect(responseMock.statusCode).toBe(400);
        expect(responseMock.data).toEqual({ error: "Quantity must be a positive number" });
    });

    test("should return 400 if output date is not provided", async () => {
        const requestMock: any = {
            body: {
                barcode: "123456",
                quantity: 1,
                outputDate: ""
            }
        };

        const responseMock: any = {
            statusCode: 0,
            data: null,
            status(code: number) {
                this.statusCode = code;
                return this;
            },
            send(data: any) {
                this.data = data;
                return this;
            }
        };

        await createProductOutputController.handle(requestMock, responseMock);

        expect(responseMock.statusCode).toBe(400);
        expect(responseMock.data).toEqual({ error: "Output date is required" });
    });

    test("should return 400 if output date is invalid", async () => {
        const requestMock: any = {
            body: {
                barcode: "123456",
                quantity: 1,
                outputDate: "invalid-date"
            }
        };

        const responseMock: any = {
            statusCode: 0,
            data: null,
            status(code: number) {
                this.statusCode = code;
                return this;
            },
            send(data: any) {
                this.data = data;
                return this;
            }
        };

        await createProductOutputController.handle(requestMock, responseMock);

        expect(responseMock.statusCode).toBe(400);
        expect(responseMock.data).toEqual({ error: "Invalid output date format" });
    });
});