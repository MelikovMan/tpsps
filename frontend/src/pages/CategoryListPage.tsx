import { List, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

export default function CategoryListPage() {
  // Заглушка данных
  const categories = [
    { id: '1', name: 'Программирование' },
    { id: '2', name: 'Дизайн' },
    { id: '3', name: 'Администрирование' },
  ];

  return (
    <div>
      <Title order={2} mb="md">Категории статей</Title>
      <List spacing="sm" size="lg" center>
        {categories.map(category => (
          <List.Item key={category.id}>
            <Link to={`/categories/${category.id}`} style={{ textDecoration: 'none' }}>
              {category.name}
            </Link>
          </List.Item>
        ))}
      </List>
    </div>
  );
}