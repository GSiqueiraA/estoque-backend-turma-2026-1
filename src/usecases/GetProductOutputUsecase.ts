import { InfrastructureError } from "../InfrastructureError";
import type { ProductOutputDeletionRepositoryInterface } from "../repositories/ProductOutputRepository";
import type { ProductOutputDTO } from "./GetAllProductOutputsUsecase";

export interface GetProductOutputUsecaseInterface {
    execute(id: string): ProductOutputDTO | null | Error;
}

export class GetProductOutputUsecase implements GetProductOutputUsecaseInterface {
    constructor(private productOutputRepository: ProductOutputDeletionRepositoryInterface) {}

    public execute(id: string): ProductOutputDTO | null | Error {
        if (!id) {
            return new Error("Output id is required");
        }

        const productOutput = this.productOutputRepository.findById(id);
        if (productOutput instanceof InfrastructureError) {
            return new InfrastructureError(productOutput.message);
        }
        if (!productOutput) {
            return null;
        }

        return {
            id: productOutput.getId(),
            product: {
                barcode: productOutput.getProduct().getBarcode(),
                name: productOutput.getProduct().getName(),
                quantityInStock: productOutput.getProduct().getQuantityInStock(),
            },
            outputQuantity: productOutput.getQuantity(),
            outputDate: productOutput.getOutputDate(),
        };
    }
}
