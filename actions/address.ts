"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { addressSchema } from "@/lib/validations/address";

export async function getAddresses() {
  const session = await getSession();
  if (!session) {
    return { success: false as const, error: "Not authenticated", addresses: [] };
  }

  const addresses = await db.address.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDefault: "desc" }, { id: "desc" }],
  });

  return { success: true as const, addresses };
}

export async function createAddress(data: unknown) {
  const session = await getSession();
  if (!session) {
    return { success: false as const, error: "Not authenticated" };
  }

  const parsed = addressSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const userId = session.userId;
  const input = parsed.data;

  // If this is set as default, unset any existing default
  if (input.isDefault) {
    await db.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  // If this is the user's first address, make it default
  const addressCount = await db.address.count({ where: { userId } });
  const isDefault = input.isDefault ?? addressCount === 0;

  const address = await db.address.create({
    data: {
      userId,
      name: input.name,
      phone: input.phone || "",
      street: input.street,
      city: input.city,
      state: input.state,
      zipCode: input.zipCode,
      country: input.country,
      isDefault,
    },
  });

  revalidatePath("/account");
  revalidatePath("/checkout");

  return { success: true as const, address };
}

export async function updateAddress(addressId: string, data: unknown) {
  const session = await getSession();
  if (!session) {
    return { success: false as const, error: "Not authenticated" };
  }

  const parsed = addressSchema.partial().safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const userId = session.userId;
  const input = parsed.data;

  const address = await db.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!address) {
    return { success: false as const, error: "Address not found" };
  }

  if (input.isDefault) {
    await db.address.updateMany({
      where: { userId, isDefault: true, id: { not: addressId } },
      data: { isDefault: false },
    });
  }

  const updated = await db.address.update({
    where: { id: addressId },
    data: {
      ...input,
      phone: input.phone || "",
    },
  });

  revalidatePath("/account");
  revalidatePath("/checkout");

  return { success: true as const, address: updated };
}

export async function deleteAddress(addressId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false as const, error: "Not authenticated" };
  }

  const userId = session.userId;

  const address = await db.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!address) {
    return { success: false as const, error: "Address not found" };
  }

  // Check if address is used in any orders
  const orderCount = await db.order.count({
    where: { addressId },
  });
  if (orderCount > 0) {
    return {
      success: false as const,
      error: "Cannot delete address used in existing orders",
    };
  }

  await db.address.delete({ where: { id: addressId } });

  // If deleted address was default, promote another address
  if (address.isDefault) {
    const nextAddress = await db.address.findFirst({
      where: { userId },
      orderBy: { id: "asc" },
    });
    if (nextAddress) {
      await db.address.update({
        where: { id: nextAddress.id },
        data: { isDefault: true },
      });
    }
  }

  revalidatePath("/account");
  revalidatePath("/checkout");

  return { success: true as const };
}

export async function setDefaultAddress(addressId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false as const, error: "Not authenticated" };
  }

  const userId = session.userId;

  const address = await db.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!address) {
    return { success: false as const, error: "Address not found" };
  }

  await db.$transaction([
    db.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    }),
    db.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath("/account");
  revalidatePath("/checkout");

  return { success: true as const };
}
