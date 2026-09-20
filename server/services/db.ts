import crypto from 'crypto';
import { CryptoService } from './cryptoService';
import { ROLES, ROLE_PERMISSIONS, RoleType, PermissionType, ARTICLE_STATUS, ArticleStatusType, COMMENT_STATUS } from '../config/constants';
import { config } from '../config/env';

export interface DbAdmin {
  id: string;
  email: string;
  displayName: string;
  role: RoleType;
  passwordHash: string;
  is2faEnabled: boolean;
  totpSecret?: string;
  backupCodes?: string[];
  status: 'ACTIVE' | 'DISABLED';
  failedLoginAttempts: number;
  lockedUntil?: number;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbSession {
  id: string;
  adminId: string;
  refreshTokenHash: string;
  ip: string;
  userAgent: string;
  expiresAt: number;
  createdAt: string;
  lastActivityAt: string;
}

export interface DbArticle {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  subtitleEn?: string;
  subtitleAr?: string;
  contentEn: string;
  contentAr: string;
  featuredImage: string;
  imageCaptionEn?: string;
  imageCaptionAr?: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  categoryId: string;
  tags: string[];
  status: ArticleStatusType;
  isBreaking: boolean;
  isTopHeadline: boolean;
  isEditorsPick?: boolean;
  readingTimeMinutes: number;
  views: number;
  source?: string;
  sourceUrl?: string;
  facebookPostId?: string;
  facebookUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  location?: string;
  people?: string[];
  organizations?: string[];
  aiConfidence?: number;
  editorialStatus?: 'draft' | 'needs_review' | 'approved' | 'published' | 'rejected';
  publishedAt?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbFacebookPost {
  id: string;
  facebookPostId: string; // Unique Facebook post ID (strictly enforced)
  pageId: string;
  message: string;
  facebookUrl: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video' | 'album' | 'link' | 'status';
  publishedAt: string;
  importedAt: string;
  rawPayload: Record<string, any>;
  processingStatus: 'pending' | 'ai_processing' | 'processed' | 'failed' | 'skipped';
  articleId?: string;
  generatedTitle?: string;
  generatedSummary?: string;
  generatedCategory?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbSyncLog {
  id: string;
  source: 'WEBHOOK' | 'MANUAL';
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface DbAiJob {
  id: string;
  postId: string;
  articleId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  model: string;
  durationMs?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface DbFacebookSettings {
  id: string;
  facebookIntegration: 'CONNECTED' | 'DISCONNECTED';
  syncMode: 'WEBHOOK' | 'MANUAL' | 'BOTH';
  aiProcessing: 'ENABLED' | 'DISABLED';
  autoPublish: boolean; // Default FALSE strictly: drafts require admin approval
  defaultCategory: string;
  aiLanguage: 'ar' | 'en' | 'both';
  articleStyle: 'formal' | 'concise' | 'detailed';
  minimumConfidence: number;
  metaPageId: string;
  metaPageName: string;
  pagePermalink: string;
  n8nWebhookSecret?: string;
  n8nAutoPublish?: boolean;
  lastSyncAt?: string;
  updatedAt: string;
}

export interface DbCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  order: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DbComment {
  id: string;
  articleId: string;
  articleTitle?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM';
  likes: number;
  createdAt: string;
  updatedAt: string;
}

export interface DbMedia {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  uploadedBy: string;
  createdAt: string;
}

export interface DbAuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DbSiteSettings {
  id: string;
  siteNameEn: string;
  siteNameAr: string;
  taglineEn: string;
  taglineAr: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  messengerName: string;
  addressEn: string;
  addressAr: string;
  require2FAForAdmins: boolean;
  commentModerationRequired: boolean;
  updatedAt: string;
}

class DatabaseStore {
  public admins: Map<string, DbAdmin> = new Map();
  public sessions: Map<string, DbSession> = new Map();
  public articles: Map<string, DbArticle> = new Map();
  public categories: Map<string, DbCategory> = new Map();
  public comments: Map<string, DbComment> = new Map();
  public media: Map<string, DbMedia> = new Map();
  public auditLogs: DbAuditLog[] = [];
  public facebookPosts: Map<string, DbFacebookPost> = new Map();
  public syncLogs: DbSyncLog[] = [];
  public aiJobs: Map<string, DbAiJob> = new Map();
  public facebookSettings: DbFacebookSettings = {
    id: 'fb-global',
    facebookIntegration: 'CONNECTED',
    syncMode: 'BOTH',
    aiProcessing: 'ENABLED',
    autoPublish: true, // Default enabled: auto-publish news live to the website
    defaultCategory: 'cat-ss',
    aiLanguage: 'both',
    articleStyle: 'formal',
    minimumConfidence: 0.85,
    metaPageId: process.env.META_PAGE_ID || '108429588219424',
    metaPageName: 'Juba News - جوبا نيوز',
    pagePermalink: 'https://www.facebook.com/share/1UpeZiXU5k/',
    n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET || 'juba_n8n_sec_2025',
    n8nAutoPublish: true,
    lastSyncAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
  public settings: DbSiteSettings = {
    id: 'global',
    siteNameEn: 'Juba News',
    siteNameAr: 'جوبا نيوز',
    taglineEn: 'South Sudan & Africa Independent Press | Your eyes on South Sudan, Africa and the World',
    taglineAr: 'صحيفة جنوب السودان وأفريقيا المستقلة | عينك على جنوب السودان، إفريقيا والعالم',
    contactEmail: 'media@juba-news.com',
    contactPhone: '+211 922 225 964',
    whatsappNumber: '+211 922 225 964',
    messengerName: 'Juba-News جوبا-نيوز',
    addressEn: 'Hai Cinema, Juba, South Sudan',
    addressAr: 'حي سينما، جوبا، جنوب السودان',
    require2FAForAdmins: false,
    commentModerationRequired: true,
    updatedAt: new Date().toISOString(),
  };

  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    // 1. Seed Initial Super Admin (Anwar Y. Youal)
    const superAdminPasswordHash = await CryptoService.hashPassword(config.initialSuperAdminPassword);
    const superAdminId = 'admin-super-01';
    this.admins.set(superAdminId, {
      id: superAdminId,
      email: config.initialSuperAdminEmail,
      displayName: 'Anwar Y. Youal (Super Admin)',
      role: ROLES.SUPER_ADMIN,
      passwordHash: superAdminPasswordHash,
      is2faEnabled: false,
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Seed Editor Admin
    const editorPasswordHash = await CryptoService.hashPassword('Editor#2026!Pass');
    const editorId = 'admin-editor-02';
    this.admins.set(editorId, {
      id: editorId,
      email: 'editor@juba-news.com',
      displayName: 'Managing Editor',
      role: ROLES.EDITOR,
      passwordHash: editorPasswordHash,
      is2faEnabled: false,
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. Seed Author Admin
    const authorPasswordHash = await CryptoService.hashPassword('Author#2026!Pass');
    const authorId = 'admin-author-03';
    this.admins.set(authorId, {
      id: authorId,
      email: 'author@juba-news.com',
      displayName: 'Senior Field Reporter',
      role: ROLES.AUTHOR,
      passwordHash: authorPasswordHash,
      is2faEnabled: false,
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 4. Seed Moderator Admin
    const modPasswordHash = await CryptoService.hashPassword('Moderator#2026!Pass');
    const modId = 'admin-mod-04';
    this.admins.set(modId, {
      id: modId,
      email: 'moderator@juba-news.com',
      displayName: 'Community Desk Moderator',
      role: ROLES.MODERATOR,
      passwordHash: modPasswordHash,
      is2faEnabled: false,
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 5. Seed Media Manager Admin
    const mediaPasswordHash = await CryptoService.hashPassword('Media#2026!Pass');
    const mediaId = 'admin-media-05';
    this.admins.set(mediaId, {
      id: mediaId,
      email: 'media@juba-news.com',
      displayName: 'Photo & Media Producer',
      role: ROLES.MEDIA_MANAGER,
      passwordHash: mediaPasswordHash,
      is2faEnabled: false,
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 6. Seed Categories
    const initialCategories: DbCategory[] = [
      { id: 'cat-ss', slug: 'south-sudan', nameEn: 'South Sudan', nameAr: 'جنوب السودان', order: 1, enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'cat-pol', slug: 'politics', nameEn: 'Politics & Governance', nameAr: 'سياسة وحكم', order: 2, enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'cat-econ', slug: 'economy', nameEn: 'Economy & Oil', nameAr: 'اقتصاد ونفط', order: 3, enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'cat-afr', slug: 'africa', nameEn: 'East Africa & Nile', nameAr: 'شرق أفريقيا وحوض النيل', order: 4, enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'cat-world', slug: 'world', nameEn: 'World News', nameAr: 'أخبار العالم', order: 5, enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'cat-inv', slug: 'investigations', nameEn: 'Investigations', nameAr: 'تحقيقات استقصائية', order: 6, enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    initialCategories.forEach((c) => this.categories.set(c.id, c));

    // 7. Seed Articles
    const initialArticles: DbArticle[] = [
      {
        id: 'art-01',
        slug: 'juba-peace-accord-nile-infrastructure-milestone',
        titleEn: 'South Sudan Accelerates Nile Basin Transport Corridor & Port Modernization',
        titleAr: 'جنوب السودان يُسرّع مشروع الممر النهري لحوض النيل وتحديث موانئ جوبا',
        subtitleEn: 'Strategic river transport upgrades connect Juba with regional trading hubs across Uganda and Egypt.',
        subtitleAr: 'تحديثات استراتيجية للنقل النهري لربط جوبا بالموانئ الإقليمية وتعزيز التبادل التجاري.',
        contentEn: 'JUBA — In a high-level summit held in Juba, transportation and commerce authorities signed landmark accords to revitalize the White Nile navigation channels...\n\nThe multi-phase infrastructure modernization ensures seamless freight transit between Nimule, Bor, Malakal and Juba port terminals, lowering commodity prices across the ten states.',
        contentAr: 'جوبا — في قمة رفيعة المستوى عُقدت في العاصمة جوبا، وقّعت سلطات النقل والتجارة اتفاقيات تاريخية لإعادة تأهيل ممرات الملاحة النهرية في حوض النيل الأبيض...\n\nويهدف المشروع الاستراتيجي إلى تأمين وصول الإمدادات التجارية الحيوية بين نمولي وبور وملكال وميناء جوبا الرئيسي، مما ينعكس إيجابياً على استقرار أسعار السلع في جميع الولايات.',
        featuredImage: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&auto=format&fit=crop&q=80',
        imageCaptionEn: 'Barges docking along the White Nile wharf in central Juba.',
        imageCaptionAr: 'صنادل النقل النهري ترسو بمحاذاة رصيف النيل الأبيض في قلب جوبا.',
        authorId: superAdminId,
        authorName: 'Machar Deng',
        authorRole: 'Chief Political Correspondent',
        categoryId: 'cat-ss',
        tags: ['South Sudan', 'Nile Basin', 'Economy', 'Infrastructure'],
        status: ARTICLE_STATUS.PUBLISHED,
        isBreaking: false,
        isTopHeadline: true,
        isEditorsPick: true,
        readingTimeMinutes: 4,
        views: 1420,
        publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'art-02',
        slug: 'east-african-community-customs-integration',
        titleEn: 'EAC Common Market: Juba Streamlines Cross-Border Digital Clearance',
        titleAr: 'السوق المشتركة لشرق أفريقيا: جوبا تطلق نظام التخليص الجمركي الرقمي الموحد',
        subtitleEn: 'New customs portal cuts waiting time at Nimule border post from days to minutes.',
        subtitleAr: 'البوابة الجمركية الجديدة تختصر زمن الانتظار في معبر نمولي الحدودي من أيام إلى دقائق.',
        contentEn: 'NIMULE — Truck drivers and commercial carriers reported smooth operations today following the rollout of the EAC unified electronic cargo tracking system.\n\nCustoms officials noted revenue transparency gains and expedited movement of essential food items into South Sudan markets.',
        contentAr: 'نمولي — أشاد سائقو الشاحنات والتجار بسهولة الإجراءات عقب تفعيل منظومة التتبع الإلكتروني الموحدة لدول مجموعة شرق أفريقيا في معبر نمولي.\n\nوأكد مسؤولو الجمارك أن التحول الرقمي يعزز الشفافية ويسرع تدفق السلع الاستهلاكية ومواد البناء للأسواق الوطنية.',
        featuredImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80',
        imageCaptionEn: 'Commercial transit corridor connecting South Sudan and Uganda.',
        imageCaptionAr: 'الممر التجاري الاستراتيجي الرابط بين جنوب السودان وأوغندا.',
        authorId: editorId,
        authorName: 'Grace Keji',
        authorRole: 'Regional Trade Analyst',
        categoryId: 'cat-econ',
        tags: ['EAC', 'Trade', 'Nimule', 'Digital Customs'],
        status: ARTICLE_STATUS.PUBLISHED,
        isBreaking: false,
        isTopHeadline: false,
        isEditorsPick: true,
        readingTimeMinutes: 3,
        views: 890,
        publishedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'art-03',
        slug: 'south-sudan-youth-innovation-hub-opens',
        titleEn: 'National Tech & Innovation Incubator Launches in Hai Cinema',
        titleAr: 'افتتاح الحاضنة الوطنية للابتكار التكنولوجي والشباب في حي سينما بجوبا',
        subtitleEn: 'Empowering young South Sudanese developers in AI, fintech, and renewable energy.',
        subtitleAr: 'دعم المطورين ورواد الأعمال من شباب جنوب السودان في الذكاء الاصطناعي والطاقة المتجددة.',
        contentEn: 'JUBA — Hundreds of students and entrepreneurs attended the grand launch of the South Sudan Tech Accelerator in Hai Cinema.\n\nThe hub provides free high-speed fiber connectivity, prototyping labs, and seed grants for software and agritech ventures tailored to local challenges.',
        contentAr: 'جوبا — شهد حي سينما في العاصمة جوبا تدشين الحاضنة الوطنية للتكنولوجيا وريادة الأعمال بمشاركة واسعة من الطلاب والمبتكرين.\n\nوتوفر الحاضنة الإنترنت فائق السرعة عبر الألياف الضوئية، ومعامل البرمجة، والمنح الأولية للمشاريع الرقمية والزراعية الذكية.',
        featuredImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
        authorId: authorId,
        authorName: 'Peter Loro',
        authorRole: 'Technology Reporter',
        categoryId: 'cat-ss',
        tags: ['Youth', 'Tech', 'Innovation', 'Juba'],
        status: ARTICLE_STATUS.PUBLISHED,
        isBreaking: false,
        isTopHeadline: false,
        readingTimeMinutes: 3,
        views: 650,
        publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    initialArticles.forEach((a) => this.articles.set(a.id, a));

    // 8. Seed Media
    const initialMedia: DbMedia[] = [
      {
        id: 'med-01',
        filename: 'nile-corridor.jpg',
        originalName: 'nile-corridor.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 245000,
        url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&auto=format&fit=crop&q=80',
        uploadedBy: superAdminId,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'med-02',
        filename: 'customs-transit.jpg',
        originalName: 'customs-transit.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 198000,
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80',
        uploadedBy: editorId,
        createdAt: new Date().toISOString(),
      }
    ];
    initialMedia.forEach((m) => this.media.set(m.id, m));

    // 9. Seed Initial Audit Log
    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: superAdminId,
      userEmail: config.initialSuperAdminEmail,
      action: 'SYSTEM_BOOTSTRAP',
      resource: 'SYSTEM',
      ip: '127.0.0.1',
      userAgent: 'Server-Init/1.0',
      timestamp: new Date().toISOString(),
      metadata: { status: 'INITIALIZED', rolesSeeded: Object.keys(ROLES) },
    });

    // 10. Seed Initial Facebook Posts from Official Page (https://www.facebook.com/share/1UpeZiXU5k/)
    const initialFbPosts: DbFacebookPost[] = [
      {
        id: 'fb-post-01',
        facebookPostId: '108429588219424_892348719201948',
        pageId: '108429588219424',
        message: 'عاجل: جنوب السودان يطلق مبادرة وطنية زراعية كبرى في ولاية الاستوائية الوسطى لتأمين الحبوب والغذاء بالشراكة مع منظمة الفاو والبنك الإفريقي للتنمية. المشروع يستهدف دعم أكثر من 50,000 مزارع وتوفير معدات الري الحديث والتقاوي المحسنة.',
        facebookUrl: 'https://www.facebook.com/share/1UpeZiXU5k/',
        mediaUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80',
        mediaType: 'photo',
        publishedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        importedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        rawPayload: { id: '108429588219424_892348719201948', page: 'Juba News' },
        processingStatus: 'processed',
        articleId: 'art-fb-01',
        generatedTitle: 'جنوب السودان يطلق مبادرة زراعية استراتيجية لدعم 50 ألف مزارع وتحقيق الأمن الغذائي',
        generatedSummary: 'مبادرة وطنية مشتركة بين وزارة الزراعة ومنظمة الفاو والبنك الإفريقي لدعم الإنتاج الزراعي في الاستوائية الوسطى.',
        generatedCategory: 'cat-ss',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'fb-post-02',
        facebookPostId: '108429588219424_892348719201949',
        pageId: '108429588219424',
        message: 'مؤتمر الاستثمار في الطاقة المتجددة بجوبا: توقيع مذكرات تفاهم لتزويد المناطق الريفية في بحر الغزال بمحطات الطاقة الشمسية المستقلة قبل نهاية العام الجاري.',
        facebookUrl: 'https://www.facebook.com/share/1UpeZiXU5k/',
        mediaUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&auto=format&fit=crop&q=80',
        mediaType: 'photo',
        publishedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
        importedAt: new Date(Date.now() - 3600000 * 9).toISOString(),
        rawPayload: { id: '108429588219424_892348719201949', page: 'Juba News' },
        processingStatus: 'processed',
        articleId: 'art-fb-02',
        generatedTitle: 'جوبا توقع مذكرات تفاهم لإنشاء محطات طاقة شمسية في ولايات بحر الغزال',
        generatedSummary: 'مشروع طاقة متجددة يستهدف تزويد القرى والمراكز الصحية بالكهرباء المستدامة.',
        generatedCategory: 'cat-econ',
        createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 9).toISOString(),
      },
      {
        id: 'fb-post-03',
        facebookPostId: '108429588219424_892348719201950',
        pageId: '108429588219424',
        message: 'منتخب جنوب السودان لكرة السلة يبدأ معسكره الإعدادي للبطولة الأفريقية وسط دعم جماهيري واسع وتفاؤل كبير بتحقيق إنجاز تاريخي جديد.',
        facebookUrl: 'https://www.facebook.com/share/1UpeZiXU5k/',
        mediaUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80',
        mediaType: 'photo',
        publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        importedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        rawPayload: { id: '108429588219424_892348719201950', page: 'Juba News' },
        processingStatus: 'pending',
        generatedTitle: 'منتخب السلة ينطلق في معسكره الإعدادي استعداداً للتصفيات الأفريقية',
        generatedSummary: 'استعدادات مكثفة لمنتخب جنوب السودان لكرة السلة وسط دعم رسمي وجماهيري كبير.',
        generatedCategory: 'cat-ss',
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      }
    ];
    initialFbPosts.forEach((p) => this.facebookPosts.set(p.id, p));

    // Seed draft article corresponding to post 1 (ready for admin editorial review)
    const fbDraftArticle: DbArticle = {
      id: 'art-fb-01',
      slug: 'south-sudan-launches-national-agricultural-initiative-fao',
      titleEn: 'South Sudan Launches Landmark Agricultural Initiative to Support 50,000 Farmers',
      titleAr: 'جنوب السودان يطلق مبادرة زراعية كبرى لدعم 50 ألف مزارع وتحقيق الأمن الغذائي',
      subtitleEn: 'Joint partnership with FAO and AfDB provides modern irrigation tools and high-yield seeds.',
      subtitleAr: 'شراكة استراتيجية مع الفاو والبنك الأفريقي للتنمية لتوفير معدات الري الحديث والتقاوي.',
      contentEn: 'JUBA — In a strategic leap towards national self-sufficiency, South Sudanese agricultural authorities, in cooperation with the Food and Agriculture Organization (FAO) and the African Development Bank, launched a massive initiative across Central Equatoria State.\n\nThe project equips over 50,000 smallholder farmers with drought-resilient seeds, solar-powered water pumps, and cold-chain storage facilities, curbing dependence on cross-border food imports and stimulating grassroots rural economies.',
      contentAr: 'جوبا — في خطوة استراتيجية نحو تحقيق الاكتفاء الذاتي والأمن الغذائي المستدام، أطلقت وزارة الزراعة والأمن الغذائي في جنوب السودان، بالتعاون مع منظمة الأغذية والزراعة (الفاو) والبنك الأفريقي للتنمية، مبادرة زراعية وطنية كبرى في ولاية الاستوائية الوسطى.\n\nوتستهدف المبادرة تزويد أكثر من 50,000 مزارع بتقنيات الري الحديثة والمضخات الشمسية والتقاوي المحسنة، بما يضمن رفع إنتاجية المحاصيل الغذائية الحيوية وتقليل الاعتماد على الواردات.',
      featuredImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80',
      imageCaptionEn: 'Farmers inspecting grain harvests in Central Equatoria.',
      imageCaptionAr: 'مزارعون في الاستوائية الوسطى يعاينون محاصيل الحبوب ضمن المبادرة الوطنية.',
      authorId: superAdminId,
      authorName: 'Juba News AI Desk (محرر الذكاء الاصطناعي)',
      authorRole: 'AI Editorial Newsroom',
      categoryId: 'cat-ss',
      tags: ['South Sudan', 'Agriculture', 'Food Security', 'Equatoria', 'Facebook'],
      status: ARTICLE_STATUS.DRAFT, // Initially draft awaiting admin approval!
      isBreaking: true,
      isTopHeadline: true,
      isEditorsPick: false,
      readingTimeMinutes: 3,
      views: 120,
      source: 'Facebook',
      sourceUrl: 'https://www.facebook.com/share/1UpeZiXU5k/',
      facebookPostId: '108429588219424_892348719201948',
      facebookUrl: 'https://www.facebook.com/share/1UpeZiXU5k/',
      seoTitle: 'South Sudan Agricultural Initiative - Juba News',
      seoDescription: 'South Sudan launches agricultural program for 50,000 farmers in Central Equatoria with FAO.',
      location: 'Juba / Central Equatoria',
      people: ['Minister of Agriculture'],
      organizations: ['FAO', 'African Development Bank', 'Ministry of Agriculture'],
      aiConfidence: 0.94,
      editorialStatus: 'draft',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    };
    this.articles.set(fbDraftArticle.id, fbDraftArticle);

    // Seed approved & published article corresponding to post 2
    const fbPublishedArticle: DbArticle = {
      id: 'art-fb-02',
      slug: 'bahr-el-ghazal-solar-microgrid-expansion-accords',
      titleEn: 'Juba Inks Accords for Solar Microgrids Across Bahr el Ghazal States',
      titleAr: 'جوبا توقع مذكرات تفاهم لإنشاء محطات طاقة شمسية في ولايات بحر الغزال',
      subtitleEn: 'Clean energy projects set to electrify rural clinics and markets before end of 2026.',
      subtitleAr: 'مشاريع طاقة نظيفة لتزويد المراكز الصحية والأسواق الريفية بالكهرباء المستدامة.',
      contentEn: 'JUBA — Energy authorities and private clean-power consortiums concluded extensive negotiations today, signing contracts to build decentralized solar microgrids across Bahr el Ghazal.\n\nThe installations will bring reliable electricity to dozens of regional health clinics, schools, and grain mills, accelerating regional development.',
      contentAr: 'جوبا — اختتمت سلطات الطاقة والشركات المتخصصة في الطاقة المتجددة مفاوضات موسعة اليوم بتوقيع عقود لإنشاء محطات طاقة شمسية مستقلة في ولايات بحر الغزال.\n\nوستوفر المحطات الجديدة التيار الكهربائي لعشرات المرافق الصحية والمدارس والمطاحن، مما يعزز البنية التحتية التنموية في المجتمعات الريفية.',
      featuredImage: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&auto=format&fit=crop&q=80',
      authorId: superAdminId,
      authorName: 'Juba News AI Desk (محرر الذكاء الاصطناعي)',
      authorRole: 'AI Editorial Newsroom',
      categoryId: 'cat-econ',
      tags: ['Solar Energy', 'Bahr el Ghazal', 'Development', 'Facebook'],
      status: ARTICLE_STATUS.PUBLISHED,
      isBreaking: false,
      isTopHeadline: false,
      readingTimeMinutes: 3,
      views: 310,
      source: 'Facebook',
      sourceUrl: 'https://www.facebook.com/share/1UpeZiXU5k/',
      facebookPostId: '108429588219424_892348719201949',
      facebookUrl: 'https://www.facebook.com/share/1UpeZiXU5k/',
      seoTitle: 'Bahr el Ghazal Solar Energy Projects - Juba News',
      seoDescription: 'South Sudan announces solar energy grids in Bahr el Ghazal for clinics and schools.',
      location: 'Bahr el Ghazal / Juba',
      organizations: ['Ministry of Energy', 'Clean Energy Consortium'],
      aiConfidence: 0.92,
      editorialStatus: 'published',
      publishedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    };
    this.articles.set(fbPublishedArticle.id, fbPublishedArticle);

    // 11. Seed Initial Sync Log
    this.syncLogs.unshift({
      id: `sync-${Date.now() - 3600000 * 4}`,
      source: 'MANUAL',
      status: 'SUCCESS',
      importedCount: 3,
      skippedCount: 0,
      failedCount: 0,
      message: 'Initial synchronization completed from official Facebook Page (Juba News)',
      details: { pageId: '108429588219424', pageUrl: 'https://www.facebook.com/share/1UpeZiXU5k/' },
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    });

    this.initialized = true;
    console.log('✅ Juba News Database Store initialized with secure seed data.');
  }

  // --- Facebook & AI Helper Methods with Strict Duplicate Prevention ---

  getFacebookPostByExternalId(facebookPostId: string): DbFacebookPost | undefined {
    for (const post of this.facebookPosts.values()) {
      if (post.facebookPostId === facebookPostId) {
        return post;
      }
    }
    return undefined;
  }

  getFacebookPostById(id: string): DbFacebookPost | undefined {
    return this.facebookPosts.get(id);
  }

  saveFacebookPost(post: DbFacebookPost): DbFacebookPost {
    this.facebookPosts.set(post.id, post);
    return post;
  }

  deleteFacebookPost(id: string): boolean {
    return this.facebookPosts.delete(id);
  }

  addSyncLog(logData: Omit<DbSyncLog, 'id' | 'timestamp'>): DbSyncLog {
    const log: DbSyncLog = {
      ...logData,
      id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.syncLogs.unshift(log);
    // Keep last 100 sync logs
    if (this.syncLogs.length > 100) {
      this.syncLogs = this.syncLogs.slice(0, 100);
    }
    return log;
  }

  createAiJob(postId: string, model: string): DbAiJob {
    const job: DbAiJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      postId,
      status: 'pending',
      model,
      createdAt: new Date().toISOString(),
    };
    this.aiJobs.set(job.id, job);
    return job;
  }

  updateAiJob(jobId: string, updates: Partial<DbAiJob>): DbAiJob | undefined {
    const job = this.aiJobs.get(jobId);
    if (!job) return undefined;
    const updated = { ...job, ...updates };
    this.aiJobs.set(jobId, updated);
    return updated;
  }
}

export const db = new DatabaseStore();
