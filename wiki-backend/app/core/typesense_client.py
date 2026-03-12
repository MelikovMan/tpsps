import typesense
from app.core.config import settings

typesense_client = typesense.Client({
    'nodes': [{
        'host': settings.TYPESENSE_HOST,
        'port': settings.TYPESENSE_PORT,
        'protocol': 'http',
    }],
    'api_key': settings.TYPESENSE_API_KEY,
    'connection_timeout_seconds': 5
})