import { NextResponse } from "next/server";
import { userService } from "@/services/user-service";
import { createUserSchema } from "@/validators/user";
import { AppError } from "@/errors";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate request body
    const validatedData = createUserSchema.parse(data);

    // Create user
    await userService.createUser(validatedData);

    // Return success response
    return NextResponse.json(
      { message: "Usuario creado correctamente" },
      { status: 201 }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const tree = z.treeifyError(error);
      return NextResponse.json({ error: tree }, { status: 400 });
    }

    // Handle custom application errors
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
