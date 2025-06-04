import { Button, Group, useMantineColorScheme } from '@mantine/core';

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();

  return (
    <Group justify="center">
      <Button size='xs' onClick={() => setColorScheme('light')}>Light</Button>
      <Button size='xs' onClick={() => setColorScheme('dark')}>Dark</Button>
      <Button size='xs' onClick={() => setColorScheme('auto')}>Auto</Button>
    </Group>
  );
}
