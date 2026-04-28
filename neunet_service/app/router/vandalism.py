from fastapi import APIRouter, HTTPException, Depends, status, Query
from app.schemas.vandalism import VandalismData, VandalismResponse
from app.models.vandalism_model import load_model_and_tokenizer
from app.config.config import settings
import torch
router = APIRouter()

@router.post("/", response_model=VandalismResponse)
async def check_vandalism(
    commit_data: VandalismData,

):
    device, tokenizer, model = await load_model_and_tokenizer()
    concat_string = "[TEXT ADDED]:" + commit_data.added_text + "[TEXT REMOVED]:" + commit_data.removed_text
    inputs = tokenizer(concat_string, return_tensors="pt", truncation=True, padding=True, max_length=settings.maxlen)
    inputs.to(device)
        
        # Предсказание
    with torch.no_grad():
        outputs = model(**inputs)
        predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        predicted_class = torch.argmax(predictions, dim=-1).item()
        confidence = predictions[0][predicted_class].item()
    return VandalismResponse (
        model_data = "Roberta Vandalism Model V1",
        predicted_class=predicted_class,
        confidence= confidence
)
    