# Law Agent Backend

这是一个法律聊天机器人的后端API，使用FastAPI框架构建。

## 项目结构

```
backend/
├── database.py          # 数据库连接和操作
├── main.py             # FastAPI应用入口
├── requirements.txt    # 项目依赖
├── .env.example        # 环境变量示例
├── README.md          # 本文件
├── models/            # 数据模型
│   ├── __init__.py
│   └── chat.py        # 聊天相关模型
├── services/          # 业务逻辑
│   ├── __init__.py
│   └── chat_service.py # 聊天服务
└── routers/           # API路由
    ├── __init__.py
    ├── chat.py        # 聊天相关路由
    └── health.py      # 健康检查路由
```

## 安装依赖

```bash
pip install -r requirements.txt
```

## 环境配置

1. 复制环境变量示例文件：
```bash
cp .env.example .env
```

2. 编辑`.env`文件，配置MongoDB连接信息：
```
MONGODB_URI=mongodb://localhost:27017/
DB_NAME=law_agent
```

## 运行应用

```bash
python main.py
```

应用将在 http://localhost:8000 上运行。

## API文档

启动应用后，可以访问以下地址查看API文档：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 主要API端点

- `POST /api/chat`: 发送聊天消息
- `GET /api/chat/history`: 获取聊天历史
- `GET /api/chat/sessions`: 获取用户会话列表
- `DELETE /api/chat/history`: 删除聊天记录
- `GET /health`: 健康检查
- `GET /`: 根路径

## 数据库设计

聊天消息存储在MongoDB的`chat_messages`集合中，包含以下字段：
- `_id`: MongoDB自动生成的唯一ID
- `session_id`: 会话标识符
- `user_id`: 用户标识符
- `role`: 消息发送者角色（user或assistant）
- `content`: 消息内容
- `message_type`: 消息类型（如text、image等）
- `timestamp`: 消息发送时间
- `additional_data`: 额外数据
