import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCartStore, type CartItem } from "@/store/cart-store";

// Mock the DB sync functions
vi.mock("@/actions/cart-db", () => ({
  syncCartItemToDB: vi.fn(() => Promise.resolve({ success: true })),
  removeCartItemFromDB: vi.fn(() => Promise.resolve({ success: true })),
  clearCartDB: vi.fn(() => Promise.resolve({ success: true })),
}));

const mockItem = (overrides?: Partial<CartItem>): Omit<CartItem, "quantity"> => ({
  id: "prod-1",
  slug: "test-product",
  name: "Test Product",
  price: 100000,
  image: "/test.jpg",
  stock: 10,
  ...overrides,
});

describe("Cart Store", () => {
  beforeEach(() => {
    // Reset store to initial state
    useCartStore.setState({ items: [], _isAuthenticated: false });
  });

  describe("addItem", () => {
    it("adds a new item with quantity 1", () => {
      useCartStore.getState().addItem(mockItem());
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(1);
      expect(items[0].id).toBe("prod-1");
    });

    it("increments quantity for existing item", () => {
      useCartStore.getState().addItem(mockItem());
      useCartStore.getState().addItem(mockItem());
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it("caps quantity at stock limit", () => {
      const item = mockItem({ stock: 2 });
      useCartStore.getState().addItem(item);
      useCartStore.getState().addItem(item);
      useCartStore.getState().addItem(item); // Should not exceed stock
      expect(useCartStore.getState().items[0].quantity).toBe(2);
    });

    it("treats different variants as separate items", () => {
      useCartStore.getState().addItem(mockItem({ variantId: "v1" }));
      useCartStore.getState().addItem(mockItem({ variantId: "v2" }));
      expect(useCartStore.getState().items).toHaveLength(2);
    });

    it("treats same product without variant and with variant as separate", () => {
      useCartStore.getState().addItem(mockItem());
      useCartStore.getState().addItem(mockItem({ variantId: "v1" }));
      expect(useCartStore.getState().items).toHaveLength(2);
    });

    it("syncs to DB when authenticated", async () => {
      const { syncCartItemToDB } = await import("@/actions/cart-db");
      useCartStore.setState({ _isAuthenticated: true });
      useCartStore.getState().addItem(mockItem());
      expect(syncCartItemToDB).toHaveBeenCalledWith("prod-1", 1, undefined);
    });

    it("does not sync to DB when unauthenticated", async () => {
      const { syncCartItemToDB } = await import("@/actions/cart-db");
      vi.mocked(syncCartItemToDB).mockClear();
      useCartStore.setState({ _isAuthenticated: false });
      useCartStore.getState().addItem(mockItem());
      expect(syncCartItemToDB).not.toHaveBeenCalled();
    });

    it("adds a new item with custom quantity", () => {
      useCartStore.getState().addItem({ ...mockItem(), quantity: 3 });
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(3);
    });

    it("increments by custom quantity for existing item", () => {
      useCartStore.getState().addItem(mockItem());
      useCartStore.getState().addItem({ ...mockItem(), quantity: 4 });
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(5);
    });

    it("caps custom quantity at stock limit for new item", () => {
      useCartStore.getState().addItem({ ...mockItem({ stock: 3 }), quantity: 10 });
      expect(useCartStore.getState().items[0].quantity).toBe(3);
    });

    it("caps custom quantity increment at stock limit", () => {
      const item = mockItem({ stock: 5 });
      useCartStore.getState().addItem(item);
      useCartStore.getState().addItem({ ...item, quantity: 10 });
      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });
  });

  describe("removeItem", () => {
    it("removes item by id", () => {
      useCartStore.setState({
        items: [{ ...mockItem(), quantity: 2 }],
      });
      useCartStore.getState().removeItem("prod-1");
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("removes correct variant item", () => {
      useCartStore.setState({
        items: [
          { ...mockItem(), variantId: "v1", quantity: 1 },
          { ...mockItem(), variantId: "v2", quantity: 1 },
        ],
      });
      useCartStore.getState().removeItem("prod-1", "v1");
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].variantId).toBe("v2");
    });

    it("syncs to DB when authenticated", async () => {
      const { removeCartItemFromDB } = await import("@/actions/cart-db");
      useCartStore.setState({
        items: [{ ...mockItem(), quantity: 1 }],
        _isAuthenticated: true,
      });
      useCartStore.getState().removeItem("prod-1");
      expect(removeCartItemFromDB).toHaveBeenCalledWith("prod-1", undefined);
    });
  });

  describe("updateQuantity", () => {
    it("updates quantity for existing item", () => {
      useCartStore.setState({
        items: [{ ...mockItem(), quantity: 1 }],
      });
      useCartStore.getState().updateQuantity("prod-1", 5);
      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it("clamps quantity to minimum of 1", () => {
      useCartStore.setState({
        items: [{ ...mockItem(), quantity: 3 }],
      });
      useCartStore.getState().updateQuantity("prod-1", 0);
      expect(useCartStore.getState().items[0].quantity).toBe(1);
    });

    it("clamps quantity to stock maximum", () => {
      useCartStore.setState({
        items: [{ ...mockItem({ stock: 5 }), quantity: 3 }],
      });
      useCartStore.getState().updateQuantity("prod-1", 99);
      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it("handles negative quantity by clamping to 1", () => {
      useCartStore.setState({
        items: [{ ...mockItem(), quantity: 3 }],
      });
      useCartStore.getState().updateQuantity("prod-1", -5);
      expect(useCartStore.getState().items[0].quantity).toBe(1);
    });

    it("does nothing for non-existent item", () => {
      useCartStore.setState({
        items: [{ ...mockItem(), quantity: 3 }],
      });
      useCartStore.getState().updateQuantity("non-existent", 5);
      expect(useCartStore.getState().items[0].quantity).toBe(3);
    });

    it("updates correct variant", () => {
      useCartStore.setState({
        items: [
          { ...mockItem(), variantId: "v1", quantity: 1 },
          { ...mockItem(), variantId: "v2", quantity: 1 },
        ],
      });
      useCartStore.getState().updateQuantity("prod-1", 3, "v2");
      expect(useCartStore.getState().items[0].quantity).toBe(1); // v1 unchanged
      expect(useCartStore.getState().items[1].quantity).toBe(3); // v2 updated
    });
  });

  describe("clearCart", () => {
    it("empties all items", () => {
      useCartStore.setState({
        items: [
          { ...mockItem(), quantity: 1 },
          { ...mockItem({ id: "prod-2" }), quantity: 2 },
        ],
      });
      useCartStore.getState().clearCart(false);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("syncs to DB when authenticated and syncToDb is true", async () => {
      const { clearCartDB } = await import("@/actions/cart-db");
      vi.mocked(clearCartDB).mockClear();
      useCartStore.setState({
        items: [{ ...mockItem(), quantity: 1 }],
        _isAuthenticated: true,
      });
      useCartStore.getState().clearCart(true);
      expect(clearCartDB).toHaveBeenCalled();
    });

    it("does not sync to DB when syncToDb is false", async () => {
      const { clearCartDB } = await import("@/actions/cart-db");
      vi.mocked(clearCartDB).mockClear();
      useCartStore.setState({
        items: [{ ...mockItem(), quantity: 1 }],
        _isAuthenticated: true,
      });
      useCartStore.getState().clearCart(false);
      expect(clearCartDB).not.toHaveBeenCalled();
    });

    it("defaults syncToDb to true", async () => {
      const { clearCartDB } = await import("@/actions/cart-db");
      vi.mocked(clearCartDB).mockClear();
      useCartStore.setState({
        items: [{ ...mockItem(), quantity: 1 }],
        _isAuthenticated: true,
      });
      useCartStore.getState().clearCart();
      expect(clearCartDB).toHaveBeenCalled();
    });
  });

  describe("replaceCart", () => {
    it("replaces all items", () => {
      useCartStore.setState({
        items: [{ ...mockItem(), quantity: 1 }],
      });
      const newItems: CartItem[] = [
        { ...mockItem({ id: "prod-a", name: "A" }), quantity: 2 },
        { ...mockItem({ id: "prod-b", name: "B" }), quantity: 3 },
      ];
      useCartStore.getState().replaceCart(newItems);
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(2);
      expect(items[0].id).toBe("prod-a");
      expect(items[1].id).toBe("prod-b");
    });
  });

  describe("totalItems", () => {
    it("returns 0 for empty cart", () => {
      expect(useCartStore.getState().totalItems()).toBe(0);
    });

    it("sums all quantities", () => {
      useCartStore.setState({
        items: [
          { ...mockItem({ id: "p1" }), quantity: 2 },
          { ...mockItem({ id: "p2" }), quantity: 3 },
          { ...mockItem({ id: "p3" }), quantity: 5 },
        ],
      });
      expect(useCartStore.getState().totalItems()).toBe(10);
    });
  });

  describe("totalPrice", () => {
    it("returns 0 for empty cart", () => {
      expect(useCartStore.getState().totalPrice()).toBe(0);
    });

    it("calculates sum of price * quantity", () => {
      useCartStore.setState({
        items: [
          { ...mockItem({ id: "p1", price: 100000 }), quantity: 2 }, // 200000
          { ...mockItem({ id: "p2", price: 50000 }), quantity: 3 },  // 150000
        ],
      });
      expect(useCartStore.getState().totalPrice()).toBe(350000);
    });

    it("handles single item correctly", () => {
      useCartStore.setState({
        items: [{ ...mockItem({ price: 250000 }), quantity: 1 }],
      });
      expect(useCartStore.getState().totalPrice()).toBe(250000);
    });
  });

  describe("setAuthenticated", () => {
    it("updates _isAuthenticated state", () => {
      useCartStore.getState().setAuthenticated(true);
      expect(useCartStore.getState()._isAuthenticated).toBe(true);
      useCartStore.getState().setAuthenticated(false);
      expect(useCartStore.getState()._isAuthenticated).toBe(false);
    });
  });

  describe("DB sync error handling", () => {
    it("shows toast on addItem DB sync failure", async () => {
      const { syncCartItemToDB } = await import("@/actions/cart-db");
      const { toast } = await import("sonner");
      vi.mocked(syncCartItemToDB).mockRejectedValueOnce(new Error("Network error"));
      useCartStore.setState({ _isAuthenticated: true, items: [] });
      useCartStore.getState().addItem(mockItem());
      // Wait for the catch handler to fire
      await vi.waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to sync cart. Please try again.");
      });
    });

    it("shows toast on removeItem DB sync failure", async () => {
      const { removeCartItemFromDB } = await import("@/actions/cart-db");
      const { toast } = await import("sonner");
      vi.mocked(toast.error).mockClear();
      vi.mocked(removeCartItemFromDB).mockRejectedValueOnce(new Error("Network error"));
      useCartStore.setState({
        items: [{ ...mockItem(), quantity: 1 }],
        _isAuthenticated: true,
      });
      useCartStore.getState().removeItem("prod-1");
      await vi.waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to sync cart. Please try again.");
      });
    });

    it("shows toast on updateQuantity DB sync failure", async () => {
      const { syncCartItemToDB } = await import("@/actions/cart-db");
      const { toast } = await import("sonner");
      vi.mocked(toast.error).mockClear();
      vi.mocked(syncCartItemToDB).mockRejectedValueOnce(new Error("Network error"));
      useCartStore.setState({
        items: [{ ...mockItem(), quantity: 1 }],
        _isAuthenticated: true,
      });
      useCartStore.getState().updateQuantity("prod-1", 3);
      await vi.waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to sync cart. Please try again.");
      });
    });

    it("shows toast on clearCart DB sync failure", async () => {
      const { clearCartDB } = await import("@/actions/cart-db");
      const { toast } = await import("sonner");
      vi.mocked(toast.error).mockClear();
      vi.mocked(clearCartDB).mockRejectedValueOnce(new Error("Network error"));
      useCartStore.setState({
        items: [{ ...mockItem(), quantity: 1 }],
        _isAuthenticated: true,
      });
      useCartStore.getState().clearCart(true);
      await vi.waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to sync cart. Please try again.");
      });
    });
  });
});
