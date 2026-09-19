import React, { useState, useEffect } from 'react';
import { HeroNewsGrid } from '../../components/public/HeroNewsGrid';
import { CategorySection } from '../../components/public/CategorySection';
import { ArticleCard } from '../../components/public/ArticleCard';
import { SEOHead } from '../../components/common/SEOHead';
import { dataService } from '../../services/dataService';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useRouter } from '../../contexts/RouterContext';
import { ArrowRight, ArrowLeft, Flame, TrendingUp, Sparkles } from 'lucide-react';
import type { Article, Category } from '../../types';

export const HomePage: React.FC = () => {
  const { language, isRTL, t } = useThemeLanguage();
  const { navigate } = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const unsub = dataService.subscribeArticles((allArticles) => {
      const published = allArticles.filter((a) => a.status === 'PUBLISHED');
      setArticles(published);
    });
    setCategories(dataService.getCategories().filter((c) => c.enabled));
    return () => unsub();
  }, []);

  const featuredStories = articles.filter((a) => a.featured || a.views > 3000);
  const heroArticles = featuredStories.length >= 4 ? featuredStories.slice(0, 4) : articles.slice(0, 4);
  const latestArticles = articles.slice(0, 6);

  // Category specific slices
  const ssArticles = articles.filter((a) => a.categorySlug === 'south-sudan');
  const africaArticles = articles.filter((a) => a.categorySlug === 'africa');
  const worldArticles = articles.filter((a) => a.categorySlug === 'world');
  const politicsArticles = articles.filter((a) => a.categorySlug === 'politics');
  const businessArticles = articles.filter((a) => a.categorySlug === 'business');
  const sportsArticles = articles.filter((a) => a.categorySlug === 'sports');
  const techArticles = articles.filter((a) => a.categorySlug === 'technology');
  const opinionArticles = articles.filter((a) => a.categorySlug === 'opinion');

  const getCat = (slug: string) => categories.find((c) => c.slug === slug) || {
    id: slug,
    slug,
    nameEn: slug,
    nameAr: slug,
    order: 99,
    enabled: true,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
      <SEOHead 
        title={language === 'ar' ? 'الرئيسية - صوت جنوب السودان وأفريقيا' : 'Home - Voice of South Sudan & Africa'}
        description="Comprehensive, verified, independent digital journalism covering South Sudan, Africa, and World events."
      />

      {/* SECTION B: Hero News Grid */}
      <HeroNewsGrid articles={heroArticles} />

      {/* SECTION C: Latest News Stream */}
      <section className="my-10">
        <div className="flex items-center justify-between border-b-2 border-stone-800 pb-2 mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
            <h2 className="text-xl sm:text-2xl font-black font-editorial tracking-tight uppercase text-stone-100">
              {t('latestNews')}
            </h2>
          </div>
          <span className="text-xs font-semibold text-stone-400">
            {articles.length} {language === 'ar' ? 'تقارير منشورة' : 'Stories Filed'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestArticles.slice(0, 3).map((art) => (
            <ArticleCard key={art.id} article={art} variant="standard" />
          ))}
        </div>
      </section>

      {/* SECTION D: South Sudan News Spotlight (Core National Mission) */}
      {ssArticles.length > 0 && (
        <div className="my-12 p-6 rounded-2xl bg-stone-900/90 border border-stone-800">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-6">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded bg-red-700 text-white font-black text-xs uppercase tracking-wider">
                🇸🇸 {t('southSudanFocus')}
              </span>
            </div>
            <button
              onClick={() => navigate('/south-sudan')}
              className="flex items-center gap-1 text-xs font-bold text-red-400 hover:underline uppercase"
            >
              <span>{t('viewAll')}</span>
              {isRTL ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <ArticleCard article={ssArticles[0]} variant="horizontal" />
            </div>
            <div className="lg:col-span-4 flex flex-col justify-between divide-y divide-stone-800">
              {ssArticles.slice(1, 4).map((art) => (
                <ArticleCard key={art.id} article={art} variant="compact" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION E: Africa News */}
      {africaArticles.length > 0 && (
        <CategorySection category={getCat('africa')} articles={africaArticles} />
      )}

      {/* SECTION F: World News */}
      {worldArticles.length > 0 && (
        <CategorySection category={getCat('world')} articles={worldArticles} />
      )}

      {/* SECTION G & H: Politics & Business Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-10">
        {politicsArticles.length > 0 && (
          <div>
            <CategorySection category={getCat('politics')} articles={politicsArticles} />
          </div>
        )}
        {businessArticles.length > 0 && (
          <div>
            <CategorySection category={getCat('business')} articles={businessArticles} />
          </div>
        )}
      </div>

      {/* SECTION I: Sports Spotlight */}
      {sportsArticles.length > 0 && (
        <CategorySection category={getCat('sports')} articles={sportsArticles} variant="lead-plus-compact" />
      )}

      {/* SECTION J & K: Technology & Opinion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-10">
        {techArticles.length > 0 && (
          <div>
            <CategorySection category={getCat('technology')} articles={techArticles} />
          </div>
        )}
        {opinionArticles.length > 0 && (
          <div>
            <CategorySection category={getCat('opinion')} articles={opinionArticles} />
          </div>
        )}
      </div>
    </div>
  );
};
