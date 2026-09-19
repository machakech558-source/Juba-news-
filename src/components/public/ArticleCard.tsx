import React from 'react';
import { Clock, MessageSquare, Eye, User } from 'lucide-react';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useRouter } from '../../contexts/RouterContext';
import { getArticleReadingTimeDisplay } from '../../utils/readingTime';
import type { Article } from '../../types';

interface ArticleCardProps {
  article: Article;
  variant?: 'standard' | 'compact' | 'horizontal';
  showCategory?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ 
  article, 
  variant = 'standard',
  showCategory = true,
}) => {
  const { language, t } = useThemeLanguage();
  const { navigate } = useRouter();

  const title = language === 'ar' ? article.titleAr : article.titleEn;
  const excerpt = language === 'ar' ? article.excerptAr : article.excerptEn;
  const categoryName = language === 'ar' ? article.categoryNameAr : article.categoryNameEn;
  const readingTimeText = getArticleReadingTimeDisplay(article, language);

  const formattedDate = article.publishedAt
    ? new Intl.DateTimeFormat(language === 'ar' ? 'ar-SS' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(article.publishedAt))
    : '';

  const handleClick = () => {
    navigate(`/article/${article.slug}`);
  };

  if (variant === 'compact') {
    return (
      <article 
        onClick={handleClick}
        className="group flex gap-3 py-3 border-b border-stone-800 cursor-pointer"
      >
        <div className="w-20 h-20 sm:w-24 sm:h-20 shrink-0 overflow-hidden rounded bg-stone-800">
          <img
            src={article.featuredImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="flex-1 flex flex-col justify-between min-w-0">
          {showCategory && (
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">
              {categoryName}
            </span>
          )}
          <h4 className="text-xs sm:text-sm font-bold text-stone-100 line-clamp-2 group-hover:text-red-400 transition leading-snug">
            {title}
          </h4>
          <div className="flex items-center gap-2 text-[11px] text-stone-400">
            <span>{formattedDate}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-red-500" />
              <span>{readingTimeText}</span>
            </span>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'horizontal') {
    return (
      <article 
        onClick={handleClick}
        className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-stone-900 border border-stone-800 hover:border-red-600/40 shadow-xs hover:shadow-md transition cursor-pointer"
      >
        <div className="sm:w-1/3 aspect-video sm:aspect-auto overflow-hidden rounded-lg bg-stone-800">
          <img
            src={article.featuredImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="sm:w-2/3 flex flex-col justify-between">
          <div>
            {showCategory && (
              <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-red-950/50 text-red-400 mb-2">
                {categoryName}
              </span>
            )}
            <h3 className="text-base sm:text-lg font-bold text-stone-100 group-hover:text-red-400 transition mb-2 font-editorial leading-snug">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 line-clamp-2 leading-relaxed">
              {excerpt}
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-stone-800/60 mt-3 text-xs text-stone-400">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-stone-300">{article.authorName}</span>
              <span>•</span>
              <span>{formattedDate}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-stone-300">
                <Clock className="w-3 h-3 text-red-500" />
                <span>{readingTimeText}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {article.views}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                {article.commentCount}
              </span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Standard Card
  return (
    <article 
      onClick={handleClick}
      className="group flex flex-col h-full bg-stone-900 rounded-xl overflow-hidden border border-stone-800 hover:border-stone-700 hover:shadow-md transition cursor-pointer"
    >
      <div className="aspect-[16/10] overflow-hidden bg-stone-800 relative">
        <img
          src={article.featuredImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {article.breaking && (
          <span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
            {t('breakingNews')}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {showCategory && (
            <span className="text-xs font-bold uppercase tracking-wider text-red-400 block mb-1.5">
              {categoryName}
            </span>
          )}
          <h3 className="text-base font-bold text-stone-100 group-hover:text-red-400 transition leading-snug font-editorial mb-2">
            {title}
          </h3>
          <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed mb-4">
            {excerpt}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-stone-400 pt-3 border-t border-stone-800">
          <span className="truncate max-w-[130px] font-medium text-stone-300">
            {article.authorName}
          </span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-red-500" />
            <span>{readingTimeText}</span>
          </div>
        </div>
      </div>
    </article>
  );
};
