import { useState } from 'react';
import {
  List, Title, Button, Modal, TextInput, Stack, Group, Loader,
  Alert, Badge
} from '@mantine/core';
import { IconPlus} from '@tabler/icons-react';

import { useAuth } from '../context/AuthContext';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '../api/categories';
import type { CategoryResponse } from '../api/types/categories';
import CategoryNode from '../components/CategoryNode';

export default function CategoryListPage() {
  const { data: categories, isLoading, error } = useCategories(); // root categories
  const { permissions } = useAuth();
  const canEdit = permissions?.can_edit;
  const canDelete = permissions?.can_delete;

  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

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
    if (editMode && selectedCategory) {
      await updateMutation.mutateAsync({
        id: selectedCategory.id,
        name: categoryName,
        parent_id: parentId || undefined,
      });
    } else {
      await createMutation.mutateAsync({
        name: categoryName,
        parent_id: parentId || undefined,
      });
    }
    setModalOpen(false);
  };

  const handleDelete = async (cat: CategoryResponse) => {
    if (confirm(`Удалить категорию "${cat.name}"?`)) {
      await deleteMutation.mutateAsync(cat.id);
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <Alert color="red">Ошибка загрузки категорий</Alert>;

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

      {categories && categories.length > 0 ? (
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
            />
          ))}
        </List>
      ) : (
        <div>Категорий пока нет</div>
      )}

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? 'Редактировать категорию' : 'Новая категория'}
      >
        <Stack>
          <TextInput
            label="Название"
            value={categoryName}
            onChange={(e) => setCategoryName(e.currentTarget.value)}
            required
          />
          {!editMode && parentId && <Badge>Вложена в категорию</Badge>}
          <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>
            {editMode ? 'Сохранить' : 'Создать'}
          </Button>
        </Stack>
      </Modal>
    </div>
  );
}