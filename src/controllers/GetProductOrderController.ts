import type { FastifyReply, FastifyRequest } from "fastify";
import { InfrastructureError } from "../InfrastructureError";
import type { GetProductOrderUsecaseInterface } from "../usecases/GetProductOrderUsecase";

export class GetProductOrderController {
    constructor(private getProductOrderUsecase: GetProductOrderUsecaseInterface) {}

    public async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        if (!request.params || typeof request.params !== "object") {
            reply.status(400).send({ error: "Invalid request parameters" });
            return;
        }

        const { id } = request.params as { id: string };
        const result = this.getProductOrderUsecase.execute(id);

        if (result instanceof InfrastructureError) {
            reply.status(500).send({ error: result.message });
            return;
        }

        if (result instanceof Error) {
            reply.status(400).send({ error: result.message });
            return;
        }

        if (result === null) {
            reply.status(404).send({ error: "Product order not found" });
            return;
        }

        reply.status(200).send(result);
    }
}
