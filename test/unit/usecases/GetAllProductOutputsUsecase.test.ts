import { InfrastructureError } from "../../../src/InfrastructureError";
import { Product } from "../../../src/entities/Product";
import { ProductOutput } from "../../../src/entities/ProductOutput";
import type { ProductOutputRepositoryInterface } from "../../../src/repositories/ProductOutputRepository";
import { GetAllProductOutputsUsecase } from "../../../src/usecases/GetAllProductOutputsUsecase";

describe("GetAllProductOutputsUsecase tests", () => {
  const product = Product.rebuild("111111", "Coca Cola", 10);
  const output = ProductOutput.rebuild(
    "output-1", product, 3, new Date("2024-01-01T12:00:00.000Z"),
  );

  const repositoryFor = (
    result: ProductOutput[] | InfrastructureError,
  ): ProductOutputRepositoryInterface => ({
    create: () => undefined,
    findAll: () => result,
  });

  test("should return all product outputs as DTOs", () => {
    expect(new GetAllProductOutputsUsecase(repositoryFor([output])).execute())
      .toEqual([
        {
          id: "output-1",
          product: { barcode: "111111", name: "Coca Cola", quantityInStock: 10 },
          outputQuantity: 3,
          outputDate: new Date("2024-01-01T12:00:00.000Z"),
        },
      ]);
  });

  test("should return an empty list when no output exists", () => {
    expect(new GetAllProductOutputsUsecase(repositoryFor([])).execute())
      .toEqual([]);
  });

  test("should return an infrastructure error when repository fails", () => {
    expect(new GetAllProductOutputsUsecase(
      repositoryFor(new InfrastructureError("Database error")),
    ).execute()).toEqual(new InfrastructureError("Database error"));
  });
});
