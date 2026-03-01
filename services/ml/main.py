"""
ProxiMart ML Service — FastAPI + LangChain
Speech-to-text transcription and receipt parsing service.
"""

from fastapi import FastAPI
from datetime import datetime, timezone

app = FastAPI(
    title="ProxiMart ML Service",
    description="LangChain-powered speech-to-text and receipt parsing service",
    version="0.1.0",
)


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and load balancer probes."""
    return {
        "success": True,
        "data": {
            "status": "ok",
            "service": "ml-service",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        "message": "ML service is healthy",
    }
