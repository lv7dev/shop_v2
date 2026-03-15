import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// Mock next/headers (cookies) for auth tests
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));
