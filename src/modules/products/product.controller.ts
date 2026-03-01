import type { Request, Response } from 'express';
import { productService } from './product.service.js';
import { sendSuccess } from '../../utils/response.js';
import type {
  CreateProductInput,
  UpdateProductInput,
  ListProductsQuery,
  ProductIdParam,
} from './product.schema.js';

/**
 * Product controller.
 * Handles HTTP request/response for product CRUD endpoints.
 */
export class ProductController {
  /**
   * Create a new product for the authenticated vendor.
   * @route POST /products
   */
  async createProduct(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const input = req.body as CreateProductInput;
    const product = await productService.createProduct(userId, input);
    sendSuccess(res, product, 'Product created', 201);
  }

  /**
   * Get a single product by ID.
   * @route GET /products/:productId
   */
  async getProduct(req: Request, res: Response): Promise<void> {
    const { productId } = req.params as unknown as ProductIdParam;
    const product = await productService.getProduct(productId);
    sendSuccess(res, product, 'Product retrieved');
  }

  /**
   * List products with optional filters and pagination.
   * @route GET /products
   */
  async listProducts(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListProductsQuery;
    const result = await productService.listProducts(query);
    sendSuccess(res, result, 'Products retrieved');
  }

  /**
   * Update a product by ID. Only the owning vendor can update.
   * @route PATCH /products/:productId
   */
  async updateProduct(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { productId } = req.params as unknown as ProductIdParam;
    const input = req.body as UpdateProductInput;
    const product = await productService.updateProduct(userId, productId, input);
    sendSuccess(res, product, 'Product updated');
  }

  /**
   * Delete a product by ID. Only the owning vendor can delete.
   * @route DELETE /products/:productId
   */
  async deleteProduct(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { productId } = req.params as unknown as ProductIdParam;
    await productService.deleteProduct(userId, productId);
    sendSuccess(res, null, 'Product deleted');
  }

  /**
   * Get low-stock products for the authenticated vendor.
   * @route GET /products/low-stock
   */
  async getLowStockProducts(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const products = await productService.getLowStockProducts(userId);
    sendSuccess(res, products, 'Low-stock products retrieved');
  }
}
