import { Loader, type MantineTheme, useMantineTheme } from '@mantine/core';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: keyof MantineTheme['colors'];
}

export default function LoadingSpinner({ 
  fullScreen = false, 
  size = 'md',
  color = 'blue'
}: LoadingSpinnerProps) {
  const theme = useMantineTheme();
  const spinner = (
    <div 
      className="spinner" 
      style={{ 
        color: theme.colors[color][6],
        display: 'inline-block'
      }}
    >
      <Loader color="blue" />;
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw'
      }}>
        {spinner}
      </div>
    );
  }

  return spinner;
}