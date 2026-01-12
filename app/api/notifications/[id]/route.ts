import { NextResponse } from "next/server";
import { notificationService } from "@/services/notification-service";
import { AppError } from "@/errors";
import { getUserId } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const action = data.action; // "read" or "delete"

    if (action === "read") {
      const notification = await notificationService.markAsRead(id, userId);
      return NextResponse.json(notification, { status: 200 });
    } else if (action === "delete") {
      const notification = await notificationService.markAsDeleted(id, userId);
      return NextResponse.json(notification, { status: 200 });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Must be 'read' or 'delete'" },
        { status: 400 }
      );
    }
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
    console.error("Error updating notification:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: errorMessage || "Error al actualizar la notificación" },
      { status: 500 }
    );
  }
}
