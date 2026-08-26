import { CreateProductOutputController } from "../../../src/controllers/CreateProductOutputController";
import { InfrastructureError } from "../../../src/InfrastructureError";
import type {
    CreateProductOutputDTO,
    CreateProductOutputUsecaseInterface,
} from "../../../src/usecases/CreateProductOutputUsecase";

function createResponseMock() {
    return {
        statusCode: 0,
        data: null as unknown,
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        send(data: unknown) {
            this.data = data;
            return this;
        },
    };
}

describe("CreateProductOutputController", () => {
    const outputDate = new Date("2026-08-20T12:00:00.000Z");
    const result: CreateProductOutputDTO = {
        productOutputId: "output-id",
        productOutputQuantity: 10,
        productOutputDate: outputDate,
        productBarcode: "123456",
        productName: "Coca Cola 350ml",
        productStock: 90,
    };

    test("should delegate creation and return 201", async () => {
        const calls: unknown[][] = [];
        const usecaseMock: CreateProductOutputUsecaseInterface = {
            execute(...args) {
                calls.push(args);
                return result;
            },
        };
        const response = createResponseMock();

        await new CreateProductOutputController(usecaseMock).handle(
            {
                body: {
                    barcode: "123456",
                    quantity: 10,
                    outputDate: outputDate.toISOString(),
                },
            } as any,
            response as any,
        );

        expect(calls).toEqual([["123456", 10, outputDate]]);
        expect(response.statusCode).toBe(201);
        expect(response.data).toEqual(result);
    });

    test("should return 400 when the body is missing", async () => {
        let called = false;
        const usecase: CreateProductOutputUsecaseInterface = {
            execute() {
                called = true;
                return result;
            },
        };
        const response = createResponseMock();

        await new CreateProductOutputController(usecase).handle(
            {} as any,
            response as any,
        );

        expect(called).toBe(false);
        expect(response.statusCode).toBe(400);
        expect(response.data).toEqual({ error: "Invalid request body" });
    });

    test("should return 400 when the request data is invalid", async () => {
        const usecase: CreateProductOutputUsecaseInterface = {
            execute() {
                return result;
            },
        };
        const response = createResponseMock();

        await new CreateProductOutputController(usecase).handle(
            {
                body: {
                    barcode: "123456",
                    quantity: 1,
                    outputDate: "invalid-date",
                },
            } as any,
            response as any,
        );

        expect(response.statusCode).toBe(400);
        expect(response.data).toEqual({ error: "Invalid output date format" });
    });

    test("should map not found errors to 404", async () => {
        const usecase: CreateProductOutputUsecaseInterface = {
            execute() {
                return new Error("Product not found");
            },
        };
        const response = createResponseMock();

        await new CreateProductOutputController(usecase).handle(
            {
                body: {
                    barcode: "missing",
                    quantity: 1,
                    outputDate: outputDate.toISOString(),
                },
            } as any,
            response as any,
        );

        expect(response.statusCode).toBe(404);
        expect(response.data).toEqual({ error: "Product not found" });
    });

    test("should map business errors to 400", async () => {
        const usecase: CreateProductOutputUsecaseInterface = {
            execute() {
                return new Error("Insufficient stock for the requested output quantity");
            },
        };
        const response = createResponseMock();

        await new CreateProductOutputController(usecase).handle(
            {
                body: {
                    barcode: "123456",
                    quantity: 20,
                    outputDate: outputDate.toISOString(),
                },
            } as any,
            response as any,
        );

        expect(response.statusCode).toBe(400);
        expect(response.data).toEqual({
            error: "Insufficient stock for the requested output quantity",
        });
    });

    test("should map infrastructure errors to 500", async () => {
        const usecase: CreateProductOutputUsecaseInterface = {
            execute() {
                return new InfrastructureError("Database error");
            },
        };
        const response = createResponseMock();

        await new CreateProductOutputController(usecase).handle(
            {
                body: {
                    barcode: "123456",
                    quantity: 1,
                    outputDate: outputDate.toISOString(),
                },
            } as any,
            response as any,
        );

        expect(response.statusCode).toBe(500);
        expect(response.data).toEqual({ error: "Database error" });
    });
});