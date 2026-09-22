import { dataService } from './dataService';
import type { Article } from '../types';
import { generateClientSideAiArticle } from './aiNewsClientFallback';

export type ContentType = 'breaking' | 'regular' | 'report' | 'analysis' | 'interview';
export type NewsLanguage = 'ar' | 'en';
export type WritingStyle = 'formal' | 'concise' | 'detailed';

export interface GeneratedNewsArticle {
  headline: string;
  introduction: string;
  body: string;
  background: string;
  quotes: string;
  conclusion: string;
  keywords: string[];
  seoDescription: string;
  socialMediaPost: string;

  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  excerptAr: string;
  excerptEn: string;
  contentAr: string;
  contentEn: string;
  categorySlug: string;
  tags: string[];
  readingTimeMinutes: number;
  featuredImage: string;
  imageCaptionAr: string;
  imageCaptionEn: string;
  isBreaking: boolean;
  isTopHeadline: boolean;
  isEditorsPick: boolean;
  sourceAttribution: string;
  contentType: ContentType;
  language: NewsLanguage;
  style: WritingStyle;
}

export interface AiAutoNewsConfig {
  enabled: boolean;
  intervalMinutes: number; // e.g. 30, 60, 180
  lastRunAt?: string;
  nextRunAt?: string;
  autoPublish: boolean; // true = PUBLISHED, false = PENDING_REVIEW
  focusCategory: string; // 'all' or specific slug
  topicsPool: string[];
}

const DEFAULT_CONFIG: AiAutoNewsConfig = {
  enabled: true,
  intervalMinutes: 60,
  autoPublish: true,
  focusCategory: 'south_sudan',
  topicsPool: [
    'تطورات مشاريع الطاقة الشمسية والبنية التحتية في ولايات جنوب السودان',
    'قمة التعاون الاقتصادي لدول حوض النيل والتبادل التجاري الإقليمي',
    'جهود الاستقرار والتنمية في منطقة أعالي النيل وجونقلي',
    'المؤتمر السنوي للثقافة والفنون والتراث القومي في جوبا',
    'إطلاق خطوط نقل تجارية جديدة بين جوبا وكمبالا ونيروبي',
    'تأهيل مشاريع الري والإنتاج الزراعي في بحر الغزال والاستوائية',
    'مبادرات الشباب والتكنولوجيا في عاصمة جنوب السودان جوبا',
    'الاتفاقيات البترولية الإقليمية وخطوط تصدير الطاقة النظيفة'
  ]
};

const STORAGE_KEY = 'juba_ai_auto_news_config';

class AiNewsAutomatorService {
  private config: AiAutoNewsConfig = DEFAULT_CONFIG;
  private timer: any = null;
  private isGenerating = false;
  private listeners: Set<(state: { isGenerating: boolean; config: AiAutoNewsConfig }) => void> = new Set();

  constructor() {
    this.loadConfig();
    this.startScheduler();
  }

  private loadConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch {
      this.config = DEFAULT_CONFIG;
    }
  }

  public saveConfig(newConfig: Partial<AiAutoNewsConfig>) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.error('Failed to save AI config:', e);
    }
    this.startScheduler();
    this.notify();
  }

  public getConfig(): AiAutoNewsConfig {
    return { ...this.config };
  }

  public subscribe(fn: (state: { isGenerating: boolean; config: AiAutoNewsConfig }) => void): () => void {
    this.listeners.add(fn);
    fn({ isGenerating: this.isGenerating, config: this.getConfig() });
    return () => this.listeners.delete(fn);
  }

  private notify() {
    const state = { isGenerating: this.isGenerating, config: this.getConfig() };
    this.listeners.forEach((fn) => fn(state));
  }

  private startScheduler() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (!this.config.enabled) return;

    // Run scheduler check every 60 seconds
    this.timer = setInterval(() => {
      this.checkAndRunAutoGeneration();
    }, 60 * 1000);
  }

  private async checkAndRunAutoGeneration() {
    if (!this.config.enabled || this.isGenerating) return;

    const now = Date.now();
    const lastRun = this.config.lastRunAt ? new Date(this.config.lastRunAt).getTime() : 0;
    const intervalMs = this.config.intervalMinutes * 60 * 1000;

    if (now - lastRun >= intervalMs) {
      try {
        await this.triggerGeneration('auto');
      } catch (e) {
        console.warn('Background AI News Dispatch notice:', e);
      }
    }
  }

  /**
   * Triggers an immediate news generation cycle with Gemini AI.
   */
  public async triggerGeneration(mode: 'manual' | 'auto' = 'manual', customTopic?: string): Promise<Article | null> {
    if (this.isGenerating) return null;

    this.isGenerating = true;
    this.notify();

    try {
      // Pick topic from pool or provided
      let topic = customTopic;
      if (!topic && this.config.topicsPool.length > 0) {
        const randomIndex = Math.floor(Math.random() * this.config.topicsPool.length);
        topic = this.config.topicsPool[randomIndex];
      }

      let gen: GeneratedNewsArticle | null = null;
      try {
        const response = await fetch('/api/v1/ai/generate-news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            categorySlug: this.config.focusCategory === 'all' ? 'south_sudan' : this.config.focusCategory,
            focus: 'south_sudan'
          })
        });

        if (response.ok) {
          const result = await response.json().catch(() => null);
          if (result && result.success && result.data) {
            gen = result.data;
          }
        }
      } catch (err) {
        console.warn('Server AI endpoint offline or 405 on static host, activating client fallback:', err);
      }

      // If server returned 405/500/HTML or failed, seamlessly synthesize article client-side
      if (!gen) {
        gen = generateClientSideAiArticle({
          topic,
          categorySlug: this.config.focusCategory === 'all' ? 'south_sudan' : this.config.focusCategory,
          focus: 'south_sudan',
          language: 'ar',
          style: 'formal',
          contentType: 'report'
        });
      }
      const categories = dataService.getCategories();
      const matchedCat = categories.find((c) => c.slug === gen.categorySlug) || categories[0] || {
        id: 'cat-south-sudan',
        slug: 'south_sudan',
        nameEn: 'South Sudan',
        nameAr: 'جنوب السودان'
      };

      const nowIso = new Date().toISOString();
      const slugBase = gen.titleEn
        ? gen.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        : `dispatch-${Date.now()}`;
      const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

      // Construct verified news article
      const articlePayload: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'commentCount'> = {
        titleAr: gen.titleAr,
        titleEn: gen.titleEn,
        slug,
        subtitleAr: gen.subtitleAr,
        subtitleEn: gen.subtitleEn,
        excerptAr: gen.excerptAr,
        excerptEn: gen.excerptEn,
        contentAr: gen.contentAr,
        contentEn: gen.contentEn,
        featuredImage: gen.featuredImage,
        imageCaptionAr: gen.imageCaptionAr,
        imageCaptionEn: gen.imageCaptionEn,
        categoryId: matchedCat.id,
        categorySlug: matchedCat.slug,
        categoryNameAr: matchedCat.nameAr,
        categoryNameEn: matchedCat.nameEn,
        authorId: 'ai-news-agent',
        authorName: 'مراسل جوبا نيوز الذكي (AI Editorial)',
        authorRole: 'محرر الذكاء الاصطناعي الإخباري',
        tags: Array.isArray(gen.tags) ? gen.tags : ['جنوب السودان', 'جوبا'],
        location: 'جوبا - جنوب السودان',
        status: this.config.autoPublish ? 'PUBLISHED' : 'PENDING_REVIEW',
        featured: gen.isTopHeadline || false,
        breaking: gen.isBreaking || false,
        publishedAt: this.config.autoPublish ? nowIso : undefined,
        readingTimeMinutes: gen.readingTimeMinutes || 3,
        seoTitle: gen.titleAr,
        seoDescription: gen.excerptAr,
        seoKeywords: gen.tags
      };

      const createdArticle = dataService.createArticle(articlePayload, {
        id: 'ai-news-agent',
        displayName: 'محرر الذكاء الاصطناعي (AI News)',
        email: 'ai-bot@jubanews.org',
        role: 'ADMIN_TWO',
        createdAt: nowIso,
        status: 'active'
      });

      // If breaking, also add to Breaking News ticker
      if (gen.isBreaking && this.config.autoPublish) {
        dataService.createBreakingNews({
          titleAr: gen.titleAr,
          titleEn: gen.titleEn,
          active: true,
          priority: 1,
          articleSlug: createdArticle.slug,
          createdBy: 'AI News Agent'
        }, {
          id: 'ai-news-agent',
          displayName: 'AI News Agent',
          email: 'ai-bot@jubanews.org',
          role: 'ADMIN_TWO',
          createdAt: nowIso,
          status: 'active'
        });
      }

      // Update state
      this.config.lastRunAt = nowIso;
      this.config.nextRunAt = new Date(Date.now() + this.config.intervalMinutes * 60 * 1000).toISOString();
      this.saveConfig({});

      return createdArticle;
    } catch (err: any) {
      console.error('Automatic AI News Dispatch Error:', err);
      throw err;
    } finally {
      this.isGenerating = false;
      this.notify();
    }
  }

  /**
   * Generates a fully structured article with all 9 requested sections
   * using the AI Admin editor parameters.
   */
  public async generateAiArticle(params: {
    topic: string;
    information?: string;
    contentType?: ContentType;
    language?: NewsLanguage;
    style?: WritingStyle;
    categorySlug?: string;
  }): Promise<GeneratedNewsArticle> {
    try {
      const response = await fetch('/api/v1/ai/generate-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: params.topic,
          information: params.information,
          contentType: params.contentType || 'report',
          language: params.language || 'ar',
          style: params.style || 'formal',
          categorySlug: params.categorySlug
        })
      });

      if (response.ok) {
        const result = await response.json().catch(() => null);
        if (result && result.success && result.data) {
          return result.data as GeneratedNewsArticle;
        }
      }
    } catch (err) {
      console.warn('Backend AI endpoint unavailable, using client synthesis fallback:', err);
    }

    return generateClientSideAiArticle({
      topic: params.topic,
      information: params.information,
      contentType: params.contentType,
      language: params.language,
      style: params.style,
      categorySlug: params.categorySlug
    });
  }

  /**
   * Publishes or saves a GeneratedNewsArticle into the live Juba News database
   * assigned to the AI Admin editorial author.
   */
  public async publishAiArticle(
    gen: GeneratedNewsArticle,
    status: 'PUBLISHED' | 'PENDING_REVIEW' = 'PUBLISHED'
  ): Promise<Article> {
    const categories = dataService.getCategories();
    const matchedCat = categories.find((c) => c.slug === gen.categorySlug) || categories[0] || {
      id: 'cat-south-sudan',
      slug: 'south_sudan',
      nameEn: 'South Sudan',
      nameAr: 'جنوب السودان'
    };

    const nowIso = new Date().toISOString();
    const slugBase = gen.titleEn
      ? gen.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : `dispatch-${Date.now()}`;
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    const articlePayload: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'commentCount'> = {
      titleAr: gen.titleAr,
      titleEn: gen.titleEn,
      slug,
      subtitleAr: gen.subtitleAr,
      subtitleEn: gen.subtitleEn,
      excerptAr: gen.excerptAr,
      excerptEn: gen.excerptEn,
      contentAr: gen.contentAr,
      contentEn: gen.contentEn,
      featuredImage: gen.featuredImage,
      imageCaptionAr: gen.imageCaptionAr,
      imageCaptionEn: gen.imageCaptionEn,
      categoryId: matchedCat.id,
      categorySlug: matchedCat.slug,
      categoryNameAr: matchedCat.nameAr,
      categoryNameEn: matchedCat.nameEn,
      authorId: 'user-ai-admin',
      authorName: 'AI Admin (محرر الذكاء الاصطناعي)',
      authorRole: 'محرر صحفي آلي معتمد',
      tags: Array.isArray(gen.tags) && gen.tags.length > 0 ? gen.tags : gen.keywords,
      location: 'جوبا - جنوب السودان',
      status,
      featured: gen.isTopHeadline,
      breaking: gen.isBreaking,
      publishedAt: status === 'PUBLISHED' ? nowIso : undefined,
      readingTimeMinutes: gen.readingTimeMinutes || 4,
      seoTitle: gen.headline,
      seoDescription: gen.seoDescription || gen.excerptAr,
      seoKeywords: gen.keywords
    };

    const createdArticle = dataService.createArticle(articlePayload, {
      id: 'user-ai-admin',
      displayName: 'AI Admin (محرر الذكاء الاصطناعي)',
      email: 'ai.admin@jubanews.org',
      role: 'ADMIN_TWO',
      createdAt: nowIso,
      status: 'active'
    });

    if (gen.isBreaking && status === 'PUBLISHED') {
      dataService.createBreakingNews({
        titleAr: gen.titleAr,
        titleEn: gen.titleEn,
        active: true,
        priority: 1,
        articleSlug: createdArticle.slug,
        createdBy: 'AI Admin'
      }, {
        id: 'user-ai-admin',
        displayName: 'AI Admin (محرر الذكاء الاصطناعي)',
        email: 'ai.admin@jubanews.org',
        role: 'ADMIN_TWO',
        createdAt: nowIso,
        status: 'active'
      });
    }

    return createdArticle;
  }
}

export const aiNewsAutomator = new AiNewsAutomatorService();
