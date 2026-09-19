import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  Calendar, 
  User, 
  Eye, 
  MessageSquare, 
  ArrowLeft, 
  ArrowRight, 
  Tag as TagIcon,
  MapPin,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import { SocialShare } from '../../components/public/SocialShare';
import { CommentSection } from '../../components/public/CommentSection';
import { ArticleCard } from '../../components/public/ArticleCard';
import { dataService } from '../../services/dataService';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useRouter } from '../../contexts/RouterContext';
import { getArticleReadingTimeDisplay, getArticleWordCount } from '../../utils/readingTime';
import type { Article } from '../../types';

interface ArticlePageProps {
  slug: string;
}

export const ArticlePage: React.FC<ArticlePageProps> = ({ slug }) => {
  const { language, isRTL, t } = useThemeLanguage();
  const { navigate } = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);

  useEffect(() => {
    const art = dataService.getArticleBySlug(slug);
    if (art) {
      setArticle(art);
      dataService.incrementArticleViews(slug);

      // Find related articles in the same category
      const related = dataService
        .getArticlesByCategory(art.categorySlug)
        .filter((a) => a.id !== art.id)
        .slice(0, 3);
      setRelatedArticles(related);
    } else {
      setArticle(null);
    }
  }, [slug]);

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold font-editorial mb-4">
          {language === 'ar' ? 'عذراً، لم يتم العثور على المقال' : 'Article Not Found'}
        </h2>
        <p className="text-stone-500 text-sm mb-6">
          {language === 'ar' ? 'ربما تم نقل هذا الخبر أو حذفه من قبل هيئة التحرير.' : 'The requested news story could not be found or has been relocated.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-red-700 text-white rounded-lg text-xs font-bold hover:bg-red-800 transition"
        >
          {language === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Return to Homepage'}
        </button>
      </div>
    );
  }

  const title = language === 'ar' ? article.titleAr : article.titleEn;
  const subtitle = language === 'ar' ? article.subtitleAr : article.subtitleEn;
  const content = language === 'ar' ? article.contentAr : article.contentEn;
  const caption = language === 'ar' ? article.imageCaptionAr : article.imageCaptionEn;
  const categoryName = language === 'ar' ? article.categoryNameAr : article.categoryNameEn;

  const pubDate = article.publishedAt
    ? new Intl.DateTimeFormat(language === 'ar' ? 'ar-SS' : 'en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(article.publishedAt))
    : '';

  const updDate = article.updatedAt
    ? new Intl.DateTimeFormat(language === 'ar' ? 'ar-SS' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(article.updatedAt))
    : null;

  return (
    <article className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <SEOHead 
        title={title}
        description={article.excerptEn || article.excerptAr}
        article={article}
        ogImage={article.featuredImage}
      />

      {/* Top Breadcrumb & Category */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 text-xs">
          <button 
            onClick={() => navigate('/')}
            className="text-stone-500 hover:text-red-600 transition"
          >
            {language === 'ar' ? 'الرئيسية' : 'Home'}
          </button>
          <span className="text-stone-400">/</span>
          <button
            onClick={() => navigate(`/${article.categorySlug}`)}
            className="font-bold text-red-600 dark:text-red-400 hover:underline uppercase tracking-wider"
          >
            {categoryName}
          </button>
        </div>

        {article.location && (
          <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
            <MapPin className="w-3.5 h-3.5 text-red-600" />
            <span>{article.location}</span>
          </div>
        )}
      </div>

      {/* Headline & Subtitle */}
      <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black font-editorial text-stone-50 tracking-tight leading-tight mb-4">
        {title}
      </h1>

      {subtitle && (
        <p className="text-base sm:text-xl text-stone-300 font-medium leading-relaxed mb-6">
          {subtitle}
        </p>
      )}

      {/* Author & Publishing Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-3.5 border-y border-stone-800 text-xs text-stone-400 mb-6">
        <div className="flex items-center gap-3">
          <img
            src={article.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt={article.authorName}
            className="w-10 h-10 rounded-full object-cover border border-stone-700"
          />
          <div>
            <span className="font-bold text-stone-100 block text-sm">
              {article.authorName}
            </span>
            <span className="text-[11px] text-stone-400">
              {article.authorRole}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{pubDate}</span>
          </div>
          <div className="flex items-center gap-1.5" title={language === 'ar' ? `عدد الكلمات: ${getArticleWordCount(article, language)} كلمة تقريباً` : `Word count: ~${getArticleWordCount(article, language)} words`}>
            <Clock className="w-3.5 h-3.5 text-red-500" />
            <span className="font-semibold text-stone-200">
              {getArticleReadingTimeDisplay(article, language)}
            </span>
            {getArticleWordCount(article, language) > 0 && (
              <span className="text-[11px] text-stone-400 font-medium">
                ({getArticleWordCount(article, language)} {language === 'ar' ? 'كلمة' : 'words'})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>{article.views} {t('views')}</span>
          </div>
        </div>
      </div>

      {/* Featured Image and Caption */}
      <div className="mb-8 rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 shadow-sm">
        <img
          src={article.featuredImage}
          alt={title}
          className="w-full h-auto max-h-[520px] object-cover"
        />
        {caption && (
          <div className="p-3 bg-stone-900 text-xs text-stone-400 italic border-t border-stone-800">
            {caption}
          </div>
        )}
      </div>

      {/* Social Share Bar */}
      <SocialShare title={title} />

      {/* Article Body Content */}
      <div className="newspaper-dropcap font-editorial text-base sm:text-lg text-stone-200 leading-relaxed sm:leading-loose whitespace-pre-line space-y-6">
        {content}
      </div>

      {/* Source attribution if imported from Facebook */}
      {(article.source === 'Facebook' || article.facebookUrl || article.facebookPostId) && (
        <div className="my-6 p-4 rounded-xl bg-blue-950/40 border border-blue-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>
              {language === 'ar'
                ? 'تم استيراد هذا الخبر وتدقيقه صحفياً من صفحة جوبا نيوز الرسمية على فيسبوك'
                : 'This news report was curated and editorialized from the official Juba News Facebook Page'}
            </span>
          </div>
          <a
            href={article.facebookUrl || 'https://www.facebook.com/share/1UpeZiXU5k/'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-bold text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            {language === 'ar' ? 'عرض المنشور الأصلي على فيسبوك' : 'View Original Facebook Post'}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Tags Section */}
      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 my-8 pt-4 border-t border-stone-800">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1 mr-2">
            <TagIcon className="w-3.5 h-3.5" />
            Tags:
          </span>
          {article.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
              className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-full text-xs font-medium transition"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Share Bar */}
      <SocialShare title={title} />

      {/* Related Stories */}
      {relatedArticles.length > 0 && (
        <section className="my-12 pt-8 border-t-2 border-stone-900 dark:border-stone-100">
          <h3 className="text-xl font-extrabold font-editorial uppercase mb-6">
            {t('relatedArticles')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((rel) => (
              <ArticleCard key={rel.id} article={rel} variant="standard" />
            ))}
          </div>
        </section>
      )}

      {/* Comments Section */}
      <CommentSection article={article} />
    </article>
  );
};
