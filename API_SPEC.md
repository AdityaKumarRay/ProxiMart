# ProxiMart API Specification

**Base URL:** `https://api.proximart.store/v1`  
**Last updated:** 2026-03-02T00:00:00Z

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
