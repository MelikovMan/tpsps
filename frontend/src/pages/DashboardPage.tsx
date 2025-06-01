import { Card, Title, Text } from '@mantine/core';

export default function DashboardPage() {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={2}>Панель управления</Title>
      <Text mt="md">Добро пожаловать в вашу вики-систему!</Text>
    </Card>
  );
}