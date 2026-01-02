import { AppError } from "./app-error";

/**
 * Error thrown when ironing item is not found
 */
export class IroningItemNotFoundError extends AppError {
  constructor(identifier?: string) {
    const message = identifier
      ? `Item de planchado no encontrado: ${identifier}`
      : "Item de planchado no encontrado";
    super(message, 404, "IRONING_ITEM_NOT_FOUND");
  }
}

/**
 * Error thrown when cleaning item is not found
 */
export class CleaningItemNotFoundError extends AppError {
  constructor(identifier?: string) {
    const message = identifier
      ? `Item de limpieza no encontrado: ${identifier}`
      : "Item de limpieza no encontrado";
    super(message, 404, "CLEANING_ITEM_NOT_FOUND");
  }
}
