
import './App.css'

// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import '@mantine/tiptap/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
export const mantineHtmlProps = {
  suppressHydrationWarning: true,
  'data-mantine-color-scheme': 'light',
};
import {
  BrowserRouter,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { ColorSchemeScript, MantineProvider } from '@mantine/core';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ColorSchemeScript />
        <Meta />
        <Links />
      </head>
      <body>
        <MantineProvider>{children}</MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
import Router from './Routes';
import { AuthProvider } from './context/AuthContext';
import { MantineEmotionProvider } from '@mantine/emotion';
import { theme } from './theme';

function App() {

  return (
    <AuthProvider>
      <MantineProvider
      theme={theme}
      withCssVariables
      >
        <MantineEmotionProvider>
          <BrowserRouter>
            <Router/>
          </BrowserRouter>
        </MantineEmotionProvider>
      </MantineProvider>
    </AuthProvider>
  )
}

export default App
