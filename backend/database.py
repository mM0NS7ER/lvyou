
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from datetime import datetime
from typing import Optional, List, Dict, Any
import os

# MongoDB连接配置
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME = "law_agent"

# 创建MongoDB客户端
client = MongoClient(MONGODB_URI, server_api=ServerApi('1'))

# 获取数据库
db = client[DB_NAME]

# 获取集合
chat_collection = db["chat_messages"]

# 确保索引
def ensure_indexes():
    # 为session_id创建索引
    chat_collection.create_index("session_id")
    # 为user_id创建索引
    chat_collection.create_index("user_id")
    # 为timestamp创建索引
    chat_collection.create_index("timestamp")

# 初始化索引
ensure_indexes()

def add_chat_message(
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
    message = {
        "session_id": session_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "message_type": message_type,
        "timestamp": datetime.utcnow(),
        "additional_data": additional_data or {}
    }

    result = chat_collection.insert_one(message)
    return {"id": str(result.inserted_id)}

def get_chat_messages(
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
    query = {"session_id": session_id}
    if user_id:
        query["user_id"] = user_id

    messages = chat_collection.find(query).sort("timestamp", 1).skip(skip).limit(limit)
    # 将ObjectId转换为字符串，确保能被JSON序列化
    messages_list = []
    for message in messages:
        message['_id'] = str(message['_id'])
        messages_list.append(message)
    return messages_list

def get_user_sessions(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    """
    获取用户的所有会话

    Args:
        user_id: 用户ID
        limit: 返回会话数量限制

    Returns:
        会话列表
    """
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": "$session_id",
            "last_message": {"$last": "$content"},
            "timestamp": {"$last": "$timestamp"}
        }},
        {"$sort": {"timestamp": -1}},
        {"$limit": limit}
    ]

    sessions = list(chat_collection.aggregate(pipeline))
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

def delete_chat_messages(session_id: str, user_id: Optional[str] = None) -> int:
    """
    删除会话中的聊天消息

    Args:
        session_id: 会话ID
        user_id: 可选的用户ID

    Returns:
        删除的消息数量
    """
    query = {"session_id": session_id}
    if user_id:
        query["user_id"] = user_id

    result = chat_collection.delete_many(query)
    return result.deleted_count
