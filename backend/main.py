from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, health

# 创建FastAPI应用
app = FastAPI(
    title="Law Agent API",
    description="法律聊天机器人API",
    version="1.0.0"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置为特定的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含路由
app.include_router(health.router)
app.include_router(chat.router)

# 定义数据模型
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

class HealthResponse(BaseModel):
    status: str
    message: str

@app.get("/")
def read_root():
    return {"message": "Welcome to Law Agent API"}

@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(status="OK", message="API is running")

@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    # 这里是简单的模拟回复，实际应用中应该调用AI模型
    if not request.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # 模拟AI回复
    ai_response = f"您的问题: {request.message}\n\n这是AI助手对您法律问题的回答。在实际应用中，这里应该是AI模型生成的专业法律建议。"

    return ChatResponse(response=ai_response)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
