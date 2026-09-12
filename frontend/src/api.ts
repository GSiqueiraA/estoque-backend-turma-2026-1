import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
});

export interface ProductOutputProduct {
  barcode: string;
  name: string;
  quantityInStock: number;
}

export interface ProductOutput {
  id: string;
  product: ProductOutputProduct;
  outputQuantity: number;
  outputDate: string;
}

export interface CreateProductOutputResponse {
  productOutputId: string;
  productOutputQuantity: number;
  productOutputDate: string;
  productBarcode: string;
  productName: string;
  productStock: number;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  return (error as Error).message || "Erro inesperado";
}
