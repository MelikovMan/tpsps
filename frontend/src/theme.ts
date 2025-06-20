import { createTheme } from "@mantine/core";


export const theme = createTheme({
  fontFamily: 'Open Sans, sans-serif',
  components: {
    Button: { defaultProps: { size: 'md' } },
    TextInput: { defaultProps: { size: 'md' } },
  },
});

