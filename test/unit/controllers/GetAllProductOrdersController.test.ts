import { InfrastructureError } from "../../../src/InfrastructureError";
import { GetAllProductOrdersController } from "../../../src/controllers/GetAllProductOrdersController";
import type {
  GetAllProductOrdersUsecaseInterface,
  ProductOrderDTO,
} from "../../../src/usecases/GetAllProductOrdersUsecase";

const responseMock = () => ({
  statusCode: 0,
  data: null as any,
  status(code: number) { this.statusCode = code; return this; },
  send(data: any) { this.data = data; return this; },
});

describe("GetAllProductOrdersController tests", () => {
  test("should return all product orders successfully", async () => {
    const orders: ProductOrderDTO[] = [{
      id: "order-1",
      product: { barcode: "111111", name: "Coca Cola", quantityInStock: 10 },
      orderQuantity: 20,
      orderDate: new Date("2024-01-01T12:00:00.000Z"),
      status: "opened",
    }];
    const usecase: GetAllProductOrdersUsecaseInterface = {
      execute: () => orders,
    };
    const response = responseMock();

    await new GetAllProductOrdersController(usecase).handle({} as any, response as any);

    expect(response.statusCode).toBe(200);
    expect(response.data).toBe(orders);
  });

  test("should return 500 when the usecase returns an infrastructure error", async () => {
    const usecase: GetAllProductOrdersUsecaseInterface = {
      execute: () => new InfrastructureError("Database error"),
    };
    const response = responseMock();

    await new GetAllProductOrdersController(usecase).handle({} as any, response as any);

    expect(response.statusCode).toBe(500);
    expect(response.data).toEqual({ error: "Database error" });
  });
});
