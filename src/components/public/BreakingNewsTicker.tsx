import React, { useState, useEffect } from 'react';
import { Flame, ChevronLeft, ChevronRight, Volume2, ArrowRight } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useRouter } from '../../contexts/RouterContext';
import type { BreakingNewsItem } from '../../types';

export const BreakingNewsTicker: React.FC = () => {
  const { language, isRTL, t } = useThemeLanguage();
  const { navigate } = useRouter();
  const [items, setItems] = useState<BreakingNewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const unsubscribe = dataService.subscribeBreakingNews((data) => {
      const active = data.filter((item) => item.active).sort((a, b) => a.priority - b.priority);
      setItems(active);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (items.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [items.length, isPaused]);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];
  const title = language === 'ar' ? currentItem.titleAr : currentItem.titleEn;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleItemClick = () => {
    if (currentItem.articleSlug) {
      navigate(`/article/${currentItem.articleSlug}`);
    }
  };

  return (
    <div 
      className="bg-red-700 text-white py-2 px-4 border-b border-red-800 shadow-inner select-none transition-colors"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
        {/* Left: Urgent Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-white text-red-700 font-black rounded uppercase text-[11px] tracking-wider shadow-xs animate-pulse">
            <Flame className="w-3.5 h-3.5 fill-red-600 text-red-600" />
            {t('breakingNews')}
          </span>
          <span className="hidden md:inline-block text-red-200 text-xs font-mono">
            {currentIndex + 1}/{items.length}
          </span>
        </div>

        {/* Center: Headline with smooth transition */}
        <div 
          onClick={handleItemClick}
          className={`flex-1 overflow-hidden whitespace-normal sm:whitespace-nowrap text-ellipsis font-medium hover:underline cursor-pointer transition duration-300 ${
            currentItem.articleSlug ? 'cursor-pointer' : ''
          }`}
        >
          <span className="font-semibold tracking-wide">
            {title}
          </span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handlePrev}
            className="p-1 rounded hover:bg-red-800 transition"
            aria-label="Previous breaking news"
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={handleNext}
            className="p-1 rounded hover:bg-red-800 transition"
            aria-label="Next breaking news"
          >
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
