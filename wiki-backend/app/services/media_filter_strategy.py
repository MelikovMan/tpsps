from sqlalchemy import or_
from app.models.media import Media
from app.schemas.media import MediaFileType

class MediaFilterStrategy:
    @staticmethod
    def get_filter_condition(file_type: MediaFileType):
        """Get SQLAlchemy filter condition for the given file type"""
        strategies = {
            MediaFileType.IMAGE: Media.mime_type.startswith('image/'),
            MediaFileType.VIDEO: Media.mime_type.startswith('video/'),
            MediaFileType.AUDIO: Media.mime_type.startswith('audio/'),
            MediaFileType.PDF: Media.mime_type == 'application/pdf',
            MediaFileType.TEXT: Media.mime_type.startswith('text/'),
        }
        return strategies.get(file_type)
    
    @staticmethod
    def get_available_types():
        """Get list of available file types for documentation"""
        return [member.value for member in MediaFileType if member != MediaFileType.ALL]