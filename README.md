# Law Agent

<div align="center">

![Law Agent Logo](https://via.placeholder.com/150?text=Law+Agent)

**法律智能助手系统**

基于AI技术的法律咨询平台，提供智能问答、文档处理和法律知识服务

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python Version](https://img.shields.io/badge/python-3.8+-yellow.svg)](https://www.python.org/downloads/)
[![React Version](https://img.shields.io/badge/react-18+-blue.svg)](https://reactjs.org/)
[![FastAPI Version](https://img.shields.io/badge/fastAPI-0.+-green.svg)](https://fastapi.tiangolo.com/)

</div>

## 📋 目录

- [项目简介](#项目简介)
- [功能特性](#功能特性)
- [项目状态](#项目状态)
- [技术架构](#技术架构)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
  - [环境要求](#环境要求)
  - [方法一：使用启动脚本（推荐）](#方法一使用启动脚本推荐)
  - [方法二：手动启动](#方法二手动启动)
- [访问地址](#访问地址)
- [许可证](#许可证)

## 项目简介

Law Agent 是一个基于FastAPI和React构建的法律智能助手系统，旨在通过人工智能技术，为用户提供便捷、准确的法律咨询服务。系统集成了先进的自然语言处理模型，能够理解用户法律问题并提供专业解答，同时支持法律文档处理和历史记录管理。

## 功能特性

### 🎯 核心功能

- **智能法律咨询**：基于AI的法律问题解答
- **多轮对话**：支持连续提问和深入探讨
- **历史记录管理**：保存和查看咨询历史
- **文件上传与处理**：支持上传PDF、DOCX、TXT等文档，AI可基于文档内容进行分析和回答

### 🚀 高级功能（开发中）

- **法律文档处理**：支持上传、解析和生成法律文档
- **法律知识库**：内置常见法律知识库
- **用户认证**：安全登录和身份验证
- **文档模板**：提供常用法律文档模板
- **智能文档分析**：上传合同等法律文档后，AI可自动识别关键条款和风险点

## 项目状态

| 功能模块 | 状态 | 完成度 |
|---------|------|--------|
| 基础聊天功能 | ✅ 已完成 | 100% |
| 后端API | ✅ 已完成 | 100% |
| 文件上传与处理 | ✅ 已完成 | 90% |
| 用户认证系统 | 🔄 开发中 | 30% |
| 法律文档处理 | 🔄 开发中 | 60% |
| UI优化 | 🔄 开发中 | 40% |

## 技术架构

<div align="center">

```mermaid
graph TD
    A[用户界面] --> B[前端应用]
    B --> C[API网关]
    C --> D[后端服务]
    D --> E[数据库]
    D --> F[AI模型]
```

</div>

- **前端**：React + TypeScript + Vite
- **后端**：FastAPI + Uvicorn + PyMongo
- **数据库**：MongoDB
- **文件存储**：本地存储 + 阿里云OSS（可选）
- **AI模型**：智谱AI API (GLM模型)
- **状态管理**：React Context API
- **UI组件库**：Ant Design (部分集成)
- **身份验证**：JWT (待实现)

## 项目结构

```
law-agent/
├── frontend/                    # React + TypeScript 前端项目
│   ├── src/                    # 源代码目录
│   │   ├── components/         # 可复用UI组件
│   │   ├── pages/              # 页面组件
│   │   ├── hooks/              # 自定义Hook
│   │   ├── services/           # API服务层
│   │   ├── stores/             # 状态管理
│   │   ├── utils/              # 工具函数
│   │   ├── App.tsx             # 主应用组件
│   │   ├── main.tsx            # 应用入口
│   │   └── router.tsx          # 路由配置
│   ├── public/                 # 静态资源
│   ├── index.html             # HTML入口文件
│   ├── package.json           # 项目依赖配置
│   ├── tsconfig.json          # TypeScript配置
│   └── vite.config.ts         # Vite构建配置
├── backend/                     # FastAPI + Uvicorn 后端项目
│   ├── app/                    # 应用程序主目录
│   │   ├── api/                # API路由
│   │   ├── crud/               # 数据访问层
│   │   ├── db/                 # 数据库配置
│   │   ├── models/             # 数据模型
│   │   └── services/           # 业务逻辑
│   ├── main.py                 # FastAPI应用主入口
│   └── requirements.txt        # Python依赖包列表
├── start.bat                   # 项目启动脚本
├── LICENSE                     # MIT许可证
├── requirements.txt            # Python依赖包列表
├── .env.example               # 环境变量示例
└── README.md                  # 项目说明文档
```

## 快速开始

### 环境要求
- Python 3.8+
- pip (Python包管理器)
- npm (Node包管理器)
- 现代浏览器 (Chrome, Firefox, Edge等)
- MongoDB 数据库 (用于存储聊天记录和文件信息)
- 可选：阿里云OSS账号 (用于文件云存储)

### 环境配置
1. **后端环境配置**
   - 进入后端目录：`cd backend`
   - 复制环境变量模板文件：`cp .env.example .env`
   - 编辑 `.env` 文件，填入您的实际配置：
     - `ZHIPU_API_KEY` 或 `AI_API_KEY`：智谱AI API密钥（必需）
     - `MONGODB_URI`：MongoDB连接字符串（默认为本地MongoDB）
     - 其他配置可根据需要修改

   获取智谱AI API密钥：
   1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
   2. 注册并登录账号
   3. 在控制台创建API密钥
   4. 将获取的API密钥填入 `.env` 文件

2. **前端环境配置**
   - 进入前端目录：`cd frontend`
   - 安装依赖：`npm install`
   - 前端通常无需额外配置，会自动使用后端API
   - 如果需要使用阿里云OSS存储文件，需要在后端配置相应的环境变量

### 方法一：使用启动脚本（推荐）

1. 确保已安装 Python 3.8+
2. 双击运行 `start.bat` 文件
3. 等待依赖安装完成，服务自动启动
4. 访问 http://localhost:3000 开始使用

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

| 服务 | 地址 | 描述 |
|------|------|------|
| 前端页面 | http://localhost:3000 | 用户界面 |
| 后端API | http://localhost:8000 | API服务 |
| API文档 | http://localhost:8000/docs | Swagger API文档 |
| 健康检查 | http://localhost:8000/health | 服务健康状态 |
| 文件上传API | http://localhost:8000/api/upload | 文件上传接口 |
| 文件下载API | http://localhost:8000/api/files/{file_id} | 文件下载接口 |

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。
