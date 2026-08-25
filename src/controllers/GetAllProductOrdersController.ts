import type { FastifyReply, FastifyRequest } from "fastify";
import { InfrastructureError } from "../InfrastructureError";
import type { GetAllProductOrdersUsecaseInterface } from "../usecases/GetAllProductOrdersUsecase";

export class GetAllProductOrdersController {
    constructor(
        private getAllProductOrdersUsecase: GetAllProductOrdersUsecaseInterface,
    ) {}

    public async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const result = this.getAllProductOrdersUsecase.execute();

        if (result instanceof InfrastructureError) {
            reply.status(500).send({ error: result.message });
            return;
        }

        reply.status(200).send(result);
    }
}
