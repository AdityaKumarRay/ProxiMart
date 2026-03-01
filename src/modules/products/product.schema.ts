import { z } from 'zod';

/**
 * Schema for creating a new product.
 * Vendors provide product details, pricing, and inventory info.
 */
export const createProductSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID').optional(),
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(200, 'Product name must be at most 200 characters'),
  description: z.string().max(2000, 'Description must be at most 2000 characters').optional(),
  price: z
    .number()
    .positive('Price must be positive')
    .max(1_000_000, 'Price must be at most 1,000,000'),
  unit: z.string().min(1).max(50).optional(),
  imageUrl: z.string().url('Invalid image URL').max(2048).optional(),
  stock: z.number().int('Stock must be an integer').min(0, 'Stock cannot be negative').optional(),
  lowStockThreshold: z
    .number()
    .int('Low stock threshold must be an integer')
    .min(0, 'Threshold cannot be negative')
    .optional(),
  isAvailable: z.boolean().optional(),
});

/** Input type inferred from the create product schema */
export type CreateProductInput = z.infer<typeof createProductSchema>;

/**
 * Schema for updating an existing product.
 * All fields are optional — only provided fields are updated.
 */
export const updateProductSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID').nullable().optional(),
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(200, 'Product name must be at most 200 characters')
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .nullable()
    .optional(),
  price: z
    .number()
    .positive('Price must be positive')
    .max(1_000_000, 'Price must be at most 1,000,000')
    .optional(),
  unit: z.string().min(1).max(50).optional(),
  imageUrl: z.string().url('Invalid image URL').max(2048).nullable().optional(),
  stock: z.number().int('Stock must be an integer').min(0, 'Stock cannot be negative').optional(),
  lowStockThreshold: z
    .number()
    .int('Low stock threshold must be an integer')
    .min(0, 'Threshold cannot be negative')
    .optional(),
  isAvailable: z.boolean().optional(),
});

/** Input type inferred from the update product schema */
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

/**
 * Schema for product list query parameters.
 * Supports filtering by vendor, category, search, and pagination.
 */
export const listProductsQuerySchema = z.object({
  vendorProfileId: z.string().uuid('Invalid vendor profile ID').optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  search: z.string().max(200).optional(),
  minPrice: z
    .string()
    .transform((v) => parseFloat(v))
    .pipe(z.number().min(0))
    .optional(),
  maxPrice: z
    .string()
    .transform((v) => parseFloat(v))
    .pipe(z.number().positive())
    .optional(),
  available: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  page: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive())
    .optional(),
  limit: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional(),
  sortBy: z
    .enum(['name', 'price', 'createdAt', 'stock'], { message: 'Invalid sort field' })
    .optional(),
  sortOrder: z.enum(['asc', 'desc'], { message: 'Invalid sort order' }).optional(),
});

/** Input type inferred from the list products query schema */
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

/**
 * Schema for product ID path parameter.
 */
export const productIdParamSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
});

/** Input type inferred from the product ID param schema */
export type ProductIdParam = z.infer<typeof productIdParamSchema>;
