from pydantic import BaseModel, ConfigDict, Field
from typing import Literal, Optional, List, Dict, Any, Union

class VandalismData(BaseModel):
    added_text:str
    removed_text:str

class VandalismResponse(BaseModel):
    model_data:str
    predicted_class:Union[Literal[0], Literal[1]]
    confidence: float
