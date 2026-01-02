import { NextResponse } from "next/server";
import { userService } from "@/services/user-service";
import { AppError } from "@/errors";

export async function GET() {
  try {
    // Get all users (excluding passwords)
    const users = await userService.getAllUsers();

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
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
    console.error("Error al obtener los usuarios:", error);
    return NextResponse.json(
      { error: "Error al obtener los usuarios" },
      { status: 500 }
    );
  }
}
