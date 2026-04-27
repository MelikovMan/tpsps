export function preprocessTemplateSyntax(markdown: string): string {
  const regex = /\{\{([^|]+?)(\|(.*?))?\}\}/g;
  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    result += markdown.slice(lastIndex, match.index);
    const name = match[1].trim();
    const paramStr = match[3] || '';
    const params: Record<string, string> = {};
    if (paramStr) {
      paramStr.split('|').forEach((pair) => {
        const [key, val] = pair.split('=');
        if (key) params[key.trim()] = val?.trim() || '';
      });
    }
    result += `<span data-template="" data-name="${name}" data-params='${JSON.stringify(params)}'></span>`;
    lastIndex = match.index + match[0].length;
  }
  result += markdown.slice(lastIndex);
  return result;
}