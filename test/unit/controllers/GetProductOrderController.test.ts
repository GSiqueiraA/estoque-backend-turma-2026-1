import { InfrastructureError } from "../../../src/InfrastructureError";
import { GetProductOrderController } from "../../../src/controllers/GetProductOrderController";
import type {
  ProductOrderDTO,
} from "../../../src/usecases/GetAllProductOrdersUsecase";
import type { GetProductOrderUsecaseInterface } from "../../../src/usecases/GetProductOrderUsecase";

const responseMock = () => ({
  statusCode: 0,
  data: null as any,
  status(code: number) { this.statusCode = code; return this; },
  send(data: any) { this.data = data; return this; },
});

class ProductOrderUsecaseMock implements GetProductOrderUsecaseInterface {
  constructor(private result: ProductOrderDTO | null | Error) {}

  execute(id: string): ProductOrderDTO | null | Error {
    return this.result;
  }
}

describe("GetProductOrderController tests", () => {
  const dto: ProductOrderDTO = {
    id: "order-1",
    product: { barcode: "111111", name: "Coca Cola", quantityInStock: 10 },
    orderQuantity: 20,
    orderDate: new Date("2024-01-01T12:00:00.000Z"),
    status: "opened",
  };

  test("should return a product order successfully", async () => {
    const response = responseMock();
    await new GetProductOrderController(new ProductOrderUsecaseMock(dto))
      .handle({ params: { id: "order-1" } } as any, response as any);

    expect(response.statusCode).toBe(200);
    expect(response.data).toBe(dto);
  });

  test.each([undefined, "invalid params"])(
    "should return 400 when params are %p",
    async params => {
      const response = responseMock();
      await new GetProductOrderController(new ProductOrderUsecaseMock(dto))
        .handle({ params } as any, response as any);

      expect(response.statusCode).toBe(400);
      expect(response.data).toEqual({ error: "Invalid request parameters" });
    },
  );

  test("should return 400 when the usecase rejects the id", async () => {
    const response = responseMock();
    await new GetProductOrderController(
      new ProductOrderUsecaseMock(new Error("Order id is required")),
    ).handle({ params: { id: "" } } as any, response as any);

    expect(response.statusCode).toBe(400);
    expect(response.data).toEqual({ error: "Order id is required" });
  });

  test("should return 404 when the product order does not exist", async () => {
    const response = responseMock();
    await new GetProductOrderController(new ProductOrderUsecaseMock(null))
      .handle({ params: { id: "missing-id" } } as any, response as any);

    expect(response.statusCode).toBe(404);
    expect(response.data).toEqual({ error: "Product order not found" });
  });

  test("should return 500 when the usecase returns an infrastructure error", async () => {
    const response = responseMock();
    await new GetProductOrderController(
      new ProductOrderUsecaseMock(new InfrastructureError("Database error")),
    ).handle({ params: { id: "order-1" } } as any, response as any);

    expect(response.statusCode).toBe(500);
    expect(response.data).toEqual({ error: "Database error" });
  });
});
