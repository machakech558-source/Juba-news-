import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, ArrowUpDown } from 'lucide-react';
import { ArticleCard } from '../../components/public/ArticleCard';
import { SEOHead } from '../../components/common/SEOHead';
import { dataService } from '../../services/dataService';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useRouter } from '../../contexts/RouterContext';
import type { Article, Category } from '../../types';

export const SearchPage: React.FC = () => {
  const { language, t } = useThemeLanguage();
  const { searchQuery, setSearchQuery } = useRouter();

  const [query, setQuery] = useState(searchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [results, setResults] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Parse query parameter from window.location if present
    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get('q');
    if (qParam) {
      setQuery(qParam);
      setSearchQuery(qParam);
    }
    setCategories(dataService.getCategories().filter(c => c.enabled));
  }, []);

  useEffect(() => {
    const res = dataService.searchArticles(query, selectedCategory, selectedAuthor);
    setResults(res);
  }, [query, selectedCategory, selectedAuthor]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(query);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SEOHead 
        title={language === 'ar' ? `البحث: ${query || 'جميع الأخبار'}` : `Search: ${query || 'All Stories'}`}
      />

      {/* Search Header and Input */}
      <div className="max-w-3xl mx-auto mb-10 text-center">
        <h1 className="text-3xl font-black font-editorial tracking-tight mb-4">
          {language === 'ar' ? 'البحث في أرشيف جوبا نيوز' : 'Search Juba News Archive'}
        </h1>
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full px-5 py-3.5 pl-12 rounded-full bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 text-sm focus:outline-none focus:border-red-600 shadow-sm"
          />
          <Search className="w-5 h-5 text-stone-400 absolute top-4 left-4" />
        </form>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs">
          <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700">
            <Filter className="w-3.5 h-3.5 text-red-600" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent focus:outline-none font-medium"
            >
              <option value="all">{t('allCategories')}</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {language === 'ar' ? c.nameAr : c.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700">
            <User className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="bg-transparent focus:outline-none font-medium"
            >
              <option value="all">{language === 'ar' ? 'جميع المحررين' : 'All Authors'}</option>
              <option value="Deng Garang">Deng Garang</option>
              <option value="Mary Nyibol">Mary Nyibol</option>
              <option value="James Taban">James Taban</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="mb-6 flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
          {t('searchResultsFor')} {query ? `"${query}"` : (language === 'ar' ? 'جميع التقارير' : 'All Stories')} ({results.length})
        </h2>
      </div>

      {results.length === 0 ? (
        <div className="py-16 text-center text-stone-500 text-sm">
          {t('noResultsFound')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((art) => (
            <ArticleCard key={art.id} article={art} variant="standard" />
          ))}
        </div>
      )}
    </div>
  );
};
