import { AppError } from "./app-error";

/**
 * Error thrown when trying to create a customer that already exists
 */
export class CustomerAlreadyExistsError extends AppError {
  constructor() {
    super("Este cliente ya está registrado", 409, "CUSTOMER_ALREADY_EXISTS");
  }
}

/**
 * Error thrown when customer is not found
 */
export class CustomerNotFoundError extends AppError {
  constructor(identifier?: string) {
    const message = identifier
      ? `Cliente no encontrado: ${identifier}`
      : "Cliente no encontrado";
    super(message, 404, "CUSTOMER_NOT_FOUND");
  }
}
