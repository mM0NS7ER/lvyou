"""
AI服务模块
负责生成AI响应
"""

from typing import Dict, Any, AsyncGenerator
from dotenv import dotenv_values
import json
import time

# 直接从.env文件读取配置
env_config = dotenv_values()

from zhipuai import ZhipuAI
import os

# 获取API密钥，优先从环境变量获取，然后从.env文件获取
zhipuai_api_key = os.getenv('ZHIPU_API_KEY') or os.getenv('AI_API_KEY')

# 初始化客户端，只有在有API密钥时才初始化
client = None
if zhipuai_api_key:
    try:
        client = ZhipuAI(api_key=zhipuai_api_key)
        print("[DEBUG] 智谱AI客户端初始化成功")
    except Exception as e:
        print(f"[ERROR] 智谱AI客户端初始化失败: {str(e)}")
        client = None

class AIService:
    """AI服务类"""

    def __init__(self):
        """初始化AI服务"""
        # 从.env文件中读取AI模型配置
        self.ai_model = env_config.get("AI_MODEL", "glm-4")
        self.api_key = env_config.get("AI_API_KEY")
        self.system_prompt = env_config.get("SYSTEM_PROMPT", "你是一个专业的法律助手")

        # 这里可以初始化AI模型，如OpenAI、Claude等
        if self.api_key:
            print(f"AI模型 {self.ai_model} 已初始化")
        else:
            print("警告: 未找到AI_API_KEY环境变量，AI服务将无法正常工作")

    async def generate_response(self, message: str, context: Dict[str, Any] = None) -> str:
        """
        生成AI响应（非流式版本）

        Args:
            message: 用户消息
            context: 上下文信息，包括会话历史等

        Returns:
            AI生成的响应
        """

        if self.api_key:
            # 使用从环境变量中读取的配置
            print(f"[DEBUG] 使用模型 {self.ai_model} 生成回答，系统提示: {self.system_prompt}")

            response = client.chat.completions.create(
                model="glm-4",
                messages=[
                    {"role":"system","content":self.system_prompt},
                    {"role":"user","content": message},
                ]
            )

            # 模拟AI响应
            result = response.choices[0].message.content
            print(f"[DEBUG] 非流式响应完成，内容长度: {len(result) if result else 0}")
            return result
        else:
            # 如果没有API密钥，返回提示信息
            return f"您的问题: {message}\n\n错误: 未配置AI API密钥，无法生成回答。请在.env文件中设置AI_API_KEY。"

    async def generate_response_stream(self, message: str, context: Dict[str, Any] = None) -> AsyncGenerator[str, None]:
        """
        生成AI响应（流式版本）

        Args:
            message: 用户消息
            context: 上下文信息，包括会话历史等

        Yields:
            AI生成的响应内容块
        """
        print(f"[DEBUG] 开始生成流式响应，消息: {message[:50]}...")

        if self.api_key:
            # 使用从环境变量中读取的配置
            print(f"[DEBUG] 使用模型 {self.ai_model} 生成流式回答，系统提示: {self.system_prompt}")

            try:
                # 使用智谱AI的流式响应功能
                print("[DEBUG] 调用智谱AI流式API...")
                response = client.chat.completions.create(
                    model="glm-4",
                    messages=[
                        {"role":"system","content":self.system_prompt},
                        {"role":"user","content": message},
                    ],
                    stream=True  # 启用流式响应
                )

                print("[DEBUG] 流式API调用成功，开始处理响应...")
                # 流式返回响应内容
                content_count = 0
                start_time = time.time()

                for chunk in response:
                    print(f"[DEBUG] 收到数据块，choices: {len(chunk.choices) if chunk.choices else 0}")

                    if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        content_count += 1
                        print(f"[DEBUG] 处理第 {content_count} 个数据块，内容: {content[:20]}...")
                        yield content

                elapsed_time = time.time() - start_time
                print(f"[DEBUG] 流式响应处理完成，共 {content_count} 个数据块，耗时: {elapsed_time:.2f}秒")

            except Exception as e:
                print(f"[ERROR] AI生成流式回复时出错: {str(e)}")
                print(f"[ERROR] 错误类型: {type(e).__name__}")
                import traceback
                print(f"[ERROR] 错误堆栈: {traceback.format_exc()}")
                yield f"\n\n抱歉，生成回复时出错: {str(e)}"
        else:
            # 如果没有API密钥，返回提示信息
            print("[ERROR] 未找到API密钥")
            error_msg = f"您的问题: {message}\n\n错误: 未配置AI API密钥，无法生成回答。请在.env文件中设置AI_API_KEY。"
            yield error_msg
