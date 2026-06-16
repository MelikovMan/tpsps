// Создайте отдельный клиентский компонент, например ThemeSwitch.tsx
'use client';

import { Switch, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useEffect } from 'react';

export function ThemeSwitch() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');
  const isDark = computedColorScheme === 'dark';

  const toggleColorScheme = () => {
    // Добавляем класс анимации перед переключением
    document.documentElement.classList.add('theme-transition');
    setColorScheme(isDark ? 'light' : 'dark');
    // Удаляем класс после завершения перехода
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 300);
  };

  useEffect(() => {
    // Хук для очистки, если пользователь закрыл вкладку до окончания анимации
    return () => {
      document.documentElement.classList.remove('theme-transition');
    };
  }, []);

  return (
    <Switch
      size="md"
      onLabel={<IconSun size={16} stroke={2.5} color="yellow" />}
      offLabel={<IconMoon size={16} stroke={2.5} color="cyan" />}
      checked={isDark}
      onChange={toggleColorScheme}
    />
  );
}