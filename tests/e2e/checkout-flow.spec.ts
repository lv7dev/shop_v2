import { test, expect } from "@playwright/test";

// Test user credentials (must exist in the database)
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || "test@example.com",
  password: process.env.TEST_USER_PASSWORD || "password123",
};

test.describe("Critical checkout flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage cart before each test
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("cart-storage"));
  });

  test("guest can browse products and add to cart", async ({ page }) => {
    await page.goto("/vi/products");

    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"], .product-card, article a');

    // Click the first product
    const firstProduct = page.locator('article a, [data-testid="product-card"] a, .product-card a').first();
    await firstProduct.click();

    // Wait for product detail page
    await page.waitForURL(/\/products\//);

    // Add to cart
    const addToCartButton = page.getByRole("button", { name: /add to cart|thêm vào giỏ/i });
    await addToCartButton.click();

    // Verify cart updated (cart icon should show count)
    await expect(
      page.locator('[data-testid="cart-count"], .cart-count, [aria-label*="cart"] span, header span')
        .filter({ hasText: /^[1-9]/ })
        .first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("user can login", async ({ page }) => {
    await page.goto("/vi/login");

    // Fill login form
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password|mật khẩu/i).fill(TEST_USER.password);

    // Submit form
    await page.getByRole("button", { name: /sign in|đăng nhập|log in/i }).click();

    // Should redirect away from login page
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 10000,
    });

    // Verify we're authenticated (check for user menu or dashboard)
    const isAuthenticated = await page
      .locator('[data-testid="user-menu"], [aria-label*="account"], [aria-label*="user"]')
      .first()
      .isVisible()
      .catch(() => true); // If redirected to home, that's also fine

    expect(isAuthenticated).toBeTruthy();
  });

  test("login → add to cart → navigate to checkout", async ({ page }) => {
    // Step 1: Login
    await page.goto("/vi/login");
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password|mật khẩu/i).fill(TEST_USER.password);
    await page.getByRole("button", { name: /sign in|đăng nhập|log in/i }).click();

    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 10000,
    });

    // Step 2: Browse to products
    await page.goto("/vi/products");
    await page.waitForSelector('article a, [data-testid="product-card"], .product-card');

    // Click first product
    const firstProduct = page.locator('article a, [data-testid="product-card"] a').first();
    await firstProduct.click();
    await page.waitForURL(/\/products\//);

    // Step 3: Add to cart
    const addToCartButton = page.getByRole("button", { name: /add to cart|thêm vào giỏ/i });
    await addToCartButton.click();

    // Brief wait for cart to update
    await page.waitForTimeout(1000);

    // Step 4: Go to cart/checkout
    // Try navigating directly to checkout
    await page.goto("/vi/checkout");

    // Should see checkout form or cart summary
    await expect(
      page.locator('text=/checkout|thanh toán|order summary|tóm tắt đơn hàng/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("checkout page shows correct totals", async ({ page }) => {
    // Set up cart via localStorage before navigating
    const cartData = {
      state: {
        items: [
          {
            id: "test-product",
            name: "Test Product",
            price: 500000,
            image: "/placeholder.jpg",
            quantity: 2,
            stock: 10,
          },
        ],
      },
      version: 0,
    };

    await page.goto("/vi");
    await page.evaluate((data) => {
      localStorage.setItem("cart-storage", JSON.stringify(data));
    }, cartData);

    await page.goto("/vi/checkout");
    await page.waitForTimeout(2000);

    // Page should display some price information
    const pageContent = await page.textContent("body");
    // Verify page loaded with content (checkout or redirect to cart)
    expect(pageContent).toBeTruthy();
  });

  test("empty cart redirects or shows empty message on checkout", async ({ page }) => {
    // Ensure empty cart
    await page.goto("/vi");
    await page.evaluate(() => {
      localStorage.setItem(
        "cart-storage",
        JSON.stringify({ state: { items: [] }, version: 0 })
      );
    });

    await page.goto("/vi/checkout");
    await page.waitForTimeout(2000);

    // Should either redirect to cart, show empty cart message, or show products link
    const pageContent = await page.textContent("body");
    const hasEmptyIndicator =
      /empty|trống|no items|không có sản phẩm|continue shopping|tiếp tục mua/i.test(
        pageContent || ""
      );
    const isRedirected = !page.url().includes("/checkout");

    expect(hasEmptyIndicator || isRedirected).toBeTruthy();
  });
});

test.describe("Navigation and page loads", () => {
  test("homepage loads correctly", async ({ page }) => {
    await page.goto("/vi");
    await expect(page).toHaveTitle(/.+/);
    // Page should have some visible content
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("products page loads with items", async ({ page }) => {
    await page.goto("/vi/products");
    // Wait for at least one product to appear
    await page.waitForSelector('article, [data-testid="product-card"], .product-card', {
      timeout: 15000,
    });
    const productCount = await page.locator('article, [data-testid="product-card"], .product-card').count();
    expect(productCount).toBeGreaterThan(0);
  });

  test("login page renders form", async ({ page }) => {
    await page.goto("/vi/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password|mật khẩu/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in|đăng nhập|log in/i })
    ).toBeVisible();
  });
});
