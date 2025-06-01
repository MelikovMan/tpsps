import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { RoleBasedRoute as RequireAuth } from '../Routes/RoleBasedRoute';
import LoadingSpinner from '../components/LoadingSpinner';

// Ленивая загрузка страниц
const HomePage = lazy(() => import('../pages/HomePage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage')); 
const ArticleListPage = lazy(() => import('../pages/ArticleListPage')); 
const ArticlePage = lazy(() => import('../pages/ArticlePage'));
const ArticleEditPage = lazy(() => import('../pages/ArticleEditPage'));
const ArticleCreatePage = lazy(() => import('../pages/ArticleCreatePage'));
const CategoryListPage = lazy(() => import('../pages/CategoryListPage')); 
const CategoryPage = lazy(() => import('../pages/CategoryPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const ProfileEditPage = lazy(() => import('../pages/ProfileEditPage'));
const AdminPage = lazy(() => import('../pages/AdminPage'));
const ModerationPage = lazy(() => import('../pages/ModerationPage'));
const UserListPage = lazy(() => import('../pages/UserListPage'));
const UserProfilePage = lazy(() => import('../pages/UserProfilePage'));
const ForbiddenPage = lazy(() => import('../pages/ForbiddenPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

export default function Router() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
    <BrowserRouter>
      <Routes>
        {/* Главный макет с AppShell */}
        <Route path="/" element={<HomePage />}>
          <Route path="articles" element={<ArticleListPage />} />
          <Route path="articles/:id" element={<ArticlePage />} />
          <Route path="categories" element={<CategoryListPage />} />
          <Route path="categories/:id" element={<CategoryPage />} />
          <Route path="users/:id/profile" element={<UserProfilePage />} />
          
          {/* Защищенные маршруты */}
          <Route path="profile" element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          } />
          
          <Route path="profile/edit" element={
            <RequireAuth>
              <ProfileEditPage />
            </RequireAuth>
          } />
          
          <Route path="articles/new" element={
            <RequireAuth requiredPermissions={['can_edit']}>
              <ArticleCreatePage />
            </RequireAuth>
          } />
          
          <Route path="articles/:id/edit" element={
            <RequireAuth requiredPermissions={['can_edit']}>
              <ArticleEditPage />
            </RequireAuth>
          } />
          
          <Route path="moderation" element={
            <RequireAuth requiredPermissions={['can_moderate']}>
              <ModerationPage />
            </RequireAuth>
          } />
          
          <Route path="users" element={
            <RequireAuth requiredPermissions={['can_moderate']}>
              <UserListPage />
            </RequireAuth>
          } />
          
          <Route path="admin" element={
            <RequireAuth requiredPermissions={['can_delete']}>
              <AdminPage />
            </RequireAuth>
          } />
        </Route>
        
        {/* Отдельные страницы без AppShell */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
    </Suspense>
  );
}