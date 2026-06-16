'use client';

import { useState, useEffect } from 'react';
import {
  List, Title, Button, Modal, TextInput, Stack, Group, Loader,
  Alert, Badge, ActionIcon
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconFolders, IconChevronDown } from '@tabler/icons-react';
import Link from 'next/link';
import { categoriesApi } from '@/lib/api/categories';
import type { CategoryResponse } from '@/lib/api/types/categories';
import { useAuth } from '@/context/AuthContext';
import { createCategory, updateCategory, deleteCategory } from '@/app/actions/categories';
// Компонент узла дерева с ленивой загрузкой детей (без React Query)
function CategoryNode({
  category,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onCreateSub,
  refreshParent, // для обновления после изменений
}: {
  category: CategoryResponse;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (cat: CategoryResponse) => void;
  onDelete: (cat: CategoryResponse) => void;
  onCreateSub: (parent: CategoryResponse) => void;
  refreshParent: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<CategoryResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChildren = category.children && category.children.length > 0;

  useEffect(() => {
    if (isExpanded && !children && !loading) {
      setLoading(true);
      categoriesApi.getList(category.id)
        .then(data => {
          setChildren(data);
          setError(null);
        })
        .catch(err => setError(err.message || 'Ошибка загрузки'))
        .finally(() => setLoading(false));
    }
  }, [isExpanded, category.id, children, loading]);

  const handleToggle = () => setIsExpanded(prev => !prev);

  return (
    <List.Item>
      <Group gap="sm">
        <IconFolders size={20} />
        {hasChildren && (
          <ActionIcon variant="subtle" onClick={handleToggle}>
            <IconChevronDown
              size={18}
              style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}
            />
          </ActionIcon>
        )}
        <Link href={`/categories/${category.id}`} style={{ textDecoration: 'none', flex: 1 }}>
          <Title order={4} size="h4">{category.name}</Title>
        </Link>
        {canEdit && (
          <ActionIcon variant="subtle" onClick={() => onCreateSub(category)}>
            <IconPlus size={18} />
          </ActionIcon>
        )}
        {canEdit && (
          <ActionIcon variant="subtle" onClick={() => onEdit(category)}>
            <IconEdit size={18} />
          </ActionIcon>
        )}
        {canDelete && (
          <ActionIcon variant="subtle" color="red" onClick={() => onDelete(category)}>
            <IconTrash size={18} />
          </ActionIcon>
        )}
      </Group>

      {isExpanded && (
        <>
          {loading && <Loader size="sm" ml="xl" />}
          {error && <Alert color="red" ml="xl">{error}</Alert>}
          {children && children.length > 0 && (
            <List spacing="xs" listStyleType="none" withPadding>
              {children.map((child) => (
                <CategoryNode
                  key={child.id}
                  category={child}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onCreateSub={onCreateSub}
                  refreshParent={refreshParent}
                />
              ))}
            </List>
          )}
        </>
      )}
    </List.Item>
  );
}

export default function CategoryListClient({ initialCategories }: { initialCategories: CategoryResponse[] }) {
  const { permissions } = useAuth();
  const canEdit = permissions?.can_edit;
  const canDelete = permissions?.can_delete;

  const [categories, setCategories] = useState<CategoryResponse[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);

  const refreshCategories = async () => {
    setLoading(true);
    try {
      const data = await categoriesApi.getList();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = (parent?: CategoryResponse) => {
    setEditMode(false);
    setSelectedCategory(null);
    setCategoryName('');
    setParentId(parent ? parent.id : null);
    setModalOpen(true);
  };

  const openEdit = (cat: CategoryResponse) => {
    setEditMode(true);
    setSelectedCategory(cat);
    setCategoryName(cat.name);
    setParentId(cat.parent_id);
    setModalOpen(true);
  };

const handleSubmit = async () => {
  try {
    if (editMode && selectedCategory) {
      await updateCategory(selectedCategory.id, { name: categoryName, parent_id: parentId || undefined });
    } else {
      await createCategory({ name: categoryName, parent_id: parentId || undefined });
    }
    await refreshCategories();
    setModalOpen(false);
  } catch (err) {
    console.error(err);
    alert('Ошибка при сохранении категории');
  }
};

const handleDelete = async (cat: CategoryResponse) => {
  if (!confirm(`Удалить категорию "${cat.name}"?`)) return;
  try {
    await deleteCategory(cat.id);
    await refreshCategories();
  } catch (err) {
    console.error(err);
    alert('Ошибка при удалении категории');
  }
};
  if (loading && categories.length === 0) return <Loader />;

  return (
    <div>
      <Group mb="md" justify="space-between">
        <Title order={2}>Категории статей</Title>
        {canEdit && (
          <Button leftSection={<IconPlus size={18} />} onClick={() => openCreate()}>
            Создать категорию
          </Button>
        )}
      </Group>

      {categories.length > 0 ? (
        <List spacing="xs" listStyleType="none">
          {categories.map((cat) => (
            <CategoryNode
              key={cat.id}
              category={cat}
              canEdit={!!canEdit}
              canDelete={!!canDelete}
              onEdit={openEdit}
              onDelete={handleDelete}
              onCreateSub={openCreate}
              refreshParent={refreshCategories}
            />
          ))}
        </List>
      ) : (
        <div>Категорий пока нет</div>
      )}

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editMode ? 'Редактировать категорию' : 'Новая категория'}>
        <Stack>
          <TextInput
            label="Название"
            value={categoryName}
            onChange={(e) => setCategoryName(e.currentTarget.value)}
            required
          />
          {!editMode && parentId && <Badge>Вложена в категорию</Badge>}
          <Button onClick={handleSubmit}>
            {editMode ? 'Сохранить' : 'Создать'}
          </Button>
        </Stack>
      </Modal>
    </div>
  );
}