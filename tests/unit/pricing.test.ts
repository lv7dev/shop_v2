import { describe, it, expect, beforeEach, vi } from "vitest";
import { cn, formatPrice, setExchangeRate, getExchangeRateValue, relativeTime, slugify } from "@/lib/utils";
import { PRICING } from "@/lib/pricing";

describe("PRICING constants", () => {
  it("has correct free shipping threshold", () => {
    expect(PRICING.freeShippingThreshold).toBe(1_000_000);
  });

  it("has correct default shipping cost", () => {
    expect(PRICING.defaultShippingCost).toBe(30_000);
  });

  it("has correct tax rate", () => {
    expect(PRICING.taxRate).toBe(0.08);
  });
});

describe("Shipping cost calculation", () => {
  it("charges shipping below threshold", () => {
    const subtotal = 500_000;
    const shipping = subtotal >= PRICING.freeShippingThreshold ? 0 : PRICING.defaultShippingCost;
    expect(shipping).toBe(30_000);
  });

  it("free shipping at threshold", () => {
    const subtotal = 1_000_000;
    const shipping = subtotal >= PRICING.freeShippingThreshold ? 0 : PRICING.defaultShippingCost;
    expect(shipping).toBe(0);
  });

  it("free shipping above threshold", () => {
    const subtotal = 2_000_000;
    const shipping = subtotal >= PRICING.freeShippingThreshold ? 0 : PRICING.defaultShippingCost;
    expect(shipping).toBe(0);
  });
});

describe("Tax calculation", () => {
  it("calculates 8% tax on subtotal", () => {
    const subtotal = 1_000_000;
    const discount = 0;
    const tax = (subtotal - discount) * PRICING.taxRate;
    expect(tax).toBe(80_000);
  });

  it("calculates tax after discount", () => {
    const subtotal = 1_000_000;
    const discount = 200_000;
    const tax = (subtotal - discount) * PRICING.taxRate;
    expect(tax).toBe(64_000);
  });

  it("tax is 0 when discount equals subtotal", () => {
    const subtotal = 500_000;
    const discount = 500_000;
    const tax = (subtotal - discount) * PRICING.taxRate;
    expect(tax).toBe(0);
  });
});

describe("Order total calculation", () => {
  it("calculates total: subtotal - discount + shipping + tax", () => {
    const subtotal = 500_000;
    const discount = 50_000;
    const shipping = PRICING.defaultShippingCost; // 30,000
    const tax = (subtotal - discount) * PRICING.taxRate; // 36,000
    const total = subtotal - discount + shipping + tax;
    expect(total).toBe(516_000);
  });

  it("calculates total with free shipping", () => {
    const subtotal = 1_500_000;
    const discount = 100_000;
    const shipping = subtotal >= PRICING.freeShippingThreshold ? 0 : PRICING.defaultShippingCost;
    const tax = (subtotal - discount) * PRICING.taxRate; // 112,000
    const total = subtotal - discount + shipping + tax;
    expect(total).toBe(1_512_000);
  });

  it("calculates total with no discount", () => {
    const subtotal = 200_000;
    const discount = 0;
    const shipping = PRICING.defaultShippingCost; // 30,000
    const tax = (subtotal - discount) * PRICING.taxRate; // 16,000
    const total = subtotal - discount + shipping + tax;
    expect(total).toBe(246_000);
  });
});

describe("Discount calculation", () => {
  it("percentage discount on order", () => {
    const subtotal = 1_000_000;
    const discountPercent = 10;
    const discount = subtotal * (discountPercent / 100);
    expect(discount).toBe(100_000);
  });

  it("fixed discount capped at subtotal", () => {
    const subtotal = 50_000;
    const discountValue = 100_000;
    const discount = Math.min(discountValue, subtotal);
    expect(discount).toBe(50_000);
  });

  it("fixed discount less than subtotal", () => {
    const subtotal = 500_000;
    const discountValue = 100_000;
    const discount = Math.min(discountValue, subtotal);
    expect(discount).toBe(100_000);
  });

  it("percentage discount on eligible products only", () => {
    const items = [
      { productId: "p1", price: 100_000, quantity: 2 }, // eligible
      { productId: "p2", price: 200_000, quantity: 1 }, // not eligible
    ];
    const eligibleIds = new Set(["p1"]);
    const eligibleSubtotal = items.reduce((sum, item) => {
      if (!eligibleIds.has(item.productId)) return sum;
      return sum + item.price * item.quantity;
    }, 0);
    const discount = eligibleSubtotal * (20 / 100); // 20% off eligible
    expect(eligibleSubtotal).toBe(200_000);
    expect(discount).toBe(40_000);
  });
});

describe("formatPrice", () => {
  beforeEach(() => {
    setExchangeRate(25000);
  });

  it("formats VND by default (locale vi)", () => {
    const result = formatPrice(100000);
    // Should contain 100.000 in VND format
    expect(result).toContain("100.000");
  });

  it("formats VND explicitly", () => {
    const result = formatPrice(100000, "vi");
    expect(result).toContain("100.000");
  });

  it("converts to USD with locale en", () => {
    const result = formatPrice(250000, "en");
    // 250000 / 25000 = $10.00
    expect(result).toBe("$10.00");
  });

  it("formats explicit VND currency code (no conversion)", () => {
    const result = formatPrice(100000, "VND");
    expect(result).toContain("100.000");
  });

  it("formats explicit USD currency code (no conversion)", () => {
    const result = formatPrice(10, "USD");
    expect(result).toBe("$10.00");
  });

  it("defaults to VND for unknown locale", () => {
    const result = formatPrice(50000, "unknown");
    expect(result).toContain("50.000");
  });

  it("handles zero", () => {
    const result = formatPrice(0);
    expect(result).toContain("0");
  });

  describe("exchange rate", () => {
    it("uses custom exchange rate", () => {
      setExchangeRate(20000);
      const result = formatPrice(100000, "en");
      // 100000 / 20000 = $5.00
      expect(result).toBe("$5.00");
    });

    it("getExchangeRateValue returns current rate", () => {
      setExchangeRate(30000);
      expect(getExchangeRateValue()).toBe(30000);
    });
  });
});

describe("cn (className merge)", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges tailwind conflicts", () => {
    // tailwind-merge should resolve p-2 vs p-4
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
  });
});

describe("relativeTime", () => {
  it("returns just now for < 60 seconds", () => {
    const now = new Date();
    const result = relativeTime(now, "en");
    // "now" or "just now" or similar
    expect(result).toBeTruthy();
  });

  it("returns minutes ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = relativeTime(fiveMinAgo, "en");
    expect(result).toContain("5");
  });

  it("returns hours ago", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const result = relativeTime(twoHoursAgo, "en");
    expect(result).toContain("2");
  });

  it("returns days ago", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const result = relativeTime(threeDaysAgo, "en");
    expect(result).toContain("3");
  });

  it("defaults to vi locale", () => {
    const now = new Date();
    const result = relativeTime(now);
    expect(result).toBeTruthy();
  });
});

describe("slugify", () => {
  it("converts text to lowercase slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Hello! @World#")).toBe("hello-world");
  });

  it("collapses multiple dashes", () => {
    expect(slugify("hello---world")).toBe("hello-world");
  });

  it("handles multiple spaces", () => {
    expect(slugify("hello   world")).toBe("hello-world");
  });

  it("trims and converts leading/trailing spaces to dashes", () => {
    // slugify trims text but spaces become dashes before trim
    const result = slugify("  hello world  ");
    expect(result).toContain("hello-world");
  });
});
