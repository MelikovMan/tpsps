import { Card, Title, Text } from "@mantine/core";

export default async function AboutPage(){
    return(
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={2}>О проекте</Title>
      <Text mt="md"> Проект был разработан в рамках решения проблемы основных затруднений вики проектов при удовлетворении основных треований веб-приложений</Text>
      <Text mt="md"> Включает сервис для услуг нейронных сетей для решения прикладных задач</Text>
      <Text mt="md"> Подразумевает использование S3 хранилищ, локальных (Minio) и облачных</Text>
      <Text mt="md"> SSR на основе Next.js</Text>
    </Card>
    )
}