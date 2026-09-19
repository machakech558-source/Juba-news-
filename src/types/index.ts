export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'AI_ADMIN' 
  | 'ADMIN_ONE' 
  | 'USER' 
  | 'super_admin' 
  | 'ai_admin' 
  | 'admin_one' 
  | 'user'
  | 'EDITOR' 
  | 'MODERATOR' 
  | 'ADMIN_TWO'
  | 'editor' 
  | 'moderator';

export interface AdminAccountConfig {
  id: string;
  email: string;
  displayName: string;
  displayNameAr: string;
  role: 'SUPER_ADMIN' | 'AI_ADMIN' | 'ADMIN_ONE';
  descriptionEn: string;
  descriptionAr: string;
  lastPasswordChangedAt?: string;
  mustChangePassword?: boolean;
}

export interface GateSecurityConfig {
  enabled: boolean;
  passcode: string;
  lastUpdated: string;
  updatedBy: string;
  failedAttempts: number;
}

export type ArticleStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED' | 'draft' | 'review' | 'published' | 'archived';

export type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM' | 'pending' | 'approved' | 'rejected' | 'spam';

export type AdPosition = 
  | 'HOMEPAGE_TOP' 
  | 'HOMEPAGE_MIDDLE' 
  | 'SIDEBAR' 
  | 'ARTICLE_TOP' 
  | 'ARTICLE_MIDDLE' 
  | 'ARTICLE_BOTTOM';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  photoURL?: string;
  bio?: string;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  status: 'active' | 'suspended';
  banned?: boolean;
}

export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  order: number;
  enabled: boolean;
  color?: string;
}

export interface Tag {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
}

export interface Article {
  id: string;
  titleEn: string;
  titleAr: string;
  slug: string;
  subtitleEn?: string;
  subtitleAr?: string;
  contentEn: string;
  contentAr: string;
  excerptEn: string;
  excerptAr: string;
  featuredImage: string;
  gallery?: string[];
  imageCaptionEn?: string;
  imageCaptionAr?: string;
  categoryId: string;
  categorySlug: string;
  categoryNameEn: string;
  categoryNameAr: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  tags: string[];
  location?: string;
  status: ArticleStatus;
  featured: boolean;
  breaking: boolean;
  breakingNews?: boolean;
  publishedAt?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  likes?: number;
  commentCount: number;
  commentsCount?: number;
  readingTimeMinutes: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  source?: string;
  sourceUrl?: string;
  facebookPostId?: string;
  facebookUrl?: string;
  people?: string[];
  organizations?: string[];
  aiConfidence?: number;
  editorialStatus?: 'draft' | 'needs_review' | 'approved' | 'published' | 'rejected';
}

export interface FacebookPost {
  id: string;
  facebookPostId: string;
  pageId: string;
  message: string;
  facebookUrl: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video' | 'album' | 'link' | 'status';
  publishedAt: string;
  importedAt: string;
  rawPayload?: any;
  processingStatus: 'pending' | 'ai_processing' | 'processed' | 'failed' | 'skipped';
  articleId?: string;
  generatedTitle?: string;
  generatedSummary?: string;
  generatedCategory?: string;
  errorMessage?: string;
  article?: {
    id: string;
    titleAr: string;
    titleEn: string;
    slug: string;
    status: string;
    editorialStatus?: string;
    categoryId?: string;
    publishedAt?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface FacebookSettings {
  id: string;
  facebookIntegration: 'CONNECTED' | 'DISCONNECTED';
  syncMode: 'WEBHOOK' | 'MANUAL' | 'BOTH';
  aiProcessing: 'ENABLED' | 'DISABLED';
  autoPublish: boolean;
  defaultCategory: string;
  aiLanguage: 'ar' | 'en' | 'both';
  articleStyle: 'formal' | 'concise' | 'detailed';
  minimumConfidence: number;
  metaPageId: string;
  metaPageName: string;
  pagePermalink: string;
  lastSyncAt?: string;
  updatedAt: string;
}

export interface SyncLog {
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

export interface FacebookSyncResult {
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  draftsCreated: number;
  publishedCount: number;
  posts: Array<{ id: string; status: string; title?: string }>;
}

export interface Comment {
  id: string;
  articleId: string;
  articleSlug: string;
  articleTitle: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  status: CommentStatus;
  parentId?: string | null;
  likes: number;
  likedBy: string[];
  reported: boolean;
  reportReason?: string;
  reportCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface BreakingNewsItem {
  id: string;
  titleEn: string;
  titleAr: string;
  articleSlug?: string;
  active: boolean;
  priority: number;
  expiresAt?: string;
  createdAt: string;
  createdBy: string;
}

export interface MediaItem {
  id: string;
  name: string;
  fileName?: string;
  url: string;
  mimeType: string;
  sizeBytes?: number;
  fileSize?: number;
  width?: number;
  height?: number;
  altText?: string;
  altEn?: string;
  altAr?: string;
  captionEn?: string;
  captionAr?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Advertisement {
  id: string;
  name: string;
  title?: string;
  advertiser?: string;
  sponsorName?: string;
  imageUrl: string;
  destinationUrl?: string;
  targetUrl?: string;
  position: AdPosition;
  active: boolean;
  startDate: string;
  endDate?: string;
  impressions: number;
  clicks: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'NEW_COMMENT' | 'COMMENT_REPORT' | 'PENDING_ARTICLE' | 'ARTICLE_APPROVED' | 'ARTICLE_PUBLISHED' | 'SYSTEM';
  read: boolean;
  createdAt: string;
  targetId?: string;
  targetType?: 'article' | 'comment' | 'user';
}

export interface ActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  adminRole: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  targetTitle?: string;
  timestamp: string;
  details?: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export interface SiteSettings {
  siteNameEn: string;
  siteNameAr: string;
  taglineEn: string;
  taglineAr: string;
  editorInChiefAr?: string;
  editorInChiefEn?: string;
  contactEmail: string;
  contactPhone?: string;
  addressEn: string;
  addressAr: string;
  facebookUrl?: string;
  twitterUrl?: string;
  whatsappNumber?: string;
  telegramUrl?: string;
  messengerName?: string;
  messengerUrl?: string;
  enableComments: boolean;
  autoApproveComments: boolean;
  maintenanceMode: boolean;
  articlesPerPage: number;
}

export type User = UserProfile;
export type BreakingNews = BreakingNewsItem;
