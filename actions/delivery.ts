"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { getDeliverySettings } from "@/actions/settings";
import { sendToUser } from "@/lib/sse";

// Common country code → full name mapping for geocoding
const COUNTRY_NAMES: Record<string, string> = {
  VN: "Vietnam",
  US: "United States",
  UK: "United Kingdom",
  GB: "United Kingdom",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  TH: "Thailand",
  SG: "Singapore",
  MY: "Malaysia",
  ID: "Indonesia",
  PH: "Philippines",
  AU: "Australia",
  CA: "Canada",
  DE: "Germany",
  FR: "France",
};

// Common city abbreviation → full name mapping
const CITY_NAMES: Record<string, string> = {
  HCM: "Ho Chi Minh City",
  HCMC: "Ho Chi Minh City",
  "TP.HCM": "Ho Chi Minh City",
  "TP HCM": "Ho Chi Minh City",
  HN: "Hanoi",
  DN: "Da Nang",
  NYC: "New York City",
  LA: "Los Angeles",
  SF: "San Francisco",
};

function expandCountry(country: string): string {
  const upper = country.trim().toUpperCase();
  return COUNTRY_NAMES[upper] || country;
}

function expandCity(city: string): string {
  const upper = city.trim().toUpperCase();
  return CITY_NAMES[upper] || city;
}

async function nominatimSearch(
  params: Record<string, string>
): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
        ...params,
        format: "json",
        limit: "1",
      })}`,
      {
        headers: { "User-Agent": "ShopV2DeliverySimulator/1.0" },
      }
    );
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch {
    return null;
  }
}

async function geocodeAddress(addressId: string) {
  const address = await db.address.findUnique({ where: { id: addressId } });
  if (!address) return null;

  // Already geocoded
  if (address.latitude && address.longitude) {
    return { latitude: address.latitude, longitude: address.longitude };
  }

  const city = expandCity(address.city);
  const country = expandCountry(address.country);
  const street = address.street;
  const state = address.state;

  // Try multiple strategies from most specific to least specific
  const attempts: Record<string, string>[] = [
    // 1. Structured search with all fields
    { street, city, state, country },
    // 2. Structured search without street (in case building name confuses it)
    { city, state, country },
    // 3. Freeform with street + city + country
    { q: `${street}, ${city}, ${country}` },
    // 4. Freeform with just city + state + country
    { q: `${city}, ${state}, ${country}` },
    // 5. Freeform with just city + country
    { q: `${city}, ${country}` },
  ];

  try {
    for (const params of attempts) {
      const result = await nominatimSearch(params);
      if (result) {
        // Save geocoded coords back to address
        await db.address.update({
          where: { id: addressId },
          data: { latitude: result.lat, longitude: result.lng },
        });
        return { latitude: result.lat, longitude: result.lng };
      }
      // Small delay between attempts to respect Nominatim rate limit (1 req/sec)
      await new Promise((r) => setTimeout(r, 1100));
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }

  return null;
}

export async function getDeliveryTrackingData(orderId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false as const, error: "Unauthorized" };
  }

  try {
    const order = await db.order.findFirst({
      where: { id: orderId, userId: session.userId },
      include: { address: true },
    });

    if (!order) {
      return { success: false as const, error: "Order not found" };
    }

    // Allow both SHIPPED and DELIVERED (so user can revisit the tracking page)
    if (order.status !== "SHIPPED" && order.status !== "DELIVERED") {
      return { success: false as const, error: "Order is not in delivery status" };
    }

    if (!order.address) {
      return { success: false as const, error: "No delivery address for this order" };
    }

    // Geocode address if needed
    const coords = await geocodeAddress(order.address.id);
    if (!coords) {
      return {
        success: false as const,
        error: "Could not determine delivery location from address. Please make sure the shipping address is valid.",
      };
    }

    const deliverySettings = await getDeliverySettings();

    return {
      success: true as const,
      hqLat: deliverySettings.hqLatitude,
      hqLng: deliverySettings.hqLongitude,
      hqAddress: deliverySettings.hqAddress,
      destLat: coords.latitude,
      destLng: coords.longitude,
      simulationDurationMinutes: deliverySettings.simulationDurationMinutes,
      orderNumber: order.orderNumber,
      isDelivered: order.status === "DELIVERED",
    };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Get delivery tracking data error:", error);
    return { success: false as const, error: "Failed to load tracking data" };
  }
}

export async function markOrderDelivered(orderId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const order = await db.order.findFirst({
      where: { id: orderId, userId: session.userId },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.status !== "SHIPPED") {
      return { success: false, error: "Order is not in shipped status" };
    }

    await db.order.update({
      where: { id: orderId },
      data: { status: "DELIVERED" },
    });

    // Create delivered notification
    try {
      const notification = await db.notification.create({
        data: {
          type: "ORDER_UPDATE",
          title: "Your order has been delivered!",
          message: `Order #${order.orderNumber.slice(-8).toUpperCase()} has arrived at the destination.`,
          data: { orderId: order.id, orderNumber: order.orderNumber },
        },
      });
      sendToUser(order.userId, {
        type: "NEW_NOTIFICATION",
        payload: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          createdAt: notification.createdAt.toISOString(),
        },
      });
    } catch {
      // Don't fail delivery if notification fails
    }

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);

    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Mark order delivered error:", error);
    return { success: false, error: "Failed to update order status" };
  }
}
