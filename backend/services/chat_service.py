
"""
聊天服务模块
负责处理聊天相关的业务逻辑
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from dotenv import dotenv_values
from repositories.chat_repository import ChatRepository
from services.ai_service import AIService
from models.chat import ChatRequest, ChatResponse

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
        处理用户消息并返回AI回复

        Args:
            request: 包含用户消息、会话ID和用户ID的请求

        Returns:
            包含AI回复、会话ID和消息ID的响应
        """
        # 生成或获取session_id
        session_id = request.session_id or str(uuid.uuid4())

        # 确保使用正确的user_id，而不是默认的"anonymous"
        user_id = request.user_id or env_config.get("DEFAULT_USER_ID", "user_ah72m2ejx")

        # 存储用户消息
        user_message_id = self.chat_repository.add_chat_message(
            session_id=session_id,
            user_id=user_id,
            role="user",
            content=request.message,
            message_type="text",
            additional_data={"timestamp": datetime.utcnow()}
        )["id"]

        # 生成AI回复
        ai_response = await self.ai_service.generate_response(request.message)

        # 存储AI回复
        ai_message_id = self.chat_repository.add_chat_message(
            session_id=session_id,
            user_id=user_id,
            role="assistant",
            content=ai_response,
            message_type="text",
            additional_data={"timestamp": datetime.utcnow()}
        )["id"]

        return ChatResponse(
            response=ai_response,
            session_id=session_id,
            message_id=ai_message_id
        )

    def get_chat_history(self, session_id: str, user_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """
        获取指定会话的聊天历史记录

        Args:
            session_id: 会话ID
            user_id: 可选的用户ID
            limit: 返回消息数量限制

        Returns:
            聊天历史记录列表
        """
        return self.chat_repository.get_chat_messages(session_id, user_id, limit)

    def get_user_sessions(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        获取用户的所有会话

        Args:
            user_id: 用户ID
            limit: 返回会话数量限制

        Returns:
            用户会话列表
        """
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
        return self.chat_repository.delete_chat_messages(session_id, user_id)
