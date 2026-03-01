# ProxiMart API Specification

**Base URL:** `https://api.proximart.store/v1`  
**Last updated:** 2026-03-02T01:00:00Z

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

| Status | Code                  | Message                            |
| ------ | --------------------- | ---------------------------------- |
| 401    | AUTH_REQUIRED         | Authentication required            |
| 401    | INVALID_TOKEN         | Invalid or expired token           |
| 403    | FORBIDDEN             | Insufficient permissions           |
| 404    | PROFILE_NOT_FOUND     | Vendor profile not found           |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests                  |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred       |

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

| Field          | Type    | Required | Description                              |
| -------------- | ------- | -------- | ---------------------------------------- |
| shopName       | string  | Yes      | Shop/store name (1-200 chars)            |
| description    | string  | No       | Shop description (max 1000 chars)        |
| address        | string  | Yes      | Full address (1-500 chars)               |
| city           | string  | Yes      | City name (1-100 chars)                  |
| state          | string  | Yes      | State name (1-100 chars)                 |
| pincode        | string  | Yes      | 6-digit Indian pincode                   |
| gstNumber      | string  | No       | Valid GST number                         |
| latitude       | number  | No       | Latitude (-90 to 90)                     |
| longitude      | number  | No       | Longitude (-180 to 180)                  |
| deliveryRadius | number  | No       | Delivery radius in km (0.5-50, default 5)|
| isOpen         | boolean | No       | Shop open status (default false)         |
| openingTime    | string  | No       | Opening time in HH:MM format             |
| closingTime    | string  | No       | Closing time in HH:MM format             |

**Response (201):**

```json
{
  "success": true,
  "data": { "...vendor profile object..." },
  "message": "Vendor profile created"
}
```

**Errors:**

| Status | Code                  | Message                            |
| ------ | --------------------- | ---------------------------------- |
| 400    | VALIDATION_ERROR      | Invalid input (see details)        |
| 401    | AUTH_REQUIRED         | Authentication required            |
| 403    | FORBIDDEN             | Insufficient permissions           |
| 409    | PROFILE_EXISTS        | Vendor profile already exists      |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests                  |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred       |

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

| Status | Code                  | Message                            |
| ------ | --------------------- | ---------------------------------- |
| 400    | VALIDATION_ERROR      | Invalid input (see details)        |
| 401    | AUTH_REQUIRED         | Authentication required            |
| 403    | FORBIDDEN             | Insufficient permissions           |
| 404    | PROFILE_NOT_FOUND     | Vendor profile not found           |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests                  |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred       |

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

| Status | Code                  | Message                            |
| ------ | --------------------- | ---------------------------------- |
| 401    | AUTH_REQUIRED         | Authentication required            |
| 401    | INVALID_TOKEN         | Invalid or expired token           |
| 403    | FORBIDDEN             | Insufficient permissions           |
| 404    | PROFILE_NOT_FOUND     | Customer profile not found         |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests                  |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred       |

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

| Field     | Type   | Required | Description                 |
| --------- | ------ | -------- | --------------------------- |
| address   | string | No       | Delivery address (max 500)  |
| city      | string | No       | City name (max 100)         |
| state     | string | No       | State name (max 100)        |
| pincode   | string | No       | 6-digit Indian pincode      |
| latitude  | number | No       | Latitude (-90 to 90)        |
| longitude | number | No       | Longitude (-180 to 180)     |

**Response (201):**

```json
{
  "success": true,
  "data": { "...customer profile object..." },
  "message": "Customer profile created"
}
```

**Errors:**

| Status | Code                  | Message                            |
| ------ | --------------------- | ---------------------------------- |
| 400    | VALIDATION_ERROR      | Invalid input (see details)        |
| 401    | AUTH_REQUIRED         | Authentication required            |
| 403    | FORBIDDEN             | Insufficient permissions           |
| 409    | PROFILE_EXISTS        | Customer profile already exists    |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests                  |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred       |

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

| Status | Code                  | Message                            |
| ------ | --------------------- | ---------------------------------- |
| 400    | VALIDATION_ERROR      | Invalid input (see details)        |
| 401    | AUTH_REQUIRED         | Authentication required            |
| 403    | FORBIDDEN             | Insufficient permissions           |
| 404    | PROFILE_NOT_FOUND     | Customer profile not found         |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests                  |
| 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred       |
