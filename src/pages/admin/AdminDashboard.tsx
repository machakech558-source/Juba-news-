import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Users, 
  MessageSquare, 
  Eye, 
  TrendingUp, 
  Flame, 
  PlusCircle, 
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  KeyRound,
  Settings,
  History,
  Lock,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useRouter } from '../../contexts/RouterContext';
import { dataService } from '../../services/dataService';
import { adminSecurityService } from '../../services/adminSecurityService';
import type { Article, Comment } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { 
    currentUser, 
    role, 
    isSuperAdmin, 
    isEditor, 
    isModerator, 
    canCreateArticle, 
    canModerateComments 
  } = useAuth();
  const { language, isRTL, t } = useThemeLanguage();
  const { navigate } = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    setArticles(dataService.getArticles());
    setComments(dataService.getAllComments());
  }, []);

  // Compute metrics
  const totalArticles = articles.length;
  const published = articles.filter((a) => a.status === 'PUBLISHED' || a.status === 'published').length;
  const drafts = articles.filter((a) => a.status === 'DRAFT' || a.status === 'draft').length;
  const pendingReview = articles.filter((a) => a.status === 'PENDING_REVIEW' || a.status === 'review').length;
  const totalViews = articles.reduce((acc, curr) => acc + (curr.views || 0), 0);
  const totalComments = comments.length;
  const pendingComments = comments.filter((c) => c.status === 'PENDING' || c.status === 'pending').length;
  const approvedComments = comments.filter((c) => c.status === 'APPROVED' || c.status === 'approved').length;
  const spamComments = comments.filter((c) => c.status === 'SPAM' || c.status === 'spam').length;
  const totalUsers = dataService.getUsers().length;

  const mostViewed = [...articles].sort((a, b) => b.views - a.views).slice(0, 5);

  // Role-customized statistics
  const stats = (isModerator && !isEditor && !isSuperAdmin)
    ? [
        { label: language === 'ar' ? 'إجمالي التعليقات' : 'Total Comments', value: totalComments, icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
        { label: language === 'ar' ? 'تنتظر المراجعة' : 'Pending Review', value: pendingComments, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
        { label: language === 'ar' ? 'معتمدة ومنشورة' : 'Approved', value: approvedComments, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
        { label: language === 'ar' ? 'رسائل غير مرغوبة (سبام)' : 'Marked Spam', value: spamComments, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/40' },
      ]
    : [
        { label: language === 'ar' ? 'إجمالي المقالات' : 'Total Articles', value: totalArticles, icon: FileText, color: 'text-stone-700 dark:text-stone-300', bg: 'bg-stone-100 dark:bg-stone-800' },
        { label: language === 'ar' ? 'المنشورة' : 'Published', value: published, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
        { label: language === 'ar' ? 'قيد المراجعة' : 'Pending Review', value: pendingReview, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
        { label: language === 'ar' ? 'مسودات' : 'Drafts', value: drafts, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/40' },
        { label: language === 'ar' ? 'إجمالي المشاهدات' : 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/40' },
        { label: language === 'ar' ? 'إجمالي التعليقات' : 'Total Comments', value: totalComments, icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
        { label: language === 'ar' ? 'تعليقات تنتظر الاعتماد' : 'Pending Comments', value: pendingComments, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/40' },
        { label: language === 'ar' ? 'المستخدمون والمديرون' : 'Users & Staff', value: totalUsers, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/40' },
      ];

  const handleModerate = (commentId: string, newStatus: 'APPROVED' | 'REJECTED' | 'SPAM') => {
    dataService.updateCommentStatus(commentId, newStatus, currentUser?.uid || 'admin');
    setComments(dataService.getAllComments());
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black font-editorial text-stone-900 dark:text-stone-100">
              {language === 'ar' ? `مرحباً، ${currentUser?.displayName}` : `Welcome back, ${currentUser?.displayName}`}
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
              {language === 'ar' ? 'إدارة التحرير' : 'Editorial Desk'}
            </span>
          </div>
          <p className="text-xs text-stone-500">
            {isModerator && !isEditor && !isSuperAdmin
              ? (language === 'ar' 
                  ? 'بوابة الرقابة التحريرية — مراجعة تعليقات القراء، ضبط البلاغات وحماية بيئة النقاش.' 
                  : 'Editorial Moderation Center — Reviewing reader discussions, handling reports and community safety.')
              : (language === 'ar' 
                  ? 'غرفة الأخبار الرقمية لصحيفة جوبا نيوز - متابعة النشر والتحليلات والرقابة التحريرية.'
                  : 'Juba News Digital Newsroom — Managing editorial dispatches, real-time metrics, and reader engagement.')}
          </p>
        </div>

        {/* Dynamic Quick Action Buttons per Role */}
        <div className="flex flex-wrap items-center gap-2">
          {canCreateArticle && (
            <>
              <button
                onClick={() => navigate('/admin/ai-news')}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{language === 'ar' ? 'الصحفي الآلي (AI)' : 'AI Auto-News'}</span>
              </button>
              <button
                onClick={() => navigate('/admin/articles/new')}
                className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-black text-white dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{language === 'ar' ? 'تحرير خبر جديد' : 'New Article'}</span>
              </button>
              <button
                onClick={() => navigate('/admin/breaking-news')}
                className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-black text-white dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl text-xs font-bold transition"
              >
                <Flame className="w-4 h-4 text-red-500" />
                <span>{language === 'ar' ? 'خبر عاجل' : 'Breaking News'}</span>
              </button>
            </>
          )}

          {canModerateComments && (
            <button
              onClick={() => navigate('/admin/comments')}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{language === 'ar' ? 'إدارة التعليقات والبلاغات' : 'Moderate Comments'}</span>
            </button>
          )}

          {isSuperAdmin && (
            <>
              <button
                onClick={() => navigate('/admin/passwords')}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                title={language === 'ar' ? 'إدارة شفرة البوابة وكلمات السر' : 'Gate & Passwords Governance'}
              >
                <KeyRound className="w-4 h-4 text-amber-300" />
                <span>{language === 'ar' ? 'شفرة البوابة وكلمات السر' : 'Gate & Passwords'}</span>
              </button>
              <button
                onClick={() => navigate('/admin/settings')}
                className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-black text-white dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Settings className="w-4 h-4 text-stone-300" />
                <span>{language === 'ar' ? 'إعدادات المنصة' : 'Site Settings'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grid of Metric Cards */}
      <div className={`grid gap-4 ${isModerator && !isEditor && !isSuperAdmin ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between"
            >
              <div>
                <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block mb-1">
                  {item.label}
                </span>
                <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 font-editorial">
                  {item.value}
                </span>
              </div>
              <div className={`p-2.5 rounded-xl ${item.bg}`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Super Admin Sovereign Command Center */}
      {isSuperAdmin && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900 to-red-950/40 border border-stone-800 shadow-md space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-950 border border-red-800/80 text-red-500 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black font-editorial text-stone-100">
                    {language === 'ar' ? 'مركز القيادة والسيادة الإدارية • Super Admin Center' : 'Super Admin Command & Governance Center'}
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-950 text-red-300 border border-red-800 uppercase">
                    Super Admin Alone
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  {language === 'ar'
                    ? 'التحكم الحصري في شفرة بوابة الإدارة، كلمات سر المديرين الثلاثة، السياسات التحريرية، والرقابة السيادية.'
                    : 'Exclusive authority over Master Gate encryption, the 3 Admins passwords, and platform policies.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{language === 'ar' ? 'بوابة الدخول:' : 'Master Gate:'}</span>
                <strong className="text-emerald-400">
                  {adminSecurityService.isGateEnforced() 
                    ? (language === 'ar' ? 'مشفرة ومفعلة' : 'Enforced') 
                    : (language === 'ar' ? 'معطلة مؤقتاً' : 'Bypassed')}
                </strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Action 1: Gate Passcode & Passwords */}
            <div 
              onClick={() => navigate('/admin/passwords')}
              className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 hover:border-red-700/80 transition cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-red-950/80 text-red-400 group-hover:bg-red-900 group-hover:text-white transition">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-red-400">Super Admin</span>
                </div>
                <h4 className="text-xs font-bold text-stone-200 group-hover:text-white transition">
                  {language === 'ar' ? 'شفرة البوابة وكلمات السر' : 'Gate Passcode & Passwords'}
                </h4>
                <p className="text-[11px] text-stone-400 mt-1 leading-snug">
                  {language === 'ar' ? 'تغيير شفرة البوابة، وتعيين كلمات السر لحسابات الأدمن الثلاثة.' : 'Update Master Gate code & reset 3 Admins passwords.'}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-red-400 group-hover:underline">
                <span>{language === 'ar' ? 'الضبط الفوري' : 'Manage Credentials'}</span>
                {isRTL ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
              </div>
            </div>

            {/* Action 2: Staff & Administrators */}
            <div 
              onClick={() => navigate('/admin/administrators')}
              className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 hover:border-red-700/80 transition cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-stone-900 text-stone-300 group-hover:bg-stone-800 group-hover:text-white transition">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-stone-400">Roles Matrix</span>
                </div>
                <h4 className="text-xs font-bold text-stone-200 group-hover:text-white transition">
                  {language === 'ar' ? 'المديرون والأدوار' : 'Admins & Roles'}
                </h4>
                <p className="text-[11px] text-stone-400 mt-1 leading-snug">
                  {language === 'ar' ? 'حوكمة حسابات الإدارة الثلاثة، وصلاحيات الكادر التحريري والمستخدمين.' : 'Manage staff roles, permissions and user registry.'}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-stone-300 group-hover:underline">
                <span>{language === 'ar' ? 'إدارة الكادر' : 'Manage Staff'}</span>
                {isRTL ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
              </div>
            </div>

            {/* Action 3: Site Settings */}
            <div 
              onClick={() => navigate('/admin/settings')}
              className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 hover:border-red-700/80 transition cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-stone-900 text-stone-300 group-hover:bg-stone-800 group-hover:text-white transition">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-stone-400">Configuration</span>
                </div>
                <h4 className="text-xs font-bold text-stone-200 group-hover:text-white transition">
                  {language === 'ar' ? 'إعدادات المنصة' : 'Site Settings'}
                </h4>
                <p className="text-[11px] text-stone-400 mt-1 leading-snug">
                  {language === 'ar' ? 'تعديل هوية الصحيفة، سياسات التعليقات، بيانات الاتصال والشعارات.' : 'Brand identity, metadata, moderation rules, and contact info.'}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-stone-300 group-hover:underline">
                <span>{language === 'ar' ? 'فتح الإعدادات' : 'Open Settings'}</span>
                {isRTL ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
              </div>
            </div>

            {/* Action 4: Audit Logs */}
            <div 
              onClick={() => navigate('/admin/activity-logs')}
              className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 hover:border-red-700/80 transition cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-stone-900 text-stone-300 group-hover:bg-stone-800 group-hover:text-white transition">
                    <History className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-stone-400">Audit Trail</span>
                </div>
                <h4 className="text-xs font-bold text-stone-200 group-hover:text-white transition">
                  {language === 'ar' ? 'سجل العمليات (Audit)' : 'Activity Logs'}
                </h4>
                <p className="text-[11px] text-stone-400 mt-1 leading-snug">
                  {language === 'ar' ? 'متابعة سجل الدخول وتعديلات المقالات وحركات الأمان بدقة.' : 'Live log of login events, article actions & security updates.'}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-stone-300 group-hover:underline">
                <span>{language === 'ar' ? 'فحص السجلات' : 'View Logs'}</span>
                {isRTL ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role specific dashboard body */}
      {isModerator && !isEditor && !isSuperAdmin ? (
        /* Moderator dedicated view */
        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-red-600" />
              <span>{language === 'ar' ? 'طابور مراجعة التعليقات الفوري' : 'Live Comment Moderation Queue'}</span>
            </h3>
            <button 
              onClick={() => navigate('/admin/comments')}
              className="text-xs text-red-600 hover:underline font-semibold"
            >
              {language === 'ar' ? 'عرض الكل' : 'View All'} →
            </button>
          </div>

          <div className="space-y-3">
            {comments.filter(c => c.status === 'PENDING' || c.status === 'pending').slice(0, 5).map(c => (
              <div key={c.id} className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100">{c.userName}</span>
                    <span className="text-[10px] text-stone-400 font-mono">{new Date(c.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-stone-700 dark:text-stone-300 italic">"{c.content}"</p>
                  <span className="text-[10px] text-stone-400 block truncate">Article: {c.articleTitle}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleModerate(c.id, 'APPROVED')}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition"
                  >
                    {language === 'ar' ? 'اعتماد' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleModerate(c.id, 'SPAM')}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition"
                  >
                    {language === 'ar' ? 'سبام' : 'Spam'}
                  </button>
                  <button
                    onClick={() => handleModerate(c.id, 'REJECTED')}
                    className="px-2.5 py-1 bg-stone-700 hover:bg-stone-800 text-white rounded text-xs font-bold transition"
                  >
                    {language === 'ar' ? 'رفض' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
            {comments.filter(c => c.status === 'PENDING' || c.status === 'pending').length === 0 && (
              <div className="text-center py-8 text-xs text-stone-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p>{language === 'ar' ? 'لا توجد تعليقات تنتظر الاعتماد حالياً.' : 'No pending comments waiting for review.'}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Super Admin and Editor view */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Weekly Readership Engagement Simulator */}
          <div className="lg:col-span-7 bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-red-600" />
                  <span>{language === 'ar' ? 'مؤشر نمو القراءات اليومية' : 'Daily Readership Velocity'}</span>
                </h3>
                <span className="text-[11px] text-stone-400">Past 7 days readership trends</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                +28.4% this week
              </span>
            </div>

            {/* Graphical Bar Visualization */}
            <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2 border-b border-stone-200 dark:border-stone-800">
              {[
                { day: 'Mon', count: 1840, h: '45%' },
                { day: 'Tue', count: 2420, h: '60%' },
                { day: 'Wed', count: 3100, h: '75%' },
                { day: 'Thu', count: 2790, h: '68%' },
                { day: 'Fri', count: 3950, h: '90%' },
                { day: 'Sat', count: 4280, h: '98%' },
                { day: 'Sun', count: 3600, h: '82%' },
              ].map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[9px] text-stone-400 opacity-0 group-hover:opacity-100 transition">
                    {d.count}
                  </span>
                  <div 
                    style={{ height: d.h }} 
                    className="w-full bg-red-600 group-hover:bg-red-700 rounded-t-md transition-all duration-500 shadow-xs"
                  />
                  <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-stone-500 pt-3">
              <span>Aggregated South Sudan & East African impressions</span>
              <button onClick={() => navigate('/admin/analytics')} className="text-red-600 hover:underline font-semibold">
                {language === 'ar' ? 'عرض التقرير الكامل' : 'Full Analytics'} →
              </button>
            </div>
          </div>

          {/* Right Column: Top Performing Articles */}
          <div className="lg:col-span-5 bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-1">
                {language === 'ar' ? 'الأخبار الأكثر قراءة' : 'Most Viewed Stories'}
              </h3>
              <span className="text-[11px] text-stone-400 block mb-4">Ranked by verified readership pageviews</span>

              <div className="space-y-3">
                {mostViewed.map((art, idx) => (
                  <div
                    key={art.id}
                    onClick={() => navigate(`/article/${art.slug}`)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/60 cursor-pointer transition"
                  >
                    <span className="text-base font-black text-red-600 w-5 text-center">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">
                        {language === 'ar' ? art.titleAr : art.titleEn}
                      </p>
                      <span className="text-[10px] text-stone-400">
                        {art.categoryNameEn} • {art.authorName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-stone-500 font-mono">
                      <Eye className="w-3.5 h-3.5 text-stone-400" />
                      <span>{art.views}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/admin/articles')}
              className="w-full mt-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg text-xs font-semibold transition"
            >
              {language === 'ar' ? 'إدارة جميع المقالات' : 'Manage All Articles'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

