import type { FastifyReply, FastifyRequest } from "fastify";
import { InfrastructureError } from "../InfrastructureError";
import type { GetAllProductOutputsUsecaseInterface } from "../usecases/GetAllProductOutputsUsecase";

export class GetAllProductOutputsController {
    constructor(
        private getAllProductOutputsUsecase: GetAllProductOutputsUsecaseInterface,
    ) {}

    public async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const result = this.getAllProductOutputsUsecase.execute();

        if (result instanceof InfrastructureError) {
            reply.status(500).send({ error: result.message });
            return;
        }

        reply.status(200).send(result);
    }
}
