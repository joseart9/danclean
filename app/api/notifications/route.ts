import { NextResponse } from "next/server";
import { notificationService } from "@/services/notification-service";
import { AppError } from "@/errors";
import { getUserId } from "@/lib/auth";
import { NotificationType } from "@/generated/prisma/client";

export async function GET(request: Request) {
  try {
    // Get user ID
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const skipParam = searchParams.get("skip");
    const typeParam = searchParams.get("type");
    const unreadOnlyParam = searchParams.get("unread_only");

    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const skip = skipParam ? parseInt(skipParam, 10) : undefined;
    const type = typeParam && Object.values(NotificationType).includes(typeParam as NotificationType)
      ? (typeParam as NotificationType)
      : undefined;
    const unreadOnly = unreadOnlyParam === "true";

    // If unread_only is requested, return unread count
    if (unreadOnly) {
      const count = await notificationService.getUnreadCount(userId, type);
      return NextResponse.json({ count }, { status: 200 });
    }

    // Get notifications
    const result = await notificationService.getNotificationsByUserId(
      userId,
      limit,
      skip,
      type
    );

    return NextResponse.json(result, { status: 200 });
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
    console.error("Error al obtener las notificaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener las notificaciones" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get user ID
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Create notification (title, message, type are in data)
    const notification = await notificationService.createNotification({
      title: data.title,
      message: data.message,
      userId,
      type: data.type,
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    // Handle unexpected errors
    console.error("Error al crear la notificación:", error);
    return NextResponse.json(
      { error: "Error al crear la notificación" },
      { status: 500 }
    );
  }
}
