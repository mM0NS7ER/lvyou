"""
聊天服务模块
负责处理聊天相关的业务逻辑
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any, AsyncGenerator
from dotenv import dotenv_values
import json
import time

from app.crud.chat_repository import ChatRepository
from app.services.ai_service import AIService
from app.models.chat import ChatRequest, ChatResponse
from app.utils.cache import history_cache, sessions_cache, clear_history_cache, clear_sessions_cache
from cachetools import cached

# 直接从.env文件读取配置
env_config = dotenv_values()

class ChatService:
    """聊天服务类"""

    def __init__(self):
        """初始化聊天服务"""
        self.chat_repository = ChatRepository()
        self.ai_service = AIService()

    async def process_message(self, request: ChatRequest) -> ChatResponse:
        """
        处理用户消息并返回AI回复（非流式版本）

        Args:
            request: 包含用户消息、会话ID和用户ID的请求

        Returns:
            包含AI回复、会话ID和消息ID的响应
        """
        print(f"[DEBUG] 开始处理非流式消息，用户ID: {request.user_id}, 会话ID: {request.session_id}")

        # 生成或获取session_id
        session_id = request.session_id or str(uuid.uuid4())
        print(f"[DEBUG] 使用会话ID: {session_id}")

        # 确保使用正确的user_id，而不是默认的"anonymous"
        user_id = request.user_id or env_config.get("DEFAULT_USER_ID", "user_ah72m2ejx")
        print(f"[DEBUG] 使用用户ID: {user_id}")

        # 存储用户消息
        user_message_id = self.chat_repository.add_chat_message(
            session_id=session_id,
            user_id=user_id,
            role="user",
            content=request.message,
            message_type="text",
            additional_data={"timestamp": datetime.utcnow()}
        )["id"]
        print(f"[DEBUG] 用户消息已保存，ID: {user_message_id}")

        # 生成AI回复
        start_time = time.time()
        ai_response = await self.ai_service.generate_response(request.message)
        elapsed_time = time.time() - start_time
        print(f"[DEBUG] AI回复生成完成，耗时: {elapsed_time:.2f}秒，内容长度: {len(ai_response) if ai_response else 0}")

        # 存储AI回复
        ai_message_id = self.chat_repository.add_chat_message(
            session_id=session_id,
            user_id=user_id,
            role="assistant",
            content=ai_response,
            message_type="text",
            additional_data={"timestamp": datetime.utcnow()}
        )["id"]
        print(f"[DEBUG] AI回复已保存，ID: {ai_message_id}")

        # 清除相关缓存
        clear_history_cache(session_id, user_id)
        clear_sessions_cache(user_id)

        return ChatResponse(
            response=ai_response,
            session_id=session_id,
            message_id=ai_message_id
        )

    async def process_message_stream(self, request: ChatRequest) -> AsyncGenerator[Dict[str, Any], None]:
        """
        处理用户消息并流式返回AI生成的回复

        Args:
            request: 包含用户消息、会话ID和用户ID的请求

        Yields:
            Dict: 包含AI生成回复内容块的字典
        """
        print(f"[DEBUG] 开始处理流式消息，用户ID: {request.user_id}, 会话ID: {request.session_id}")

        try:
            # 生成或获取session_id
            session_id = request.session_id or str(uuid.uuid4())
            print(f"[DEBUG] 使用会话ID: {session_id}")

            # 确保使用正确的user_id，而不是默认的"anonymous"
            user_id = request.user_id or env_config.get("DEFAULT_USER_ID", "user_ah72m2ejx")
            print(f"[DEBUG] 使用用户ID: {user_id}")

            # 存储用户消息
            user_message_id = self.chat_repository.add_chat_message(
                session_id=session_id,
                user_id=user_id,
                role="user",
                content=request.message,
                message_type="text",
                additional_data={"timestamp": datetime.utcnow()}
            )["id"]
            print(f"[DEBUG] 用户消息已保存，ID: {user_message_id}")

            # 获取AI回复（流式）
            print("[DEBUG] 开始获取AI流式回复...")
            full_content = ""
            chunk_count = 0
            start_time = time.time()

            async for chunk in self.ai_service.generate_response_stream(request.message):
                chunk_count += 1
                full_content += chunk
                print(f"[DEBUG] 处理第 {chunk_count} 个数据块，当前内容长度: {len(full_content)}")
                yield {"content": chunk}

            elapsed_time = time.time() - start_time
            print(f"[DEBUG] AI流式回复获取完成，共 {chunk_count} 个数据块，总内容长度: {len(full_content)}，耗时: {elapsed_time:.2f}秒")

            # 存储完整AI回复到数据库
            ai_message_id = self.chat_repository.add_chat_message(
                session_id=session_id,
                user_id=user_id,
                role="assistant",
                content=full_content,
                message_type="text",
                additional_data={"timestamp": datetime.utcnow()}
            )["id"]
            print(f"[DEBUG] 完整AI回复已保存，ID: {ai_message_id}")

            # 清除相关缓存
            clear_history_cache(session_id, user_id)
            clear_sessions_cache(user_id)

        except Exception as e:
            print(f"[ERROR] 处理流式消息时出错: {str(e)}")
            print(f"[ERROR] 错误类型: {type(e).__name__}")
            import traceback
            print(f"[ERROR] 错误堆栈: {traceback.format_exc()}")
            raise

    @cached(history_cache, key=lambda self, session_id, user_id, limit: f"history:{session_id}:{user_id or 'all'}:{limit}")
    def get_chat_history(self, session_id: str, user_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """
        获取指定会话的聊天历史记录(带缓存)

        Args:
            session_id: 会话ID
            user_id: 可选的用户ID
            limit: 返回消息数量限制

        Returns:
            聊天历史记录列表
        """
        print(f"[DEBUG] 从数据库获取历史记录: session_id={session_id}, user_id={user_id}, limit={limit}")
        return self.chat_repository.get_chat_messages(session_id, user_id, limit)

    @cached(sessions_cache, key=lambda self, user_id, limit: f"sessions:{user_id}:{limit}")
    def get_user_sessions(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        获取用户的所有会话(带缓存)

        Args:
            user_id: 用户ID
            limit: 返回会话数量限制

        Returns:
            用户会话列表
        """
        print(f"[DEBUG] 从数据库获取用户会话: user_id={user_id}, limit={limit}")
        return self.chat_repository.get_user_sessions(user_id, limit)

    def delete_chat_history(self, session_id: str, user_id: Optional[str] = None) -> int:
        """
        删除指定会话的聊天记录

        Args:
            session_id: 会话ID
            user_id: 可选的用户ID

        Returns:
            删除的消息数量
        """
        # 先删除数据
        deleted_count = self.chat_repository.delete_chat_messages(session_id, user_id)

        # 清除相关缓存
        clear_history_cache(session_id, user_id)
        if user_id:
            clear_sessions_cache(user_id)

        print(f"[DEBUG] 已删除 {deleted_count} 条消息并清除缓存")
        return deleted_count
