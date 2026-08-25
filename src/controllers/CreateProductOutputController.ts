import type { FastifyRequest, FastifyReply } from "fastify";
import { InfrastructureError } from "../InfrastructureError";
import type { CreateProductOutputUsecaseInterface } from "../usecases/CreateProductOutputUsecase";

export class CreateProductOutputController {
    public constructor(private readonly createProductOutputUsecase: CreateProductOutputUsecaseInterface) {}

    public async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
        if (!request.body || typeof request.body !== "object") {
            response.status(400).send({ error: "Invalid request body" });
            return;
        }

        const { barcode, quantity, outputDate } = request.body as {
            barcode?: string;
            quantity?: number;
            outputDate?: string;
        };

        if (!barcode) {
            return response.status(400).send({ error: "Barcode is required" });
        }

        if (quantity === undefined) {
            return response.status(400).send({ error: "Quantity is required" });
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
            return response.status(400).send({ error: "Quantity must be a positive number" });
        }

        if (!outputDate) {
            return response.status(400).send({ error: "Output date is required" });
        }

        const newOutputDate = new Date(outputDate);
        if (isNaN(newOutputDate.getTime())) {
            return response.status(400).send({ error: "Invalid output date format" });
        }
        
        const result = this.createProductOutputUsecase.execute(barcode, quantity, newOutputDate);

        if (result instanceof InfrastructureError) {
            response.status(500).send({ error: result.message });
            return;
        }

        if (result instanceof Error) {
            const statusCode = result.message === "Product not found" ? 404 : 400;
            response.status(statusCode).send({ error: result.message });
            return;
        }

        response.status(201).send({
            productOutputId: result.productOutputId,
            productOutputQuantity: result.productOutputQuantity,
            productOutputDate: result.productOutputDate,
            productBarcode: result.productBarcode,
            productName: result.productName,
            productStock: result.productStock,
        });
    }
}