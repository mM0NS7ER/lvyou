
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from database import add_chat_message, get_chat_messages, get_user_sessions, delete_chat_messages
from models.chat import ChatRequest, ChatResponse

class ChatService:
    def __init__(self):
        pass

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

        # 生成或获取user_id
        user_id = request.user_id or "anonymous"

        # 存储用户消息
        user_message_id = add_chat_message(
            session_id=session_id,
            user_id=user_id,
            role="user",
            content=request.message,
            message_type="text",
            additional_data={"timestamp": datetime.utcnow()}
        )["id"]

        # 模拟AI回复 - 实际应用中应该调用AI模型
        ai_response = f"您的问题: {request.message}\n\n这是AI助手对您法律问题的回答。在实际应用中，这里应该是AI模型生成的专业法律建议。"

        # 存储AI回复
        ai_message_id = add_chat_message(
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
        return get_chat_messages(session_id, user_id, limit)

    def get_user_sessions(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        获取用户的所有会话

        Args:
            user_id: 用户ID
            limit: 返回会话数量限制

        Returns:
            用户会话列表
        """
        return get_user_sessions(user_id, limit)

    def delete_chat_history(self, session_id: str, user_id: Optional[str] = None) -> int:
        """
        删除指定会话的聊天记录

        Args:
            session_id: 会话ID
            user_id: 可选的用户ID

        Returns:
            删除的消息数量
        """
        return delete_chat_messages(session_id, user_id)
