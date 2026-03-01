import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';
import type {
  CreateProductInput,
  UpdateProductInput,
  ListProductsQuery,
} from './product.schema.js';

/** Shape of product data returned to clients */
interface ProductResponse {
  id: string;
  vendorProfileId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  imageUrl: string | null;
  stock: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: { id: string; name: string } | null;
}

/** Shape of paginated product list response */
interface ProductListResponse {
  products: ProductResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Shape of low-stock alert item */
interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
}

/**
 * Product service.
 * Handles CRUD operations for products and inventory management.
 */
export class ProductService {
  /**
   * Create a new product for a vendor.
   * Requires the vendor to have a profile.
   * @throws AppError 404 if vendor profile not found
   * @throws AppError 404 if category does not exist
   */
  async createProduct(userId: string, input: CreateProductInput): Promise<ProductResponse> {
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      logger.warn({ userId }, 'Vendor profile not found when creating product');
      throw new AppError(
        'Vendor profile not found — create a profile first',
        404,
        'PROFILE_NOT_FOUND',
      );
    }

    if (input.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
      });
      if (!category) {
        logger.warn({ categoryId: input.categoryId }, 'Category not found');
        throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }
    }

    const product = await prisma.product.create({
      data: {
        vendorProfileId: vendorProfile.id,
        categoryId: input.categoryId ?? null,
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        unit: input.unit ?? 'piece',
        imageUrl: input.imageUrl ?? null,
        stock: input.stock ?? 0,
        lowStockThreshold: input.lowStockThreshold ?? 10,
        isAvailable: input.isAvailable ?? true,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    logger.info({ userId, productId: product.id }, 'Product created');
    return product;
  }

  /**
   * Get a single product by ID.
   * @throws AppError 404 if product not found
   */
  async getProduct(productId: string): Promise<ProductResponse> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: { select: { id: true, name: true } } },
    });

    if (!product) {
      logger.warn({ productId }, 'Product not found');
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    return product;
  }

  /**
   * List products with optional filters and pagination.
   * Public endpoint — no auth required.
   */
  async listProducts(query: ListProductsQuery): Promise<ProductListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const where: Record<string, unknown> = {};

    if (query.vendorProfileId) {
      where['vendorProfileId'] = query.vendorProfileId;
    }

    if (query.categoryId) {
      where['categoryId'] = query.categoryId;
    }

    if (query.search) {
      where['name'] = { contains: query.search, mode: 'insensitive' };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {};
      if (query.minPrice !== undefined) priceFilter['gte'] = query.minPrice;
      if (query.maxPrice !== undefined) priceFilter['lte'] = query.maxPrice;
      where['price'] = priceFilter;
    }

    if (query.available !== undefined) {
      where['isAvailable'] = query.available;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.product.count({ where }),
    ]);

    logger.info({ filters: query, total }, 'Products listed');

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update a product. Only the owning vendor can update.
   * @throws AppError 404 if vendor profile not found
   * @throws AppError 404 if product not found
   * @throws AppError 403 if product doesn't belong to vendor
   * @throws AppError 404 if category does not exist
   */
  async updateProduct(
    userId: string,
    productId: string,
    input: UpdateProductInput,
  ): Promise<ProductResponse> {
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      logger.warn({ userId }, 'Vendor profile not found when updating product');
      throw new AppError('Vendor profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    const existing = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existing) {
      logger.warn({ productId }, 'Product not found for update');
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    if (existing.vendorProfileId !== vendorProfile.id) {
      logger.warn({ userId, productId }, 'Vendor attempted to update another vendor product');
      throw new AppError('You can only update your own products', 403, 'FORBIDDEN');
    }

    if (input.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
      });
      if (!category) {
        logger.warn({ categoryId: input.categoryId }, 'Category not found');
        throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
      }
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: input,
      include: { category: { select: { id: true, name: true } } },
    });

    logger.info({ userId, productId }, 'Product updated');
    return product;
  }

  /**
   * Delete a product. Only the owning vendor can delete.
   * @throws AppError 404 if vendor profile not found
   * @throws AppError 404 if product not found
   * @throws AppError 403 if product doesn't belong to vendor
   */
  async deleteProduct(userId: string, productId: string): Promise<void> {
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      logger.warn({ userId }, 'Vendor profile not found when deleting product');
      throw new AppError('Vendor profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    const existing = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existing) {
      logger.warn({ productId }, 'Product not found for deletion');
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    if (existing.vendorProfileId !== vendorProfile.id) {
      logger.warn({ userId, productId }, 'Vendor attempted to delete another vendor product');
      throw new AppError('You can only delete your own products', 403, 'FORBIDDEN');
    }

    await prisma.product.delete({ where: { id: productId } });

    logger.info({ userId, productId }, 'Product deleted');
  }

  /**
   * Get products with stock at or below their low-stock threshold.
   * Only returns products belonging to the authenticated vendor.
   * @throws AppError 404 if vendor profile not found
   */
  async getLowStockProducts(userId: string): Promise<LowStockItem[]> {
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      logger.warn({ userId }, 'Vendor profile not found for low-stock check');
      throw new AppError('Vendor profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    const products = await prisma.$queryRaw<LowStockItem[]>`
      SELECT id, name, stock, low_stock_threshold AS "lowStockThreshold"
      FROM products
      WHERE vendor_profile_id = ${vendorProfile.id}
        AND stock <= low_stock_threshold
      ORDER BY stock ASC
    `;

    logger.info({ userId, count: products.length }, 'Low-stock products retrieved');
    return products;
  }
}

/** Singleton product service instance */
export const productService = new ProductService();
