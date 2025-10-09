"""
配置模块
负责加载和管理应用程序配置
"""

import os
from dotenv import dotenv_values

class Settings:
    """应用程序设置"""
    
    def __init__(self):
        # 从.env文件加载配置
        self.env_config = dotenv_values()
        
        # MongoDB配置
        self.MONGODB_URI = self.env_config.get("MONGODB_URI", "mongodb://localhost:27017/")
        self.DB_NAME = self.env_config.get("DB_NAME", "law_agent")
        
        # 服务器配置
        self.HOST = self.env_config.get("HOST", "0.0.0.0")
        self.PORT = int(self.env_config.get("PORT", 8000))
        
        # CORS配置
        self.ALLOWED_ORIGINS = self._get_allowed_origins()
        
        # 默认用户ID
        self.DEFAULT_USER_ID = self.env_config.get("DEFAULT_USER_ID", "user_default")
        
        # AI服务配置
        self.AI_MODEL = self.env_config.get("AI_MODEL", "glm-4")
        self.AI_API_KEY = self.env_config.get("AI_API_KEY", "")
        self.SYSTEM_PROMPT = self.env_config.get("SYSTEM_PROMPT", "你是一个专业的法律助手")
        
        # 阿里云OSS配置
        self.OSS_ACCESS_KEY_ID = self.env_config.get("OSS_ACCESS_KEY_ID", "")
        self.OSS_ACCESS_KEY_SECRET = self.env_config.get("OSS_ACCESS_KEY_SECRET", "")
        self.OSS_ENDPOINT = self.env_config.get("OSS_ENDPOINT", "")
        self.OSS_BUCKET_NAME = self.env_config.get("OSS_BUCKET_NAME", "")
        self.OSS_BASE_URL = self.env_config.get("OSS_BASE_URL", "")
    
    def _get_allowed_origins(self) -> list:
        """获取允许的CORS源列表"""
        origins_str = self.env_config.get("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8080")
        return [origin.strip() for origin in origins_str.split(",") if origin.strip()]

# 创建全局设置实例
settings = Settings()
