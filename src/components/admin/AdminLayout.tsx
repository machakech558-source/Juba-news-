import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  FolderTree, 
  Tag, 
  MessageSquare, 
  Image, 
  Flame, 
  DollarSign, 
  BarChart3, 
  Users, 
  History, 
  Settings, 
  Bell, 
  LogOut, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Menu, 
  X,
  KeyRound
} from 'lucide-react';
import { JubaNewsEmblem } from '../common/JubaNewsLogo';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useRouter } from '../../contexts/RouterContext';
import { dataService } from '../../services/dataService';
import type { UserRole } from '../../types';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    currentUser, 
    role, 
    isSuperAdmin, 
    isEditor, 
    isModerator, 
    canCreateArticle, 
    canModerateComments, 
    canManageUsers, 
    canManageAdmins, 
    canModifySettings, 
    canViewLogs, 
    logout 
  } = useAuth();
  const { language, isRTL, t } = useThemeLanguage();
  const { currentPath, navigate } = useRouter();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const notifications = dataService.getNotifications();
  const unreadNotifs = notifications.filter((n) => !n.read);

  // Dynamically constructed sections strictly based on role permissions
  const navSections = [
    {
      title: language === 'ar' ? 'نظرة عامة' : 'Overview',
      items: [
        { label: language === 'ar' ? 'لوحة القيادة' : 'Dashboard', path: '/admin', icon: LayoutDashboard },
      ],
    },
    // Editorial Content: visible to Editor and Super Admin ONLY (Moderator cannot view/create articles)
    ...(isEditor ? [{
      title: language === 'ar' ? 'المحتوى التحريري' : 'Editorial Content',
      items: [
        { label: language === 'ar' ? 'جميع الأخبار' : 'All Articles', path: '/admin/articles', icon: FileText },
        { label: language === 'ar' ? 'تحرير خبر جديد' : 'New Article', path: '/admin/articles/new', icon: PlusCircle },
        { label: language === 'ar' ? 'غرفة أخبار AI وفيسبوك' : 'AI Newsroom & Facebook', path: '/admin/ai-news', icon: Sparkles },
        { label: language === 'ar' ? 'الأقسام' : 'Categories', path: '/admin/categories', icon: FolderTree },
      ],
    }] : []),
    // Community & Moderation: visible to Moderator and Super Admin
    ...((isModerator || canManageUsers) ? [{
      title: language === 'ar' ? 'المجتمع والرقابة' : 'Community & Moderation',
      items: [
        ...(isModerator ? [
          { label: language === 'ar' ? 'التعليقات والبلاغات' : 'Comments & Reports', path: '/admin/comments', icon: MessageSquare },
        ] : []),
        ...(canManageUsers ? [
          { label: language === 'ar' ? 'قراء المنصة' : 'Users Registry', path: '/admin/users', icon: Users },
        ] : []),
      ],
    }] : []),
    // Broadcast & Media: visible to Editor and Super Admin
    ...(isEditor ? [{
      title: language === 'ar' ? 'البث المباشر والوسائط' : 'Broadcast & Media',
      items: [
        { label: language === 'ar' ? 'شريط الأخبار العاجلة' : 'Breaking News', path: '/admin/breaking-news', icon: Flame },
        { label: language === 'ar' ? 'مكتبة الوسائط' : 'Media Library', path: '/admin/media', icon: Image },
        ...(isSuperAdmin ? [
          { label: language === 'ar' ? 'الإعلانات والرعايات' : 'Advertisements', path: '/admin/advertisements', icon: DollarSign },
        ] : []),
        { label: language === 'ar' ? 'التحليلات والإحصاء' : 'Analytics', path: '/admin/analytics', icon: BarChart3 },
      ],
    }] : []),
    // Governance: Super Admin strictly
    ...(isSuperAdmin ? [{
      title: language === 'ar' ? 'الإدارة العليا والأمان' : 'Super Admin & Governance',
      items: [
        { label: language === 'ar' ? 'شفرة البوابة وكلمات السر' : 'Gate Passcode & Passwords', path: '/admin/passwords', icon: KeyRound },
        { label: language === 'ar' ? 'إدارة المديرين والأدوار' : 'Administrators & Roles', path: '/admin/administrators', icon: ShieldCheck },
        { label: language === 'ar' ? 'سجل العمليات (Audit Logs)' : 'Audit Trail Logs', path: '/admin/activity-logs', icon: History },
        { label: language === 'ar' ? 'إعدادات المنصة' : 'Site Settings', path: '/admin/settings', icon: Settings },
      ],
    }] : [{
      title: language === 'ar' ? 'أمان الحساب' : 'Account Security',
      items: [
        { label: language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password', path: '/admin/passwords', icon: KeyRound },
      ],
    }]),
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col antialiased">
      {/* Admin Top Navigation */}
      <header className="h-16 bg-stone-900 border-b border-stone-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-stone-300 hover:bg-stone-800"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            title="Return to Public News Website"
          >
            <div className="transition-transform group-hover:scale-105">
              <JubaNewsEmblem size={36} idSuffix="admin-top" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-editorial text-base font-black tracking-tight text-stone-900 dark:text-stone-100 group-hover:text-red-600 transition uppercase">
                  <span className="text-red-600">JUBA</span>{' '}
                  <span className="text-blue-700 dark:text-blue-400">NEWS</span>
                </span>
              </div>
              <span className="text-[9px] text-red-600 dark:text-red-400 font-black block uppercase tracking-wider">
                CMS CONTROL ROOM
              </span>
            </div>
          </div>
        </div>

        {/* Right Topbar Controls */}
        <div className="flex items-center gap-3">
          {/* Authenticated Admin Badge (Read-Only) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold border border-stone-200 dark:border-stone-700/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-bold uppercase tracking-wide text-[11px]">
              {language === 'ar' ? 'جلسة إدارية آمنة' : 'Secure Admin'}
            </span>
          </div>

          {/* Notifications Center */}
          <div className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 relative transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
              )}
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
              )}
            </button>

            {notifDropdownOpen && (
              <div className={`absolute top-full mt-2 w-80 bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-800 p-3 z-50 ${isRTL ? 'left-0' : 'right-0'}`}>
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2 mb-2">
                  <span className="font-bold text-xs">
                    {language === 'ar' ? 'الإشعارات التحريرية' : 'Editorial Notifications'} ({unreadNotifs.length})
                  </span>
                  <button
                    onClick={() => dataService.markAllNotificationsRead()}
                    className="text-[11px] text-red-600 hover:underline"
                  >
                    {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-4">No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => dataService.markNotificationRead(n.id)}
                        className={`p-2 rounded-lg text-xs cursor-pointer transition ${
                          n.read ? 'bg-stone-50 dark:bg-stone-800/40 text-stone-500' : 'bg-red-50 dark:bg-red-950/30 text-stone-900 dark:text-stone-100 font-medium'
                        }`}
                      >
                        <p className="font-semibold text-xs">{n.title}</p>
                        <p className="text-[11px] text-stone-500 line-clamp-2">{n.message}</p>
                        <span className="text-[9px] text-stone-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* View Public Website Link */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 transition"
          >
            <span>{language === 'ar' ? 'زيارة الموقع' : 'View Site'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-stone-900 border-e border-stone-800 p-4 space-y-6 select-none shrink-0">
          <div className="space-y-6 flex-1">
            {navSections.map((sec) => {
              if (sec.items.length === 0) return null;
              return (
                <div key={sec.title}>
                  <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mb-2 px-3">
                    {sec.title}
                  </p>
                  <ul className="space-y-1">
                    {sec.items.map((item) => {
                      const isActive = currentPath === item.path;
                      const Icon = item.icon;
                      return (
                        <li key={item.path}>
                          <button
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                              isActive
                                ? 'bg-red-700 text-white shadow-xs'
                                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{item.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* User Profile Card in Sidebar */}
          <div className="border-t border-stone-200 dark:border-stone-800 pt-4">
            <div className="flex items-center gap-3 px-2 mb-3">
              <img
                src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                alt=""
                className="w-8 h-8 rounded-full object-cover border border-stone-300 dark:border-stone-700"
              />
              <div className="min-w-0 flex-1">
                <span className="font-bold text-xs truncate block">{currentUser?.displayName}</span>
                <span className="text-[10px] text-stone-500 truncate block">{role}</span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-stone-500 hover:text-red-600 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </aside>

        {/* Mobile Drawer Sidebar */}
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex">
            <div className="w-72 bg-white dark:bg-stone-900 h-full p-4 overflow-y-auto flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                  <span className="font-editorial text-lg font-bold">Juba News CMS</span>
                  <button onClick={() => setMobileSidebarOpen(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {navSections.map((sec) => (
                  <div key={sec.title}>
                    <p className="text-[10px] font-black uppercase text-stone-400 mb-1.5 px-2">{sec.title}</p>
                    <ul className="space-y-1">
                      {sec.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <li key={item.path}>
                            <button
                              onClick={() => {
                                navigate(item.path);
                                setMobileSidebarOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                                currentPath === item.path ? 'bg-red-700 text-white' : 'text-stone-600 dark:text-stone-300'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
