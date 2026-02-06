import { PrismaClient } from "../lib/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: "admin@shop.com",
      name: "Admin",
      password: await bcrypt.hash("admin123", 12),
      role: "ADMIN",
    },
  });

  // Create customer
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

  // Create categories
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

  // Create products
  const products = await Promise.all([
    prisma.product.create({
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
    }),
    prisma.product.create({
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
    }),
    prisma.product.create({
      data: {
        name: "Cotton T-Shirt",
        slug: "cotton-t-shirt",
        description: "Comfortable 100% organic cotton t-shirt",
        price: 24.99,
        comparePrice: 34.99,
        sku: "TS-001",
        stock: 100,
        images: ["https://picsum.photos/seed/tshirt1/600/600"],
        attributes: { sizes: ["S", "M", "L", "XL"], colors: ["Black", "White", "Navy"] },
        categoryId: clothing.id,
        isActive: true,
      },
    }),
    prisma.product.create({
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
    }),
  ]);

  // Create reviews
  await prisma.review.create({
    data: {
      rating: 5,
      comment: "Amazing sound quality!",
      userId: customer.id,
      productId: products[0].id,
    },
  });

  console.log("Seed completed successfully");
  console.log(`Created: 2 users, 3 categories, ${products.length} products, 1 review`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
