import { Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { RoleBasedRoute as RequireAuth } from '../Routes/RoleBasedRoute';
import LoadingSpinner from '../components/LoadingSpinner';
import { AnimatePresence } from 'framer-motion';

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

const CommitsHistoryPage = lazy(() => import('../pages/CommitHistoryPage'));
const BranchesPage = lazy(() => import('../pages/BranchesPage'));
const MediaUploadPage = lazy(() => import('../pages/MediaUploadPage'));


export default function Router() {
  const location = useLocation();
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Главный макет с AppShell */}
        <Route path="/" element={<HomePage />}>
          <Route index element={<DashboardPage/>}/>
          <Route path="articles" element={<ArticleListPage />} />
          <Route path="articles/:id" element={<ArticlePage />} />

          <Route path="articles/:id/history" element={
            <RequireAuth>
              <CommitsHistoryPage />
            </RequireAuth>
          } />
          <Route path="articles/create" element={
            <RequireAuth>
              <ArticleCreatePage />
            </RequireAuth>
          } />
          <Route path="articles/:id/branches" element={
            <RequireAuth requiredPermissions={['can_edit']}>
              <BranchesPage />
            </RequireAuth>
          } />
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
          
          <Route path="articles/:articleId/edit" element={
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
          <Route path="admin/*" element={
            <RequireAuth requiredPermissions={['can_delete']}>
              <AdminPage />
            </RequireAuth>
          } />
          <Route path="admin" element={
            <RequireAuth requiredPermissions={['can_delete']}>
              <AdminPage />
            </RequireAuth>
          } />
            <Route path="media/upload" element={
              <RequireAuth requiredPermissions={['can_edit']}>
                <MediaUploadPage />
              </RequireAuth>
            }/>
        </Route>

        
        
        {/* Отдельные страницы без AppShell */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </AnimatePresence>
    </Suspense>
  );
}