import { InfrastructureError } from "../InfrastructureError";
import type { ProductOrderRepositoryInterface } from "../repositories/ProductOrderRepository";
import type { ProductOrderDTO } from "./GetAllProductOrdersUsecase";

export interface GetProductOrderUsecaseInterface {
    execute(id: string): ProductOrderDTO | null | Error;
}

export class GetProductOrderUsecase implements GetProductOrderUsecaseInterface {
    constructor(private productOrderRepository: ProductOrderRepositoryInterface) {}

    public execute(id: string): ProductOrderDTO | null | Error {
        if (!id) {
            return new Error("Order id is required");
        }

        const productOrder = this.productOrderRepository.findById(id);
        if (productOrder instanceof InfrastructureError) {
            return new InfrastructureError(productOrder.message);
        }
        if (!productOrder) {
            return null;
        }

        return {
            id: productOrder.getId(),
            product: {
                barcode: productOrder.getProduct().getBarcode(),
                name: productOrder.getProduct().getName(),
                quantityInStock: productOrder.getProduct().getQuantityInStock(),
            },
            orderQuantity: productOrder.getOrderQuantity(),
            orderDate: productOrder.getOrderDate(),
            status: productOrder.getStatus(),
        };
    }
}
