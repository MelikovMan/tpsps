// components/ArticleCard.tsx
'use client';

import { Paper, Text } from '@mantine/core';
import Link from 'next/link';
import classes from './ArticleCard.module.css'; // Импортируем стили как объект

interface ArticleCardProps {
  href: string;
  title: string;
  description: string;
  color: string;
}

export default function ArticleCard({ href, title, description, color }: ArticleCardProps) {
  return (
    <Paper
      component={Link}
      href={href}
      p="md"
      withBorder
      radius="md"
      className={classes.card} // 👈 Применяем базовый CSS-класс
      data-color={color}      // 👈 Передаём цвет в data-атрибут для CSS
    >
      <Text fw={600} size="lg">
        {title}
      </Text>
      <Text size="sm" c="dimmed">
        {description}
      </Text>
    </Paper>
  );
}