import { Button, Group, useMantineColorScheme } from '@mantine/core';

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();

  return (
    <Group justify="center">
      <Button size='xs' variant="outline" onClick={() => setColorScheme('light')}>Light</Button>
      <Button size='xs' variant="outline" onClick={() => setColorScheme('dark')}>Dark</Button>
      <Button size='xs' variant="outline" onClick={() => setColorScheme('auto')}>Auto</Button>
    </Group>
  );
}
