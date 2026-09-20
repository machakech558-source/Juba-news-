import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  Sliders, 
  Plus, 
  Trash2, 
  FileText, 
  Zap, 
  AlertCircle,
  ExternalLink,
  Search,
  Eye,
  Check,
  X,
  Share2,
  Copy,
  Layers,
  ArrowRight,
  ShieldCheck,
  Send,
  Database,
  Filter,
  RotateCcw
} from 'lucide-react';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useRouter } from '../../contexts/RouterContext';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import type { Article, Category, FacebookPost, FacebookSettings, SyncLog, FacebookSyncResult } from '../../types';

export const AiNewsAutomationPage: React.FC = () => {
  const { language, isRTL } = useThemeLanguage();
  const { navigate } = useRouter();
  const { currentUser } = useAuth();

  // Active section tab: A to F + G
  const [activeTab, setActiveTab] = useState<
    'imports' | 'drafts' | 'published' | 'failed' | 'logs' | 'settings' | 'generator'
  >('drafts');

  // Loading & state
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<FacebookSyncResult | null>(null);

  // Data
  const [fbStatus, setFbStatus] = useState<any>(null);
  const [fbPosts, setFbPosts] = useState<FacebookPost[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [fbSettings, setFbSettings] = useState<FacebookSettings>({
    id: 'fb-global',
    facebookIntegration: 'CONNECTED',
    syncMode: 'BOTH',
    aiProcessing: 'ENABLED',
    autoPublish: true,
    defaultCategory: 'cat-ss',
    aiLanguage: 'both',
    articleStyle: 'formal',
    minimumConfidence: 0.85,
    metaPageId: '108429588219424',
    metaPageName: 'Juba News - جوبا نيوز',
    pagePermalink: 'https://www.facebook.com/share/1UpeZiXU5k/',
    updatedAt: new Date().toISOString(),
  });

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Preview & Edit Modal
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedPost, setSelectedPost] = useState<FacebookPost | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Edit form state
  const [editTitleAr, setEditTitleAr] = useState('');
  const [editTitleEn, setEditTitleEn] = useState('');
  const [editContentAr, setEditContentAr] = useState('');
  const [editContentEn, setEditContentEn] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editSeoTitle, setEditSeoTitle] = useState('');
  const [editSeoDesc, setEditSeoDesc] = useState('');

  // Test import modal
  const [testImportOpen, setTestImportOpen] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testUrl, setTestUrl] = useState('https://www.facebook.com/share/1UpeZiXU5k/');
  const [testImageUrl, setTestImageUrl] = useState('');
  const [testIsImporting, setTestIsImporting] = useState(false);

  // Success / Error alerts
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [status, posts, logs, settings] = await Promise.all([
        dataService.getFacebookStatus(),
        dataService.getFacebookPosts(),
        dataService.getSyncLogs(),
        dataService.getFacebookSettings(),
      ]);

      setFbStatus(status);
      setFbPosts(posts);
      setSyncLogs(logs);
      if (settings) setFbSettings(settings);

      setArticles(dataService.getArticles());
      setCategories(dataService.getCategories().filter((c) => c.enabled));
    } catch (err) {
      console.error('Failed loading newsroom data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const unsub = dataService.subscribeArticles((arts) => setArticles(arts));
    return unsub;
  }, []);

  // Filtered views
  const facebookArticles = articles.filter(
    (a) => a.source === 'Facebook' || a.facebookPostId || a.authorRole === 'AI Editorial Newsroom'
  );

  const draftsList = facebookArticles.filter(
    (a) => a.status === 'draft' || a.status === 'DRAFT' || a.editorialStatus === 'draft' || a.editorialStatus === 'needs_review'
  );

  const publishedList = facebookArticles.filter(
    (a) => a.status === 'published' || a.status === 'PUBLISHED' || a.editorialStatus === 'published'
  );

  const failedPosts = fbPosts.filter((p) => p.processingStatus === 'failed');

  // Manual Synchronization Handler
  const handleSyncFacebookNow = async () => {
    setIsSyncing(true);
    setAlertError(null);
    try {
      const result = await dataService.syncFacebookNow();
      setSyncResult(result);
      setSyncModalOpen(true);
      await loadAllData();
      setAlertSuccess(
        language === 'ar'
          ? `تمت المزامنة بنجاح! تم استيراد ${result.importedCount} منشورات وتخطي ${result.skippedCount} مكررات.`
          : `Sync completed! Imported ${result.importedCount} posts, skipped ${result.skippedCount} duplicates.`
      );
    } catch (err: any) {
      setAlertError(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (article: Article, post?: FacebookPost) => {
    setSelectedArticle(article);
    setSelectedPost(post || fbPosts.find((p) => p.facebookPostId === article.facebookPostId || p.id === article.facebookPostId) || null);
    setEditTitleAr(article.titleAr);
    setEditTitleEn(article.titleEn || '');
    setEditContentAr(article.contentAr);
    setEditContentEn(article.contentEn || '');
    setEditCategoryId(article.categoryId);
    setEditImage(article.featuredImage);
    setEditSeoTitle(article.seoTitle || article.titleAr);
    setEditSeoDesc(article.seoDescription || article.subtitleAr || '');
    setEditModalOpen(true);
  };

  // Save Edit Form
  const handleSaveEdit = () => {
    if (!selectedArticle) return;
    const cat = categories.find((c) => c.id === editCategoryId);

    dataService.updateArticle(
      selectedArticle.id,
      {
        titleAr: editTitleAr,
        titleEn: editTitleEn,
        contentAr: editContentAr,
        contentEn: editContentEn,
        categoryId: editCategoryId,
        categorySlug: cat ? cat.slug : selectedArticle.categorySlug,
        categoryNameAr: cat ? cat.nameAr : selectedArticle.categoryNameAr,
        categoryNameEn: cat ? cat.nameEn : selectedArticle.categoryNameEn,
        featuredImage: editImage,
        seoTitle: editSeoTitle,
        seoDescription: editSeoDesc,
      },
      currentUser || undefined
    );

    setEditModalOpen(false);
    setAlertSuccess(language === 'ar' ? 'تم حفظ التعديلات التحريرية بنجاح.' : 'Editorial changes saved.');
  };

  // Editorial Actions
  const handleApprove = (articleId: string) => {
    dataService.approveArticle(articleId, currentUser || undefined);
    setAlertSuccess(language === 'ar' ? 'تم اعتماد المسودة بنجاح وجاهزة للنشر.' : 'Draft approved successfully.');
    loadAllData();
  };

  const handlePublish = (articleId: string) => {
    dataService.publishArticleDirect(articleId, currentUser || undefined);
    setAlertSuccess(language === 'ar' ? 'تم نشر الخبر على الموقع بنجاح!' : 'Article published live to the website!');
    loadAllData();
  };

  const handleReject = (articleId: string) => {
    dataService.rejectArticle(articleId, 'Rejected by Editor', currentUser || undefined);
    setAlertSuccess(language === 'ar' ? 'تم رفض المسودة وأرشفتها.' : 'Draft rejected.');
    loadAllData();
  };

  const handleDelete = (articleId: string) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الخبر نهائياً؟' : 'Permanently delete this article?')) {
      dataService.deleteArticle(articleId, currentUser || undefined);
      setAlertSuccess(language === 'ar' ? 'تم حذف الخبر.' : 'Article deleted.');
      loadAllData();
    }
  };

  const handleReprocess = async (postId: string) => {
    try {
      await dataService.reprocessFacebookPost(postId);
      setAlertSuccess(language === 'ar' ? 'تمت إعادة معالجة المنشور بواسطة الذكاء الاصطناعي.' : 'Post reprocessed by AI.');
      loadAllData();
    } catch (err: any) {
      setAlertError(err.message || 'Reprocessing failed');
    }
  };

  // Test Import Post
  const handleTestImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMessage.trim()) return;
    setTestIsImporting(true);
    setAlertError(null);
    try {
      const art = await dataService.testImportFacebookPost({
        message: testMessage,
        permalink: testUrl,
        imageUrl: testImageUrl,
      });
      setTestImportOpen(false);
      setTestMessage('');
      setAlertSuccess(
        language === 'ar'
          ? `تم استيراد المنشور بنجاح وإنشاء مسودة خبر تحريرية: "${art?.titleAr || 'مسودة جديدة'}"`
          : `Post imported and converted to draft: "${art?.titleEn || 'New Draft'}"`
      );
      loadAllData();
      setActiveTab('drafts');
    } catch (err: any) {
      setAlertError(err.message || 'Import failed');
    } finally {
      setTestIsImporting(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.updateFacebookSettings(fbSettings);
      setAlertSuccess(language === 'ar' ? 'تم حفظ إعدادات غرفة أخبار فيسبوك بنجاح.' : 'Newsroom settings updated.');
    } catch (err: any) {
      setAlertError(err.message || 'Failed saving settings');
    }
  };

  // Instant Toggle for Live Auto-Publish
  const handleToggleAutoPublish = async (newVal: boolean) => {
    const updated = { ...fbSettings, autoPublish: newVal };
    setFbSettings(updated);
    try {
      await dataService.updateFacebookSettings(updated);
      setAlertSuccess(
        newVal
          ? (language === 'ar' ? 'تم تفعيل النشر التلقائي المباشر (Auto-Publish) بنجاح! سيتم نشر الأخبار فورياً للجمهور.' : 'Live Auto-Publish enabled! News will be published directly.')
          : (language === 'ar' ? 'تم تحويل النظام إلى وضع المسودات (تتطلب مراجعة المحرر).' : 'Switched to Draft mode (requires editorial review).')
      );
    } catch (err: any) {
      setAlertError(err.message || 'Failed saving settings');
    }
  };

  // Batch Publish All Drafts
  const handlePublishAllDrafts = () => {
    if (draftsList.length === 0) return;
    const confirmMsg = language === 'ar'
      ? `هل تريد بالتأكيد نشر جميع المسودات المعلقة (${draftsList.length}) فوراً إلى الموقع للجمهور؟`
      : `Publish all ${draftsList.length} pending drafts live now?`;
    if (!window.confirm(confirmMsg)) return;

    draftsList.forEach((d) => {
      dataService.publishArticleDirect(d.id, currentUser || undefined);
    });
    setAlertSuccess(
      language === 'ar'
        ? `تم نشر جميع المسودات المعلقة (${draftsList.length}) على الموقع بنجاح!`
        : `Successfully published all ${draftsList.length} drafts!`
    );
    loadAllData();
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Banner & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {language === 'ar' ? 'غرفة أخبار الذكاء الاصطناعي وفيسبوك' : 'AI Newsroom & Facebook Automation'}
                </h1>
                <p className="text-sm text-slate-300">
                  {language === 'ar'
                    ? 'المزامنة التلقائية ومعالجة أخبار صفحة جوبا نيوز عبر الذكاء الاصطناعي مع نظام المراجعة والاعتماد التحريري'
                    : 'Automated ingestion and AI transformation of Juba News Facebook posts with editorial approval'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {language === 'ar' ? 'متصل بصفحة فيسبوك' : 'Connected to Facebook'}
              </span>
              <a
                href="https://www.facebook.com/share/1UpeZiXU5k/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
              >
                <Share2 className="w-3 h-3" />
                {language === 'ar' ? 'صفحة جوبا نيوز الرسمية' : 'Official Facebook Page'}
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
              <span className="text-slate-400 px-2">|</span>
              <span className="text-slate-300">
                {language === 'ar' ? 'معرف الصفحة:' : 'Page ID:'} <code className="text-amber-300 font-mono">108429588219424</code>
              </span>
              <span className="text-slate-400 px-2">|</span>
              <div className="inline-flex items-center gap-2">
                <span className="text-slate-300">
                  {language === 'ar' ? 'نظام النشر الافتراضي:' : 'Default Publish:'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleAutoPublish(!fbSettings.autoPublish)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition shadow-xs cursor-pointer ${
                    fbSettings.autoPublish
                      ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                  }`}
                  title={language === 'ar' ? 'انقر للتبديل بين النشر التلقائي والمسودة' : 'Click to toggle auto-publish mode'}
                >
                  <span className={`w-2 h-2 rounded-full ${fbSettings.autoPublish ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {fbSettings.autoPublish
                    ? (language === 'ar' ? '✓ نشر تلقائي مباشر (مفعل)' : '✓ Live Auto-Publish (ON)')
                    : (language === 'ar' ? 'مسودة (يتطلب مراجعة المحرر)' : 'Draft (Manual Approval)')}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setTestImportOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 text-blue-400" />
              {language === 'ar' ? 'استيراد منشور يدوي' : 'Import Single Post'}
            </button>
            <button
              onClick={handleSyncFacebookNow}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing
                ? language === 'ar' ? 'جاري المزامنة...' : 'Syncing...'
                : language === 'ar' ? 'مزامنة فيسبوك الآن' : 'Sync Facebook Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alertSuccess && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{alertSuccess}</span>
          </div>
          <button onClick={() => setAlertSuccess(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {alertError && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{alertError}</span>
          </div>
          <button onClick={() => setAlertError(null)} className="text-rose-700 hover:text-rose-900 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 block mb-1">
            {language === 'ar' ? 'حالة الربط' : 'Connection'}
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-base font-bold text-slate-900">
              {language === 'ar' ? 'نشط' : 'Active'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Meta Graph v21.0</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 block mb-1">
            {language === 'ar' ? 'منشورات مستوردة' : 'Imported Posts'}
          </span>
          <span className="text-2xl font-bold text-slate-900">{fbPosts.length}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {language === 'ar' ? 'من فيسبوك' : 'From Facebook'}
          </span>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 shadow-sm">
          <span className="text-xs font-semibold text-amber-700 block mb-1">
            {language === 'ar' ? 'مسودات قيد المراجعة' : 'AI Drafts'}
          </span>
          <span className="text-2xl font-bold text-amber-900">{draftsList.length}</span>
          <span className="text-[11px] text-amber-600 mt-1 block">
            {language === 'ar' ? 'تحتاج قرار المحرر' : 'Awaiting Editor'}
          </span>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80 shadow-sm">
          <span className="text-xs font-semibold text-emerald-700 block mb-1">
            {language === 'ar' ? 'أخبار منشورة' : 'Published News'}
          </span>
          <span className="text-2xl font-bold text-emerald-900">{publishedList.length}</span>
          <span className="text-[11px] text-emerald-600 mt-1 block">
            {language === 'ar' ? 'معروضة على الموقع' : 'Live on site'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 block mb-1">
            {language === 'ar' ? 'فشل الاستيراد' : 'Failed'}
          </span>
          <span className="text-2xl font-bold text-rose-600">{failedPosts.length}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {language === 'ar' ? 'أخطاء معالجة' : 'Errors'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 block mb-1">
            {language === 'ar' ? 'آخر مزامنة' : 'Last Sync'}
          </span>
          <span className="text-xs font-semibold text-slate-800 block truncate">
            {fbStatus?.lastSyncAt ? new Date(fbStatus.lastSyncAt).toLocaleTimeString() : 'قبل قليل'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {language === 'ar' ? 'تحديث تلقائي' : 'Auto sync'}
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('drafts')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'drafts'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          {language === 'ar' ? 'B. مسودات الذكاء الاصطناعي' : 'B. AI Drafts'}
          <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-bold">
            {draftsList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('imports')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'imports'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4 text-blue-600" />
          {language === 'ar' ? 'A. استيرادات فيسبوك' : 'A. Facebook Imports'}
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
            {fbPosts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('published')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'published'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {language === 'ar' ? 'C. الأخبار المنشورة' : 'C. Published News'}
          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800">
            {publishedList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('failed')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'failed'
              ? 'border-rose-600 text-rose-700 bg-rose-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {language === 'ar' ? 'D. الاستيرادات المتعثرة' : 'D. Failed Imports'}
          {failedPosts.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-rose-100 text-rose-800">
              {failedPosts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'logs'
              ? 'border-slate-800 text-slate-900 bg-slate-100/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-slate-600" />
          {language === 'ar' ? 'E. سجلات المزامنة' : 'E. Sync Logs'}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4 text-indigo-600" />
          {language === 'ar' ? 'F. الإعدادات والربط' : 'F. Settings'}
        </button>
      </div>

      {/* SECTION B: AI DRAFTS (EDITORIAL REVIEW WORKFLOW) */}
      {activeTab === 'drafts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {language === 'ar' ? 'المسودات التحريرية قيد المراجعة' : 'Editorial Drafts Pending Review'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'ar'
                  ? 'يتم تحويل منشورات فيسبوك إلى مسودات تلقائياً. قم بمراجعة العناوين والمتن قبل اعتمادها ونشرها.'
                  : 'Facebook posts converted to drafts. Review, edit, approve, or publish them.'}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-slate-500">
                {language === 'ar' ? 'إجمالي المسودات:' : 'Total Drafts:'} <strong>{draftsList.length}</strong>
              </span>
              {draftsList.length > 0 && (
                <button
                  type="button"
                  onClick={handlePublishAllDrafts}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
                  title={language === 'ar' ? 'نشر جميع هذه المسودات فوراً على الموقع' : 'Publish all drafts live now'}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? `نشر الكل فوراً (${draftsList.length})` : `Publish All (${draftsList.length})`}</span>
                </button>
              )}
            </div>
          </div>

          {draftsList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">
                {language === 'ar' ? 'لا توجد مسودات معلقة حالياً' : 'No pending drafts'}
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                {language === 'ar'
                  ? 'انقر على زر "مزامنة فيسبوك الآن" لسحب المنشورات الجديدة من صفحة جوبا نيوز وتحويلها لمسودات.'
                  : 'Click "Sync Facebook Now" to pull latest posts from Juba News page.'}
              </p>
              <button
                onClick={handleSyncFacebookNow}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500"
              >
                <RefreshCw className="w-4 h-4" />
                {language === 'ar' ? 'مزامنة فيسبوك الآن' : 'Sync Facebook Now'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {draftsList.map((art) => (
                <div
                  key={art.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800">
                        <Clock className="w-3.5 h-3.5" />
                        {language === 'ar' ? 'مسودة - تتطلب اعتماد' : 'Draft - Needs Review'}
                      </span>
                      {art.facebookUrl && (
                        <a
                          href={art.facebookUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Share2 className="w-3 h-3" />
                          {language === 'ar' ? 'المنشور الأصلي' : 'Original Post'}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {art.featuredImage && (
                        <img
                          src={art.featuredImage}
                          alt={art.titleAr}
                          referrerPolicy="no-referrer"
                          className="w-24 h-24 object-cover rounded-xl flex-shrink-0 border border-slate-100"
                        />
                      )}
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                          {art.titleAr}
                        </h3>
                        {art.titleEn && (
                          <p className="text-xs text-slate-500 line-clamp-1 italic font-sans">
                            {art.titleEn}
                          </p>
                        )}
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                          {art.subtitleAr || art.contentAr}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {art.categoryNameAr || 'جنوب السودان'}
                      </span>
                      {art.facebookPostId && (
                        <span className="text-[11px] font-mono text-slate-400">
                          ID: {art.facebookPostId.slice(-8)}
                        </span>
                      )}
                      {art.createdAt && (
                        <span className="text-[11px] text-slate-400">
                          {new Date(art.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Editorial Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(art)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        {language === 'ar' ? 'تعديل' : 'Edit'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedArticle(art);
                          setPreviewModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {language === 'ar' ? 'معاينة' : 'Preview'}
                      </button>
                      {art.facebookPostId && (
                        <button
                          onClick={() => handleReprocess(art.facebookPostId!)}
                          title={language === 'ar' ? 'إعادة توليد بواسطة الذكاء الاصطناعي' : 'Regenerate with AI'}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleReject(art.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors"
                      >
                        {language === 'ar' ? 'رفض' : 'Reject'}
                      </button>
                      <button
                        onClick={() => handleApprove(art.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        {language === 'ar' ? 'اعتماد' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handlePublish(art.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
                      >
                        {language === 'ar' ? 'نشر فوري' : 'Publish'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION A: FACEBOOK IMPORTS TABLE */}
      {activeTab === 'imports' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'ar' ? 'جميع منشورات فيسبوك المستوردة' : 'Imported Facebook Posts'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'ar'
                  ? 'سجل المنشورات المسحوبة من الصفحة، وحالة معالجة الذكاء الاصطناعي والحالة التحريرية'
                  : 'Log of posts imported from the page with AI processing and editorial status'}
              </p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={language === 'ar' ? 'بحث في المنشورات...' : 'Search posts...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">{language === 'ar' ? 'المنشور الأصلي' : 'Original Post'}</th>
                  <th className="p-3">{language === 'ar' ? 'العنوان المولد (AI)' : 'Generated Title'}</th>
                  <th className="p-3">{language === 'ar' ? 'تاريخ النشر' : 'Published Date'}</th>
                  <th className="p-3">{language === 'ar' ? 'حالة AI' : 'AI Status'}</th>
                  <th className="p-3">{language === 'ar' ? 'الحالة التحريرية' : 'Editorial Status'}</th>
                  <th className="p-3 text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fbPosts
                  .filter((p) => !searchQuery || p.message.toLowerCase().includes(searchQuery.toLowerCase()) || p.generatedTitle?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((p) => {
                    const linkedArt = p.articleId ? articles.find((a) => a.id === p.articleId) : null;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 max-w-xs">
                          <div className="flex gap-2">
                            {p.mediaUrl && (
                              <img
                                src={p.mediaUrl}
                                alt="Post media"
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 object-cover rounded-lg border border-slate-100 flex-shrink-0"
                              />
                            )}
                            <div>
                              <p className="line-clamp-2 text-slate-800 font-medium text-xs leading-snug">
                                {p.message}
                              </p>
                              <a
                                href={p.facebookUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                              >
                                {p.facebookPostId.slice(-8)}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 max-w-sm">
                          <p className="line-clamp-2 text-slate-900 font-semibold">
                            {p.generatedTitle || (language === 'ar' ? 'قيد التوليد...' : 'Processing...')}
                          </p>
                          {p.generatedSummary && (
                            <p className="line-clamp-1 text-slate-500 text-[11px] mt-0.5">
                              {p.generatedSummary}
                            </p>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap text-slate-500">
                          {new Date(p.publishedAt).toLocaleDateString()}
                          <span className="block text-[10px] text-slate-400">
                            {new Date(p.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {p.processingStatus === 'processed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                              <Check className="w-3 h-3" />
                              {language === 'ar' ? 'تمت المعالجة' : 'Processed'}
                            </span>
                          ) : p.processingStatus === 'ai_processing' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              {language === 'ar' ? 'جاري المعالجة' : 'Processing'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700">
                              <X className="w-3 h-3" />
                              {language === 'ar' ? 'فشل' : 'Failed'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {linkedArt?.status === 'PUBLISHED' || linkedArt?.status === 'published' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              {language === 'ar' ? 'منشور' : 'Published'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                              {language === 'ar' ? 'مسودة' : 'Draft'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap text-right space-x-1 rtl:space-x-reverse">
                          {linkedArt && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(linkedArt, p)}
                                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px]"
                              >
                                {language === 'ar' ? 'تعديل' : 'Edit'}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedArticle(linkedArt);
                                  setPreviewModalOpen(true);
                                }}
                                className="px-2 py-1 rounded text-slate-600 hover:bg-slate-100 text-[11px]"
                              >
                                <Eye className="w-3.5 h-3.5 inline" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleReprocess(p.id)}
                            title={language === 'ar' ? 'إعادة التوليد بواسطة الذكاء الاصطناعي' : 'Reprocess with AI'}
                            className="p-1 rounded text-slate-500 hover:bg-slate-100"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION C: PUBLISHED NEWS FROM FACEBOOK */}
      {activeTab === 'published' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'ar' ? 'الأخبار المنشورة على الموقع من فيسبوك' : 'Published Facebook News'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'ar'
                  ? 'هذه الأخبار معروضة حالياً في الصفحة الرئيسية ومحركات البحث مع رابط المصدر الأصلي لفيسبوك'
                  : 'Articles currently active on the public site and home page'}
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
              {publishedList.length} {language === 'ar' ? 'خبر منشور' : 'Live Articles'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publishedList.map((art) => (
              <div
                key={art.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video bg-slate-100">
                    <img
                      src={art.featuredImage}
                      alt={art.titleAr}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-md">
                      {language === 'ar' ? 'منشور' : 'Live'}
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <span className="text-xs font-semibold text-blue-600 block">
                      {art.categoryNameAr || 'جنوب السودان'}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                      {art.titleAr}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {art.subtitleAr || art.contentAr}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <a
                    href={`/article/${art.slug}`}
                    className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    {language === 'ar' ? 'عرض في الموقع' : 'View on Site'}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(art)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                    >
                      {language === 'ar' ? 'تعديل' : 'Edit'}
                    </button>
                    <button
                      onClick={() => handleReject(art.id)}
                      className="px-2.5 py-1 rounded text-rose-600 hover:bg-rose-50 font-medium"
                    >
                      {language === 'ar' ? 'إلغاء النشر' : 'Unpublish'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION D: FAILED IMPORTS */}
      {activeTab === 'failed' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'ar' ? 'المنشورات المتعثرة وأخطاء المعالجة' : 'Failed Ingestion & AI Errors'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'ar'
                  ? 'المنشورات التي تعذر معالجتها أو حدث خطأ أثناء تحويلها. يمكنك إعادة المحاولة بنقرة واحدة.'
                  : 'Posts that encountered errors during ingestion or AI processing'}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
              {failedPosts.length} {language === 'ar' ? 'أخطاء' : 'Errors'}
            </span>
          </div>

          {failedPosts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">
                {language === 'ar' ? 'رائع! لا توجد أي أخطاء استيراد متعثرة.' : 'No failed imports detected.'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'ar' ? 'جميع منشورات فيسبوك تمت معالجتها بسلاسة وبدون تعارض.' : 'All imports processed cleanly.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {failedPosts.map((p) => (
                <div key={p.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-bold text-rose-900">
                        {p.errorMessage || 'AI Generation Failure'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">ID: {p.facebookPostId}</span>
                    </div>
                    <p className="text-xs text-slate-700 line-clamp-2">{p.message}</p>
                  </div>
                  <button
                    onClick={() => handleReprocess(p.id)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 flex-shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                    {language === 'ar' ? 'إعادة المعالجة' : 'Retry AI'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION E: SYNCHRONIZATION LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'ar' ? 'سجل المزامنة والويب هوك' : 'Synchronization & Webhook Logs'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'ar'
                  ? 'سجل تفصيلي لعمليات مزامنة Graph API واستقبال إشعارات Meta Webhook'
                  : 'History of Webhook triggers and manual Graph API sync runs'}
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {syncLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'PARTIAL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {log.status}
                    </span>
                    <span className="font-semibold text-slate-800">{log.message}</span>
                    <span className="text-[11px] font-mono text-slate-400">[{log.source}]</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500">
                    <span>
                      {language === 'ar' ? 'مستورد:' : 'Imported:'} <strong>{log.importedCount}</strong>
                    </span>
                    <span>
                      {language === 'ar' ? 'مكرر مستبعد:' : 'Skipped:'} <strong>{log.skippedCount}</strong>
                    </span>
                    <span>
                      {language === 'ar' ? 'فشل:' : 'Failed:'} <strong>{log.failedCount}</strong>
                    </span>
                  </div>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION F: SETTINGS & WEBHOOK INSTRUCTIONS */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {language === 'ar' ? 'إعدادات غرفة أخبار فيسبوك والذكاء الاصطناعي' : 'Facebook & AI Newsroom Settings'}
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              {language === 'ar'
                ? 'تخصيص قواعد المعالجة الآلية، لغة الأخبار، وسياسة النشر التحريرية'
                : 'Configure ingestion rules, AI language models, and publishing policy'}
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-5 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {language === 'ar' ? 'معرف الصفحة (Page ID)' : 'Meta Page ID'}
                  </label>
                  <input
                    type="text"
                    value={fbSettings.metaPageId}
                    onChange={(e) => setFbSettings({ ...fbSettings, metaPageId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {language === 'ar' ? 'اسم الصفحة' : 'Page Name'}
                  </label>
                  <input
                    type="text"
                    value={fbSettings.metaPageName}
                    onChange={(e) => setFbSettings({ ...fbSettings, metaPageName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              {/* Editorial Auto Publish Master Control Card */}
              <div className={`p-5 rounded-2xl border transition-all ${
                fbSettings.autoPublish 
                  ? 'border-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/30 dark:border-emerald-700 shadow-xs' 
                  : 'border-amber-300 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-700'
              }`}>
                {/* Header with Title & Main Switch */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      fbSettings.autoPublish
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-amber-500 text-white'
                    }`}>
                      {fbSettings.autoPublish ? <Zap className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-base text-slate-900 dark:text-white">
                          {language === 'ar' ? 'النشر التلقائي المباشر (Auto-Publish)' : 'Automatic Live Publishing'}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          fbSettings.autoPublish
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300'
                        }`}>
                          {fbSettings.autoPublish ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{language === 'ar' ? 'مفعل الآن (نشر فوري)' : 'Active (Live Publishing)'}</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>{language === 'ar' ? 'معطل (وضع المسودة)' : 'Disabled (Draft Mode)'}</span>
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {fbSettings.autoPublish
                          ? (language === 'ar'
                              ? 'النشر التلقائي مُفعّل: يتم نشر الأخبار والمنشورات فورياً ومباشرة على موقع جوبا نيوز للجمهور بمجرد استيرادها ومعالجتها آلياً بالذكاء الاصطناعي.'
                              : 'Auto-publish is enabled: All processed news items are published live directly to the website without manual review.')
                          : (language === 'ar'
                              ? 'وضع المسودات: تبقى الأخبار كمسودات بانتظار مراجعة واعتماد المحرر قبل ظهورها للجمهور.'
                              : 'Draft mode: News stays in draft mode requiring editorial approval before going live.')}
                      </p>
                    </div>
                  </div>

                  {/* Guaranteed Visible & Clickable Toggle Switch */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={fbSettings.autoPublish}
                      onClick={() => handleToggleAutoPublish(!fbSettings.autoPublish)}
                      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                        fbSettings.autoPublish ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      title={language === 'ar' ? 'تبديل النشر التلقائي' : 'Toggle Auto-Publish'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          fbSettings.autoPublish
                            ? (isRTL ? '-translate-x-6' : 'translate-x-6')
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Two Large Interactive Mode Selector Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                  {/* Option 1: Auto-Publish Live */}
                  <div
                    onClick={() => handleToggleAutoPublish(true)}
                    className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-start gap-3 ${
                      fbSettings.autoPublish
                        ? 'bg-emerald-100/90 border-emerald-600 text-emerald-950 dark:bg-emerald-950/60 dark:border-emerald-500 dark:text-emerald-100 shadow-xs ring-1 ring-emerald-600'
                        : 'bg-white/80 border-slate-200 hover:border-emerald-400 text-slate-700 dark:bg-slate-900/50 dark:border-slate-800'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${
                      fbSettings.autoPublish ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {language === 'ar' ? '1. النشر التلقائي المباشر (Auto-Publish)' : '1. Live Auto-Publishing'}
                        </span>
                        {fbSettings.autoPublish && (
                          <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">
                            {language === 'ar' ? '✓ مُفعّل الآن' : '✓ Active'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        {language === 'ar'
                          ? 'نشر فوري ومباشر على الموقع بمجرد المعالجة'
                          : 'Immediate live publication upon ingestion'}
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Drafts & Editorial Review */}
                  <div
                    onClick={() => handleToggleAutoPublish(false)}
                    className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-start gap-3 ${
                      !fbSettings.autoPublish
                        ? 'bg-amber-100/90 border-amber-600 text-amber-950 dark:bg-amber-950/60 dark:border-amber-500 dark:text-amber-100 shadow-xs ring-1 ring-amber-600'
                        : 'bg-white/80 border-slate-200 hover:border-amber-400 text-slate-700 dark:bg-slate-900/50 dark:border-slate-800'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${
                      !fbSettings.autoPublish ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {language === 'ar' ? '2. مسودة ومراجعة يدوية (Draft Mode)' : '2. Draft Mode & Review'}
                        </span>
                        {!fbSettings.autoPublish && (
                          <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300">
                            {language === 'ar' ? '✓ مُفعّل الآن' : '✓ Active'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        {language === 'ar'
                          ? 'تبقى الأخبار كمسودات بانتظار موافقة المحرر'
                          : 'Requires manual review before publication'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {language === 'ar' ? 'لغة التوليد التحريري' : 'AI Output Language'}
                  </label>
                  <select
                    value={fbSettings.aiLanguage}
                    onChange={(e) => setFbSettings({ ...fbSettings, aiLanguage: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
                  >
                    <option value="both">{language === 'ar' ? 'عربي وإنجليزي معاً (ثنائي اللغة)' : 'Bilingual (Arabic & English)'}</option>
                    <option value="ar">{language === 'ar' ? 'عربي فقط' : 'Arabic Only'}</option>
                    <option value="en">{language === 'ar' ? 'إنجليزي فقط' : 'English Only'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {language === 'ar' ? 'الأسلوب الصحفي' : 'Journalistic Style'}
                  </label>
                  <select
                    value={fbSettings.articleStyle}
                    onChange={(e) => setFbSettings({ ...fbSettings, articleStyle: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
                  >
                    <option value="formal">{language === 'ar' ? 'صحفي رسمي رصين (Formal News)' : 'Formal Journalistic'}</option>
                    <option value="concise">{language === 'ar' ? 'موجز وسريع (Concise Dispatch)' : 'Concise Dispatch'}</option>
                    <option value="detailed">{language === 'ar' ? 'تقرير تحليلي موسع (In-Depth Analysis)' : 'In-Depth Analysis'}</option>
                  </select>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 shadow-md transition-colors"
                >
                  {language === 'ar' ? 'حفظ إعدادات الغرفة' : 'Save Newsroom Settings'}
                </button>
              </div>
            </form>
          </div>

          {/* Webhook Connection Guide Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-4 shadow-sm text-xs">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {language === 'ar' ? 'بيانات ربط Meta Webhook' : 'Meta Webhook Endpoint Info'}
            </h3>
            <p className="text-slate-300 leading-relaxed">
              {language === 'ar'
                ? 'استخدم هذه البيانات في بوابة Meta for Developers لربط إشعارات Webhook للصفحة تلقائياً وبشكل فوري:'
                : 'Configure these credentials in the Meta for Developers Webhook portal:'}
            </p>

            <div className="space-y-3">
              <div>
                <span className="text-slate-400 block mb-1">Webhook Callback URL:</span>
                <div className="flex items-center gap-1 bg-slate-800 p-2 rounded-lg font-mono text-[11px] text-blue-300 border border-slate-700">
                  <span className="truncate">https://.../api/webhooks/facebook</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(window.location.origin + '/api/webhooks/facebook')}
                    title="Copy"
                    className="p-1 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Verify Token (رمز التحقق):</span>
                <div className="flex items-center gap-1 bg-slate-800 p-2 rounded-lg font-mono text-[11px] text-amber-300 border border-slate-700">
                  <span>juba_news_meta_verify_token_2026</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText('juba_news_meta_verify_token_2026')}
                    title="Copy"
                    className="p-1 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Subscription Field:</span>
                <div className="bg-slate-800 p-2 rounded-lg font-mono text-[11px] text-emerald-300 border border-slate-700">
                  Page &gt; feed (add)
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              {language === 'ar'
                ? 'حماية كاملة من التكرار عبر التحقق الصارم من معرف المنشور في قاعدة البيانات.'
                : 'Guaranteed deduplication via database post ID unique constraints.'}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL SYNC SUMMARY REPORT */}
      {syncModalOpen && syncResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {language === 'ar' ? 'تقرير المزامنة مع فيسبوك' : 'Facebook Sync Summary Report'}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <button onClick={() => setSyncModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sync Counters Grid */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl">
                <span className="text-xs text-blue-700 block font-medium">
                  {language === 'ar' ? 'منشورات جديدة مستوردة' : 'Imported'}
                </span>
                <span className="text-2xl font-black text-blue-900">{syncResult.importedCount}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <span className="text-xs text-slate-600 block font-medium">
                  {language === 'ar' ? 'مكررات تم تخطيها' : 'Skipped Duplicates'}
                </span>
                <span className="text-2xl font-black text-slate-700">{syncResult.skippedCount}</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl">
                <span className="text-xs text-amber-700 block font-medium">
                  {language === 'ar' ? 'مسودات AI جديدة' : 'AI Drafts Created'}
                </span>
                <span className="text-2xl font-black text-amber-900">{syncResult.draftsCreated}</span>
              </div>
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl">
                <span className="text-xs text-rose-700 block font-medium">
                  {language === 'ar' ? 'أخطاء / متعثر' : 'Failed'}
                </span>
                <span className="text-2xl font-black text-rose-800">{syncResult.failedCount}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">
                {language === 'ar' ? 'تفاصيل المنشورات التي تمت معالجتها:' : 'Processed Posts Details:'}
              </span>
              <div className="max-h-40 overflow-y-auto space-y-1.5 divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 text-xs">
                {syncResult.posts.map((p, idx) => (
                  <div key={idx} className="pt-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-800 font-medium truncate max-w-[280px]">
                      {p.title || `Post ${p.id.slice(-6)}`}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                        p.status === 'imported'
                          ? 'bg-blue-100 text-blue-800'
                          : p.status === 'skipped_duplicate'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSyncModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500"
              >
                {language === 'ar' ? 'إغلاق ومتابعة المراجعة' : 'Close & Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITORIAL DRAFT EDIT MODAL */}
      {editModalOpen && selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {language === 'ar' ? 'تحرير ومراجعة المسودة الإخبارية' : 'Edit & Polish AI Draft'}
                </h3>
                <span className="text-xs text-slate-500">
                  {language === 'ar' ? 'المصدر: صفحة جوبا نيوز على فيسبوك' : 'Source: Juba News Facebook'}
                </span>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'ar' ? 'العنوان الرئيسي بالعربية' : 'Arabic Headline'}
                </label>
                <input
                  type="text"
                  value={editTitleAr}
                  onChange={(e) => setEditTitleAr(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'ar' ? 'العنوان بالإنجليزية' : 'English Headline'}
                </label>
                <input
                  type="text"
                  value={editTitleEn}
                  onChange={(e) => setEditTitleEn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-sans focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'ar' ? 'القسم / التصنيف' : 'Category'}
                  </label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {language === 'ar' ? c.nameAr : c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'ar' ? 'رابط الصورة البارزة' : 'Featured Image URL'}
                  </label>
                  <input
                    type="text"
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'ar' ? 'متن الخبر الصحفي (عربي)' : 'News Body (Arabic)'}
                </label>
                <textarea
                  rows={6}
                  value={editContentAr}
                  onChange={(e) => setEditContentAr(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SEO Title</label>
                  <input
                    type="text"
                    value={editSeoTitle}
                    onChange={(e) => setEditSeoTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SEO Description</label>
                  <input
                    type="text"
                    value={editSeoDesc}
                    onChange={(e) => setEditSeoDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handlePublish(selectedArticle.id);
                    setEditModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
                >
                  {language === 'ar' ? 'اعتماد ونشر مباشر' : 'Approve & Publish'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm"
                >
                  {language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW MODAL */}
      {previewModalOpen && selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {language === 'ar' ? 'معاينة الخبر قبل النشر' : 'Article Preview'}
              </span>
              <button onClick={() => setPreviewModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100">
                <img
                  src={selectedArticle.featuredImage}
                  alt={selectedArticle.titleAr}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                  {selectedArticle.categoryNameAr || 'جنوب السودان'}
                </span>
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                  {selectedArticle.titleAr}
                </h1>
                {selectedArticle.titleEn && (
                  <h2 className="text-sm font-medium text-slate-500 italic">
                    {selectedArticle.titleEn}
                  </h2>
                )}
                <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>المصدر: صفحة جوبا نيوز الرسمية على فيسبوك</span>
                  <span>•</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <div className="text-sm text-slate-800 leading-relaxed space-y-3 whitespace-pre-line border-t border-slate-100 pt-4">
                {selectedArticle.contentAr}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
              >
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEdit(selectedArticle);
                    setPreviewModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </button>
                <button
                  onClick={() => {
                    handlePublish(selectedArticle.id);
                    setPreviewModalOpen(false);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
                >
                  {language === 'ar' ? 'نشر فوري في الموقع' : 'Publish Live'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL POST TEST IMPORT */}
      {testImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {language === 'ar' ? 'استيراد منشور فيسبوك مخصص' : 'Import Custom Facebook Post'}
              </h3>
              <button onClick={() => setTestImportOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTestImportSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'ar' ? 'نص منشور فيسبوك *' : 'Post Content / Text *'}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={language === 'ar' ? 'الصق نص المنشور من صفحة فيسبوك هنا...' : 'Paste Facebook post text here...'}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 leading-relaxed"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'ar' ? 'رابط المنشور الأصلي' : 'Post Permalink'}
                </label>
                <input
                  type="url"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'ar' ? 'رابط الصورة المرفقة (اختياري)' : 'Attached Image URL (Optional)'}
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={testImageUrl}
                  onChange={(e) => setTestImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTestImportOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={testIsImporting}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 disabled:opacity-50"
                >
                  {testIsImporting
                    ? language === 'ar' ? 'جاري التحويل والتحرير...' : 'Processing with AI...'
                    : language === 'ar' ? 'استيراد وتحويل لمسودة' : 'Import to Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
