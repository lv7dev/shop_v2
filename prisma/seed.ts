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

  await prisma.user.create({
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

  const customer2 = await prisma.user.create({
    data: {
      email: "jane@shop.com",
      name: "Jane Smith",
      password: await bcrypt.hash("customer123", 12),
      role: "CUSTOMER",
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

  const accessories = await prisma.category.create({
    data: {
      name: "Accessories",
      slug: "accessories",
      description: "Phone cases, chargers, and more",
      parentId: electronics.id,
    },
  });

  const audio = await prisma.category.create({
    data: {
      name: "Audio",
      slug: "audio",
      description: "Headphones, speakers, and audio equipment",
      parentId: electronics.id,
    },
  });

  const clothing = await prisma.category.create({
    data: {
      name: "Clothing",
      slug: "clothing",
      description: "Apparel and fashion",
    },
  });

  const menClothing = await prisma.category.create({
    data: {
      name: "Men",
      slug: "men",
      description: "Men's clothing and fashion",
      parentId: clothing.id,
    },
  });

  const womenClothing = await prisma.category.create({
    data: {
      name: "Women",
      slug: "women",
      description: "Women's clothing and fashion",
      parentId: clothing.id,
    },
  });

  const homeKitchen = await prisma.category.create({
    data: {
      name: "Home & Kitchen",
      slug: "home-kitchen",
      description: "Home decor, kitchen appliances, and more",
    },
  });

  const sports = await prisma.category.create({
    data: {
      name: "Sports & Outdoors",
      slug: "sports-outdoors",
      description: "Sports equipment and outdoor gear",
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
  const [colorBlack, colorWhite, colorNavy, colorRed, colorGreen] = await Promise.all([
    prisma.facetValue.create({ data: { facetId: colorFacet.id, value: "Black", slug: "black", displayOrder: 1 } }),
    prisma.facetValue.create({ data: { facetId: colorFacet.id, value: "White", slug: "white", displayOrder: 2 } }),
    prisma.facetValue.create({ data: { facetId: colorFacet.id, value: "Navy", slug: "navy", displayOrder: 3 } }),
    prisma.facetValue.create({ data: { facetId: colorFacet.id, value: "Red", slug: "red", displayOrder: 4 } }),
    prisma.facetValue.create({ data: { facetId: colorFacet.id, value: "Green", slug: "green", displayOrder: 5 } }),
  ]);

  // Facet values — Brand
  const [brandSony, brandAnker, brandNike, brandAdidas, brandSamsung, brandApple, brandBose, brandPhilips] =
    await Promise.all([
      prisma.facetValue.create({ data: { facetId: brandFacet.id, value: "Sony", slug: "sony", displayOrder: 1 } }),
      prisma.facetValue.create({ data: { facetId: brandFacet.id, value: "Anker", slug: "anker", displayOrder: 2 } }),
      prisma.facetValue.create({ data: { facetId: brandFacet.id, value: "Nike", slug: "nike", displayOrder: 3 } }),
      prisma.facetValue.create({ data: { facetId: brandFacet.id, value: "Adidas", slug: "adidas", displayOrder: 4 } }),
      prisma.facetValue.create({ data: { facetId: brandFacet.id, value: "Samsung", slug: "samsung", displayOrder: 5 } }),
      prisma.facetValue.create({ data: { facetId: brandFacet.id, value: "Apple", slug: "apple", displayOrder: 6 } }),
      prisma.facetValue.create({ data: { facetId: brandFacet.id, value: "Bose", slug: "bose", displayOrder: 7 } }),
      prisma.facetValue.create({ data: { facetId: brandFacet.id, value: "Philips", slug: "philips", displayOrder: 8 } }),
    ]);

  // ── Products ───────────────────────────────────

  // 1. Wireless Headphones
  const headphones = await prisma.product.create({
    data: {
      name: "Wireless Headphones",
      slug: "wireless-headphones",
      description: "Premium noise-cancelling wireless headphones with 30-hour battery life and superior sound quality.",
      price: 149.99,
      comparePrice: 199.99,
      sku: "WH-001",
      stock: 50,
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop",
      ],
      categoryId: audio.id,
      isActive: true,
    },
  });

  // 2. USB-C Charger
  const charger = await prisma.product.create({
    data: {
      name: "USB-C Charger",
      slug: "usb-c-charger",
      description: "65W fast charging adapter compatible with laptops, tablets, and smartphones.",
      price: 29.99,
      sku: "UC-001",
      stock: 200,
      images: [
        "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=600&fit=crop",
      ],
      categoryId: accessories.id,
      isActive: true,
    },
  });

  // 3. Smartphone Case
  const phoneCase = await prisma.product.create({
    data: {
      name: "Smartphone Case",
      slug: "smartphone-case",
      description: "Slim protective case with shock absorption and anti-scratch coating.",
      price: 19.99,
      sku: "SC-001",
      stock: 150,
      images: [
        "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&h=600&fit=crop",
      ],
      categoryId: accessories.id,
      isActive: true,
    },
  });

  // 4. Bluetooth Speaker
  const speaker = await prisma.product.create({
    data: {
      name: "Bluetooth Speaker",
      slug: "bluetooth-speaker",
      description: "Portable waterproof Bluetooth speaker with 360-degree sound and 12-hour playtime.",
      price: 79.99,
      comparePrice: 99.99,
      sku: "BS-001",
      stock: 75,
      images: [
        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=600&h=600&fit=crop",
      ],
      categoryId: audio.id,
      isActive: true,
    },
  });

  // 5. Laptop Stand
  const laptopStand = await prisma.product.create({
    data: {
      name: "Laptop Stand",
      slug: "laptop-stand",
      description: "Adjustable aluminum laptop stand for improved ergonomics and cooling.",
      price: 49.99,
      sku: "LS-001",
      stock: 120,
      images: [
        "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop",
      ],
      categoryId: accessories.id,
      isActive: true,
    },
  });

  // 6. Wireless Mouse
  const mouse = await prisma.product.create({
    data: {
      name: "Wireless Mouse",
      slug: "wireless-mouse",
      description: "Ergonomic wireless mouse with silent clicks and long battery life.",
      price: 34.99,
      sku: "WM-001",
      stock: 180,
      images: [
        "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop",
      ],
      categoryId: accessories.id,
      isActive: true,
    },
  });

  // 7. Cotton T-Shirt (with variants)
  const tshirt = await prisma.product.create({
    data: {
      name: "Cotton T-Shirt",
      slug: "cotton-t-shirt",
      description: "Comfortable 100% organic cotton t-shirt with a relaxed fit.",
      price: 24.99,
      comparePrice: 34.99,
      sku: "TS-001",
      stock: 0,
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=600&fit=crop",
      ],
      categoryId: menClothing.id,
      isActive: true,
    },
  });

  // 8. Denim Jeans
  const jeans = await prisma.product.create({
    data: {
      name: "Denim Jeans",
      slug: "denim-jeans",
      description: "Classic slim-fit denim jeans with stretch comfort technology.",
      price: 59.99,
      comparePrice: 79.99,
      sku: "DJ-001",
      stock: 90,
      images: [
        "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=600&fit=crop",
      ],
      categoryId: menClothing.id,
      isActive: true,
    },
  });

  // 9. Running Shoes
  const runningShoes = await prisma.product.create({
    data: {
      name: "Running Shoes",
      slug: "running-shoes",
      description: "Lightweight running shoes with responsive cushioning for long-distance comfort.",
      price: 89.99,
      comparePrice: 119.99,
      sku: "RS-001",
      stock: 60,
      images: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=600&fit=crop",
      ],
      categoryId: sports.id,
      isActive: true,
    },
  });

  // 10. Yoga Mat
  const yogaMat = await prisma.product.create({
    data: {
      name: "Yoga Mat",
      slug: "yoga-mat",
      description: "Non-slip premium yoga mat with extra cushioning. 6mm thick for joint support.",
      price: 29.99,
      sku: "YM-001",
      stock: 100,
      images: [
        "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&h=600&fit=crop",
      ],
      categoryId: sports.id,
      isActive: true,
    },
  });

  // 11. Summer Dress
  const dress = await prisma.product.create({
    data: {
      name: "Summer Dress",
      slug: "summer-dress",
      description: "Flowy summer dress with floral print, perfect for warm weather occasions.",
      price: 44.99,
      sku: "SD-001",
      stock: 45,
      images: [
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=600&fit=crop",
      ],
      categoryId: womenClothing.id,
      isActive: true,
    },
  });

  // 12. Leather Wallet
  const wallet = await prisma.product.create({
    data: {
      name: "Leather Wallet",
      slug: "leather-wallet",
      description: "Genuine leather bifold wallet with RFID blocking technology.",
      price: 39.99,
      sku: "LW-001",
      stock: 130,
      images: [
        "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=600&fit=crop",
      ],
      categoryId: accessories.id,
      isActive: true,
    },
  });

  // 13. Coffee Maker
  const coffeeMaker = await prisma.product.create({
    data: {
      name: "Coffee Maker",
      slug: "coffee-maker",
      description: "12-cup programmable coffee maker with built-in grinder and thermal carafe.",
      price: 69.99,
      comparePrice: 89.99,
      sku: "CM-001",
      stock: 40,
      images: [
        "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&h=600&fit=crop",
      ],
      categoryId: homeKitchen.id,
      isActive: true,
    },
  });

  // 14. Stainless Steel Water Bottle
  const waterBottle = await prisma.product.create({
    data: {
      name: "Stainless Steel Water Bottle",
      slug: "stainless-steel-water-bottle",
      description: "Double-wall insulated water bottle that keeps drinks cold 24h or hot 12h.",
      price: 24.99,
      sku: "WB-001",
      stock: 200,
      images: [
        "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=600&fit=crop",
      ],
      categoryId: sports.id,
      isActive: true,
    },
  });

  // 15. Desk Lamp
  const deskLamp = await prisma.product.create({
    data: {
      name: "Desk Lamp",
      slug: "desk-lamp",
      description: "LED desk lamp with adjustable brightness, color temperature, and USB charging port.",
      price: 34.99,
      sku: "DL-001",
      stock: 85,
      images: [
        "https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=600&h=600&fit=crop",
      ],
      categoryId: homeKitchen.id,
      isActive: true,
    },
  });

  // 16. Backpack
  const backpack = await prisma.product.create({
    data: {
      name: "Backpack",
      slug: "backpack",
      description: "Durable water-resistant backpack with laptop compartment and multiple pockets.",
      price: 54.99,
      comparePrice: 69.99,
      sku: "BP-001",
      stock: 70,
      images: [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop",
      ],
      categoryId: sports.id,
      isActive: true,
    },
  });

  // 17. Sunglasses
  const sunglasses = await prisma.product.create({
    data: {
      name: "Sunglasses",
      slug: "sunglasses",
      description: "Polarized UV400 sunglasses with lightweight frame and scratch-resistant lenses.",
      price: 29.99,
      sku: "SG-001",
      stock: 110,
      images: [
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop",
      ],
      categoryId: accessories.id,
      isActive: true,
    },
  });

  // 18. Ceramic Mug Set
  const mugSet = await prisma.product.create({
    data: {
      name: "Ceramic Mug Set",
      slug: "ceramic-mug-set",
      description: "Set of 4 handcrafted ceramic mugs in earthy tones. Microwave and dishwasher safe.",
      price: 19.99,
      sku: "MS-001",
      stock: 95,
      images: [
        "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&h=600&fit=crop",
      ],
      categoryId: homeKitchen.id,
      isActive: true,
    },
  });

  // 19. Fitness Tracker
  const fitnessTracker = await prisma.product.create({
    data: {
      name: "Fitness Tracker",
      slug: "fitness-tracker",
      description: "Advanced fitness tracker with heart rate monitor, GPS, and 7-day battery life.",
      price: 99.99,
      comparePrice: 129.99,
      sku: "FT-001",
      stock: 55,
      images: [
        "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&h=600&fit=crop",
      ],
      categoryId: electronics.id,
      isActive: true,
    },
  });

  // 20. Throw Pillow Set
  const throwPillows = await prisma.product.create({
    data: {
      name: "Throw Pillow Set",
      slug: "throw-pillow-set",
      description: "Set of 2 decorative throw pillows with removable, washable covers.",
      price: 34.99,
      sku: "TP-001",
      stock: 80,
      images: [
        "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&h=600&fit=crop",
      ],
      categoryId: homeKitchen.id,
      isActive: true,
    },
  });

  // ── Product Facet Values (for filtering & SEO) ──

  await prisma.productFacetValue.createMany({
    data: [
      // 1. Headphones → Sony, Black
      { productId: headphones.id, facetValueId: brandSony.id },
      { productId: headphones.id, facetValueId: colorBlack.id },
      // 2. Charger → Anker, White
      { productId: charger.id, facetValueId: brandAnker.id },
      { productId: charger.id, facetValueId: colorWhite.id },
      // 3. Phone Case → Samsung, Black, White
      { productId: phoneCase.id, facetValueId: brandSamsung.id },
      { productId: phoneCase.id, facetValueId: colorBlack.id },
      { productId: phoneCase.id, facetValueId: colorWhite.id },
      // 4. Speaker → Bose, Black
      { productId: speaker.id, facetValueId: brandBose.id },
      { productId: speaker.id, facetValueId: colorBlack.id },
      // 5. Laptop Stand → Anker
      { productId: laptopStand.id, facetValueId: brandAnker.id },
      // 6. Mouse → Apple, White
      { productId: mouse.id, facetValueId: brandApple.id },
      { productId: mouse.id, facetValueId: colorWhite.id },
      // 7. T-Shirt → Nike + all sizes/colors
      { productId: tshirt.id, facetValueId: brandNike.id },
      { productId: tshirt.id, facetValueId: sizeS.id },
      { productId: tshirt.id, facetValueId: sizeM.id },
      { productId: tshirt.id, facetValueId: sizeL.id },
      { productId: tshirt.id, facetValueId: sizeXL.id },
      { productId: tshirt.id, facetValueId: colorBlack.id },
      { productId: tshirt.id, facetValueId: colorWhite.id },
      { productId: tshirt.id, facetValueId: colorNavy.id },
      // 8. Jeans → Adidas, Navy
      { productId: jeans.id, facetValueId: brandAdidas.id },
      { productId: jeans.id, facetValueId: colorNavy.id },
      // 9. Running Shoes → Nike, Black, Red
      { productId: runningShoes.id, facetValueId: brandNike.id },
      { productId: runningShoes.id, facetValueId: colorBlack.id },
      { productId: runningShoes.id, facetValueId: colorRed.id },
      // 10. Yoga Mat → Adidas, Green
      { productId: yogaMat.id, facetValueId: brandAdidas.id },
      { productId: yogaMat.id, facetValueId: colorGreen.id },
      // 11. Dress → Red
      { productId: dress.id, facetValueId: colorRed.id },
      { productId: dress.id, facetValueId: sizeS.id },
      { productId: dress.id, facetValueId: sizeM.id },
      { productId: dress.id, facetValueId: sizeL.id },
      // 12. Wallet → Black
      { productId: wallet.id, facetValueId: colorBlack.id },
      // 13. Coffee Maker → Philips, Black
      { productId: coffeeMaker.id, facetValueId: brandPhilips.id },
      { productId: coffeeMaker.id, facetValueId: colorBlack.id },
      // 14. Water Bottle → Green
      { productId: waterBottle.id, facetValueId: colorGreen.id },
      // 15. Desk Lamp → Philips, White
      { productId: deskLamp.id, facetValueId: brandPhilips.id },
      { productId: deskLamp.id, facetValueId: colorWhite.id },
      // 16. Backpack → Nike, Black
      { productId: backpack.id, facetValueId: brandNike.id },
      { productId: backpack.id, facetValueId: colorBlack.id },
      // 17. Sunglasses → Black
      { productId: sunglasses.id, facetValueId: colorBlack.id },
      // 18. Mug Set → White
      { productId: mugSet.id, facetValueId: colorWhite.id },
      // 19. Fitness Tracker → Samsung, Black
      { productId: fitnessTracker.id, facetValueId: brandSamsung.id },
      { productId: fitnessTracker.id, facetValueId: colorBlack.id },
      // 20. Throw Pillows → White
      { productId: throwPillows.id, facetValueId: colorWhite.id },
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

  await prisma.review.createMany({
    data: [
      { rating: 5, comment: "Amazing sound quality! Best headphones I've ever owned.", userId: customer.id, productId: headphones.id },
      { rating: 4, comment: "Great fit and comfortable fabric. Love the Navy color!", userId: customer.id, productId: tshirt.id },
      { rating: 5, comment: "Fast charging and works with all my devices.", userId: customer2.id, productId: charger.id },
      { rating: 4, comment: "Great sound for the size. Battery lasts all day.", userId: customer.id, productId: speaker.id },
      { rating: 5, comment: "Perfect for my desk setup. Very sturdy.", userId: customer2.id, productId: laptopStand.id },
      { rating: 5, comment: "Super comfortable for long runs!", userId: customer.id, productId: runningShoes.id },
      { rating: 4, comment: "Nice thickness, doesn't slip at all.", userId: customer2.id, productId: yogaMat.id },
      { rating: 5, comment: "Beautiful dress, fits perfectly.", userId: customer2.id, productId: dress.id },
      { rating: 4, comment: "Makes great coffee every morning.", userId: customer.id, productId: coffeeMaker.id },
      { rating: 5, comment: "Keeps water ice cold all day long!", userId: customer2.id, productId: waterBottle.id },
    ],
  });

  // ── Summary ────────────────────────────────────

  console.log("Seed completed successfully");
  console.log(
    `Created: 3 users, 8 categories, 3 facets, 13 facet values, 20 products, ${variantCombos.length} variants, 10 reviews`
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
