"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InfiniteScroll from "@/components/ui/infinite-scroll";
import {
  useNotifications,
  useUnreadCount,
  type NotificationType,
} from "@/hooks/useNotifications";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/format-relative-time";

const notificationTypeLabels: Record<NotificationType, string> = {
  ERROR: "Error",
  INFO: "Info",
  WARNING: "Advertencia",
  SUCCESS: "Éxito",
  CRITICAL: "Crítico",
};

const notificationTypeVariants: Record<
  NotificationType,
  "error" | "info" | "warning" | "success" | "default"
> = {
  ERROR: "error",
  INFO: "info",
  WARNING: "warning",
  SUCCESS: "success",
  CRITICAL: "error",
};

export function NotificationsButton() {
  const [open, setOpen] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<
    NotificationType | undefined
  >(undefined);
  const [allNotifications, setAllNotifications] = React.useState<
    ReturnType<typeof useNotifications>["notifications"]
  >([]);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const queryClient = useQueryClient();

  // Fetch unread count
  const { count: unreadCount } = useUnreadCount({
    enabled: true,
  });

  // Fetch notifications
  const { notifications, totalPages, isLoading } = useNotifications({
    type: selectedType,
    enabled: open,
    limit: 20,
    page: currentPage,
  });

  // Reset when popover closes or filter changes
  React.useEffect(() => {
    if (!open) {
      setAllNotifications([]);
      setCurrentPage(0);
      setIsLoadingMore(false);
    }
  }, [open]);

  // Reset when filter changes
  React.useEffect(() => {
    if (open) {
      setAllNotifications([]);
      setCurrentPage(0);
      setIsLoadingMore(false);
    }
  }, [selectedType, open]);

  // Accumulate notifications for infinite scroll
  React.useEffect(() => {
    if (!open) return;

    if (notifications.length > 0) {
      if (currentPage === 0) {
        setAllNotifications(notifications);
        setIsLoadingMore(false);
      } else {
        setAllNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const newNotifications = notifications.filter(
            (n) => !existingIds.has(n.id)
          );
          return [...prev, ...newNotifications];
        });
        setIsLoadingMore(false);
      }
    } else if (currentPage === 0 && notifications.length === 0 && !isLoading) {
      setAllNotifications([]);
      setIsLoadingMore(false);
    }
  }, [notifications, currentPage, open, isLoading]);

  // Calculate hasMore for InfiniteScroll
  const hasMore = React.useMemo(() => {
    if (!open) return false;
    if (totalPages > 1) {
      return currentPage < totalPages - 1;
    }
    const currentLength =
      allNotifications.length > 0
        ? allNotifications.length
        : notifications.length;
    return currentLength === 20;
  }, [
    open,
    totalPages,
    currentPage,
    allNotifications.length,
    notifications.length,
  ]);

  // Load next page function for InfiniteScroll
  const loadNextPage = React.useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading) {
      setIsLoadingMore(true);
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasMore, isLoadingMore, isLoading]);

  // Mark notification as read
  const handleMarkAsRead = React.useCallback(
    async (notificationId: string) => {
      try {
        await apiClient.patch(`/notifications/${notificationId}`, {
          action: "read",
        });
        // Invalidate queries to refresh
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({
          queryKey: ["notifications", "unread-count"],
        });
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [queryClient]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex flex-col h-[600px]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notificaciones</h3>
            <Select
              value={selectedType || "all"}
              onValueChange={(value) => {
                setSelectedType(
                  value === "all" ? undefined : (value as NotificationType)
                );
              }}
            >
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(notificationTypeLabels).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && currentPage === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-6 w-6" />
              </div>
            ) : allNotifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">
                  No hay notificaciones
                </p>
              </div>
            ) : (
              <InfiniteScroll
                hasMore={hasMore}
                isLoading={isLoadingMore || isLoading}
                next={loadNextPage}
                threshold={1}
              >
                {allNotifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <div
                      className={cn(
                        "p-4 cursor-pointer hover:bg-accent transition-colors",
                        !notification.isRead && "bg-accent/50"
                      )}
                      onMouseEnter={() => {
                        if (!notification.isRead) {
                          handleMarkAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Badge
                          variant={
                            notificationTypeVariants[notification.type] ||
                            "default"
                          }
                          className="mt-0.5 shrink-0"
                        >
                          {notificationTypeLabels[notification.type]}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm">
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {index < allNotifications.length - 1 && <Separator />}
                  </React.Fragment>
                ))}
                {hasMore && (isLoadingMore || isLoading) && (
                  <div className="flex items-center justify-center py-4">
                    <Spinner className="h-4 w-4 mr-2" />
                    <span className="text-sm text-muted-foreground">
                      Cargando más...
                    </span>
                  </div>
                )}
              </InfiniteScroll>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
