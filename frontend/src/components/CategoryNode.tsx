import { useState } from 'react';
import {
  List, Title, Group, ActionIcon, Loader,
  Alert
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconFolders, IconChevronDown } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useCategories } from '../api/categories';
import type { CategoryResponse } from '../api/types/categories';

// ---------- Recursive tree node ----------
// Inside CategoryListPage.tsx – replace the CategoryNode function

interface CategoryNodeProps {
  category: CategoryResponse;   // now: children is string[]
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (cat: CategoryResponse) => void;
  onDelete: (cat: CategoryResponse) => void;
  onCreateSub: (parent: CategoryResponse) => void;
}

export default function CategoryNode({ category, canEdit, canDelete, onEdit, onDelete, onCreateSub }: CategoryNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false); // start collapsed, except root? You can set true for first level if you want

  // Determine if there are any children (from the IDs array)
  const hasChildren = category.children && category.children.length > 0;

  // Lazy fetch direct children when expanded
  const {
    data: fetchedChildren,
    isLoading: loadingChildren,
    error: errorChildren,
  } = useCategories(category.id, {
    enabled: isExpanded,   // only fetch when expanded
  });

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  // Show the fetched children when expanded and data is available
  const childCategories = isExpanded ? fetchedChildren : undefined;

  return (
    <List.Item>
      <Group gap="sm">
        <IconFolders size={20} />
        {/* Show expand button only if there are children */}
        {hasChildren && (
          <ActionIcon variant="subtle" onClick={toggleExpand} title="Развернуть/свернуть">
            <IconChevronDown
              size={18}
              style={{
                transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s',
              }}
            />
          </ActionIcon>
        )}
        <Link to={`/categories/${category.id}`} style={{ textDecoration: 'none', flex: 1 }}>
          <Title order={4} size="h4">
            {category.name}
          </Title>
        </Link>
        {canEdit && (
          <ActionIcon variant="subtle" onClick={() => onCreateSub(category)} title="Создать подкатегорию">
            <IconPlus size={18} />
          </ActionIcon>
        )}
        {canEdit && (
          <ActionIcon variant="subtle" onClick={() => onEdit(category)} title="Редактировать">
            <IconEdit size={18} />
          </ActionIcon>
        )}
        {canDelete && (
          <ActionIcon variant="subtle" color="red" onClick={() => onDelete(category)} title="Удалить">
            <IconTrash size={18} />
          </ActionIcon>
        )}
      </Group>

      {/* Children subtree */}
      {isExpanded && childCategories && childCategories.length > 0 && (
        <List spacing="xs" listStyleType="none" withPadding>
          {childCategories.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateSub={onCreateSub}
            />
          ))}
        </List>
      )}

      {isExpanded && loadingChildren && <Loader size="sm" ml="xl" />}
      {isExpanded && errorChildren && <Alert color="red" ml="xl">Ошибка загрузки подкатегорий</Alert>}
    </List.Item>
  );
}