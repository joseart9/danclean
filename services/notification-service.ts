// DB
import { prisma } from "@/db";

// Types
import { NotificationType } from "@/generated/prisma/client";

export interface CreateNotificationInput {
  title: string;
  message: string;
  userId: string;
  type?: NotificationType;
}

export class NotificationService {
  async createNotification(data: CreateNotificationInput) {
    // Create notification
    const notification = await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        userId: data.userId,
        type: data.type || NotificationType.INFO,
      },
    });

    return notification;
  }

  async getNotificationsByUserId(
    userId: string,
    limit?: number,
    skip?: number,
    type?: NotificationType
  ) {
    // Build where clause
    const where: any = {
      userId,
      isDeleted: false,
    };

    if (type) {
      where.type = type;
    }

    // Get total count
    const total = await prisma.notification.count({
      where,
    });

    // Get notifications with pagination
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: skip,
    });

    return { notifications, total };
  }

  async getUnreadCount(userId: string, type?: NotificationType) {
    // Build where clause
    const where: any = {
      userId,
      isDeleted: false,
      isRead: false,
    };

    if (type) {
      where.type = type;
    }

    // Get unread count
    const count = await prisma.notification.count({
      where,
    });

    return count;
  }

  async markAsRead(notificationId: string, userId: string) {
    // Check if notification exists and belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    // Update notification
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
      },
    });

    return updatedNotification;
  }

  async markAsDeleted(notificationId: string, userId: string) {
    // Check if notification exists and belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    // Update notification
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isDeleted: true,
      },
    });

    return updatedNotification;
  }
}

export const notificationService = new NotificationService();
