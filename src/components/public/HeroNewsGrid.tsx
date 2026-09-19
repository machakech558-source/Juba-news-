import React from 'react';
import { Clock, MessageSquare, Eye, ArrowRight, ArrowLeft } from 'lucide-react';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useRouter } from '../../contexts/RouterContext';
import { getArticleReadingTimeDisplay } from '../../utils/readingTime';
import type { Article } from '../../types';

interface HeroNewsGridProps {
  articles: Article[];
}

export const HeroNewsGrid: React.FC<HeroNewsGridProps> = ({ articles }) => {
  const { language, isRTL, t } = useThemeLanguage();
  const { navigate } = useRouter();

  if (!articles || articles.length === 0) return null;

  const mainStory = articles[0];
  const sideStories = articles.slice(1, 4);

  const mainTitle = language === 'ar' ? mainStory.titleAr : mainStory.titleEn;
  const mainExcerpt = language === 'ar' ? mainStory.excerptAr : mainStory.excerptEn;
  const mainCategory = language === 'ar' ? mainStory.categoryNameAr : mainStory.categoryNameEn;

  const formattedDate = mainStory.publishedAt
    ? new Intl.DateTimeFormat(language === 'ar' ? 'ar-SS' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(mainStory.publishedAt))
    : '';

  return (
    <section className="my-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Lead Story (Takes 7 or 8 columns on desktop) */}
        <div className="lg:col-span-8 flex flex-col">
          <div 
            onClick={() => navigate(`/article/${mainStory.slug}`)}
            className="group relative flex-1 flex flex-col bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 hover:shadow-xl transition duration-300 cursor-pointer"
          >
            {/* Lead Image */}
            <div className="relative aspect-[16/9] sm:aspect-[16/10] overflow-hidden bg-stone-900">
              <img
                src={mainStory.featuredImage}
                alt={mainTitle}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060b18]/90 via-[#060b18]/40 to-transparent"></div>

              {/* Category Pill */}
              <div className="absolute top-4 start-4">
                <span className="px-3 py-1 bg-red-600 text-white font-black text-xs uppercase tracking-wider rounded-md shadow-md">
                  {mainCategory}
                </span>
              </div>

              {/* Overlay Metadata for Mobile & High Contrast */}
              <div className="absolute bottom-4 start-4 end-4 text-white">
                <div className="flex items-center gap-3 text-xs text-stone-300 mb-2">
                  <span className="font-semibold">{mainStory.authorName}</span>
                  <span>•</span>
                  <span>{formattedDate}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-red-400" />
                    <span>{getArticleReadingTimeDisplay(mainStory, language)}</span>
                  </span>
                </div>
                <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold font-editorial leading-tight text-white group-hover:text-red-300 transition line-clamp-3">
                  {mainTitle}
                </h2>
              </div>
            </div>

            {/* Excerpt & Action below image */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between bg-stone-900">
              <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-4">
                {mainExcerpt}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-stone-800">
                <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4 text-stone-400" />
                    {mainStory.views} {t('views')}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4 text-stone-400" />
                    {mainStory.commentCount} {t('comments')}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 group-hover:text-red-700">
                  <span>{t('readMore')}</span>
                  {isRTL ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stories Stack (Takes 4 columns on desktop) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          <div className="border-b-2 border-red-600 pb-1.5 mb-1 flex items-center justify-between">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-stone-900 dark:text-stone-100">
              {language === 'ar' ? 'أهم العناوين' : 'Top Headlines'}
            </h3>
            <span className="text-[11px] text-red-600 font-bold uppercase">
              {language === 'ar' ? 'تحديث مستمر' : 'Live updates'}
            </span>
          </div>

          <div className="flex-1 flex flex-col divide-y divide-stone-200 dark:divide-stone-800">
            {sideStories.map((story) => {
              const sTitle = language === 'ar' ? story.titleAr : story.titleEn;
              const sCat = language === 'ar' ? story.categoryNameAr : story.categoryNameEn;
              const sDate = story.publishedAt
                ? new Intl.DateTimeFormat(language === 'ar' ? 'ar-SS' : 'en-GB', {
                    day: 'numeric',
                    month: 'short',
                  }).format(new Date(story.publishedAt))
                : '';

              return (
                <div
                  key={story.id}
                  onClick={() => navigate(`/article/${story.slug}`)}
                  className="group py-3.5 first:pt-0 last:pb-0 cursor-pointer flex gap-3.5 items-center"
                >
                  <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-stone-200 dark:bg-stone-800">
                    <img
                      src={story.featuredImage}
                      alt={sTitle}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 tracking-wider">
                      {sCat}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-red-700 dark:group-hover:text-red-400 transition leading-snug line-clamp-2 mt-0.5 mb-1 font-editorial">
                      {sTitle}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                      <span>{sDate}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-red-500" />
                        <span>{getArticleReadingTimeDisplay(story, language)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
