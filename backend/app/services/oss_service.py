"""
阿里云OSS服务模块
负责处理阿里云对象存储的相关操作
"""

import os
import uuid
from typing import Dict, Any, Optional
from datetime import datetime
import oss2
from oss2.exceptions import ClientError, ServerError
from app.core.config import settings

class OSSService:
    """阿里云OSS服务类"""

    def __init__(self):
        """初始化OSS服务"""
        # 从环境变量获取配置
        self.access_key_id = settings.OSS_ACCESS_KEY_ID
        self.access_key_secret = settings.OSS_ACCESS_KEY_SECRET
        self.endpoint = settings.OSS_ENDPOINT
        self.bucket_name = settings.OSS_BUCKET_NAME
        self.base_url = settings.OSS_BASE_URL

        # 创建OSS Bucket实例
        self.auth = oss2.Auth(self.access_key_id, self.access_key_secret)
        self.bucket = oss2.Bucket(self.auth, self.endpoint, self.bucket_name)

        # 确保Bucket存在
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """确保Bucket存在，如果不存在则创建"""
        try:
            self.bucket.get_bucket_info()
        except oss2.exceptions.NoSuchBucket:
            try:
                self.bucket.create_bucket()
                print(f"[INFO] OSS Bucket '{self.bucket_name}' 创建成功")
            except Exception as e:
                print(f"[ERROR] 创建OSS Bucket失败: {str(e)}")
                raise Exception(f"创建OSS Bucket失败: {str(e)}")

    async def upload_file(self, file_content: bytes, file_name: str) -> Dict[str, Any]:
        """
        上传文件到阿里云OSS

        Args:
            file_content: 文件内容
            file_name: 文件名

        Returns:
            上传结果信息
        """
        try:
            # 生成唯一文件名
            file_ext = os.path.splitext(file_name)[1]
            unique_filename = f"{uuid.uuid4()}{file_ext}"

            # 上传文件到OSS
            print(f"[DEBUG] OSS服务: 上传文件 {file_name} 到OSS，存储文件名: {unique_filename}")
            self.bucket.put_object(unique_filename, file_content)
            result = None

            # 构建文件访问URL
            file_url = f"{self.base_url}/{unique_filename}"

            print(f"[DEBUG] OSS服务: 文件上传成功，URL: {file_url}")
            
            # 获取文件大小
            file_size = len(file_content)
            
            return {
                "stored_name": unique_filename,
                "file_url": file_url,
                "file_size": file_size,
                "last_modified": datetime.utcnow(),
                "etag": ""  # OSS返回的ETag可能需要特殊处理
            }
        except (ClientError, ServerError) as e:
            print(f"[ERROR] OSS服务: 文件上传失败: {str(e)}")
            raise Exception(f"文件上传到OSS失败: {str(e)}")
        except Exception as e:
            print(f"[ERROR] OSS服务: 未知错误: {str(e)}")
            raise Exception(f"文件上传到OSS失败: {str(e)}")

    async def delete_file(self, file_name: str) -> bool:
        """
        从阿里云OSS删除文件

        Args:
            file_name: 文件名

        Returns:
            是否删除成功
        """
        try:
            self.bucket.delete_object(file_name)
            return True
        except (ClientError, ServerError) as e:
            print(f"[ERROR] OSS服务: 删除文件失败: {str(e)}")
            return False
        except Exception as e:
            print(f"[ERROR] OSS服务: 删除文件未知错误: {str(e)}")
            return False

    async def get_file_url(self, file_name: str) -> str:
        """
        获取文件的访问URL

        Args:
            file_name: 文件名

        Returns:
            文件访问URL
        """
        try:
            # 生成签名URL，有效期1小时
            url = self.bucket.sign_url('GET', file_name, 3600)
            return url
        except Exception as e:
            print(f"[ERROR] OSS服务: 获取文件URL失败: {str(e)}")
            return f"{self.base_url}/{file_name}"
