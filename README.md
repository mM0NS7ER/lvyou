# Law Agent

Law Agent 是一个法律智能助手系统，提供法律咨询和文档处理功能。

## 项目结构

```
law-agent/
├── frontend/         # React + Vite + TypeScript 前端项目
├── backend/          # FastAPI + Uvicorn 后端项目
└── start.bat         # 项目启动脚本
```

## 快速开始

### 方法一：使用启动脚本（推荐）

1. 确保已安装 Node.js 和 Python 3.8+
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

   **uvicorn命令参数说明：**
   - `main:app` - 指定main.py中的app实例
   - `--host 0.0.0.0` - 监听所有网络接口
   - `--port 8000` - 指定端口号
   - `--reload` - 开启热重载，代码修改后自动重启服务

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

## 技术栈

- 前端：React + Vite + TypeScript
- 后端：FastAPI + Uvicorn
- 状态管理：待添加
- UI组件库：待添加
