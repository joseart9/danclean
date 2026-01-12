import { z } from "zod";

// Use enum values directly to avoid importing Prisma client in client components
const NotificationType = {
  ERROR: "ERROR",
  INFO: "INFO",
  WARNING: "WARNING",
  SUCCESS: "SUCCESS",
  CRITICAL: "CRITICAL",
} as const;

type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const createNotificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.nativeEnum(NotificationType).optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
