import mistune
import bleach

async def md_to_html(text:str):
    renderer = mistune.HTMLRenderer()
    markdown = mistune.Markdown(renderer)
    html = str(markdown(text))
    safe_html = bleach.clean(
        html,
        tags=[
                    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 
                    'div', 'span', 'pre', 'code', 'ul', 'ol', 'li', 
                    'strong', 'em', 'a', 'img', 'table', 'thead', 
                    'tbody', 'tr', 'th', 'td'
                ],
        attributes={
                    'a': ['href', 'title', 'target'],
                    'img': ['src', 'alt', 'width', 'height'],
                    '*': ['class', 'id']
        }
    )
    return safe_html