import React from 'react';
import { ThemeLanguageProvider } from './contexts/ThemeLanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RouterProvider, useRouter } from './contexts/RouterContext';

// Public Components
import { Header } from './components/public/Header';
import { BreakingNewsTicker } from './components/public/BreakingNewsTicker';
import { Footer } from './components/public/Footer';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { ArticlePage } from './pages/public/ArticlePage';
import { CategoryPage } from './pages/public/CategoryPage';
import { SearchPage } from './pages/public/SearchPage';
import { ProfilePage } from './pages/public/ProfilePage';
import { AboutPage, ContactPage, PrivacyPage } from './pages/public/StaticPages';

// Admin Components & Pages
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ArticleListPage } from './pages/admin/ArticleListPage';
import { ArticleEditorPage } from './pages/admin/ArticleEditorPage';
import { BreakingNewsManager } from './pages/admin/BreakingNewsManager';
import { CommentModerationPage } from './pages/admin/CommentModerationPage';
import { MediaLibraryPage } from './pages/admin/MediaLibraryPage';
import { AdCampaignsPage } from './pages/admin/AdCampaignsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { ActivityLogsPage } from './pages/admin/ActivityLogsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminPasswordSettingsPage } from './pages/admin/AdminPasswordSettingsPage';
import { CategoryManagementPage } from './pages/admin/CategoryManagementPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AiNewsAutomationPage } from './pages/admin/AiNewsAutomationPage';
import { RoleGuard } from './components/common/RoleGuards';

const AppRouter: React.FC = () => {
  const { currentPath } = useRouter();
  const { role, isAdmin } = useAuth();

  // Admin Routes Handler
  if (currentPath.startsWith('/admin')) {
    if (!isAdmin) {
      return <AdminLoginPage />;
    }

    let adminContent = <AdminDashboard />;

    if (currentPath === '/admin/articles') {
      adminContent = <ArticleListPage />;
    } else if (currentPath === '/admin/articles/new') {
      adminContent = <ArticleEditorPage />;
    } else if (currentPath === '/admin/ai-news' || currentPath === '/admin/facebook' || currentPath === '/admin/ai-newsroom') {
      adminContent = <AiNewsAutomationPage />;
    } else if (currentPath.startsWith('/admin/articles/') && currentPath.endsWith('/edit')) {
      const parts = currentPath.split('/');
      const id = parts[3];
      adminContent = <ArticleEditorPage articleId={id} />;
    } else if (currentPath === '/admin/categories') {
      adminContent = <CategoryManagementPage />;
    } else if (currentPath === '/admin/breaking-news') {
      adminContent = <BreakingNewsManager />;
    } else if (currentPath === '/admin/comments') {
      adminContent = <CommentModerationPage />;
    } else if (currentPath === '/admin/media') {
      adminContent = <MediaLibraryPage />;
    } else if (currentPath === '/admin/advertisements') {
      adminContent = <RoleGuard requireSuperAdmin><AdCampaignsPage /></RoleGuard>;
    } else if (currentPath === '/admin/administrators' || currentPath === '/admin/users') {
      adminContent = <RoleGuard requireSuperAdmin><AdminUsersPage /></RoleGuard>;
    } else if (currentPath === '/admin/activity-logs') {
      adminContent = <RoleGuard requireSuperAdmin><ActivityLogsPage /></RoleGuard>;
    } else if (currentPath === '/admin/settings') {
      adminContent = <RoleGuard requireSuperAdmin><AdminSettingsPage /></RoleGuard>;
    } else if (currentPath === '/admin/passwords' || currentPath === '/admin/security' || currentPath === '/admin/gate') {
      adminContent = <AdminPasswordSettingsPage />;
    } else if (currentPath === '/admin/analytics') {
      adminContent = <AdminDashboard />;
    }

    return (
      <RoleGuard requireAdmin>
        <AdminLayout>{adminContent}</AdminLayout>
      </RoleGuard>
    );
  }

  // Public Routes Handler
  let publicPage = <HomePage />;

  if (currentPath.startsWith('/article/')) {
    const slug = currentPath.replace('/article/', '');
    publicPage = <ArticlePage slug={slug} />;
  } else if (currentPath === '/search' || currentPath.startsWith('/search?')) {
    publicPage = <SearchPage />;
  } else if (currentPath === '/profile') {
    publicPage = <ProfilePage />;
  } else if (currentPath === '/about') {
    publicPage = <AboutPage />;
  } else if (currentPath === '/contact') {
    publicPage = <ContactPage />;
  } else if (currentPath === '/privacy' || currentPath === '/terms') {
    publicPage = <PrivacyPage />;
  } else if (currentPath.length > 1 && !currentPath.includes('.')) {
    // Check if category slug (e.g. /south-sudan, /africa, /world, etc.)
    const slug = currentPath.replace('/', '');
    publicPage = <CategoryPage slug={slug} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-950 text-stone-100 transition-colors duration-200">
      {/* SECTION A: Breaking News Ticker on Top */}
      <BreakingNewsTicker />

      {/* Main Newspaper Header & Navigation */}
      <Header />

      {/* Main Content View */}
      <main className="flex-1">
        {publicPage}
      </main>

      {/* Editorial Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <ThemeLanguageProvider>
      <AuthProvider>
        <RouterProvider>
          <AppRouter />
        </RouterProvider>
      </AuthProvider>
    </ThemeLanguageProvider>
  );
}
