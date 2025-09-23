
"""
数据库模块
提供数据库连接和配置
"""

import os
from config.db_config import db_config

# 导出数据库配置
# 保持向后兼容性，直接暴露数据库配置对象
def get_db():
    """获取数据库连接实例"""
    return db_config

def connect():
    """连接数据库"""
    return db_config.connect()

def disconnect():
    """断开数据库连接"""
    return db_config.disconnect()

