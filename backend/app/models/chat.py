
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    files: Optional[List[Dict[str, Any]]] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    message_id: str

class HealthResponse(BaseModel):
    status: str
    message: str

class Message(BaseModel):
    _id: str
    session_id: str
    user_id: str
    role: str
    content: str
    message_type: str
    timestamp: datetime
    additional_data: dict
