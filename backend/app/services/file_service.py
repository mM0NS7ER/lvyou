
"""
文件服务模块
负责文件上传、存储和管理的业务逻辑
"""

import os
import uuid
import shutil
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import UploadFile
from bson import ObjectId
from app.crud.file_repository import FileRepository
from app.db.db_config import db_config

class FileService:
    """文件服务类"""

    def __init__(self):
        """初始化文件服务"""
        self.file_repository = FileRepository()
        # 确保上传目录存在
        self.upload_dir = "uploads"
        os.makedirs(self.upload_dir, exist_ok=True)

    async def save_file(self, file: UploadFile, session_id: Optional[str], user_id: Optional[str]) -> Dict[str, Any]:
        """
        保存上传的文件

        Args:
            file: 上传的文件
            session_id: 会话ID
            user_id: 用户ID

        Returns:
            文件信息字典
        """
        # 生成唯一文件名
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(self.upload_dir, unique_filename)
        print(f"[DEBUG] 文件服务: 准备保存文件 {file.filename} 到 {file_path}")

        # 保存文件
        try:
            print(f"[DEBUG] 文件服务: 开始保存文件到 {file_path}")
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            print(f"[DEBUG] 文件服务: 文件保存成功")
        except Exception as e:
            print(f"[ERROR] 文件服务: 保存文件失败: {str(e)}")
            raise Exception(f"保存文件失败: {str(e)}")

        # 准备文件信息
        print(f"[DEBUG] 文件服务: 准备文件信息")
        file_info = {
            "id": str(uuid.uuid4()),
            "original_name": file.filename,
            "stored_name": unique_filename,
            "file_path": file_path,
            "file_size": file.size,
            "file_type": file.content_type,
            "upload_time": datetime.utcnow(),
            "session_id": session_id,
            "user_id": user_id,
            # 为图片文件生成预览URL
            "preview_url": file.content_type.startswith("image/") and f"/uploads/{unique_filename}" or None
        }

        # 保存文件信息到数据库
        try:
            print(f"[DEBUG] 文件服务: 保存文件信息到数据库, 文件名: {file.filename}")
            result = self.file_repository.add_file_info(file_info)
            print(f"[DEBUG] 文件服务: 文件信息已保存到数据库: {result.get('id')}")

            # 确保返回的数据可以序列化为JSON
            # 创建一个深拷贝并确保所有ObjectId都被转换为字符串
            json_safe_file_info = {}
            for key, value in file_info.items():
                if isinstance(value, ObjectId):
                    json_safe_file_info[key] = str(value)
                else:
                    json_safe_file_info[key] = value

            # 确保返回的数据可以序列化为JSON
            json_safe_file_info["id"] = str(json_safe_file_info["id"])  # 确保id是字符串
            return {
                **json_safe_file_info,
                "db_id": str(result.get('id'))  # 确保db_id也是字符串
            }
        except Exception as e:
            # 如果数据库保存失败，删除已上传的文件
            print(f"[ERROR] 文件服务: 保存文件信息到数据库失败: {str(e)}")
            try:
                print(f"[DEBUG] 文件服务: 删除已上传的文件 {file_path}")
                os.remove(file_path)
            except:
                pass
            raise Exception(f"保存文件信息到数据库失败: {str(e)}")

    def get_file_info(self, file_id: str) -> Dict[str, Any]:
        """
        获取文件信息

        Args:
            file_id: 文件ID

        Returns:
            文件信息字典
        """
        return self.file_repository.get_file_info(file_id)

    def get_session_files(self, session_id: str) -> List[Dict[str, Any]]:
        """
        获取会话中的所有文件

        Args:
            session_id: 会话ID

        Returns:
            文件列表
        """
        return self.file_repository.get_session_files(session_id)

    def delete_file(self, file_id: str) -> bool:
        """
        删除文件

        Args:
            file_id: 文件ID

        Returns:
            是否删除成功
        """
        # 获取文件信息
        file_info = self.get_file_info(file_id)
        if not file_info:
            return False

        # 删除物理文件
        try:
            os.remove(file_info["file_path"])
        except Exception as e:
            print(f"删除物理文件失败: {str(e)}")

        # 从数据库删除记录
        return self.file_repository.delete_file_info(file_id)
