import { Card, Group, Text, ThemeIcon } from "@mantine/core";

export default function StatsCard({ title, value, description, icon, color }: {
    title: string;
    value: string | number;
    description: string;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
                <div>
                    <Text c="dimmed" size="sm" tt="uppercase" fw={700}>
                        {title}
                    </Text>
                    <Text fw={700} size="xl">
                        {value}
                    </Text>
                    <Text c="dimmed" size="xs">
                        {description}
                    </Text>
                </div>
                <ThemeIcon color={color} size={38} radius="md">
                    {icon}
                </ThemeIcon>
            </Group>
        </Card>
    );
}
