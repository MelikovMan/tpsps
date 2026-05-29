// app/register/RegisterForm.tsx
'use client';

import { useActionState } from 'react';
import {
  Container, Title, TextInput, PasswordInput, Button, Alert, Box,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { register } from '@/app/actions/auth';

const initialState = { error: undefined };

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(register, initialState);

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
          justifyContent: 'center',
        }}
      >
        <Container size="xs" w="100%">
          <Box
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              borderRadius: 'var(--mantine-radius-md)',
              boxShadow: 'var(--mantine-shadow-lg)',
              padding: '2rem',
            }}
          >
            <Title order={2} ta="center" mb="md">
              Регистрация
            </Title>

            {state?.error && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Ошибка регистрации"
                color="red"
                mb="md"
              >
                {state.error}
              </Alert>
            )}

            <form action={formAction}>
              <TextInput
                label="Имя пользователя"
                placeholder="Придумайте логин"
                name="username"
                required
                mb="md"
              />

              <TextInput
                label="Email"
                placeholder="your@email.com"
                name="email"
                required
                mb="md"
              />

              <PasswordInput
                label="Пароль"
                placeholder="Не менее 6 символов"
                name="password"
                required
                mb="md"
              />

              <PasswordInput
                label="Подтверждение пароля"
                placeholder="Повторите пароль"
                name="confirmPassword"
                required
                mb="xl"
              />

              <Button
                type="submit"
                fullWidth
                loading={isPending}
                mb="sm"
              >
                Зарегистрироваться
              </Button>
            </form>

            <Button
              component={Link}
              href="/login"
              variant="outline"
              fullWidth
            >
              Уже есть аккаунт? Войти
            </Button>
          </Box>
        </Container>
      </Box>
    </motion.div>
  );
}