import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Eye, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Image as ImageIcon, 
  Bold, 
  Italic, 
  Heading2, 
  Heading3, 
  Quote, 
  List, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Tag as TagIcon,
  X,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useRouter } from '../../contexts/RouterContext';
import { dataService } from '../../services/dataService';
import { countWords, calculateReadingTimeMinutes, formatReadingTime } from '../../utils/readingTime';
import type { Article, ArticleStatus, Category } from '../../types';

interface ArticleEditorPageProps {
  articleId?: string; // If undefined, creates new article
}

export const ArticleEditorPage: React.FC<ArticleEditorPageProps> = ({ articleId }) => {
  const { currentUser, role, isSuperAdmin, canPublish } = useAuth();
  const { language, isRTL, t } = useThemeLanguage();
  const { navigate } = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'english' | 'arabic' | 'settings'>('english');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  // Form States
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [slug, setSlug] = useState('');
  const [subtitleEn, setSubtitleEn] = useState('');
  const [subtitleAr, setSubtitleAr] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [contentAr, setContentAr] = useState('');
  const [excerptEn, setExcerptEn] = useState('');
  const [excerptAr, setExcerptAr] = useState('');
  const [featuredImage, setFeaturedImage] = useState('https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80');
  const [imageCaptionEn, setImageCaptionEn] = useState('');
  const [imageCaptionAr, setImageCaptionAr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('Juba, South Sudan');
  const [status, setStatus] = useState<ArticleStatus>('DRAFT');
  const [featured, setFeatured] = useState(false);
  const [breaking, setBreaking] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [tagsInput, setTagsInput] = useState('South Sudan, Juba, Breaking');
  const [readingTimeMinutes, setReadingTimeMinutes] = useState(4);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiPromptTopic, setAiPromptTopic] = useState('');

  useEffect(() => {
    const cats = dataService.getCategories();
    setCategories(cats);
    if (cats.length > 0 && !categoryId) {
      setCategoryId(cats[0].id);
    }

    if (articleId) {
      const art = dataService.getArticleById(articleId);
      if (art) {
        setTitleEn(art.titleEn);
        setTitleAr(art.titleAr);
        setSlug(art.slug);
        setSubtitleEn(art.subtitleEn || '');
        setSubtitleAr(art.subtitleAr || '');
        setContentEn(art.contentEn);
        setContentAr(art.contentAr);
        setExcerptEn(art.excerptEn);
        setExcerptAr(art.excerptAr);
        setFeaturedImage(art.featuredImage);
        setImageCaptionEn(art.imageCaptionEn || '');
        setImageCaptionAr(art.imageCaptionAr || '');
        setCategoryId(art.categoryId);
        setLocation(art.location || 'Juba, South Sudan');
        setStatus(art.status);
        setFeatured(art.featured);
        setBreaking(art.breaking);
        setScheduledAt(art.scheduledAt || '');
        setTagsInput(art.tags.join(', '));
        setReadingTimeMinutes(art.readingTimeMinutes);
      }
    }
  }, [articleId]);

  // Auto-slug generator from English title if empty or editing new
  const handleTitleEnChange = (val: string) => {
    setTitleEn(val);
    if (!articleId && !slug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(generated);
    }
  };

  // Helper toolbar action for formatting
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const isEn = activeTab === 'english';
    const current = isEn ? contentEn : contentAr;
    const update = isEn ? setContentEn : setContentAr;
    update(current + `\n${prefix}Selected text${suffix}\n`);
  };

  const handleAiGenerate = async (prompt?: string) => {
    setIsAiGenerating(true);
    try {
      const selectedCat = categories.find((c) => c.id === categoryId);
      const res = await fetch('/api/v1/ai/generate-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: prompt || titleAr || titleEn || undefined,
          categorySlug: selectedCat?.slug || 'south_sudan'
        })
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error(language === 'ar' ? 'استجابة خادم الذكاء الاصطناعي غير صالحة' : 'Invalid response from AI server');
      }
      if (data && data.success && data.data) {
        const gen = data.data;
        setTitleEn(gen.titleEn);
        setTitleAr(gen.titleAr);
        setSubtitleEn(gen.subtitleEn || '');
        setSubtitleAr(gen.subtitleAr || '');
        setContentEn(gen.contentEn);
        setContentAr(gen.contentAr);
        setExcerptEn(gen.excerptEn);
        setExcerptAr(gen.excerptAr);
        if (gen.featuredImage) setFeaturedImage(gen.featuredImage);
        if (gen.imageCaptionAr) setImageCaptionAr(gen.imageCaptionAr);
        if (gen.imageCaptionEn) setImageCaptionEn(gen.imageCaptionEn);
        if (Array.isArray(gen.tags)) setTagsInput(gen.tags.join(', '));
        if (gen.readingTimeMinutes) setReadingTimeMinutes(gen.readingTimeMinutes);
        if (gen.isBreaking !== undefined) setBreaking(gen.isBreaking);
        if (gen.isTopHeadline !== undefined) setFeatured(gen.isTopHeadline);

        // Generate clean slug
        const generatedSlug = gen.titleEn
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');
        setSlug(generatedSlug || `article-${Date.now()}`);

        setSavedFeedback(
          language === 'ar'
            ? 'تمت صياغة الخبر الثنائي بنجاح بواسطة الذكاء الاصطناعي!'
            : 'AI successfully drafted the full bilingual article!'
        );
        setTimeout(() => setSavedFeedback(null), 5000);
        setAiPromptOpen(false);
        setAiPromptTopic('');
      } else {
        throw new Error(data?.error || 'Failed to generate content');
      }
    } catch (err: any) {
      alert(err.message || 'Error communicating with AI service');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSave = (targetStatus?: ArticleStatus) => {
    if (!currentUser) return;
    const finalStatus = targetStatus || status;

    const selectedCat = categories.find((c) => c.id === categoryId) || categories[0];
    const parsedTags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    const payload = {
      titleEn: titleEn.trim() || 'Untitled Article',
      titleAr: titleAr.trim() || titleEn.trim() || 'خبر بدون عنوان',
      slug: slug.trim() || `article-${Date.now()}`,
      subtitleEn,
      subtitleAr,
      contentEn: contentEn.trim() || 'Content coming soon...',
      contentAr: contentAr.trim() || contentEn.trim() || 'المحتوى قيد التحرير...',
      excerptEn: excerptEn.trim() || titleEn.slice(0, 150),
      excerptAr: excerptAr.trim() || titleAr.slice(0, 150),
      featuredImage,
      imageCaptionEn,
      imageCaptionAr,
      categoryId: selectedCat.id,
      categorySlug: selectedCat.slug,
      categoryNameEn: selectedCat.nameEn,
      categoryNameAr: selectedCat.nameAr,
      authorId: currentUser.id,
      authorName: currentUser.displayName,
      authorRole: currentUser.role,
      authorAvatar: currentUser.avatarUrl,
      tags: parsedTags,
      location,
      status: finalStatus,
      featured,
      breaking,
      scheduledAt: finalStatus === 'SCHEDULED' ? scheduledAt : undefined,
      publishedAt: finalStatus === 'PUBLISHED' ? new Date().toISOString() : undefined,
      readingTimeMinutes,
    };

    if (articleId) {
      dataService.updateArticle(articleId, payload, currentUser);
      setSavedFeedback('Article successfully updated!');
    } else {
      const created = dataService.createArticle(payload, currentUser);
      setSavedFeedback('Article successfully created!');
      setTimeout(() => navigate(`/admin/articles`), 1200);
    }

    setStatus(finalStatus);
    setTimeout(() => setSavedFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/articles')}
            className="p-2 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
          >
            {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-editorial text-stone-900 dark:text-stone-100">
              {articleId ? (language === 'ar' ? 'تعديل الخبر التحريري' : 'Edit News Dispatch') : (language === 'ar' ? 'تحرير خبر جديد' : 'Compose News Dispatch')}
            </h1>
            <span className="text-[11px] text-stone-500">
              Status: <span className="font-bold uppercase text-red-600">{status}</span>
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AI Story Generator Button */}
          <button
            type="button"
            disabled={isAiGenerating}
            onClick={() => setAiPromptOpen(!aiPromptOpen)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-800 hover:to-amber-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            <Sparkles className={`w-4 h-4 text-amber-300 ${isAiGenerating ? 'animate-spin' : ''}`} />
            <span>{isAiGenerating ? (language === 'ar' ? 'جاري الصياغة...' : 'Drafting...') : (language === 'ar' ? 'صياغة بالذكاء الاصطناعي' : 'AI Draft')}</span>
          </button>

          {/* Preview Modal Trigger */}
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-semibold transition"
          >
            <Eye className="w-4 h-4" />
            <span>{language === 'ar' ? 'معاينة' : 'Preview'}</span>
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={() => handleSave('DRAFT')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-900 dark:text-stone-100 rounded-lg text-xs font-bold transition"
          >
            <Save className="w-4 h-4" />
            <span>{language === 'ar' ? 'حفظ كمسودة' : 'Save Draft'}</span>
          </button>

          {/* Submit for Review or Direct Publish */}
          {canPublish ? (
            <button
              type="button"
              onClick={() => handleSave('PUBLISHED')}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'ar' ? 'نشر فوري' : 'Publish Story'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSave('PENDING_REVIEW')}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              <span>{language === 'ar' ? 'إرسال للمراجعة التحريرية' : 'Submit for Review'}</span>
            </button>
          )}
        </div>
      </div>

      {savedFeedback && (
        <div className="p-3 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{savedFeedback}</span>
        </div>
      )}

      {/* AI Assistant Quick Generator Banner */}
      {aiPromptOpen && (
        <div className="p-4 rounded-2xl bg-stone-900 border border-amber-600/40 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>{language === 'ar' ? 'مساعد الذكاء الاصطناعي لصياغة الأخبار (Gemini 3.8 Flash)' : 'Gemini AI News Co-Pilot'}</span>
            </span>
            <button
              type="button"
              onClick={() => setAiPromptOpen(false)}
              className="p-1 text-stone-400 hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-stone-400">
            {language === 'ar'
              ? 'اكتب فكرة الخبر أو الكلمات المفتاحية وسيتولى الذكاء الاصطناعي صياغة الخبر بالكامل بالعربية والإنجليزية مع المقدمة، المتن، الصورة، والوسوم في هذا النموذج.'
              : 'Provide an angle or headline, and Gemini AI will draft the entire bilingual dispatch directly into your editor fields.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={aiPromptTopic}
              onChange={(e) => setAiPromptTopic(e.target.value)}
              placeholder={language === 'ar' ? 'اكتب موضوع أو ملخص الخبر هنا...' : 'Enter article topic or breaking news summary...'}
              className="flex-1 px-3.5 py-2 text-xs bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none"
            />
            <button
              type="button"
              disabled={isAiGenerating}
              onClick={() => handleAiGenerate(aiPromptTopic)}
              className="px-4 py-2 bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-800 hover:to-amber-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
              <span>{isAiGenerating ? (language === 'ar' ? 'جاري الصياغة...' : 'Generating...') : (language === 'ar' ? 'صياغة المحتوى الآن' : 'Generate Now')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Editor Body Grid: 8 Cols Editor / 4 Cols Metadata & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Editor Tabs */}
        <div className="lg:col-span-8 space-y-4">
          {/* Language Switcher Tabs */}
          <div className="flex border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-t-xl px-4 pt-2">
            <button
              onClick={() => setActiveTab('english')}
              className={`py-2 px-4 text-xs font-bold border-b-2 transition ${
                activeTab === 'english'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              English Edition
            </button>
            <button
              onClick={() => setActiveTab('arabic')}
              className={`py-2 px-4 text-xs font-bold border-b-2 transition ${
                activeTab === 'arabic'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              النسخة العربية (Arabic)
            </button>
          </div>

          {/* Tab 1: English Content */}
          {activeTab === 'english' && (
            <div className="p-6 bg-white dark:bg-stone-900 rounded-b-xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-stone-600 dark:text-stone-400 mb-1.5">
                  Headline (English) *
                </label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => handleTitleEnChange(e.target.value)}
                  placeholder="e.g. South Sudan and Regional Partners Sign Groundbreaking Nile Water Accord"
                  className="w-full p-3 text-base font-bold rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                  Subtitle / Deck (English)
                </label>
                <input
                  type="text"
                  value={subtitleEn}
                  onChange={(e) => setSubtitleEn(e.target.value)}
                  placeholder="A one-sentence editorial deck summarizing the core development"
                  className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
                />
              </div>

              {/* Formatting Toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-stone-100 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**')}
                  className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('*', '*')}
                  className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('## ')}
                  className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
                  title="Heading 2"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('### ')}
                  className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
                  title="Heading 3"
                >
                  <Heading3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('> ')}
                  className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
                  title="Quote"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('- ')}
                  className="p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
                  title="Bullet List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black uppercase text-stone-600 dark:text-stone-400">
                    Body Content (English) *
                  </label>
                  <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                    {countWords(contentEn)} words • {formatReadingTime(calculateReadingTimeMinutes(contentEn, 'en'), 'en')}
                  </span>
                </div>
                <textarea
                  rows={14}
                  value={contentEn}
                  onChange={(e) => {
                    setContentEn(e.target.value);
                    const calculatedMinutes = calculateReadingTimeMinutes(e.target.value, 'en');
                    setReadingTimeMinutes(calculatedMinutes);
                  }}
                  placeholder="Draft your full verified report here..."
                  className="w-full p-3.5 text-sm font-editorial leading-relaxed rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                  Lead Excerpt (English)
                </label>
                <textarea
                  rows={2}
                  value={excerptEn}
                  onChange={(e) => setExcerptEn(e.target.value)}
                  placeholder="Summary shown on cards and search engine snippets"
                  className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Arabic Content */}
          {activeTab === 'arabic' && (
            <div dir="rtl" className="p-6 bg-white dark:bg-stone-900 rounded-b-xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-stone-600 dark:text-stone-400 mb-1.5">
                  العنوان باللغة العربية *
                </label>
                <input
                  type="text"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder="مثال: جنوب السودان وشركاؤه الإقليميون يوقعون اتفاقية تاريخية لإدارة مياه النيل"
                  className="w-full p-3 text-base font-bold rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                  العنوان الفرعي (Deck)
                </label>
                <input
                  type="text"
                  value={subtitleAr}
                  onChange={(e) => setSubtitleAr(e.target.value)}
                  placeholder="ملخص تحريري في سطر واحد لتسليط الضوء على الحدث"
                  className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black uppercase text-stone-600 dark:text-stone-400">
                    نص التقرير الصحفي باللغة العربية *
                  </label>
                  <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                    {countWords(contentAr)} كلمة • {formatReadingTime(calculateReadingTimeMinutes(contentAr, 'ar'), 'ar')}
                  </span>
                </div>
                <textarea
                  rows={14}
                  value={contentAr}
                  onChange={(e) => {
                    setContentAr(e.target.value);
                    const calculatedMinutes = calculateReadingTimeMinutes(e.target.value, 'ar');
                    setReadingTimeMinutes(calculatedMinutes);
                  }}
                  placeholder="حرر النص الكامل للخبر أو التحليل هنا..."
                  className="w-full p-3.5 text-sm font-editorial leading-relaxed rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5">
                  الموجز التحريري (Excerpt)
                </label>
                <textarea
                  rows={2}
                  value={excerptAr}
                  onChange={(e) => setExcerptAr(e.target.value)}
                  placeholder="موجز يظهر في بطاقات الأخبار ومحركات البحث"
                  className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Settings & Publishing Sidebar (4 Columns) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Publishing Controls */}
          <div className="p-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
              Editorial Workflow & Desk
            </h3>

            {/* Status Select */}
            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                Editorial Workflow Stage
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                className="w-full p-2 text-xs rounded bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none font-semibold"
              >
                <option value="DRAFT">Draft</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                {canPublish && <option value="APPROVED">Approved</option>}
                {canPublish && <option value="PUBLISHED">Published</option>}
                {canPublish && <option value="SCHEDULED">Scheduled</option>}
              </select>
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                News Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2 text-xs rounded bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameEn} ({c.nameAr})
                  </option>
                ))}
              </select>
            </div>

            {/* Slug */}
            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                URL Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full p-2 text-xs rounded bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none font-mono text-[11px]"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                Filing Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2 text-xs rounded bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  Featured (Lead in Hero Grid)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={breaking}
                  onChange={(e) => setBreaking(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span className="font-semibold text-red-700 dark:text-red-400">
                  ⚡ Breaking Alert (Top Banner)
                </span>
              </label>
            </div>
          </div>

          {/* Featured Image Box */}
          <div className="p-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
              Featured Image
            </h3>

            <div className="aspect-[16/10] rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              <img
                src={featuredImage}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-2 text-xs rounded bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                Caption / Photo Credit (EN)
              </label>
              <input
                type="text"
                value={imageCaptionEn}
                onChange={(e) => setImageCaptionEn(e.target.value)}
                placeholder="Photo: Juba News / Deng Garang"
                className="w-full p-2 text-xs rounded bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Tags & Reading Time */}
          <div className="p-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 pb-2">
              Taxonomy & Meta
            </h3>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full p-2 text-xs rounded bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                Estimated Reading Time (Minutes)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={readingTimeMinutes}
                onChange={(e) => setReadingTimeMinutes(Number(e.target.value))}
                className="w-full p-2 text-xs rounded bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4 mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                Editorial Preview Mode
              </span>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-black font-editorial text-stone-900 dark:text-stone-100">
                {titleEn || titleAr || 'Untitled Preview'}
              </h1>
              {subtitleEn && (
                <p className="text-stone-600 dark:text-stone-300 font-medium text-base">
                  {subtitleEn}
                </p>
              )}
              <div className="aspect-[16/9] rounded-xl overflow-hidden bg-stone-800">
                <img src={featuredImage} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="font-editorial text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-line">
                {contentEn || contentAr || 'No content entered yet.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
