import { Alert, Button, Container, PasswordInput, Stack, TextInput, Title, Grid, Box, useMantineTheme } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRegister } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useMediaQuery } from '@mantine/hooks';
import { motion } from 'framer-motion';
const re_for_email =
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
export default function RegisterPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const register = useRegister();
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const from = location.state?.from?.pathname || '/';

  const form = useForm({
    initialValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      username: (value) => (value ? null : 'Введите имя пользователя'),
      email: (value) => (re_for_email.test(value) ? null : 'Некорректный email'),
      password: (value) => (value.length >= 6 ? null : 'Минимум 6 символов'),
      confirmPassword: (value, values) => 
        value === values.password ? null : 'Пароли не совпадают',
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
        backgroundImage: 'url(https://source.unsplash.com/random/1920x1080/?abstract,tech)',
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
                Регистрация
              </Title>
              
              {register.error && (
                <Alert 
                  icon={<IconAlertCircle size="1rem" />} 
                  title="Ошибка регистрации" 
                  color="red"
                  style={{ fontSize: isMobile ? theme.fontSizes.xs : theme.fontSizes.sm }}
                >
                  {register.error?.message|| 'Ошибка при создании аккаунта'}
                </Alert>
              )}

              <form onSubmit={form.onSubmit((values) => 
                register.mutate({
                  username: values.username,
                  email: values.email,
                  password: values.password
                })
              )}>
                <TextInput
                  label="Имя пользователя"
                  placeholder="Придумайте логин"
                  size={isMobile ? 'sm' : 'md'}
                  {...form.getInputProps('username')}
                />
                
                <TextInput
                  label="Email"
                  placeholder="your@email.com"
                  mt="md"
                  size={isMobile ? 'sm' : 'md'}
                  {...form.getInputProps('email')}
                />
                
                <PasswordInput
                  label="Пароль"
                  placeholder="Не менее 6 символов"
                  mt="md"
                  size={isMobile ? 'sm' : 'md'}
                  {...form.getInputProps('password')}
                />
                
                <PasswordInput
                  label="Подтверждение пароля"
                  placeholder="Повторите пароль"
                  mt="md"
                  size={isMobile ? 'sm' : 'md'}
                  {...form.getInputProps('confirmPassword')}
                />
                
                <Button 
                  type="submit" 
                  fullWidth 
                  mt="xl" 
                  size={isMobile ? 'sm' : 'md'}
                  loading={register.isPending}
                >
                  Зарегистрироваться
                </Button>
              </form>
              
              <Button 
                component={Link}
                to="/login"
                variant="outline"
                fullWidth
                size={isMobile ? 'sm' : 'md'}
                mt="sm"
              >
                Уже есть аккаунт? Войти
              </Button>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
    </motion.div>
  );
}