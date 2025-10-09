
"""
文件上传API模块
处理文件上传和存储相关操作
"""

import os
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request, Header
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from app.services.file_service import FileService

router = APIRouter()
file_service = FileService()

async def get_user_id(request: Request, x_user_id: str = Header(None), form_user_id: str = Form(None)) -> str:
    """
    从请求中获取用户ID，如果不存在则使用默认值
    """
    # # 优先使用请求头中的用户ID
    # if x_user_id:
    #     return x_user_id

    # # 其次使用表单中的用户ID
    # if form_user_id:
    #     return form_user_id

    # # 如果都没有，尝试从查询参数中获取
    # user_id = request.query_params.get("user_id")
    # if user_id:
    #     return user_id

    # 如果都没有，返回默认用户ID
    return "user_ah72m2ejx"  # 与前端默认值保持一致

@router.post("/api/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    session_id: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None),
    request: Request = None
):
    """
    处理文件上传请求

    Args:
        files: 上传的文件列表
        session_id: 会话ID
        user_id: 用户ID

    Returns:
        上传结果, 包含文件信息和存储路径
    """
    # 获取用户ID
    authenticated_user_id = await get_user_id(request, form_user_id=user_id)
    print(f"[DEBUG] 认证用户ID: {authenticated_user_id}")
    print(f"[DEBUG] 表单用户ID: {user_id}")

    # 如果提供了表单中的user_id，确保与认证的user_id一致
    # 如果user_id为空，则使用认证的用户ID
    if user_id and user_id != authenticated_user_id:
        print(f"[ERROR] 用户ID不匹配: 表单ID={user_id}, 认证ID={authenticated_user_id}")
        raise HTTPException(status_code=403, detail="用户ID不匹配")

    # 如果没有提供user_id，则使用认证的用户ID
    if not user_id:
        user_id = authenticated_user_id
        print(f"[DEBUG] 使用认证的用户ID: {user_id}")

    if not files:
        raise HTTPException(status_code=400, detail="没有上传文件")

    try:
        print(f"[DEBUG] 开始处理 {len(files)} 个文件")
        uploaded_files = []
        for i, file in enumerate(files):
            # 检查文件大小 (限制为10MB)
            max_size = 10 * 1024 * 1024  # 10MB
            if file.size > max_size:
                raise HTTPException(
                    status_code=413, 
                    detail=f"文件 {file.filename} 超过大小限制 (10MB)"
                )

            # 检查文件类型
            print(f"[DEBUG] 文件 {i+1}: {file.filename} 类型 {file.content_type}")
            allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt'}
            file_ext = os.path.splitext(file.filename)[1].lower()
            if file_ext not in allowed_extensions:
                raise HTTPException(
                    status_code=415,
                    detail=f"文件 {file.filename} 类型不支持"
                )

            # 保存文件并获取信息
            print(f"[DEBUG] 正在保存文件 {i+1}: {file.filename}")
            file_info = await file_service.save_file(file, session_id, user_id)
            print(f"[DEBUG] 文件 {i+1} 保存成功: {file_info}")
            uploaded_files.append(file_info)

        print(f"成功接收 {len(uploaded_files)} 个文件，文件已保存到数据库")
        # 确保返回的数据可以序列化为JSON
        json_safe_files = []
        for file in uploaded_files:
            json_safe_file = {}
            for key, value in file.items():
                if isinstance(value, ObjectId):
                    json_safe_file[key] = str(value)
                else:
                    json_safe_file[key] = value
            json_safe_files.append(json_safe_file)

        return {
            "status": "success",
            "message": f"成功上传 {len(uploaded_files)} 个文件",
            "files": json_safe_files
        }
    except Exception as e:
        print(f"[ERROR] 文件上传失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"文件上传失败: {str(e)}")

@router.delete("/api/files/{file_id}")
async def delete_file(file_id: str, user_id: Optional[str] = None):
    """
    删除指定文件

    Args:
        file_id: 文件ID
        user_id: 可选的用户ID

    Returns:
        删除结果
    """
    try:
        # 获取文件信息
        file_info = file_service.get_file_info(file_id)
        if not file_info:
            raise HTTPException(status_code=404, detail="文件不存在")
        
        # 如果提供了user_id，验证是否匹配
        if user_id and file_info.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="无权删除此文件")
        
        # 删除文件
        deleted = await file_service.delete_file(file_id)
        if deleted:
            return {"status": "success", "message": "文件删除成功"}
        else:
            raise HTTPException(status_code=500, detail="文件删除失败")
    except Exception as e:
        print(f"[ERROR] 文件删除失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"文件删除失败: {str(e)}")
