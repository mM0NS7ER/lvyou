
"""
聊天数据访问模块
负责与聊天消息相关的数据库操作
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from config.db_config import db_config

class ChatRepository:
    """聊天数据访问类"""

    def __init__(self):
        """初始化聊天数据访问类"""
        # 使用db_config的collection属性获取集合
        self.chat_collection = db_config.collection

    def add_chat_message(
        self,
        session_id: str,
        user_id: str,
        role: str,
        content: str,
        message_type: str = "text",
        additional_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        添加聊天消息到数据库

        Args:
            session_id: 会话ID
            user_id: 用户ID
            role: 角色 (user/assistant)
            content: 消息内容
            message_type: 消息类型 (text/image等)
            additional_data: 额外数据

        Returns:
            插入的文档ID
        """
        try:
            message = {
                "session_id": session_id,
                "user_id": user_id,
                "role": role,
                "content": content,
                "message_type": message_type,
                "timestamp": datetime.utcnow(),
                "additional_data": additional_data or {}
            }

            result = self.chat_collection.insert_one(message)
            print(f"成功添加消息: {str(result.inserted_id)}")
            return {"id": str(result.inserted_id)}
        except Exception as e:
            print(f"添加消息失败: {str(e)}")
            raise

    def get_chat_messages(
        self,
        session_id: str,
        user_id: Optional[str] = None,
        limit: int = 50,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        """
        获取会话中的聊天消息

        Args:
            session_id: 会话ID
            user_id: 可选的用户ID
            limit: 返回消息数量限制
            skip: 跳过的消息数量

        Returns:
            消息列表
        """
        try:
            query = {"session_id": session_id}
            if user_id:
                query["user_id"] = user_id

            messages = self.chat_collection.find(query).sort("timestamp", 1).skip(skip).limit(limit)
            # 将ObjectId转换为字符串，确保能被JSON序列化
            messages_list = []
            for message in messages:
                message['_id'] = str(message['_id'])
                messages_list.append(message)
            print(f"成功获取消息: {len(messages_list)}条")
            return messages_list
        except Exception as e:
            print(f"获取消息失败: {str(e)}")
            raise

    def get_user_sessions(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        获取用户的所有会话

        Args:
            user_id: 用户ID
            limit: 返回会话数量限制

        Returns:
            会话列表
        """
        try:
            # 使用更简单的方法获取用户会话
            # 先获取所有属于该用户的会话ID
            session_ids = set()
            cursor = self.chat_collection.find({"user_id": user_id}, {"session_id": 1})
            for message in cursor:
                session_ids.add(message["session_id"])
            
            # 为每个会话获取最后一条消息
            sessions = []
            for session_id in session_ids:
                last_message_cursor = self.chat_collection.find({
                    "session_id": session_id,
                    "user_id": user_id
                }).sort("timestamp", -1).limit(1)
                
                for msg in last_message_cursor:
                    sessions.append({
                        "session_id": session_id,
                        "last_message": msg["content"],
                        "timestamp": msg["timestamp"]
                    })
                    break
            
            # 按时间排序并限制数量
            sessions = sorted(sessions, key=lambda x: x["timestamp"], reverse=True)[:limit]
            print(f"成功获取用户会话: {len(sessions)}条")
            return sessions
        except Exception as e:
            print(f"获取用户会话失败: {str(e)}")
            raise
        # 将ObjectId转换为字符串，确保能被JSON序列化
        sessions_list = []
        for session in sessions:
            session_list_item = {
                "session_id": session["_id"],
                "last_message": session["last_message"],
                "timestamp": session["timestamp"]
            }
            sessions_list.append(session_list_item)
        return sessions_list

    def delete_chat_messages(self, session_id: str, user_id: Optional[str] = None) -> int:
        """
        删除会话中的聊天消息

        Args:
            session_id: 会话ID
            user_id: 可选的用户ID

        Returns:
            删除的消息数量
        """
        try:
            query = {"session_id": session_id}
            if user_id:
                query["user_id"] = user_id

            result = self.chat_collection.delete_many(query)
            print(f"成功删除消息: {result.deleted_count}条")
            return result.deleted_count
        except Exception as e:
            print(f"删除消息失败: {str(e)}")
            raise
