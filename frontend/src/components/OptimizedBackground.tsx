import { Box } from '@mantine/core';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

export const OptimizedBackground = ({ src, children }: {src: string, children:React.ReactNode}) => (
  <Box style={{ position: 'relative', minHeight: '100vh' }}>
    <LazyLoadImage
      src={src}
      alt="background"
      effect="blur"
      wrapperProps={{ style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1
      }}}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
      placeholderSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%235f9ea0'/%3E%3C/svg%3E"
    />
    {children}
  </Box>
);
