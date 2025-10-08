
"""
数据库配置模块
负责MongoDB数据库的连接和配置
"""

import os
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from dotenv import dotenv_values

# 直接从.env文件读取配置
env_config = dotenv_values()

class DatabaseConfig:
    """数据库配置类"""

    def __init__(self):
        # MongoDB连接配置
        self.mongodb_uri = env_config.get("MONGODB_URI", "mongodb://localhost:27017/")
        self.db_name = env_config.get("DB_NAME", "law_agent")
        self.client = None
        self.db = None
        self.chat_collection = None
        self._files_collection = None

    def connect(self):
        """连接到MongoDB数据库"""
        if self.client is None:
            try:
                self.client = MongoClient(self.mongodb_uri, server_api=ServerApi('1'))
                # 测试连接
                self.client.admin.command('ping')
                print("成功连接到MongoDB")

                self.db = self.client[self.db_name]
                self.chat_collection = self.db["chat_messages"]
                self._files_collection = self.db["files"]
                self._ensure_indexes()
            except Exception as e:
                print(f"连接MongoDB失败: {str(e)}")
                raise
        return self.client

    @property
    def collection(self):
        """获取聊天集合的属性访问器"""
        if self.chat_collection is None:
            self.connect()
        return self.chat_collection
        
    @property
    def files_collection(self):
        """获取文件集合的属性访问器"""
        if self._files_collection is None:
            self.connect()
        return self._files_collection

    def _ensure_indexes(self):
        """确保数据库索引存在"""
        try:
            # 为聊天集合创建索引
            self.chat_collection.create_index("session_id")
            self.chat_collection.create_index("user_id")
            self.chat_collection.create_index("timestamp")
            
            # 为文件集合创建索引
            self.files_collection.create_index("session_id")
            self.files_collection.create_index("user_id")
            self.files_collection.create_index("upload_time")
            
            print("数据库索引已创建")
        except Exception as e:
            print(f"创建数据库索引失败: {str(e)}")
            raise

    def disconnect(self):
        """断开数据库连接"""
        if self.client:
            self.client.close()
            self.client = None
            self.db = None
            self.chat_collection = None
            self._files_collection = None
            print("已断开数据库连接")

# 创建全局数据库配置实例
db_config = DatabaseConfig()
