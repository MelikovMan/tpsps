export default function getAnimationKey(pathname: string){
  const parts = pathname.split('/');
  // Если это страница статьи (третий сегмент — ID)
  if (parts[1] === 'articles' && parts[2]) {
    return `/articles/${parts[2]}`;
  }
  return pathname;
};