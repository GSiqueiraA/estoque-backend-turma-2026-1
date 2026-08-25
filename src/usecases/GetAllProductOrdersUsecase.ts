import { InfrastructureError } from "../InfrastructureError";
import type { ProductOrderRepositoryInterface } from "../repositories/ProductOrderRepository";

export interface ProductOrderProductDTO {
    barcode: string;
    name: string;
    quantityInStock: number;
}

export interface ProductOrderDTO {
    id: string;
    product: ProductOrderProductDTO;
    orderQuantity: number;
    orderDate: Date;
    status: string;
}

export interface GetAllProductOrdersUsecaseInterface {
    execute(): ProductOrderDTO[] | InfrastructureError;
}

export class GetAllProductOrdersUsecase implements GetAllProductOrdersUsecaseInterface {
    constructor(private productOrderRepository: ProductOrderRepositoryInterface) {}

    public execute(): ProductOrderDTO[] | InfrastructureError {
        const productOrders = this.productOrderRepository.findAll();
        if (productOrders instanceof InfrastructureError) {
            return new InfrastructureError(productOrders.message);
        }

        return productOrders.map(productOrder => ({
            id: productOrder.getId(),
            product: {
                barcode: productOrder.getProduct().getBarcode(),
                name: productOrder.getProduct().getName(),
                quantityInStock: productOrder.getProduct().getQuantityInStock(),
            },
            orderQuantity: productOrder.getOrderQuantity(),
            orderDate: productOrder.getOrderDate(),
            status: productOrder.getStatus(),
        }));
    }
}
