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
