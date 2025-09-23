
"""
AI服务模块
负责生成AI响应
"""

from typing import Dict, Any
from dotenv import dotenv_values

# 直接从.env文件读取配置
env_config = dotenv_values()

from zhipuai import ZhipuAI
import os
zhipuai_api_key = os.getenv('ZHIPU_API_KEY')
client = ZhipuAI(api_key=zhipuai_api_key)

class AIService:
    """AI服务类"""

    def __init__(self):
        """初始化AI服务"""
        # 从.env文件中读取AI模型配置
        self.ai_model = env_config.get("AI_MODEL", "gpt-3.5-turbo")
        self.api_key = env_config.get("AI_API_KEY")
        self.system_prompt = env_config.get("SYSTEM_PROMPT", "你是一个专业的法律助手")

        # 这里可以初始化AI模型，如OpenAI、Claude等
        if self.api_key:
            print(f"AI模型 {self.ai_model} 已初始化")
        else:
            print("警告: 未找到AI_API_KEY环境变量，AI服务将无法正常工作")

    async def generate_response(self, message: str, context: Dict[str, Any] = None) -> str:
        """
        生成AI响应

        Args:
            message: 用户消息
            context: 上下文信息，包括会话历史等

        Returns:
            AI生成的响应
        """

        if self.api_key:
            # 使用从环境变量中读取的配置
            print(f"使用模型 {self.ai_model} 生成回答，系统提示: {self.system_prompt}")

            response = client.chat.completions.create(
                model="glm-4",
                messages=[
                    {"role":"system","content":self.system_prompt},
                    {"role":"user","content": message},
                ]
            )

            # 模拟AI响应
            return response.choices[0].message.content
        else:
            # 如果没有API密钥，返回提示信息
            return f"您的问题: {message}\n\n错误: 未配置AI API密钥，无法生成回答。请在.env文件中设置AI_API_KEY。"
