import { PrismaClient } from "../lib/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data (order matters for foreign keys)
  await prisma.variantFacetValue.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productFacetValue.deleteMany();
  await prisma.facetValue.deleteMany();
  await prisma.facet.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ──────────────────────────────────────

  const admin = await prisma.user.create({
    data: {
      email: "admin@shop.com",
      name: "Admin",
      password: await bcrypt.hash("admin123", 12),
      role: "ADMIN",
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "customer@shop.com",
      name: "John Doe",
      password: await bcrypt.hash("customer123", 12),
      role: "CUSTOMER",
      addresses: {
        create: {
          name: "John Doe",
          phone: "+1234567890",
          street: "123 Main St",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "US",
          isDefault: true,
        },
      },
    },
  });

  // ── Categories ──────────────────────────────────

  const electronics = await prisma.category.create({
    data: {
      name: "Electronics",
      slug: "electronics",
      description: "Electronic devices and gadgets",
    },
  });

  const clothing = await prisma.category.create({
    data: {
      name: "Clothing",
      slug: "clothing",
      description: "Apparel and fashion",
    },
  });

  const accessories = await prisma.category.create({
    data: {
      name: "Accessories",
      slug: "accessories",
      description: "Phone cases, chargers, and more",
      parentId: electronics.id,
    },
  });

  // ── Facets (Attributes) ─────────────────────────

  const sizeFacet = await prisma.facet.create({
    data: { name: "Size", slug: "size", displayOrder: 1 },
  });

  const colorFacet = await prisma.facet.create({
    data: { name: "Color", slug: "color", displayOrder: 2 },
  });

  const brandFacet = await prisma.facet.create({
    data: { name: "Brand", slug: "brand", displayOrder: 3 },
  });

  // Facet values — Size
  const [sizeS, sizeM, sizeL, sizeXL] = await Promise.all([
    prisma.facetValue.create({ data: { facetId: sizeFacet.id, value: "S", slug: "s", displayOrder: 1 } }),
    prisma.facetValue.create({ data: { facetId: sizeFacet.id, value: "M", slug: "m", displayOrder: 2 } }),
    prisma.facetValue.create({ data: { facetId: sizeFacet.id, value: "L", slug: "l", displayOrder: 3 } }),
    prisma.facetValue.create({ data: { facetId: sizeFacet.id, value: "XL", slug: "xl", displayOrder: 4 } }),
  ]);

  // Facet values — Color
  const [colorBlack, colorWhite, colorNavy] = await Promise.all([
    prisma.facetValue.create({ data: { facetId: colorFacet.id, value: "Black", slug: "black", displayOrder: 1 } }),
    prisma.facetValue.create({ data: { facetId: colorFacet.id, value: "White", slug: "white", displayOrder: 2 } }),
    prisma.facetValue.create({ data: { facetId: colorFacet.id, value: "Navy", slug: "navy", displayOrder: 3 } }),
  ]);

  // Facet values — Brand
  const [brandSony, brandAnker, brandNike] = await Promise.all([
    prisma.facetValue.create({ data: { facetId: brandFacet.id, value: "Sony", slug: "sony", displayOrder: 1 } }),
    prisma.facetValue.create({ data: { facetId: brandFacet.id, value: "Anker", slug: "anker", displayOrder: 2 } }),
    prisma.facetValue.create({ data: { facetId: brandFacet.id, value: "Nike", slug: "nike", displayOrder: 3 } }),
  ]);

  // ── Products ───────────────────────────────────

  const headphones = await prisma.product.create({
    data: {
      name: "Wireless Headphones",
      slug: "wireless-headphones",
      description: "Premium noise-cancelling wireless headphones",
      price: 149.99,
      comparePrice: 199.99,
      sku: "WH-001",
      stock: 50,
      images: [
        "https://picsum.photos/seed/headphones1/600/600",
        "https://picsum.photos/seed/headphones2/600/600",
      ],
      categoryId: electronics.id,
      isActive: true,
    },
  });

  const charger = await prisma.product.create({
    data: {
      name: "USB-C Charger",
      slug: "usb-c-charger",
      description: "65W fast charging adapter",
      price: 29.99,
      sku: "UC-001",
      stock: 200,
      images: ["https://picsum.photos/seed/charger1/600/600"],
      categoryId: accessories.id,
      isActive: true,
    },
  });

  // T-Shirt — base product (price is display default; stock tracked per variant)
  const tshirt = await prisma.product.create({
    data: {
      name: "Cotton T-Shirt",
      slug: "cotton-t-shirt",
      description: "Comfortable 100% organic cotton t-shirt",
      price: 24.99,
      comparePrice: 34.99,
      sku: "TS-001",
      stock: 0,
      images: ["https://picsum.photos/seed/tshirt1/600/600"],
      categoryId: clothing.id,
      isActive: true,
    },
  });

  const phoneCase = await prisma.product.create({
    data: {
      name: "Smartphone Case",
      slug: "smartphone-case",
      description: "Slim protective case with shock absorption",
      price: 19.99,
      sku: "SC-001",
      stock: 150,
      images: ["https://picsum.photos/seed/case1/600/600"],
      categoryId: accessories.id,
      isActive: true,
    },
  });

  // ── Product Facet Values (for filtering & SEO) ──

  await prisma.productFacetValue.createMany({
    data: [
      // Headphones → Sony, Black
      { productId: headphones.id, facetValueId: brandSony.id },
      { productId: headphones.id, facetValueId: colorBlack.id },
      // Charger → Anker
      { productId: charger.id, facetValueId: brandAnker.id },
      // T-Shirt → Nike + all sizes/colors it comes in
      { productId: tshirt.id, facetValueId: brandNike.id },
      { productId: tshirt.id, facetValueId: sizeS.id },
      { productId: tshirt.id, facetValueId: sizeM.id },
      { productId: tshirt.id, facetValueId: sizeL.id },
      { productId: tshirt.id, facetValueId: sizeXL.id },
      { productId: tshirt.id, facetValueId: colorBlack.id },
      { productId: tshirt.id, facetValueId: colorWhite.id },
      { productId: tshirt.id, facetValueId: colorNavy.id },
      // Phone Case → Black, White
      { productId: phoneCase.id, facetValueId: colorBlack.id },
      { productId: phoneCase.id, facetValueId: colorWhite.id },
    ],
  });

  // ── Variants for Cotton T-Shirt ─────────────────
  // Each Size × Color combo = separate variant with own price, stock, SKU

  const variantCombos = [
    { size: sizeS, color: colorBlack, sku: "TS-S-BLK", price: 24.99, stock: 15 },
    { size: sizeS, color: colorWhite, sku: "TS-S-WHT", price: 24.99, stock: 10 },
    { size: sizeS, color: colorNavy, sku: "TS-S-NVY", price: 24.99, stock: 8 },
    { size: sizeM, color: colorBlack, sku: "TS-M-BLK", price: 24.99, stock: 20 },
    { size: sizeM, color: colorWhite, sku: "TS-M-WHT", price: 24.99, stock: 18 },
    { size: sizeM, color: colorNavy, sku: "TS-M-NVY", price: 24.99, stock: 12 },
    { size: sizeL, color: colorBlack, sku: "TS-L-BLK", price: 26.99, stock: 14 },
    { size: sizeL, color: colorWhite, sku: "TS-L-WHT", price: 26.99, stock: 10 },
    { size: sizeL, color: colorNavy, sku: "TS-L-NVY", price: 26.99, stock: 6 },
    { size: sizeXL, color: colorBlack, sku: "TS-XL-BLK", price: 28.99, stock: 8 },
    { size: sizeXL, color: colorWhite, sku: "TS-XL-WHT", price: 28.99, stock: 5 },
    { size: sizeXL, color: colorNavy, sku: "TS-XL-NVY", price: 28.99, stock: 3 },
  ];

  for (const combo of variantCombos) {
    const variant = await prisma.productVariant.create({
      data: {
        productId: tshirt.id,
        sku: combo.sku,
        price: combo.price,
        stock: combo.stock,
      },
    });

    await prisma.variantFacetValue.createMany({
      data: [
        { variantId: variant.id, facetValueId: combo.size.id },
        { variantId: variant.id, facetValueId: combo.color.id },
      ],
    });
  }

  // ── Reviews ────────────────────────────────────

  await prisma.review.create({
    data: {
      rating: 5,
      comment: "Amazing sound quality!",
      userId: customer.id,
      productId: headphones.id,
    },
  });

  await prisma.review.create({
    data: {
      rating: 4,
      comment: "Great fit and comfortable fabric. Love the Navy color!",
      userId: customer.id,
      productId: tshirt.id,
    },
  });

  // ── Summary ────────────────────────────────────

  console.log("Seed completed successfully");
  console.log(
    `Created: 2 users, 3 categories, 3 facets, 10 facet values, 4 products, ${variantCombos.length} variants, 2 reviews`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
