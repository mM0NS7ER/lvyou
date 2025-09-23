# Law Agent

Law Agent 是一个基于FastAPI的法律智能助手系统，提供法律咨询、文档处理和智能问答功能。项目旨在通过人工智能技术，为用户提供便捷、准确的法律咨询服务，帮助解决常见的法律问题。

## 功能特性

- 智能法律咨询：基于AI的法律问题解答
- 法律文档处理：支持上传、解析和生成法律文档
- 历史记录管理：保存和查看咨询历史
- 多轮对话：支持连续提问和深入探讨
- 法律知识库：内置常见法律知识库
- 用户认证：安全登录和身份验证 (开发中)
- 文档模板：提供常用法律文档模板 (开发中)

## 项目状态

当前处于开发阶段，已完成基础聊天功能和后端API。下一步计划实现用户认证系统、法律文档处理功能和UI优化。

## 项目结构

```
law-agent/
├── frontend/                    # 前端项目
│   ├── src/                    # 源代码目录
│   │   ├── components/         # 可复用UI组件
│   │   │   ├── Sidebar.tsx     # 侧边栏组件
│   │   │   ├── Header.tsx      # 页面头部
│   │   │   ├── InputArea.tsx   # 输入区域
│   │   │   ├── HistorySidebar.tsx  # 历史记录侧边栏
│   │   │   └── ...             # 其他组件
│   │   ├── pages/              # 页面组件
│   │   │   └── ChatPage.tsx    # 聊天页面
│   │   ├── App.tsx             # 主应用组件
│   │   └── router.tsx          # 路由配置
│   ├── public/                 # 静态资源
│   ├── index.html             # HTML入口文件
│   ├── package.json           # 项目依赖配置
│   ├── tsconfig.json          # TypeScript配置
│   └── vite.config.ts         # Vite构建配置
├── backend/                     # FastAPI + Uvicorn 后端项目
│   ├── main.py                 # FastAPI应用主入口
│   ├── database.py             # 数据库配置与连接
│   ├── models/                 # 数据模型
│   │   └── chat.py             # 聊天相关数据模型
│   ├── routers/                # API路由模块
│   │   ├── chat.py             # 聊天相关API
│   │   └── health.py           # 健康检查API
│   └── services/               # 业务逻辑服务
│       └── chat_service.py     # 聊天服务逻辑
├── start.bat                   # 项目启动脚本
└── LICENSE                     # MIT许可证
├── requirements.txt            # Python依赖包列表
├── .env.example               # 环境变量示例
└── README.md                  # 项目说明文档
```

## 快速开始

### 环境要求
- Python 3.8+
- pip (Python包管理器)
- 现代浏览器 (Chrome, Firefox, Edge等)

### 方法一：使用启动脚本（推荐）

1. 确保已安装 Python 3.8+
2. 双击运行 `start.bat` 文件
3. 等待依赖安装完成，服务自动启动

### 方法二：手动启动

#### 后端启动

1. 进入后端目录：
   ```bash
   cd backend
   ```

2. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```

3. 启动服务（任选一种方式）：

   **方式1：使用run.py脚本**
   ```bash
   python run.py
   ```

   **方式2：直接使用uvicorn命令**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

   **方式3：使用模块运行**
   ```bash
   uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```

#### 前端启动

1. 进入前端目录：
   ```bash
   cd frontend
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 启动开发服务器：
   ```bash
   npm run dev
   ```

## 访问地址

- 前端页面：http://localhost:3000
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/docs

## 技术栈

- 前端：React + TypeScript + Vite
- 后端：FastAPI + Uvicorn + PyMongo
- 数据库：MongoDB
- 状态管理：React Context API + Redux (待实现)
- UI组件库：Ant Design (待集成)
- AI模型：OpenAI API (或其他法律专业模型)
- 身份验证：JWT (待实现)
