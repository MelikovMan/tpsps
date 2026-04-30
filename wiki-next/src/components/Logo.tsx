// src/components/Logo.tsx
import { Group, Text } from '@mantine/core';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 30 }: LogoProps) {
  return (
    <Group>
      <div style={{
        width: size,
        height: size,
        backgroundColor: '#228be6',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Text  
          color="white"
          size={`${size * 0.6}`}
          style={{ lineHeight: 1 }}
        >
          W
        </Text>
      </div>
    </Group>
  );
}