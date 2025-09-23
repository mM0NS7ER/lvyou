
from fastapi import APIRouter
from app.models.chat import HealthResponse

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check():
    """
    健康检查端点

    Returns:
        API状态信息
    """
    return HealthResponse(status="OK", message="API is running")

@router.get("/")
def read_root():
    """
    根路径端点

    Returns:
        欢迎信息
    """
    return {"message": "Welcome to Law Agent API"}
