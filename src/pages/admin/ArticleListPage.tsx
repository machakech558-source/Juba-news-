import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useRouter } from '../../contexts/RouterContext';
import { dataService } from '../../services/dataService';
import type { Article, ArticleStatus, Category } from '../../types';

export const ArticleListPage: React.FC = () => {
  const { currentUser, role, isSuperAdmin, canPublish } = useAuth();
  const { language, t } = useThemeLanguage();
  const { navigate } = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = dataService.subscribeArticles((data) => {
      setArticles(data);
    });
    setCategories(dataService.getCategories());
    return () => unsub();
  }, []);

  const filteredArticles = articles.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && a.categorySlug !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = a.titleEn.toLowerCase().includes(q) || a.titleAr.includes(q) || a.authorName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleTogglePublish = (article: Article) => {
    if (!currentUser) return;
    const newStatus: ArticleStatus = article.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    dataService.updateArticle(article.id, {
      status: newStatus,
      publishedAt: newStatus === 'PUBLISHED' ? new Date().toISOString() : article.publishedAt,
    }, currentUser);
  };

  const handleDuplicate = (article: Article) => {
    if (!currentUser) return;
    dataService.createArticle({
      titleEn: `${article.titleEn} (Copy)`,
      titleAr: `${article.titleAr} (نسخة)`,
      slug: `${article.slug}-copy-${Date.now()}`,
      subtitleEn: article.subtitleEn,
      subtitleAr: article.subtitleAr,
      contentEn: article.contentEn,
      contentAr: article.contentAr,
      excerptEn: article.excerptEn,
      excerptAr: article.excerptAr,
      featuredImage: article.featuredImage,
      imageCaptionEn: article.imageCaptionEn,
      imageCaptionAr: article.imageCaptionAr,
      categoryId: article.categoryId,
      categorySlug: article.categorySlug,
      categoryNameEn: article.categoryNameEn,
      categoryNameAr: article.categoryNameAr,
      authorId: currentUser.id,
      authorName: currentUser.displayName,
      authorRole: currentUser.role,
      authorAvatar: currentUser.avatarUrl,
      tags: [...article.tags],
      location: article.location,
      status: 'DRAFT',
      featured: false,
      breaking: false,
      readingTimeMinutes: article.readingTimeMinutes,
    }, currentUser);
  };

  const handleDelete = (id: string) => {
    if (!currentUser) return;
    dataService.deleteArticle(id, currentUser);
    setDeleteConfirmId(null);
  };

  const getStatusBadge = (status: ArticleStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">PUBLISHED</span>;
      case 'PENDING_REVIEW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">REVIEW</span>;
      case 'APPROVED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">APPROVED</span>;
      case 'SCHEDULED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">SCHEDULED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300">DRAFT</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-editorial text-stone-900 dark:text-stone-100">
            {language === 'ar' ? 'إدارة الأخبار والمقالات' : 'Article Management'}
          </h1>
          <p className="text-xs text-stone-500">
            {language === 'ar' ? 'تحرير ونشر واعتماد المواد الإخبارية وفق مسار العمل التحريري.' : 'Review, compose, verify, and publish news dispatches across all desks.'}
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/articles/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ar' ? 'كتابة خبر جديد' : 'Compose Article'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'ar' ? 'ابحث بالعنوان أو الكاتب...' : 'Search by headline, author...'}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:border-red-600"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 absolute top-2.5 left-3" />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:outline-none"
          >
            <option value="ALL">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="SCHEDULED">Scheduled</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:outline-none"
          >
            <option value="ALL">{language === 'ar' ? 'جميع الأقسام' : 'All Categories'}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {language === 'ar' ? c.nameAr : c.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 text-start">Article</th>
                <th className="py-3 px-3 text-start">Category</th>
                <th className="py-3 px-3 text-start">Author</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Views</th>
                <th className="py-3 px-3 text-center">Date</th>
                <th className="py-3 px-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    No articles found matching query.
                  </td>
                </tr>
              ) : (
                filteredArticles.map((art) => {
                  const title = language === 'ar' ? art.titleAr : art.titleEn;
                  const dateFormatted = new Date(art.publishedAt || art.createdAt).toLocaleDateString();

                  return (
                    <tr key={art.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition">
                      <td className="py-3 px-4 min-w-[280px]">
                        <div className="flex items-center gap-3">
                          <img
                            src={art.featuredImage}
                            alt=""
                            className="w-12 h-10 object-cover rounded-md shrink-0 bg-stone-200 dark:bg-stone-800"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-stone-900 dark:text-stone-100 line-clamp-1 hover:text-red-600 cursor-pointer"
                               onClick={() => navigate(`/article/${art.slug}`)}>
                              {title}
                            </p>
                            <span className="text-[10px] text-stone-400 truncate block">
                              /{art.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">
                          {art.categoryNameEn}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-stone-600 dark:text-stone-400">
                        {art.authorName}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(art.status)}
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-stone-600 dark:text-stone-400">
                        {art.views}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap text-stone-500 text-[11px]">
                        {dateFormatted}
                      </td>

                      <td className="py-3 px-4 text-end whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View public */}
                          <button
                            onClick={() => navigate(`/article/${art.slug}`)}
                            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
                            title="View Public Article"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => navigate(`/admin/articles/${art.id}/edit`)}
                            className="p-1 text-stone-600 dark:text-stone-300 hover:text-red-600 transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Duplicate */}
                          <button
                            onClick={() => handleDuplicate(art)}
                            className="p-1 text-stone-400 hover:text-stone-600 transition"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Quick Publish/Unpublish toggle if authorized */}
                          {canPublish && (
                            <button
                              onClick={() => handleTogglePublish(art)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                art.status === 'PUBLISHED'
                                  ? 'bg-stone-200 hover:bg-stone-300 text-stone-800'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {art.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                            </button>
                          )}

                          {/* Delete (Confirmation required) */}
                          {isSuperAdmin && (
                            <button
                              onClick={() => setDeleteConfirmId(art.id)}
                              className="p-1 text-stone-400 hover:text-red-600 transition"
                              title="Delete permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog for Delete */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 max-w-sm w-full border border-stone-200 dark:border-stone-800 shadow-2xl">
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 mb-2">
              {language === 'ar' ? 'تأكيد الحذف النهائي' : 'Confirm Permanent Deletion'}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
              {language === 'ar'
                ? 'هل أنت متأكد من حذف هذا الخبر نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to permanently delete this news dispatch? This action cannot be undone.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
