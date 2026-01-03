import { AppError } from "./app-error";

/**
 * Error thrown when cleaning item option is not found
 */
export class CleaningItemOptionNotFoundError extends AppError {
  constructor(identifier?: string) {
    const message = identifier
      ? `Opción de limpieza no encontrada: ${identifier}`
      : "Opción de limpieza no encontrada";
    super(message, 404, "CLEANING_ITEM_OPTION_NOT_FOUND");
  }
}
