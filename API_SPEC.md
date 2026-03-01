# ProxiMart API Specification

**Base URL:** `https://api.proximart.store/v1`  
**Last updated:** 2026-03-02T03:00:00Z

---

## General

### Response Format

All endpoints return responses in the following format:

**Success:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Human-readable success message"
}
```

**Error:**

```json
{
  "success": false,
  "error": {
    "code": "MACHINE_READABLE_CODE",
    "message": "Human-readable error message"
  }
}
```

### Rate Limiting

- **General routes:** 100 requests per 15-minute window
- **Auth routes:** 20 requests per 15-minute window

Rate limit headers are included in all responses:

- `RateLimit-Limit`
- `RateLimit-Remaining`
- `RateLimit-Reset`

---

## Endpoints

### `GET /health`

Health check endpoint for monitoring and load balancer probes.

**Rate Limit:** General (100 req / 15 min)

**Request:** No body required.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 12345.678,
    "timestamp": "2026-03-02T00:00:00.000Z"
  },
  "message": "Server is healthy"
}
```

**Errors:**

| Status | Code                  | Message                      |
| ------ | --------------------- | ---------------------------- |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests            |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred |

---

### `POST /auth/register`

Register a new vendor or customer account.

**Rate Limit:** Strict (20 req / 15 min)

**Request Body:**

```json
{
  "email": "vendor@example.com",
  "password": "securePass123",
  "name": "Ramesh Kumar",
  "phone": "+919876543210",
  "role": "VENDOR"
}
```

| Field    | Type   | Required | Description             |
| -------- | ------ | -------- | ----------------------- |
| email    | string | Yes      | Valid email address     |
| password | string | Yes      | Minimum 8 characters    |
| name     | string | Yes      | User's full name        |
| phone    | string | No       | Phone number (optional) |
| role     | enum   | Yes      | `VENDOR` or `CUSTOMER`  |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "vendor@example.com",
      "name": "Ramesh Kumar",
      "role": "VENDOR"
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  },
  "message": "Registration successful"
}
```

**Errors:**

| Status | Code                  | Message                      |
| ------ | --------------------- | ---------------------------- |
| 400    | VALIDATION_ERROR      | Invalid input (see details)  |
| 409    | EMAIL_EXISTS          | Email already registered     |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests            |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred |

---

### `POST /auth/login`

Authenticate an existing user and receive JWT tokens.

**Rate Limit:** Strict (20 req / 15 min)

**Request Body:**

```json
{
  "email": "vendor@example.com",
  "password": "securePass123"
}
```

| Field    | Type   | Required | Description         |
| -------- | ------ | -------- | ------------------- |
| email    | string | Yes      | Valid email address |
| password | string | Yes      | Account password    |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "vendor@example.com",
      "name": "Ramesh Kumar",
      "role": "VENDOR"
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  },
  "message": "Login successful"
}
```

**Errors:**

| Status | Code                  | Message                      |
| ------ | --------------------- | ---------------------------- |
| 400    | VALIDATION_ERROR      | Invalid input (see details)  |
| 401    | INVALID_CREDENTIALS   | Invalid email or password    |
| 403    | ACCOUNT_DEACTIVATED   | Account has been deactivated |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests            |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred |

---

### `POST /auth/refresh`

Exchange a valid refresh token for a new access/refresh token pair.

**Rate Limit:** Strict (20 req / 15 min)

**Request Body:**

```json
{
  "refreshToken": "eyJhbG..."
}
```

| Field        | Type   | Required | Description           |
| ------------ | ------ | -------- | --------------------- |
| refreshToken | string | Yes      | Current refresh token |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "vendor@example.com",
      "name": "Ramesh Kumar",
      "role": "VENDOR"
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  },
  "message": "Token refreshed"
}
```

**Errors:**

| Status | Code                  | Message                          |
| ------ | --------------------- | -------------------------------- |
| 400    | VALIDATION_ERROR      | Invalid input (see details)      |
| 401    | INVALID_TOKEN         | Invalid or expired refresh token |
| 403    | ACCOUNT_DEACTIVATED   | Account has been deactivated     |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests                |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred     |

---

### `POST /auth/logout`

Invalidate the current refresh token. Requires authentication.

**Rate Limit:** Strict (20 req / 15 min)

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:** None required.

**Response (200):**

```json
{
  "success": true,
  "data": null,
  "message": "Logged out successfully"
}
```

**Errors:**

| Status | Code                  | Message                      |
| ------ | --------------------- | ---------------------------- |
| 401    | AUTH_REQUIRED         | Authentication required      |
| 401    | INVALID_TOKEN         | Invalid or expired token     |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests            |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred |

---

## Vendor Profile Endpoints

All vendor profile endpoints require authentication with a valid access token and `VENDOR` role.

### `GET /vendors/profile`

Get the authenticated vendor's profile.

**Rate Limit:** General (100 req / 15 min)

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request:** No body required.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "shopName": "Ramesh Kirana",
    "description": "Fresh groceries daily",
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "gstNumber": null,
    "latitude": 19.076,
    "longitude": 72.8777,
    "deliveryRadius": 5.0,
    "isOpen": false,
    "openingTime": "08:00",
    "closingTime": "22:00",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  "message": "Vendor profile retrieved"
}
```

**Errors:**

| Status | Code                  | Message                      |
| ------ | --------------------- | ---------------------------- |
| 401    | AUTH_REQUIRED         | Authentication required      |
| 401    | INVALID_TOKEN         | Invalid or expired token     |
| 403    | FORBIDDEN             | Insufficient permissions     |
| 404    | PROFILE_NOT_FOUND     | Vendor profile not found     |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests            |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred |

---

### `POST /vendors/profile`

Create a vendor profile for the authenticated user.

**Rate Limit:** General (100 req / 15 min)

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "shopName": "Ramesh Kirana",
  "description": "Fresh groceries daily",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "gstNumber": "27AABCU9603R1ZM",
  "latitude": 19.076,
  "longitude": 72.8777,
  "deliveryRadius": 5.0,
  "isOpen": false,
  "openingTime": "08:00",
  "closingTime": "22:00"
}
```

| Field          | Type    | Required | Description                               |
| -------------- | ------- | -------- | ----------------------------------------- |
| shopName       | string  | Yes      | Shop/store name (1-200 chars)             |
| description    | string  | No       | Shop description (max 1000 chars)         |
| address        | string  | Yes      | Full address (1-500 chars)                |
| city           | string  | Yes      | City name (1-100 chars)                   |
| state          | string  | Yes      | State name (1-100 chars)                  |
| pincode        | string  | Yes      | 6-digit Indian pincode                    |
| gstNumber      | string  | No       | Valid GST number                          |
| latitude       | number  | No       | Latitude (-90 to 90)                      |
| longitude      | number  | No       | Longitude (-180 to 180)                   |
| deliveryRadius | number  | No       | Delivery radius in km (0.5-50, default 5) |
| isOpen         | boolean | No       | Shop open status (default false)          |
| openingTime    | string  | No       | Opening time in HH:MM format              |
| closingTime    | string  | No       | Closing time in HH:MM format              |

**Response (201):**

```json
{
  "success": true,
  "data": { "...vendor profile object..." },
  "message": "Vendor profile created"
}
```

**Errors:**

| Status | Code                  | Message                       |
| ------ | --------------------- | ----------------------------- |
| 400    | VALIDATION_ERROR      | Invalid input (see details)   |
| 401    | AUTH_REQUIRED         | Authentication required       |
| 403    | FORBIDDEN             | Insufficient permissions      |
| 409    | PROFILE_EXISTS        | Vendor profile already exists |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests             |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred  |

---

### `PATCH /vendors/profile`

Update the authenticated vendor's profile. Only provided fields are updated.

**Rate Limit:** General (100 req / 15 min)

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:** Any subset of the POST fields. All fields are optional. Nullable fields can be set to `null`.

**Response (200):**

```json
{
  "success": true,
  "data": { "...updated vendor profile object..." },
  "message": "Vendor profile updated"
}
```

**Errors:**

| Status | Code                  | Message                      |
| ------ | --------------------- | ---------------------------- |
| 400    | VALIDATION_ERROR      | Invalid input (see details)  |
| 401    | AUTH_REQUIRED         | Authentication required      |
| 403    | FORBIDDEN             | Insufficient permissions     |
| 404    | PROFILE_NOT_FOUND     | Vendor profile not found     |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests            |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred |

---

## Customer Profile Endpoints

All customer profile endpoints require authentication with a valid access token and `CUSTOMER` role.

### `GET /customers/profile`

Get the authenticated customer's profile.

**Rate Limit:** General (100 req / 15 min)

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request:** No body required.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "address": "456 Park Lane",
    "city": "Delhi",
    "state": "Delhi",
    "pincode": "110001",
    "latitude": 28.6139,
    "longitude": 77.209,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  "message": "Customer profile retrieved"
}
```

**Errors:**

| Status | Code                  | Message                      |
| ------ | --------------------- | ---------------------------- |
| 401    | AUTH_REQUIRED         | Authentication required      |
| 401    | INVALID_TOKEN         | Invalid or expired token     |
| 403    | FORBIDDEN             | Insufficient permissions     |
| 404    | PROFILE_NOT_FOUND     | Customer profile not found   |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests            |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred |

---

### `POST /customers/profile`

Create a customer profile for the authenticated user. All fields are optional.

**Rate Limit:** General (100 req / 15 min)

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "address": "456 Park Lane",
  "city": "Delhi",
  "state": "Delhi",
  "pincode": "110001",
  "latitude": 28.6139,
  "longitude": 77.209
}
```

| Field     | Type   | Required | Description                |
| --------- | ------ | -------- | -------------------------- |
| address   | string | No       | Delivery address (max 500) |
| city      | string | No       | City name (max 100)        |
| state     | string | No       | State name (max 100)       |
| pincode   | string | No       | 6-digit Indian pincode     |
| latitude  | number | No       | Latitude (-90 to 90)       |
| longitude | number | No       | Longitude (-180 to 180)    |

**Response (201):**

```json
{
  "success": true,
  "data": { "...customer profile object..." },
  "message": "Customer profile created"
}
```

**Errors:**

| Status | Code                  | Message                         |
| ------ | --------------------- | ------------------------------- |
| 400    | VALIDATION_ERROR      | Invalid input (see details)     |
| 401    | AUTH_REQUIRED         | Authentication required         |
| 403    | FORBIDDEN             | Insufficient permissions        |
| 409    | PROFILE_EXISTS        | Customer profile already exists |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests               |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred    |

---

### `PATCH /customers/profile`

Update the authenticated customer's profile. Only provided fields are updated.

**Rate Limit:** General (100 req / 15 min)

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:** Any subset of the POST fields. All fields are optional. Nullable fields can be set to `null`.

**Response (200):**

```json
{
  "success": true,
  "data": { "...updated customer profile object..." },
  "message": "Customer profile updated"
}
```

**Errors:**

| Status | Code                  | Message                      |
| ------ | --------------------- | ---------------------------- |
| 400    | VALIDATION_ERROR      | Invalid input (see details)  |
| 401    | AUTH_REQUIRED         | Authentication required      |
| 403    | FORBIDDEN             | Insufficient permissions     |
| 404    | PROFILE_NOT_FOUND     | Customer profile not found   |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests            |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred |

---

## Product Endpoints

### `GET /products`

List products with optional filters and pagination. Public endpoint — no authentication required.

**Rate Limit:** General (100 req / 15 min)

**Query Parameters:**

| Parameter       | Type   | Required | Description                                       |
| --------------- | ------ | -------- | ------------------------------------------------- |
| vendorProfileId | string | No       | Filter by vendor profile ID (UUID)                |
| categoryId      | string | No       | Filter by category ID (UUID)                      |
| search          | string | No       | Search products by name (case-insensitive)        |
| minPrice        | number | No       | Minimum price filter                              |
| maxPrice        | number | No       | Maximum price filter                              |
| available       | string | No       | Filter by availability (`true`/`false`)           |
| page            | number | No       | Page number (default: 1)                          |
| limit           | number | No       | Items per page (1-100, default: 20)               |
| sortBy          | enum   | No       | Sort field: `name`, `price`, `createdAt`, `stock` |
| sortOrder       | enum   | No       | Sort order: `asc` or `desc` (default: `desc`)     |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "vendorProfileId": "uuid",
        "categoryId": "uuid",
        "name": "Basmati Rice 5kg",
        "description": "Premium aged basmati rice",
        "price": 450,
        "unit": "bag",
        "imageUrl": null,
        "stock": 25,
        "lowStockThreshold": 10,
        "isAvailable": true,
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z",
        "category": { "id": "uuid", "name": "Groceries" }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  },
  "message": "Products retrieved"
}
```

**Errors:**

| Status | Code                  | Message                      |
| ------ | --------------------- | ---------------------------- |
| 400    | VALIDATION_ERROR      | Invalid input (see details)  |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests            |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred |

---

### `GET /products/:productId`

Get a single product by ID. Public endpoint — no authentication required.

**Rate Limit:** General (100 req / 15 min)

**Path Parameters:**

| Parameter | Type   | Required | Description       |
| --------- | ------ | -------- | ----------------- |
| productId | string | Yes      | Product ID (UUID) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "vendorProfileId": "uuid",
    "categoryId": "uuid",
    "name": "Basmati Rice 5kg",
    "description": "Premium aged basmati rice",
    "price": 450,
    "unit": "bag",
    "imageUrl": null,
    "stock": 25,
    "lowStockThreshold": 10,
    "isAvailable": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z",
    "category": { "id": "uuid", "name": "Groceries" }
  },
  "message": "Product retrieved"
}
```

**Errors:**

| Status | Code                  | Message                      |
| ------ | --------------------- | ---------------------------- |
| 400    | VALIDATION_ERROR      | Invalid product ID           |
| 404    | PRODUCT_NOT_FOUND     | Product not found            |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests            |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred |

---

### `POST /products`

Create a new product. Requires authentication with `VENDOR` role.

**Rate Limit:** General (100 req / 15 min)

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "name": "Basmati Rice 5kg",
  "description": "Premium aged basmati rice",
  "price": 450,
  "unit": "bag",
  "categoryId": "uuid",
  "stock": 25,
  "lowStockThreshold": 10,
  "isAvailable": true,
  "imageUrl": "https://example.com/rice.jpg"
}
```

| Field             | Type    | Required | Description                             |
| ----------------- | ------- | -------- | --------------------------------------- |
| name              | string  | Yes      | Product name (1-200 chars)              |
| description       | string  | No       | Product description (max 2000 chars)    |
| price             | number  | Yes      | Price (positive, max 1,000,000)         |
| unit              | string  | No       | Unit of measurement (default: "piece")  |
| categoryId        | string  | No       | Category UUID                           |
| stock             | integer | No       | Stock quantity (default: 0)             |
| lowStockThreshold | integer | No       | Low stock alert threshold (default: 10) |
| isAvailable       | boolean | No       | Availability status (default: true)     |
| imageUrl          | string  | No       | Product image URL                       |

**Response (201):**

```json
{
  "success": true,
  "data": { "...product object with category..." },
  "message": "Product created"
}
```

**Errors:**

| Status | Code                  | Message                                         |
| ------ | --------------------- | ----------------------------------------------- |
| 400    | VALIDATION_ERROR      | Invalid input (see details)                     |
| 401    | AUTH_REQUIRED         | Authentication required                         |
| 403    | FORBIDDEN             | Insufficient permissions                        |
| 404    | PROFILE_NOT_FOUND     | Vendor profile not found — create profile first |
| 404    | CATEGORY_NOT_FOUND    | Category not found                              |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests                               |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred                    |

---

### `PATCH /products/:productId`

Update a product. Only the owning vendor can update. Requires `VENDOR` role.

**Rate Limit:** General (100 req / 15 min)

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Path Parameters:**

| Parameter | Type   | Required | Description       |
| --------- | ------ | -------- | ----------------- |
| productId | string | Yes      | Product ID (UUID) |

**Request Body:** Any subset of the POST fields. All fields are optional. Nullable fields (`description`, `imageUrl`, `categoryId`) can be set to `null`.

**Response (200):**

```json
{
  "success": true,
  "data": { "...updated product object..." },
  "message": "Product updated"
}
```

**Errors:**

| Status | Code                  | Message                               |
| ------ | --------------------- | ------------------------------------- |
| 400    | VALIDATION_ERROR      | Invalid input (see details)           |
| 401    | AUTH_REQUIRED         | Authentication required               |
| 403    | FORBIDDEN             | You can only update your own products |
| 404    | PROFILE_NOT_FOUND     | Vendor profile not found              |
| 404    | PRODUCT_NOT_FOUND     | Product not found                     |
| 404    | CATEGORY_NOT_FOUND    | Category not found                    |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests                     |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred          |

---

### `DELETE /products/:productId`

Delete a product. Only the owning vendor can delete. Requires `VENDOR` role.

**Rate Limit:** General (100 req / 15 min)

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Path Parameters:**

| Parameter | Type   | Required | Description       |
| --------- | ------ | -------- | ----------------- |
| productId | string | Yes      | Product ID (UUID) |

**Request Body:** None required.

**Response (200):**

```json
{
  "success": true,
  "data": null,
  "message": "Product deleted"
}
```

**Errors:**

| Status | Code                  | Message                               |
| ------ | --------------------- | ------------------------------------- |
| 400    | VALIDATION_ERROR      | Invalid product ID                    |
| 401    | AUTH_REQUIRED         | Authentication required               |
| 403    | FORBIDDEN             | You can only delete your own products |
| 404    | PROFILE_NOT_FOUND     | Vendor profile not found              |
| 404    | PRODUCT_NOT_FOUND     | Product not found                     |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests                     |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred          |

---

### `GET /products/low-stock`

Get products with stock at or below their low-stock threshold. Requires authentication with `VENDOR` role. Only returns the authenticated vendor's products.

**Rate Limit:** General (100 req / 15 min)

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request:** No body required.

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Basmati Rice 5kg",
      "stock": 3,
      "lowStockThreshold": 10
    }
  ],
  "message": "Low-stock products retrieved"
}
```

**Errors:**

| Status | Code                  | Message                      |
| ------ | --------------------- | ---------------------------- |
| 401    | AUTH_REQUIRED         | Authentication required      |
| 403    | FORBIDDEN             | Insufficient permissions     |
| 404    | PROFILE_NOT_FOUND     | Vendor profile not found     |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests            |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred |

---

## Order Endpoints

### POST /orders

Create a new order (CUSTOMER only). Uses an **ACID transaction** to atomically validate products, check stock, decrement inventory, and create the order with all items.

**Auth:** Bearer token (CUSTOMER role required)

**Request Body:**

```json
{
  "vendorProfileId": "uuid",
  "items": [
    { "productId": "uuid", "quantity": 2 },
    { "productId": "uuid", "quantity": 1 }
  ],
  "deliveryAddress": "456 Market Road, Delhi",
  "notes": "Ring the bell (optional)"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "PM-20260101-ABC123",
    "customerProfileId": "uuid",
    "vendorProfileId": "uuid",
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "totalAmount": 1260,
    "paidAmount": 0,
    "deliveryAddress": "456 Market Road, Delhi",
    "notes": null,
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "name": "Basmati Rice 5kg",
        "price": 450,
        "quantity": 2,
        "subtotal": 900
      }
    ],
    "payments": [],
    "receipt": null
  },
  "message": "Order created"
}
```

**Error Responses:**

| Status | Code                    | Message                                |
| ------ | ----------------------- | -------------------------------------- |
| 400    | VALIDATION_ERROR        | Invalid request body                   |
| 400    | PRODUCT_VENDOR_MISMATCH | Product does not belong to this vendor |
| 400    | PRODUCT_NOT_AVAILABLE   | Product is not available               |
| 400    | INSUFFICIENT_STOCK      | Insufficient stock for product         |
| 401    | AUTH_REQUIRED           | Authentication required                |
| 403    | FORBIDDEN               | Customer role required                 |
| 404    | PROFILE_NOT_FOUND       | Customer profile not found             |
| 404    | VENDOR_NOT_FOUND        | Vendor profile not found               |
| 404    | PRODUCT_NOT_FOUND       | Product not found                      |

---

### GET /orders

List orders for the authenticated user. Customers see their orders; vendors see orders placed with them.

**Auth:** Bearer token (any authenticated role)

**Query Parameters:**

| Param     | Type   | Default | Description                                      |
| --------- | ------ | ------- | ------------------------------------------------ |
| status    | string | —       | Filter by order status (e.g. PENDING, DELIVERED) |
| page      | number | 1       | Page number (1-indexed)                          |
| limit     | number | 20      | Items per page (1–100)                           |
| sortOrder | string | desc    | Sort by createdAt: `asc` or `desc`               |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "orders": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  },
  "message": "Orders retrieved"
}
```

---

### GET /orders/:orderId

Get a single order with items, payments, and receipt.

**Auth:** Bearer token (must be order's customer or vendor)

**Success Response (200):**

```json
{
  "success": true,
  "data": { "id": "uuid", "orderNumber": "...", "items": [...], "payments": [...], "receipt": null },
  "message": "Order retrieved"
}
```

**Error Responses:**

| Status | Code             | Message                              |
| ------ | ---------------- | ------------------------------------ |
| 400    | VALIDATION_ERROR | Invalid orderId format               |
| 401    | AUTH_REQUIRED    | Authentication required              |
| 403    | FORBIDDEN        | You do not have access to this order |
| 404    | ORDER_NOT_FOUND  | Order not found                      |

---

### PATCH /orders/:orderId/status

Update order status (VENDOR only). Enforces valid transitions:

```
PENDING → CONFIRMED → PACKED → OUT_FOR_DELIVERY → DELIVERED
PENDING/CONFIRMED/PACKED → CANCELLED
```

**Auth:** Bearer token (VENDOR role required, must own the order)

**Request Body:**

```json
{
  "status": "CONFIRMED"
}
```

Valid values: `CONFIRMED`, `PACKED`, `OUT_FOR_DELIVERY`, `DELIVERED`

**Success Response (200):**

```json
{
  "success": true,
  "data": { "id": "uuid", "status": "CONFIRMED", ... },
  "message": "Order status updated"
}
```

**Error Responses:**

| Status | Code                      | Message                               |
| ------ | ------------------------- | ------------------------------------- |
| 400    | INVALID_STATUS_TRANSITION | Cannot transition from X to Y         |
| 400    | VALIDATION_ERROR          | Invalid status value                  |
| 401    | AUTH_REQUIRED             | Authentication required               |
| 403    | FORBIDDEN                 | Vendor role required / not your order |
| 404    | PROFILE_NOT_FOUND         | Vendor profile not found              |
| 404    | ORDER_NOT_FOUND           | Order not found                       |

---

### PATCH /orders/:orderId/cancel

Cancel an order (CUSTOMER only). Only allowed before `OUT_FOR_DELIVERY`. Restores inventory atomically via ACID transaction.

**Auth:** Bearer token (CUSTOMER role required, must own the order)

**Success Response (200):**

```json
{
  "success": true,
  "data": { "id": "uuid", "status": "CANCELLED", ... },
  "message": "Order cancelled"
}
```

**Error Responses:**

| Status | Code                      | Message                                 |
| ------ | ------------------------- | --------------------------------------- |
| 400    | INVALID_STATUS_TRANSITION | Cannot cancel order in current status   |
| 401    | AUTH_REQUIRED             | Authentication required                 |
| 403    | FORBIDDEN                 | Customer role required / not your order |
| 404    | PROFILE_NOT_FOUND         | Customer profile not found              |
| 404    | ORDER_NOT_FOUND           | Order not found                         |

---

### POST /orders/:orderId/payments

Record a payment for an order. Supports **partial payments**. Updates `paidAmount` and `paymentStatus` (PARTIAL → PAID).

**Auth:** Bearer token (must be order's customer or vendor)

**Request Body:**

```json
{
  "amount": 600,
  "method": "UPI",
  "reference": "upi-txn-123 (optional)"
}
```

Valid methods: `COD`, `UPI`, `WALLET`

**Success Response (200):**

```json
{
  "success": true,
  "data": { "id": "uuid", "paidAmount": 600, "paymentStatus": "PARTIAL", "payments": [...], ... },
  "message": "Payment recorded"
}
```

**Error Responses:**

| Status | Code                    | Message                                   |
| ------ | ----------------------- | ----------------------------------------- |
| 400    | VALIDATION_ERROR        | Invalid request body                      |
| 400    | ORDER_CANCELLED         | Cannot record payment for cancelled order |
| 400    | ALREADY_PAID            | Order is already fully paid               |
| 400    | PAYMENT_EXCEEDS_BALANCE | Payment exceeds remaining balance         |
| 401    | AUTH_REQUIRED           | Authentication required                   |
| 403    | FORBIDDEN               | No access to this order                   |
| 404    | ORDER_NOT_FOUND         | Order not found                           |

---

### POST /orders/:orderId/receipt

Generate a receipt for a delivered order (VENDOR only). One receipt per order.

**Auth:** Bearer token (VENDOR role required, must own the order)

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderId": "uuid",
    "receiptNumber": "RCP-20260101-ABC123",
    "totalAmount": 1260,
    "paidAmount": 1260,
    "issuedAt": "ISO timestamp"
  },
  "message": "Receipt generated"
}
```

**Error Responses:**

| Status | Code                | Message                               |
| ------ | ------------------- | ------------------------------------- |
| 400    | ORDER_NOT_DELIVERED | Receipt only for delivered orders     |
| 401    | AUTH_REQUIRED       | Authentication required               |
| 403    | FORBIDDEN           | Vendor role required / not your order |
| 404    | PROFILE_NOT_FOUND   | Vendor profile not found              |
| 404    | ORDER_NOT_FOUND     | Order not found                       |
| 409    | RECEIPT_EXISTS      | Receipt already exists for this order |

---

### GET /orders/:orderId/receipt

Get the receipt for an order.

**Auth:** Bearer token (must be order's customer or vendor)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderId": "uuid",
    "receiptNumber": "RCP-20260101-ABC123",
    "totalAmount": 1260,
    "paidAmount": 1260,
    "issuedAt": "ISO timestamp"
  },
  "message": "Receipt retrieved"
}
```

**Error Responses:**

| Status | Code              | Message                          |
| ------ | ----------------- | -------------------------------- |
| 400    | VALIDATION_ERROR  | Invalid orderId format           |
| 401    | AUTH_REQUIRED     | Authentication required          |
| 403    | FORBIDDEN         | No access to this order          |
| 404    | ORDER_NOT_FOUND   | Order not found                  |
| 404    | RECEIPT_NOT_FOUND | Receipt not found for this order |
