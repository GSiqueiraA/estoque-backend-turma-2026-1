import { InfrastructureError } from "../../../src/InfrastructureError";
import { GetProductOutputController } from "../../../src/controllers/GetProductOutputController";
import type {
  ProductOutputDTO,
} from "../../../src/usecases/GetAllProductOutputsUsecase";
import type { GetProductOutputUsecaseInterface } from "../../../src/usecases/GetProductOutputUsecase";

const responseMock = () => ({
  statusCode: 0,
  data: null as any,
  status(code: number) { this.statusCode = code; return this; },
  send(data: any) { this.data = data; return this; },
});

class ProductOutputUsecaseMock implements GetProductOutputUsecaseInterface {
  constructor(private result: ProductOutputDTO | null | Error) {}

  execute(id: string): ProductOutputDTO | null | Error {
    return this.result;
  }
}

describe("GetProductOutputController tests", () => {
  const dto: ProductOutputDTO = {
    id: "output-1",
    product: { barcode: "111111", name: "Coca Cola", quantityInStock: 10 },
    outputQuantity: 3,
    outputDate: new Date("2024-01-01T12:00:00.000Z"),
  };

  test("should return a product output successfully", async () => {
    const response = responseMock();
    await new GetProductOutputController(new ProductOutputUsecaseMock(dto))
      .handle({ params: { id: "output-1" } } as any, response as any);

    expect(response.statusCode).toBe(200);
    expect(response.data).toBe(dto);
  });

  test.each([undefined, "invalid params"])(
    "should return 400 when params are %p",
    async params => {
      const response = responseMock();
      await new GetProductOutputController(new ProductOutputUsecaseMock(dto))
        .handle({ params } as any, response as any);

      expect(response.statusCode).toBe(400);
      expect(response.data).toEqual({ error: "Invalid request parameters" });
    },
  );

  test("should return 400 when the usecase rejects the id", async () => {
    const response = responseMock();
    await new GetProductOutputController(
      new ProductOutputUsecaseMock(new Error("Output id is required")),
    ).handle({ params: { id: "" } } as any, response as any);

    expect(response.statusCode).toBe(400);
    expect(response.data).toEqual({ error: "Output id is required" });
  });

  test("should return 404 when the product output does not exist", async () => {
    const response = responseMock();
    await new GetProductOutputController(new ProductOutputUsecaseMock(null))
      .handle({ params: { id: "missing-id" } } as any, response as any);

    expect(response.statusCode).toBe(404);
    expect(response.data).toEqual({ error: "Product output not found" });
  });

  test("should return 500 when the usecase returns an infrastructure error", async () => {
    const response = responseMock();
    await new GetProductOutputController(
      new ProductOutputUsecaseMock(new InfrastructureError("Database error")),
    ).handle({ params: { id: "output-1" } } as any, response as any);

    expect(response.statusCode).toBe(500);
    expect(response.data).toEqual({ error: "Database error" });
  });
});
