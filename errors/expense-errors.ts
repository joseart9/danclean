import { AppError } from "./app-error";

/**
 * Error thrown when expense is not found
 */
export class ExpenseNotFoundError extends AppError {
  constructor(identifier?: string) {
    const message = identifier
      ? `Gasto no encontrado: ${identifier}`
      : "Gasto no encontrado";
    super(message, 404, "EXPENSE_NOT_FOUND");
  }
}
