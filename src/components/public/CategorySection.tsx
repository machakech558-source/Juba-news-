import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { ArticleCard } from './ArticleCard';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useRouter } from '../../contexts/RouterContext';
import type { Article, Category } from '../../types';

interface CategorySectionProps {
  category: Category;
  articles: Article[];
  variant?: 'grid' | 'lead-plus-compact';
}

export const CategorySection: React.FC<CategorySectionProps> = ({ 
  category, 
  articles,
  variant = 'grid'
}) => {
  const { language, isRTL, t } = useThemeLanguage();
  const { navigate } = useRouter();

  if (articles.length === 0) return null;

  const categoryName = language === 'ar' ? category.nameAr : category.nameEn;

  return (
    <section className="my-8 sm:my-12">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-2 border-stone-200 dark:border-stone-800 pb-2.5 mb-6">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-6 bg-red-600 rounded-xs"></span>
          <h2 className="text-xl sm:text-2xl font-extrabold font-editorial tracking-tight text-stone-900 dark:text-stone-100">
            {categoryName}
          </h2>
        </div>

        <button
          onClick={() => navigate(`/${category.slug}`)}
          className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 transition uppercase tracking-wider"
        >
          <span>{t('viewAll')}</span>
          {isRTL ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Articles Presentation */}
      {variant === 'lead-plus-compact' && articles.length >= 3 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <ArticleCard article={articles[0]} variant="standard" showCategory={false} />
          </div>
          <div className="lg:col-span-5 flex flex-col justify-between">
            {articles.slice(1, 4).map((art) => (
              <ArticleCard key={art.id} article={art} variant="compact" showCategory={false} />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.slice(0, 3).map((art) => (
            <ArticleCard key={art.id} article={art} variant="standard" showCategory={false} />
          ))}
        </div>
      )}
    </section>
  );
};
