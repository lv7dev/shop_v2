// @vitest-environment node
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { verifyToken } from "@/lib/auth-edge";
import { SignJWT } from "jose";

// We need to mock the db for getCurrentUser / requireAuth / requireAdmin
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

const JWT_KEY = new TextEncoder().encode("dev-secret-change-in-production");
const WRONG_KEY = new TextEncoder().encode("wrong-secret");

describe("Password hashing", () => {
  it("hashes a password", async () => {
    const hash = await hashPassword("testpassword");
    expect(hash).toBeDefined();
    expect(hash).not.toBe("testpassword");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("produces different hashes for same password (salted)", async () => {
    const hash1 = await hashPassword("password123");
    const hash2 = await hashPassword("password123");
    expect(hash1).not.toBe(hash2);
  });

  it("verifies correct password", async () => {
    const hash = await hashPassword("mysecurepassword");
    const result = await verifyPassword("mysecurepassword", hash);
    expect(result).toBe(true);
  });

  it("rejects incorrect password", async () => {
    const hash = await hashPassword("correctpassword");
    const result = await verifyPassword("wrongpassword", hash);
    expect(result).toBe(false);
  });

  it("handles empty password", async () => {
    const hash = await hashPassword("");
    const result = await verifyPassword("", hash);
    expect(result).toBe(true);
  });

  it("handles special characters", async () => {
    const password = "p@$$w0rd!#%^&*(){}[]";
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });

  it("handles long passwords", async () => {
    const password = "a".repeat(100);
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });
});

describe("verifyToken (edge auth)", () => {
  it("verifies a valid JWT token", async () => {
    const token = await new SignJWT({ userId: "user-1", role: "CUSTOMER" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_KEY);

    const result = await verifyToken(token);
    expect(result).toBeDefined();
    expect(result!.userId).toBe("user-1");
    expect(result!.role).toBe("CUSTOMER");
  });

  it("returns null for invalid token", async () => {
    const result = await verifyToken("invalid-token-string");
    expect(result).toBeNull();
  });

  it("returns null for expired token", async () => {
    const token = await new SignJWT({ userId: "user-1", role: "CUSTOMER" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 86400)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(JWT_KEY);

    const result = await verifyToken(token);
    expect(result).toBeNull();
  });

  it("returns null for token signed with wrong secret", async () => {
    const token = await new SignJWT({ userId: "user-1", role: "CUSTOMER" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(WRONG_KEY);

    const result = await verifyToken(token);
    expect(result).toBeNull();
  });

  it("preserves admin role in token", async () => {
    const token = await new SignJWT({ userId: "admin-1", role: "ADMIN" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_KEY);

    const result = await verifyToken(token);
    expect(result!.role).toBe("ADMIN");
  });
});

describe("getSession", () => {
  let cookiesModule: typeof import("next/headers");

  beforeEach(async () => {
    cookiesModule = await import("next/headers");
  });

  it("returns null when no cookie exists", async () => {
    vi.mocked(cookiesModule.cookies).mockResolvedValue({
      get: vi.fn(() => undefined),
      set: vi.fn(),
      delete: vi.fn(),
    } as never);

    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    expect(session).toBeNull();
  });

  it("returns session payload for valid token", async () => {
    const token = await new SignJWT({ userId: "user-1", role: "CUSTOMER" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_KEY);

    vi.mocked(cookiesModule.cookies).mockResolvedValue({
      get: vi.fn(() => ({ value: token })),
      set: vi.fn(),
      delete: vi.fn(),
    } as never);

    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    expect(session).toBeDefined();
    expect(session!.userId).toBe("user-1");
    expect(session!.role).toBe("CUSTOMER");
  });

  it("returns null for invalid token in cookie", async () => {
    vi.mocked(cookiesModule.cookies).mockResolvedValue({
      get: vi.fn(() => ({ value: "bad-token" })),
      set: vi.fn(),
      delete: vi.fn(),
    } as never);

    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    expect(session).toBeNull();
  });
});

describe("createSession", () => {
  let cookiesModule: typeof import("next/headers");

  beforeEach(async () => {
    cookiesModule = await import("next/headers");
  });

  it("creates a JWT and sets httpOnly cookie", async () => {
    const mockSet = vi.fn();
    vi.mocked(cookiesModule.cookies).mockResolvedValue({
      get: vi.fn(),
      set: mockSet,
      delete: vi.fn(),
    } as never);

    const { createSession } = await import("@/lib/auth");
    await createSession({ userId: "user-1", role: "CUSTOMER" });

    expect(mockSet).toHaveBeenCalledTimes(1);
    const [name, token, options] = mockSet.mock.calls[0];
    expect(name).toBe("session");
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    expect(options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    expect(options.maxAge).toBe(60 * 60 * 24 * 7);
  });
});

describe("deleteSession", () => {
  let cookiesModule: typeof import("next/headers");

  beforeEach(async () => {
    cookiesModule = await import("next/headers");
  });

  it("deletes the session cookie", async () => {
    const mockDelete = vi.fn();
    vi.mocked(cookiesModule.cookies).mockResolvedValue({
      get: vi.fn(),
      set: vi.fn(),
      delete: mockDelete,
    } as never);

    const { deleteSession } = await import("@/lib/auth");
    await deleteSession();

    expect(mockDelete).toHaveBeenCalledWith("session");
  });
});

describe("getCurrentUser", () => {
  let cookiesModule: typeof import("next/headers");
  let dbModule: typeof import("@/lib/db");

  beforeEach(async () => {
    cookiesModule = await import("next/headers");
    dbModule = await import("@/lib/db");
  });

  it("returns user from DB when session exists", async () => {
    const token = await new SignJWT({ userId: "user-1", role: "CUSTOMER" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_KEY);

    vi.mocked(cookiesModule.cookies).mockResolvedValue({
      get: vi.fn(() => ({ value: token })),
      set: vi.fn(),
      delete: vi.fn(),
    } as never);

    const mockUser = {
      id: "user-1",
      email: "test@test.com",
      name: "Test",
      image: null,
      role: "CUSTOMER",
      createdAt: new Date(),
    };
    vi.mocked(dbModule.db.user.findUnique).mockResolvedValue(mockUser as never);

    const { getCurrentUser } = await import("@/lib/auth");
    const user = await getCurrentUser();
    expect(user).toEqual(mockUser);
  });

  it("returns null when no session", async () => {
    vi.mocked(cookiesModule.cookies).mockResolvedValue({
      get: vi.fn(() => undefined),
      set: vi.fn(),
      delete: vi.fn(),
    } as never);

    const { getCurrentUser } = await import("@/lib/auth");
    const user = await getCurrentUser();
    expect(user).toBeNull();
  });
});

describe("requireAuth and requireAdmin", () => {
  let cookiesModule: typeof import("next/headers");
  let dbModule: typeof import("@/lib/db");

  beforeEach(async () => {
    cookiesModule = await import("next/headers");
    dbModule = await import("@/lib/db");
  });

  it("requireAuth throws when not logged in", async () => {
    vi.mocked(cookiesModule.cookies).mockResolvedValue({
      get: vi.fn(() => undefined),
      set: vi.fn(),
      delete: vi.fn(),
    } as never);

    const { requireAuth } = await import("@/lib/auth");
    await expect(requireAuth()).rejects.toThrow("Unauthorized");
  });

  it("requireAdmin throws Forbidden for non-admin", async () => {
    const token = await new SignJWT({ userId: "user-1", role: "CUSTOMER" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_KEY);

    vi.mocked(cookiesModule.cookies).mockResolvedValue({
      get: vi.fn(() => ({ value: token })),
      set: vi.fn(),
      delete: vi.fn(),
    } as never);

    vi.mocked(dbModule.db.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "user@test.com",
      name: "User",
      image: null,
      role: "CUSTOMER",
      createdAt: new Date(),
    } as never);

    const { requireAdmin } = await import("@/lib/auth");
    await expect(requireAdmin()).rejects.toThrow("Forbidden");
  });
});
