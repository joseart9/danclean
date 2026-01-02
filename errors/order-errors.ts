import { AppError } from "./app-error";

/**
 * Error thrown when order is not found
 */
export class OrderNotFoundError extends AppError {
  constructor(identifier?: string) {
    const message = identifier
      ? `Orden no encontrada: ${identifier}`
      : "Orden no encontrada";
    super(message, 404, "ORDER_NOT_FOUND");
  }
}

/**
 * Error thrown when order item is not found
 */
export class OrderItemNotFoundError extends AppError {
  constructor(identifier?: string) {
    const message = identifier
      ? `Item de orden no encontrado: ${identifier}`
      : "Item de orden no encontrado";
    super(message, 404, "ORDER_ITEM_NOT_FOUND");
  }
}

