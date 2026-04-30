// app/login/LoginForm.tsx
'use client';

import { useActionState } from 'react';
import {
  Container, Title, TextInput, PasswordInput, Button, Group, Alert, Box,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { login } from '@/app/actions/auth';

const initialState = { error: undefined };

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);

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
              Вход в систему
            </Title>

            {state?.error && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Ошибка входа"
                color="red"
                mb="md"
              >
                {state.error}
              </Alert>
            )}

            <form action={formAction}>
              <TextInput
                label="Имя пользователя"
                placeholder="Ваш логин"
                name="username"
                required
                mb="md"
              />

              <PasswordInput
                label="Пароль"
                placeholder="Ваш пароль"
                name="password"
                required
                mb="xl"
              />

              <Button
                type="submit"
                fullWidth
                loading={isPending}
                mb="sm"
              >
                Войти
              </Button>
            </form>

            <Button
              component={Link}
              href="/register"
              variant="outline"
              fullWidth
            >
              Создать новый аккаунт
            </Button>
          </Box>
        </Container>
      </Box>
    </motion.div>
  );
}