import type { FastifyReply, FastifyRequest } from "fastify";
import { InfrastructureError } from "../InfrastructureError";
import type { GetProductOutputUsecaseInterface } from "../usecases/GetProductOutputUsecase";

export class GetProductOutputController {
    constructor(private getProductOutputUsecase: GetProductOutputUsecaseInterface) {}

    public async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        if (!request.params || typeof request.params !== "object") {
            reply.status(400).send({ error: "Invalid request parameters" });
            return;
        }

        const { id } = request.params as { id: string };
        const result = this.getProductOutputUsecase.execute(id);

        if (result instanceof InfrastructureError) {
            reply.status(500).send({ error: result.message });
            return;
        }

        if (result instanceof Error) {
            reply.status(400).send({ error: result.message });
            return;
        }

        if (result === null) {
            reply.status(404).send({ error: "Product output not found" });
            return;
        }

        reply.status(200).send(result);
    }
}
