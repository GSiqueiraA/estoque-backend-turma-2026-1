import Database from "better-sqlite3";
import { Product } from "../entities/Product";
import { ProductOrder } from "../entities/ProductOrder";
import { InfrastructureError } from "../InfrastructureError";
import type { SqliteConnection } from "./SqliteConnection";

export interface ProductOrderRepositoryInterface {
    create(productOrder: ProductOrder): void | InfrastructureError;
    findById(id: string): ProductOrder | null | InfrastructureError;
    findAll(): ProductOrder[] | InfrastructureError;
    close(id: string): void | InfrastructureError;
}

export interface ProductOrderReopeningRepositoryInterface {
    reopen(id: string): void | InfrastructureError;
}

export class ProductOrderRepository implements ProductOrderRepositoryInterface, ProductOrderReopeningRepositoryInterface {

    private sqliteConnection: SqliteConnection;

    constructor(connection: SqliteConnection) {
        this.sqliteConnection = connection;
    }

    public create(productOrder: ProductOrder): void | InfrastructureError {
        try {
            const connection: Database.Database = this.sqliteConnection.getConnection();
            const insertStatement = connection.prepare(
                "INSERT INTO product_orders (id, product_barcode, order_quantity, order_date, status) VALUES (?, ?, ?, ?, ?)"
            );
            insertStatement.run(
                productOrder.getId(),
                productOrder.getProduct().getBarcode(),
                productOrder.getOrderQuantity(),
                productOrder.formatOrderDate(),
                productOrder.getStatus()
            );
        } catch (error) {
            return new InfrastructureError("Failed to create product order");
        }
    }

    public findById(id: string): ProductOrder | null | InfrastructureError {
        try {
            const connection: Database.Database = this.sqliteConnection.getConnection();
            const selectStatement = connection.prepare(
                `SELECT po.id, po.product_barcode, po.order_quantity, po.order_date, po.status,
                        p.barcode, p.name, p.quantity_in_stock
                   FROM product_orders po
                   JOIN products p ON p.barcode = po.product_barcode
                  WHERE po.id = ?`,
            );
            const row = selectStatement.get(id) as {
                id: string;
                product_barcode: string;
                order_quantity: number;
                order_date: string;
                status: string;
                barcode: string;
                name: string;
                quantity_in_stock: number;
            } | undefined;

            if (!row) {
                return null;
            }

            return ProductOrder.rebuild(
                row.id,
                Product.rebuild(row.barcode, row.name, row.quantity_in_stock),
                row.order_quantity,
                new Date(row.order_date),
                row.status,
            );
        } catch (error) {
            return new InfrastructureError("Database error");
        }
    }

    public findAll(): ProductOrder[] | InfrastructureError {
        try {
            const connection: Database.Database = this.sqliteConnection.getConnection();
            const selectStatement = connection.prepare(
                `SELECT po.id, po.product_barcode, po.order_quantity, po.order_date, po.status,
                        p.barcode, p.name, p.quantity_in_stock
                   FROM product_orders po
                   JOIN products p ON p.barcode = po.product_barcode`,
            );
            const rows = selectStatement.all() as Array<{
                id: string;
                product_barcode: string;
                order_quantity: number;
                order_date: string;
                status: string;
                barcode: string;
                name: string;
                quantity_in_stock: number;
            }>;

            return rows.map(row => ProductOrder.rebuild(
                row.id,
                Product.rebuild(row.barcode, row.name, row.quantity_in_stock),
                row.order_quantity,
                new Date(row.order_date),
                row.status,
            ));
        } catch (error) {
            return new InfrastructureError("Database error");
        }
    }

    public close(id: string): void | InfrastructureError {
        try {
            const connection: Database.Database = this.sqliteConnection.getConnection();
            connection.prepare(
                "UPDATE product_orders SET status = ? WHERE id = ?",
            ).run("closed", id);
        } catch (error) {
            return new InfrastructureError("Database error");
        }
    }

    public reopen(id: string): void | InfrastructureError {
        try {
            this.sqliteConnection.getConnection().prepare(
                "UPDATE product_orders SET status = ? WHERE id = ?",
            ).run("opened", id);
        } catch {
            return new InfrastructureError("Database error");
        }
    }
}
