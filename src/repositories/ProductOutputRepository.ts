import Database from "better-sqlite3";
import { InfrastructureError } from "../InfrastructureError";
import { ProductOutput } from "../entities/ProductOutput";
import type { SqliteConnection } from "./SqliteConnection";

export interface ProductOutputRepositoryInterface {
    create(productOutput: ProductOutput): void | InfrastructureError;
}

export class ProductOutputRepository implements ProductOutputRepositoryInterface {
    constructor(private readonly sqliteConnection: SqliteConnection) {}

    public create(productOutput: ProductOutput): void | InfrastructureError {
        try {
            const connection: Database.Database = this.sqliteConnection.getConnection();
            connection.prepare(
                "INSERT INTO product_outputs (id, product_id, quantity, output_date) VALUES (?, ?, ?, ?)",
            ).run(
                productOutput.getId(),
                productOutput.getProduct().getBarcode(),
                productOutput.getQuantity(),
                productOutput.getOutputDate().toISOString(),
            );
        } catch {
            return new InfrastructureError("Failed to create product output");
        }
    }
}