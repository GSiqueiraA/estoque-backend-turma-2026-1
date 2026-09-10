import { InfrastructureError } from "../InfrastructureError";
import type { ProductOutputRepositoryInterface } from "../repositories/ProductOutputRepository";

export interface ProductOutputProductDTO {
    barcode: string;
    name: string;
    quantityInStock: number;
}

export interface ProductOutputDTO {
    id: string;
    product: ProductOutputProductDTO;
    outputQuantity: number;
    outputDate: Date;
}

export interface GetAllProductOutputsUsecaseInterface {
    execute(): ProductOutputDTO[] | InfrastructureError;
}

export class GetAllProductOutputsUsecase implements GetAllProductOutputsUsecaseInterface {
    constructor(private productOutputRepository: ProductOutputRepositoryInterface) {}

    public execute(): ProductOutputDTO[] | InfrastructureError {
        const productOutputs = this.productOutputRepository.findAll();
        if (productOutputs instanceof InfrastructureError) {
            return new InfrastructureError(productOutputs.message);
        }

        return productOutputs.map(productOutput => ({
            id: productOutput.getId(),
            product: {
                barcode: productOutput.getProduct().getBarcode(),
                name: productOutput.getProduct().getName(),
                quantityInStock: productOutput.getProduct().getQuantityInStock(),
            },
            outputQuantity: productOutput.getQuantity(),
            outputDate: productOutput.getOutputDate(),
        }));
    }
}
