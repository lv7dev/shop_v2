import { PrismaClient } from "../lib/generated/prisma/client";

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
      password: "admin123", // TODO: hash in production
      role: "ADMIN",
    },
  });

  // Create customer
  const customer = await prisma.user.create({
    data: {
      email: "customer@shop.com",
      name: "John Doe",
      password: "customer123", // TODO: hash in production
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
        images: ["/images/headphones-1.jpg", "/images/headphones-2.jpg"],
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
        images: ["/images/charger-1.jpg"],
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
        images: ["/images/tshirt-1.jpg"],
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
        images: ["/images/case-1.jpg"],
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
