"""Tests for the ML service health check endpoint."""

import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.mark.anyio
async def test_health_check():
    """GET /health should return 200 with service status."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "ok"
    assert data["data"]["service"] == "ml-service"
    assert "timestamp" in data["data"]
    assert data["message"] == "ML service is healthy"
