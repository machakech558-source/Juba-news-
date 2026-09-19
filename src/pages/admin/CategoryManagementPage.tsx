import React, { useState, useEffect } from 'react';
import { FolderTree, Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { dataService } from '../../services/dataService';
import type { Category } from '../../types';

export const CategoryManagementPage: React.FC = () => {
  const { currentUser, isSuperAdmin } = useAuth();
  const { language, t } = useThemeLanguage();

  const [categories, setCategories] = useState<Category[]>([]);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [slug, setSlug] = useState('');
  const [descEn, setDescEn] = useState('');

  useEffect(() => {
    setCategories(dataService.getCategories());
  }, []);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !currentUser) return;

    const newSlug = slug.trim() || nameEn.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      slug: newSlug,
      nameEn: nameEn.trim(),
      nameAr: nameAr.trim() || nameEn.trim(),
      descriptionEn: descEn.trim(),
      descriptionAr: descEn.trim(),
      order: categories.length + 1,
      enabled: true,
    };

    const updated = [...categories, newCat];
    setCategories(updated);
    setNameEn('');
    setNameAr('');
    setSlug('');
    setDescEn('');
  };

  const handleToggle = (cat: Category) => {
    const updated = categories.map((c) => (c.id === cat.id ? { ...c, enabled: !c.enabled } : c));
    setCategories(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black font-editorial text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <FolderTree className="w-6 h-6 text-red-600" />
          <span>{language === 'ar' ? 'إدارة أقسام الموقع والملفات' : 'News Desk & Category Taxonomy'}</span>
        </h1>
        <p className="text-xs text-stone-500">
          {language === 'ar' ? 'تهيئة الأقسام الرئيسية وتصنيفات التغطية الإخبارية.' : 'Configure primary news desks, slugs, and navigation bar hierarchy.'}
        </p>
      </div>

      {/* Add Category Form */}
      <form onSubmit={handleAddCategory} className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-red-600" />
          <span>Create New News Section</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
              Category Name (English) *
            </label>
            <input
              type="text"
              required
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Investigation"
              className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
            />
          </div>

          <div dir="rtl">
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
              اسم القسم (بالعربية) *
            </label>
            <input
              type="text"
              required
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="مثال: تحقيقات استقصائية"
              className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
              URL Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. investigations"
              className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            Add Category
          </button>
        </div>
      </form>

      {/* Categories List */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4 text-start">Order</th>
                <th className="py-3 px-4 text-start">English Name</th>
                <th className="py-3 px-4 text-start">Arabic Name</th>
                <th className="py-3 px-4 text-start">Slug</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-end">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
              {categories.map((c, index) => (
                <tr key={c.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                  <td className="py-3 px-4 font-mono text-stone-400">{index + 1}</td>
                  <td className="py-3 px-4 font-bold text-stone-900 dark:text-stone-100">{c.nameEn}</td>
                  <td className="py-3 px-4 text-stone-800 dark:text-stone-200 font-sans">{c.nameAr}</td>
                  <td className="py-3 px-4 font-mono text-stone-500 text-[11px]">/{c.slug}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      c.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                    }`}>
                      {c.enabled ? 'ACTIVE' : 'HIDDEN'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-end">
                    <button
                      onClick={() => handleToggle(c)}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200"
                    >
                      {c.enabled ? 'Hide' : 'Show'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
