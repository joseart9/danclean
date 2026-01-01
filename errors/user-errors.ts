import { AppError } from "./app-error";

/**
 * Error thrown when trying to create a user that already exists
 */
export class UserAlreadyExistsError extends AppError {
  constructor() {
    super("Este usuario ya está registrado", 409, "USER_ALREADY_EXISTS");
  }
}

/**
 * Error thrown when user is not found
 */
export class UserNotFoundError extends AppError {
  constructor(identifier?: string) {
    const message = identifier
      ? `Usuario no encontrado: ${identifier}`
      : "Usuario no encontrado";
    super(message, 404, "USER_NOT_FOUND");
  }
}

/**
 * Error thrown when authentication fails (invalid credentials)
 */
export class InvalidCredentialsError extends AppError {
  constructor() {
    super("Credenciales inválidas", 401, "INVALID_CREDENTIALS");
  }
}
