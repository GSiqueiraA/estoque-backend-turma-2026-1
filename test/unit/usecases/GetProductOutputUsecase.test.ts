import { InfrastructureError } from "../../../src/InfrastructureError";
import { Product } from "../../../src/entities/Product";
import { ProductOutput } from "../../../src/entities/ProductOutput";
import type { ProductOutputDeletionRepositoryInterface } from "../../../src/repositories/ProductOutputRepository";
import { GetProductOutputUsecase } from "../../../src/usecases/GetProductOutputUsecase";

describe("GetProductOutputUsecase tests", () => {
  const product = Product.rebuild("111111", "Coca Cola", 10);
  const output = ProductOutput.rebuild(
    "output-1", product, 3, new Date("2024-01-01T12:00:00.000Z"),
  );

  const repositoryFor = (
    result: ProductOutput | null | InfrastructureError,
  ): ProductOutputDeletionRepositoryInterface => ({
    findById: () => result,
    delete: () => undefined,
  });

  test("should return a product output as a DTO", () => {
    expect(new GetProductOutputUsecase(repositoryFor(output)).execute("output-1"))
      .toEqual({
        id: "output-1",
        product: { barcode: "111111", name: "Coca Cola", quantityInStock: 10 },
        outputQuantity: 3,
        outputDate: new Date("2024-01-01T12:00:00.000Z"),
      });
  });

  test("should reject an empty output id", () => {
    expect(new GetProductOutputUsecase(repositoryFor(output)).execute(""))
      .toEqual(new Error("Output id is required"));
  });

  test("should return null when the output does not exist", () => {
    expect(new GetProductOutputUsecase(repositoryFor(null)).execute("missing-id"))
      .toBeNull();
  });

  test("should return an infrastructure error when repository fails", () => {
    expect(new GetProductOutputUsecase(
      repositoryFor(new InfrastructureError("Database error")),
    ).execute("output-1")).toEqual(new InfrastructureError("Database error"));
  });
});
