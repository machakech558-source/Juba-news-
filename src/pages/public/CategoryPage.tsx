import React, { useState, useEffect } from 'react';
import { ArticleCard } from '../../components/public/ArticleCard';
import { SEOHead } from '../../components/common/SEOHead';
import { dataService } from '../../services/dataService';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useRouter } from '../../contexts/RouterContext';
import { Filter, ArrowUpDown } from 'lucide-react';
import type { Article, Category } from '../../types';

interface CategoryPageProps {
  slug: string;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ slug }) => {
  const { language, t } = useThemeLanguage();
  const { navigate } = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'views'>('newest');

  useEffect(() => {
    const cats = dataService.getCategories();
    const found = cats.find((c) => c.slug === slug);
    if (found) {
      setCategory(found);
      const catArticles = dataService.getArticlesByCategory(slug);
      setArticles(catArticles);
    } else {
      setCategory(null);
    }
  }, [slug]);

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold font-editorial mb-4">
          {language === 'ar' ? 'القسم غير متوفر' : 'Category Not Found'}
        </h2>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-red-700 text-white rounded-lg text-xs font-bold hover:bg-red-800 transition"
        >
          {language === 'ar' ? 'الرئيسية' : 'Back to Home'}
        </button>
      </div>
    );
  }

  const categoryName = language === 'ar' ? category.nameAr : category.nameEn;
  const description = language === 'ar' ? category.descriptionAr : category.descriptionEn;

  const sortedArticles = [...articles].sort((a, b) => {
    if (sortBy === 'views') return b.views - a.views;
    return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
      <SEOHead 
        title={categoryName}
        description={description}
      />

      {/* Category Header */}
      <div className="border-b-2 border-stone-900 dark:border-stone-100 pb-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-8 bg-red-600 rounded-xs"></span>
              <h1 className="text-3xl sm:text-4xl font-black font-editorial tracking-tight uppercase">
                {categoryName}
              </h1>
            </div>
            {description && (
              <p className="text-sm text-stone-600 dark:text-stone-300 max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Sorting Control */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500 flex items-center gap-1 font-medium">
              <ArrowUpDown className="w-3.5 h-3.5" />
              {t('sortBy')}:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'views')}
              className="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:outline-none"
            >
              <option value="newest">{t('newestFirst')}</option>
              <option value="views">{t('mostViewed')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      {sortedArticles.length === 0 ? (
        <div className="py-16 text-center text-stone-500 text-sm">
          {language === 'ar' ? 'لا توجد مقالات منشورة حالياً في هذا القسم.' : 'No published articles found in this category.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedArticles.map((art) => (
            <ArticleCard key={art.id} article={art} variant="standard" showCategory={false} />
          ))}
        </div>
      )}
    </div>
  );
};
