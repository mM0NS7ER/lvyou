
"""
文件数据访问模块
负责与文件相关的数据库操作
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId
from app.db.db_config import db_config

class FileRepository:
    """文件数据访问类"""

    def __init__(self):
        """初始化文件数据访问类"""
        # 使用db_config的files_collection属性获取集合
        self.files_collection = db_config.files_collection

    def add_file_info(self, file_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        添加文件信息到数据库

        Args:
            file_info: 文件信息字典

        Returns:
            插入的文档ID
        """
        try:
            # 添加时间戳
            file_info["created_at"] = datetime.utcnow()
            print(f"[DEBUG] 文件仓库: 准备插入文件信息, 文件名: {file_info.get('original_name')}")

            result = self.files_collection.insert_one(file_info)
            print(f"[DEBUG] 文件仓库: 成功添加文件信息: {str(result.inserted_id)}")
            return {"id": str(result.inserted_id)}
        except Exception as e:
            print(f"[ERROR] 文件仓库: 添加文件信息失败: {str(e)}")
            print(f"[ERROR] 文件仓库: 文件信息: {file_info}")
            raise

    def get_file_info(self, file_id: str) -> Optional[Dict[str, Any]]:
        """
        获取文件信息

        Args:
            file_id: 文件ID

        Returns:
            文件信息字典，如果不存在则返回None
        """
        try:
            file = self.files_collection.find_one({"id": file_id})
            if file:
                # 将ObjectId转换为字符串，并确保所有字段都可以序列化
                file = {k: str(v) if isinstance(v, ObjectId) else v for k, v in file.items()}
                return file
            return None
        except Exception as e:
            print(f"获取文件信息失败: {str(e)}")
            raise

    def get_session_files(self, session_id: str) -> List[Dict[str, Any]]:
        """
        获取会话中的所有文件

        Args:
            session_id: 会话ID

        Returns:
            文件列表
        """
        try:
            files = self.files_collection.find({"session_id": session_id}).sort("created_at", 1)
            files_list = []
            for file in files:
                # 将ObjectId转换为字符串，并确保所有字段都可以序列化
                file = {k: str(v) if isinstance(v, ObjectId) else v for k, v in file.items()}
                files_list.append(file)
            print(f"成功获取会话文件: {len(files_list)}个")
            return files_list
        except Exception as e:
            print(f"获取会话文件失败: {str(e)}")
            raise

    def delete_file_info(self, file_id: str) -> bool:
        """
        删除文件信息

        Args:
            file_id: 文件ID

        Returns:
            是否删除成功
        """
        try:
            result = self.files_collection.delete_one({"id": file_id})
            if result.deleted_count > 0:
                print(f"成功删除文件信息: {file_id}")
                return True
            return False
        except Exception as e:
            print(f"删除文件信息失败: {str(e)}")
            raise
