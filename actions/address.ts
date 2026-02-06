"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

type AddressInput = {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
};

export async function createAddress(userId: string, data: AddressInput) {
  // If this is set as default, unset any existing default
  if (data.isDefault) {
    await db.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  // If this is the user's first address, make it default
  const addressCount = await db.address.count({ where: { userId } });
  const isDefault = data.isDefault ?? addressCount === 0;

  const address = await db.address.create({
    data: {
      userId,
      name: data.name,
      phone: data.phone,
      street: data.street,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      country: data.country,
      isDefault,
    },
  });

  revalidatePath("/account");
  revalidatePath("/checkout");

  return { success: true, address };
}

export async function updateAddress(
  addressId: string,
  userId: string,
  data: Partial<AddressInput>
) {
  const address = await db.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!address) {
    return { success: false, error: "Address not found" };
  }

  if (data.isDefault) {
    await db.address.updateMany({
      where: { userId, isDefault: true, id: { not: addressId } },
      data: { isDefault: false },
    });
  }

  const updated = await db.address.update({
    where: { id: addressId },
    data,
  });

  revalidatePath("/account");
  revalidatePath("/checkout");

  return { success: true, address: updated };
}

export async function deleteAddress(addressId: string, userId: string) {
  const address = await db.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!address) {
    return { success: false, error: "Address not found" };
  }

  // Check if address is used in any orders
  const orderCount = await db.order.count({
    where: { addressId },
  });
  if (orderCount > 0) {
    return {
      success: false,
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

  return { success: true };
}

export async function setDefaultAddress(addressId: string, userId: string) {
  const address = await db.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!address) {
    return { success: false, error: "Address not found" };
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

  return { success: true };
}
