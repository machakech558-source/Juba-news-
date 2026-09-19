import React, { useState } from 'react';
import { 
  Globe, 
  Moon, 
  Sun, 
  Search, 
  Menu, 
  X, 
  User as UserIcon, 
  Flame, 
  Clock, 
  Phone, 
  Mail, 
  Eye 
} from 'lucide-react';
import { JubaNewsEmblem } from '../common/JubaNewsLogo';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from '../../contexts/RouterContext';
import { dataService } from '../../services/dataService';

export const Header: React.FC = () => {
  const { language, setLanguage, theme, setTheme, t, isRTL } = useThemeLanguage();
  const { currentUser, logout } = useAuth();
  const { currentPath, navigate, searchQuery, setSearchQuery } = useRouter();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const categories = dataService.getCategories().filter(c => c.enabled);

  // Format today's date
  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat(language === 'ar' ? 'ar-SS' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      setSearchQuery(localSearch.trim());
      navigate(`/search?q=${encodeURIComponent(localSearch.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const navItems = [
    { label: language === 'ar' ? 'الرئيسية' : 'Home', path: '/' },
    ...categories.map(cat => ({
      label: language === 'ar' ? cat.nameAr : cat.nameEn,
      path: `/${cat.slug}`,
    })),
  ];

  return (
    <header className="w-full bg-stone-900 text-stone-100 border-b border-stone-800 transition-colors">
      {/* Top Utility Bar */}
      <div className="bg-stone-950 text-stone-300 text-xs py-1.5 px-4 border-b border-stone-800/80">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: Date & Location & Editor-in-Chief & Direct Helpline */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center gap-1.5 text-stone-300 font-medium">
              <Clock className="w-3.5 h-3.5 text-red-500" />
              {formattedDate}
            </span>
            <span className="hidden sm:inline text-stone-600">|</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-stone-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Juba 32°C • Sunny
            </span>
            <span className="text-stone-600">|</span>
            <a 
              href="tel:+211922225964" 
              className="hidden lg:inline-flex items-center gap-1 text-stone-300 hover:text-white transition"
              dir="ltr"
              title="Editorial Desk"
            >
              <Phone className="w-3 h-3 text-red-400" />
              <span>+211 922 225 964</span>
            </a>
            <span className="hidden xl:inline text-stone-600">|</span>
            <a 
              href="mailto:media@juba-news.com" 
              className="hidden xl:inline-flex items-center gap-1 text-stone-300 hover:text-white transition"
              title="Media Desk"
            >
              <Mail className="w-3 h-3 text-red-400" />
              <span>media@juba-news.com</span>
            </a>
          </div>

          {/* Right: Language, Theme */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center rounded bg-stone-800 p-0.5 border border-stone-700">
              <button
                id="lang-en-btn"
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  language === 'en'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                EN
              </button>
              <button
                id="lang-ar-btn"
                onClick={() => setLanguage('ar')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  language === 'ar'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                عربي
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1 text-stone-400 hover:text-stone-200 transition"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Masthead */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Newspaper Logo Branding */}
          <div 
            onClick={() => navigate('/')} 
            className="cursor-pointer text-center sm:text-start select-none flex-1 sm:flex-initial"
          >
            <div className="flex items-center justify-center sm:justify-start gap-3.5">
              {/* Official Juba News .net Emblem */}
              <div className="flex-shrink-0 transition-transform duration-200 hover:scale-105">
                <JubaNewsEmblem size={58} idSuffix="header" />
              </div>
              
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight font-editorial uppercase flex items-center gap-1.5">
                    {language === 'ar' ? (
                      <span className="text-stone-50">
                        <span className="text-red-500">جوبا</span>{' '}
                        <span className="text-blue-400">نيوز</span>
                      </span>
                    ) : (
                      <>
                        <span className="text-red-500">JUBA</span>
                        <span className="text-blue-400">NEWS</span>
                      </>
                    )}
                  </h1>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-red-950/80 text-red-400 border border-red-800/60 uppercase tracking-wider">
                    {language === 'ar' ? 'صحيفة جنوب السودان وأفريقيا المستقلة' : 'South Sudan & Africa Independent Press'}
                  </span>
                </div>

                {/* Editor-in-Chief & Prominent Motto in Masthead */}
                <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1.5 flex-wrap">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-stone-950 border border-stone-800 text-xs shadow-xs">
                    <span className="text-red-400 font-bold">{language === 'ar' ? 'رئيس التحرير:' : 'Editor-in-Chief:'}</span>
                    <span className="text-stone-100 font-extrabold">{language === 'ar' ? 'أنور يل يوال' : 'Anwar Yiel Yuol'}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-400 font-bold tracking-wide flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      {language === 'ar' ? 'عينك على جنوب السودان، إفريقيا والعالم' : 'Your eyes on South Sudan, Africa and the World'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Central Editorial Motto Plaque on Large Screens */}
          <div className="hidden xl:flex flex-col items-center justify-center text-center px-5 py-2.5 rounded-xl bg-stone-950/90 border border-stone-800 shadow-inner">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              {language === 'ar' ? 'صحيفة جنوب السودان وأفريقيا المستقلة' : 'South Sudan & Africa Independent Press'}
            </span>
            <span className="text-xs text-amber-400/90 mt-1 font-semibold flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              {language === 'ar' ? 'عينك على جنوب السودان، إفريقيا والعالم' : 'Your eyes on South Sudan, Africa and the World'}
            </span>
          </div>

          {/* Right Header Action Controls: Search Only (No Admin / Control Panel in Public UI) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                id="masthead-search-input"
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-56 lg:w-72 pl-9 pr-3 py-1.5 text-xs bg-stone-800 text-stone-100 placeholder:text-stone-400 border border-stone-700 rounded-full focus:outline-none focus:ring-2 focus:ring-red-600 transition"
              />
              <Search className={`w-3.5 h-3.5 text-stone-400 absolute top-2.5 ${isRTL ? 'right-3' : 'left-3'}`} />
            </form>
          </div>
        </div>
      </div>

      {/* Editorial Tagline Ribbon */}
      <div className="bg-stone-950 border-t border-stone-800/80 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-[11px] sm:text-xs">
          <div className="flex items-center gap-2.5 text-stone-300 font-medium flex-wrap">
            <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 font-bold border border-red-800/50">
              {language === 'ar' ? 'صحيفة جنوب السودان وأفريقيا المستقلة' : 'South Sudan & Africa Press'}
            </span>
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              {language === 'ar' ? 'عينك على جنوب السودان، إفريقيا والعالم' : 'Your eyes on South Sudan, Africa and the World'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-stone-400 text-[11px]">
            <span>🇸🇸 {language === 'ar' ? 'صوت الحقيقة الرقمي الأول' : 'Digital Journalism of South Sudan'}</span>
          </div>
        </div>
      </div>

      {/* Main Horizontal Category Navigation Bar */}
      <nav className="hidden lg:block bg-stone-900/90 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center justify-between text-xs font-bold uppercase tracking-wider overflow-x-auto scrollbar-none py-2.5 gap-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`px-3 py-1.5 rounded-md whitespace-nowrap transition ${
                      isActive
                        ? 'bg-red-700 text-white font-extrabold shadow-xs'
                        : 'text-stone-300 hover:text-red-400 hover:bg-stone-800'
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Mobile Off-Canvas Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex">
          <div 
            className={`w-4/5 max-w-sm bg-stone-900 text-stone-100 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto ${
              isRTL ? 'mr-auto' : 'ml-auto'
            }`}
          >
            <div>
              <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-red-700 text-white flex items-center justify-center font-bold text-sm">
                    JN
                  </div>
                  <div>
                    <span className="font-editorial text-lg font-bold block text-stone-100">
                      {language === 'ar' ? 'جوبا نيوز' : 'JUBA NEWS'}
                    </span>
                    <span className="text-[10px] text-red-400 font-bold block">
                      {language === 'ar' ? 'صحيفة جنوب السودان وأفريقيا المستقلة' : 'South Sudan & Africa Independent Press'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Motto Banner */}
              <div className="p-2.5 rounded-lg bg-stone-950 border border-stone-800 mb-4 text-xs text-amber-400 font-bold flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{language === 'ar' ? 'عينك على جنوب السودان، إفريقيا والعالم' : 'Your eyes on South Sudan, Africa and the World'}</span>
              </div>

              {/* Mobile Search Form */}
              <form onSubmit={handleSearchSubmit} className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="w-full px-3 py-2 text-xs bg-stone-800 text-stone-100 placeholder:text-stone-400 border border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <Search className="w-4 h-4 text-stone-400 absolute top-2.5 right-3" />
                </div>
              </form>

              {/* Mobile Categories Links */}
              <div className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-start px-3 py-2 rounded-lg text-sm font-semibold transition ${
                      currentPath === item.path
                        ? 'bg-red-700 text-white'
                        : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="border-t border-stone-800 pt-4 mt-6">
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-center space-y-1">
                <div className="text-[11px] text-stone-400 font-medium">
                  {language === 'ar' ? 'صحيفة جوبا نيوز المستقلة' : 'Juba News Independent Press'}
                </div>
                <div className="text-xs text-amber-400 font-bold flex items-center justify-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'عينك على جنوب السودان، إفريقيا والعالم' : 'Your eyes on South Sudan, Africa & the World'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
