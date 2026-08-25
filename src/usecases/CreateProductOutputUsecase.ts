import { InfrastructureError } from "../InfrastructureError";
import { Product } from "../entities/Product";
import { ProductOutput } from "../entities/ProductOutput";
import type { ProductOutputRepositoryInterface } from "../repositories/ProductOutputRepository";
import type { ProductRepositoryInterface } from "../repositories/ProductRepository";

export interface CreateProductOutputDTO {
    productOutputId: string;
    productOutputQuantity: number;
    productOutputDate: Date;
    productBarcode: string;
    productName: string;
    productStock: number;
}

export interface CreateProductOutputUsecaseInterface {
    execute(barcode: string, quantity: number, outputDate: Date): CreateProductOutputDTO | Error;
}

export class CreateProductOutputUsecase implements CreateProductOutputUsecaseInterface {
    constructor(
        private readonly productRepository: ProductRepositoryInterface,
        private readonly productOutputRepository: ProductOutputRepositoryInterface,
    ) {}

    public execute(barcode: string, quantity: number, outputDate: Date): CreateProductOutputDTO | Error {
        const productResult = this.productRepository.findByBarcode(barcode);
        if (productResult instanceof InfrastructureError) {
            return productResult;
        }
        if (!(productResult instanceof Product)) {
            return new Error("Product not found");
        }

        const productOutput = ProductOutput.create(productResult, quantity, outputDate);
        if (productOutput instanceof Error) {
            return productOutput;
        }

        const createResult = this.productOutputRepository.create(productOutput);
        if (createResult instanceof InfrastructureError) {
            return createResult;
        }

        const newStock = productResult.getQuantityInStock() - quantity;
        const updateResult = this.productRepository.updateStock(barcode, newStock);
        if (updateResult instanceof InfrastructureError) {
            return updateResult;
        }

        return {
            productOutputId: productOutput.getId(),
            productOutputQuantity: productOutput.getQuantity(),
            productOutputDate: productOutput.getOutputDate(),
            productBarcode: productResult.getBarcode(),
            productName: productResult.getName(),
            productStock: newStock,
        };
    }
}