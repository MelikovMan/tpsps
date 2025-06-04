import { Alert, Button, Container, PasswordInput, Stack, TextInput, Title, Grid, Box, useMantineTheme } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLogin } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useMediaQuery } from '@mantine/hooks';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const login = useLogin();
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const from = location.state?.from?.pathname || '/';

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: (value) => (value ? null : 'Введите имя пользователя'),
      password: (value) => (value ? null : 'Введите пароль'),
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
    <Box 
      style={{
        minHeight: '100vh',
        backgroundImage: 'url(https://source.unsplash.com/random/1920x1080/?nature,water)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '1rem' : 0,
      }}
    >
      <Container size="xl" w="100%" p={0}>
        <Grid justify="center" m={0}>
          <Grid.Col 
           span={{base:8,md:12}}
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              borderRadius: 'md',
              boxShadow: 'lg',
              padding: isMobile ? '1.5rem' : '2rem',
            }}
          >
            <Stack gap={isMobile ? 'sm' : 'md'}>
              <Title 
                order={isMobile ? 3 : 2} 
                ta="center"
                style={{ fontSize: isMobile ? theme.fontSizes.xl : theme.fontSizes.xxl }}
              >
                Вход в систему
              </Title>
              
              {login.error && (
                <Alert 
                  icon={<IconAlertCircle size="1rem" />} 
                  title="Ошибка входа" 
                  color="red"
                  style={{ fontSize: isMobile ? theme.fontSizes.xs : theme.fontSizes.sm }}
                >
                  {login.error?.message || 'Неверные учетные данные'}
                </Alert>
              )}

              <form onSubmit={form.onSubmit((values) => login.mutate(values))}>
                <TextInput
                  label="Имя пользователя"
                  placeholder="Ваш логин"
                  size={isMobile ? 'sm' : 'md'}
                  {...form.getInputProps('username')}
                />
                
                <PasswordInput
                  label="Пароль"
                  placeholder="Ваш пароль"
                  mt="md"
                  size={isMobile ? 'sm' : 'md'}
                  {...form.getInputProps('password')}
                />
                
                <Button 
                  type="submit" 
                  fullWidth 
                  mt="xl" 
                  size={isMobile ? 'sm' : 'md'}
                  loading={login.isPending}
                >
                  Войти
                </Button>
              </form>
              
              <Button 
                component={Link}
                to="/register"
                variant="outline"
                fullWidth
                size={isMobile ? 'sm' : 'md'}
                mt="sm"
              >
                Создать новый аккаунт
              </Button>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
    </motion.div>
  );
}