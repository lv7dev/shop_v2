"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function getNotifications() {
  const session = await getSession();
  if (!session) return { success: false, notifications: [] };

  const notifications = await db.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      reads: {
        where: { userId: session.userId },
        select: { id: true },
      },
    },
  });

  return {
    success: true,
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data as Record<string, unknown> | null,
      createdAt: n.createdAt.toISOString(),
      isRead: n.reads.length > 0,
    })),
  };
}

export async function markNotificationRead(notificationId: string) {
  const session = await getSession();
  if (!session) return { success: false };

  await db.notificationRead.upsert({
    where: {
      notificationId_userId: {
        notificationId,
        userId: session.userId,
      },
    },
    create: {
      notificationId,
      userId: session.userId,
    },
    update: {},
  });

  return { success: true };
}

export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session) return { success: false };

  const unread = await db.notification.findMany({
    where: {
      reads: { none: { userId: session.userId } },
    },
    select: { id: true },
  });

  if (unread.length > 0) {
    await db.notificationRead.createMany({
      data: unread.map((n) => ({
        notificationId: n.id,
        userId: session.userId,
      })),
      skipDuplicates: true,
    });
  }

  return { success: true };
}
