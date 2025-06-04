import { Group, Button, Menu, ActionIcon } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import {IconEdit, IconHistory, IconGitBranch, IconDots, IconEye } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';

interface ArticleNavigationProps {
  articleId: string;
  currentBranch?: string;
  variant?: 'buttons' | 'menu';
}

export default function ArticleNavigation({ 
  articleId, 
  currentBranch = 'main',
  variant = 'buttons' 
}: ArticleNavigationProps) {
  const { permissions } = useAuth();
  const location = useLocation();
  const canEdit = permissions?.can_edit;
  
  const branchParam = currentBranch !== 'main' ? `?branch=${currentBranch}` : '';
  
  const navigationItems = [
    {
      label: 'Просмотр',
      to: `/articles/${articleId}${branchParam}`,
      icon: <IconEye size="1rem" />,
      active: location.pathname === `/articles/${articleId}`,
      show: true
    },
    {
      label: 'Редактировать',
      to: `/articles/${articleId}/edit${branchParam}`,
      icon: <IconEdit size="1rem" />,
      active: location.pathname === `/articles/${articleId}/edit`,
      show: canEdit
    },
    {
      label: 'История',
      to: `/articles/${articleId}/history`,
      icon: <IconHistory size="1rem" />,
      active: location.pathname === `/articles/${articleId}/history`,
      show: true
    },
    {
      label: 'Ветки',
      to: `/articles/${articleId}/branches`,
      icon: <IconGitBranch size="1rem" />,
      active: location.pathname === `/articles/${articleId}/branches`,
      show: canEdit
    }
  ].filter(item => item.show);

  if (variant === 'menu') {
    return (
      <Menu>
        <Menu.Target>
          <ActionIcon variant="subtle">
            <IconDots size="1rem" />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          {navigationItems.map((item) => (
            <Menu.Item
              key={item.to}
              component={Link}
              to={item.to}
              leftSection={item.icon}
              data-active={item.active || undefined}
            >
              {item.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    );
  }

  return (
    <Group>
      {navigationItems.map((item) => (
        <Button
          key={item.to}
          component={Link}
          to={item.to}
          variant={item.active ? 'filled' : 'subtle'}
          leftSection={item.icon}
          size="sm"
        >
          {item.label}
        </Button>
      ))}
    </Group>
  );
}