from transformers import  DebertaV2Tokenizer, DebertaV2ForSequenceClassification
import torch
from app.config.config import settings
async def load_model_and_tokenizer(model_path=settings.vandalism_model_path):
    """Загрузка модели и токенизатора"""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Используется устройство: {device}")
    
    # Загружаем токенизатор и модель
    tokenizer = DebertaV2Tokenizer.from_pretrained("microsoft/deberta-v3-base")
    model = DebertaV2ForSequenceClassification.from_pretrained(model_path).to(device)
    model.resize_token_embeddings(len(tokenizer))
    
    return device, tokenizer, model