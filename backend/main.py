from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, health, cache, upload
from app.db.db_config import db_config
from app.core.config import settings

# 创建FastAPI应用
app = FastAPI(
    title="Law Agent API",
    description="法律聊天机器人API",
    version="1.0.0"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS if isinstance(settings.ALLOWED_ORIGINS, list) else [settings.ALLOWED_ORIGINS],  # 从配置模块读取允许的源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含路由
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(cache.router)
app.include_router(upload.router)

@app.on_event("startup")
async def startup_event():
    """应用启动时执行的操作"""
    # 连接数据库
    db_config.connect()
    print("数据库连接已建立")

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时执行的操作"""
    # 断开数据库连接
    db_config.disconnect()
    print("数据库连接已关闭")

if __name__ == "__main__":
    import uvicorn
    host = settings.HOST
    port = settings.PORT
    uvicorn.run(app, host=host, port=port)
