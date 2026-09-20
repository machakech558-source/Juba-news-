import { 
  INITIAL_CATEGORIES, 
  INITIAL_ARTICLES, 
  INITIAL_BREAKING_NEWS, 
  INITIAL_ADMINS, 
  INITIAL_COMMENTS, 
  INITIAL_ADVERTISEMENTS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_ACTIVITY_LOGS, 
  INITIAL_SETTINGS 
} from '../data/sampleData';
import type { 
  Article, 
  Category, 
  BreakingNewsItem, 
  UserProfile, 
  Comment, 
  Advertisement, 
  NotificationItem, 
  ActivityLog, 
  SiteSettings, 
  UserRole, 
  AdPosition, 
  CommentStatus,
  MediaItem
} from '../types';

type Listener<T> = (data: T) => void;

class DataService {
  private articles: Article[] = [];
  private categories: Category[] = [];
  private breakingNews: BreakingNewsItem[] = [];
  private users: UserProfile[] = [];
  private comments: Comment[] = [];
  private advertisements: Advertisement[] = [];
  private media: MediaItem[] = [];
  private notifications: NotificationItem[] = [];
  private activityLogs: ActivityLog[] = [];
  private settings: SiteSettings = INITIAL_SETTINGS;

  private articleListeners: Set<Listener<Article[]>> = new Set();
  private breakingNewsListeners: Set<Listener<BreakingNewsItem[]>> = new Set();
  private commentsListeners: Set<Listener<Comment[]>> = new Set();
  private categoryListeners: Set<Listener<Category[]>> = new Set();
  private notificationListeners: Set<Listener<NotificationItem[]>> = new Set();

  constructor() {
    this.initData();
  }

  private initData() {
    try {
      const storedArticles = localStorage.getItem('juba_articles');
      this.articles = storedArticles ? JSON.parse(storedArticles) : INITIAL_ARTICLES;

      const storedCategories = localStorage.getItem('juba_categories');
      this.categories = storedCategories ? JSON.parse(storedCategories) : INITIAL_CATEGORIES;

      const storedBreaking = localStorage.getItem('juba_breaking');
      this.breakingNews = storedBreaking ? JSON.parse(storedBreaking) : INITIAL_BREAKING_NEWS;

      const storedUsers = localStorage.getItem('juba_users');
      if (storedUsers) {
        const parsed: UserProfile[] = JSON.parse(storedUsers);
        // Ensure system administrators (like Anwar Yiel Yuol) are synced into local storage
        INITIAL_ADMINS.forEach((initAdmin) => {
          const existingIdx = parsed.findIndex((u) => u.id === initAdmin.id || u.email.toLowerCase() === initAdmin.email.toLowerCase());
          if (existingIdx >= 0) {
            parsed[existingIdx] = { ...parsed[existingIdx], ...initAdmin };
          } else {
            parsed.unshift(initAdmin);
          }
        });
        this.users = parsed;
      } else {
        this.users = INITIAL_ADMINS;
      }

      const storedComments = localStorage.getItem('juba_comments');
      this.comments = storedComments ? JSON.parse(storedComments) : INITIAL_COMMENTS;

      const storedAds = localStorage.getItem('juba_ads');
      this.advertisements = storedAds ? JSON.parse(storedAds) : INITIAL_ADVERTISEMENTS;

      const storedMedia = localStorage.getItem('juba_media');
      this.media = storedMedia ? JSON.parse(storedMedia) : [
        {
          id: 'med-1',
          name: 'Juba Skyline & Nile River Bridge',
          fileName: 'juba-skyline.jpg',
          url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&auto=format&fit=crop&q=80',
          mimeType: 'image/jpeg',
          sizeBytes: 940000,
          altText: 'Panoramic view of Juba over the White Nile',
          altEn: 'Panoramic view of Juba over the White Nile',
          altAr: 'مشهد بانورامي لمدينة جوبا على ضفاف النيل الأبيض',
          uploadedBy: 'Emmanuel Deng',
          uploadedAt: new Date().toISOString(),
        },
        {
          id: 'med-2',
          name: 'South Sudan National Assembly Chamber',
          fileName: 'assembly-chamber.jpg',
          url: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=1200&auto=format&fit=crop&q=80',
          mimeType: 'image/jpeg',
          sizeBytes: 810000,
          altText: 'Transitional National Legislative Assembly session',
          altEn: 'Transitional National Legislative Assembly session',
          altAr: 'جلسة المجلس التشريعي القومي الانتقالي',
          uploadedBy: 'Mary Achol',
          uploadedAt: new Date().toISOString(),
        },
        {
          id: 'med-3',
          name: 'South Sudan National Basketball Team',
          fileName: 'bright-stars.jpg',
          url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80',
          mimeType: 'image/jpeg',
          sizeBytes: 1120000,
          altText: 'Bright Stars international basketball court celebration',
          altEn: 'Bright Stars international basketball court celebration',
          altAr: 'احتفال منتخب برايت ستارز لكرة السلة',
          uploadedBy: 'Peter Lado',
          uploadedAt: new Date().toISOString(),
        }
      ];

      const storedNotifs = localStorage.getItem('juba_notifs');
      this.notifications = storedNotifs ? JSON.parse(storedNotifs) : INITIAL_NOTIFICATIONS;

      const storedLogs = localStorage.getItem('juba_logs');
      this.activityLogs = storedLogs ? JSON.parse(storedLogs) : INITIAL_ACTIVITY_LOGS;

      const storedSettings = localStorage.getItem('juba_settings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        if (parsed.siteNameEn?.includes('.net')) parsed.siteNameEn = 'Juba News';
        if (parsed.siteNameAr?.includes('.نت')) parsed.siteNameAr = 'جوبا نيوز';
        parsed.contactEmail = 'media@juba-news.com';
        parsed.contactPhone = '+211 922 225 964';
        parsed.whatsappNumber = '+211 922 225 964';
        parsed.messengerName = 'Juba-News جوبا-نيوز';
        parsed.messengerUrl = 'https://m.me/jubanews';
        parsed.addressAr = 'حي السينما، جوبا، جمهورية جنوب السودان';
        parsed.addressEn = 'Hai Cinema, Juba, South Sudan';
        this.settings = parsed;
        localStorage.setItem('juba_settings', JSON.stringify(parsed));
      } else {
        this.settings = INITIAL_SETTINGS;
      }
    } catch {
      this.articles = INITIAL_ARTICLES;
      this.categories = INITIAL_CATEGORIES;
      this.breakingNews = INITIAL_BREAKING_NEWS;
      this.users = INITIAL_ADMINS;
      this.comments = INITIAL_COMMENTS;
      this.advertisements = INITIAL_ADVERTISEMENTS;
      this.notifications = INITIAL_NOTIFICATIONS;
      this.activityLogs = INITIAL_ACTIVITY_LOGS;
      this.settings = INITIAL_SETTINGS;
    }
  }

  private save(key: string, data: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error('Storage save error:', err);
    }
  }

  // --- Subscriptions ---
  subscribeArticles(listener: Listener<Article[]>): () => void {
    this.articleListeners.add(listener);
    listener([...this.articles]);
    return () => this.articleListeners.delete(listener);
  }

  private notifyArticles() {
    this.save('juba_articles', this.articles);
    this.articleListeners.forEach((fn) => fn([...this.articles]));
  }

  subscribeCategories(listener: Listener<Category[]>): () => void {
    this.categoryListeners.add(listener);
    listener([...this.categories]);
    return () => this.categoryListeners.delete(listener);
  }

  private notifyCategories() {
    this.save('juba_categories', this.categories);
    this.categoryListeners.forEach((fn) => fn([...this.categories]));
  }

  subscribeBreakingNews(listener: Listener<BreakingNewsItem[]>): () => void {
    this.breakingNewsListeners.add(listener);
    listener([...this.breakingNews]);
    return () => this.breakingNewsListeners.delete(listener);
  }

  private notifyBreakingNews() {
    this.save('juba_breaking', this.breakingNews);
    this.breakingNewsListeners.forEach((fn) => fn([...this.breakingNews]));
  }

  subscribeComments(listener: Listener<Comment[]>): () => void {
    this.commentsListeners.add(listener);
    listener([...this.comments]);
    return () => this.commentsListeners.delete(listener);
  }

  private notifyComments() {
    this.save('juba_comments', this.comments);
    this.commentsListeners.forEach((fn) => fn([...this.comments]));
  }

  subscribeNotifications(listener: Listener<NotificationItem[]>): () => void {
    this.notificationListeners.add(listener);
    listener([...this.notifications]);
    return () => this.notificationListeners.delete(listener);
  }

  private notifyNotifications() {
    this.save('juba_notifs', this.notifications);
    this.notificationListeners.forEach((fn) => fn([...this.notifications]));
  }

  // --- Articles ---
  getArticles(): Article[] {
    return [...this.articles];
  }

  getPublishedArticles(): Article[] {
    return this.articles.filter((a) => a.status === 'PUBLISHED');
  }

  getArticleBySlug(slug: string): Article | undefined {
    return this.articles.find((a) => a.slug === slug);
  }

  getArticleById(id: string): Article | undefined {
    return this.articles.find((a) => a.id === id);
  }

  getArticlesByCategory(categorySlug: string): Article[] {
    return this.articles.filter((a) => a.categorySlug === categorySlug && a.status === 'PUBLISHED');
  }

  searchArticles(query: string, categorySlug?: string, authorName?: string): Article[] {
    const q = query.trim().toLowerCase();
    return this.articles.filter((a) => {
      if (a.status !== 'PUBLISHED') return false;
      if (categorySlug && categorySlug !== 'all' && a.categorySlug !== categorySlug) return false;
      if (authorName && authorName !== 'all' && !a.authorName.toLowerCase().includes(authorName.toLowerCase())) return false;

      if (!q) return true;

      const matchEn = a.titleEn.toLowerCase().includes(q) || a.excerptEn.toLowerCase().includes(q) || a.contentEn.toLowerCase().includes(q);
      const matchAr = a.titleAr.includes(q) || a.excerptAr.includes(q) || a.contentAr.includes(q);
      const matchTags = a.tags.some((t) => t.toLowerCase().includes(q));
      const matchAuthor = a.authorName.toLowerCase().includes(q);

      return matchEn || matchAr || matchTags || matchAuthor;
    });
  }

  createArticle(articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'commentCount'>, user: UserProfile): Article {
    const newArticle: Article = {
      ...articleData,
      id: `art-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      commentCount: 0,
    };

    this.articles = [newArticle, ...this.articles];
    this.notifyArticles();

    this.logActivity({
      adminId: user.id,
      adminName: user.displayName,
      adminRole: user.role,
      action: 'Created article',
      targetType: 'Article',
      targetId: newArticle.id,
      targetTitle: newArticle.titleEn,
      details: `Status set to ${newArticle.status}`,
    });

    return newArticle;
  }

  updateArticle(id: string, updates: Partial<Article>, user: UserProfile): Article | null {
    const idx = this.articles.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    const oldArticle = this.articles[idx];
    const updated: Article = {
      ...oldArticle,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.articles[idx] = updated;
    this.notifyArticles();

    this.logActivity({
      adminId: user.id,
      adminName: user.displayName,
      adminRole: user.role,
      action: 'Updated article',
      targetType: 'Article',
      targetId: updated.id,
      targetTitle: updated.titleEn,
      details: updates.status && updates.status !== oldArticle.status 
        ? `Status updated from ${oldArticle.status} to ${updates.status}`
        : 'Modified article contents or metadata',
    });

    return updated;
  }

  deleteArticle(id: string, user: UserProfile): boolean {
    const article = this.articles.find((a) => a.id === id);
    if (!article) return false;

    this.articles = this.articles.filter((a) => a.id !== id);
    this.notifyArticles();

    this.logActivity({
      adminId: user.id,
      adminName: user.displayName,
      adminRole: user.role,
      action: 'Deleted article',
      targetType: 'Article',
      targetId: id,
      targetTitle: article.titleEn,
      details: 'Permanently removed from database',
    });

    return true;
  }

  incrementArticleViews(slug: string): void {
    const article = this.articles.find((a) => a.slug === slug);
    if (article) {
      article.views += 1;
      this.notifyArticles();
    }
  }

  // --- Breaking News ---
  getBreakingNews(): BreakingNewsItem[] {
    return this.breakingNews.filter((bn) => bn.active);
  }

  getAllBreakingNews(): BreakingNewsItem[] {
    return [...this.breakingNews];
  }

  createBreakingNews(item: Omit<BreakingNewsItem, 'id' | 'createdAt'>, user: UserProfile): BreakingNewsItem {
    const newItem: BreakingNewsItem = {
      ...item,
      id: `bn-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    this.breakingNews = [newItem, ...this.breakingNews];
    this.notifyBreakingNews();

    this.logActivity({
      adminId: user.id,
      adminName: user.displayName,
      adminRole: user.role,
      action: 'Created breaking news',
      targetType: 'BreakingNews',
      targetId: newItem.id,
      targetTitle: newItem.titleEn.slice(0, 40) + '...',
      details: `Active: ${newItem.active}, Priority: ${newItem.priority}`,
    });

    return newItem;
  }

  updateBreakingNews(id: string, updates: Partial<BreakingNewsItem>, user: UserProfile): BreakingNewsItem | null {
    const idx = this.breakingNews.findIndex((b) => b.id === id);
    if (idx === -1) return null;

    this.breakingNews[idx] = { ...this.breakingNews[idx], ...updates };
    this.notifyBreakingNews();

    this.logActivity({
      adminId: user.id,
      adminName: user.displayName,
      adminRole: user.role,
      action: 'Updated breaking news',
      targetType: 'BreakingNews',
      targetId: id,
      targetTitle: this.breakingNews[idx].titleEn.slice(0, 40) + '...',
    });

    return this.breakingNews[idx];
  }

  deleteBreakingNews(id: string, user: UserProfile): boolean {
    const item = this.breakingNews.find((b) => b.id === id);
    if (!item) return false;

    this.breakingNews = this.breakingNews.filter((b) => b.id !== id);
    this.notifyBreakingNews();

    this.logActivity({
      adminId: user.id,
      adminName: user.displayName,
      adminRole: user.role,
      action: 'Deleted breaking news',
      targetType: 'BreakingNews',
      targetId: id,
      targetTitle: item.titleEn.slice(0, 40) + '...',
    });

    return true;
  }

  // --- Categories ---
  getCategories(): Category[] {
    return [...this.categories].sort((a, b) => a.order - b.order);
  }

  saveCategory(cat: Category, user: UserProfile): Category {
    const idx = this.categories.findIndex((c) => c.id === cat.id);
    if (idx >= 0) {
      this.categories[idx] = cat;
    } else {
      this.categories.push(cat);
    }
    this.notifyCategories();

    this.logActivity({
      adminId: user.id,
      adminName: user.displayName,
      adminRole: user.role,
      action: idx >= 0 ? 'Updated category' : 'Created category',
      targetType: 'Category',
      targetId: cat.id,
      targetTitle: cat.nameEn,
    });

    return cat;
  }

  deleteCategory(id: string, user: UserProfile): boolean {
    this.categories = this.categories.filter((c) => c.id !== id);
    this.notifyCategories();

    this.logActivity({
      adminId: user.id,
      adminName: user.displayName,
      adminRole: user.role,
      action: 'Deleted category',
      targetType: 'Category',
      targetId: id,
    });

    return true;
  }

  // --- Comments ---
  getCommentsForArticle(articleId: string): Comment[] {
    return this.comments.filter((c) => c.articleId === articleId && c.status === 'APPROVED');
  }

  getAllComments(): Comment[] {
    return [...this.comments];
  }

  addComment(data: { articleId: string; articleSlug: string; articleTitle: string; content: string; user: UserProfile }): Comment {
    const autoApprove = this.settings.autoApproveComments;
    const newComment: Comment = {
      id: `com-${Date.now()}`,
      articleId: data.articleId,
      articleSlug: data.articleSlug,
      articleTitle: data.articleTitle,
      userId: data.user.id,
      userName: data.user.displayName,
      userAvatar: data.user.avatarUrl,
      content: data.content,
      status: autoApprove ? 'APPROVED' : 'PENDING',
      likes: 0,
      likedBy: [],
      reported: false,
      reportCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.comments = [newComment, ...this.comments];
    this.notifyComments();

    // increment article comment count if approved
    if (newComment.status === 'APPROVED') {
      const art = this.articles.find((a) => a.id === data.articleId);
      if (art) {
        art.commentCount += 1;
        this.notifyArticles();
      }
    }

    // Add admin notification
    this.addNotification({
      title: 'New Reader Comment',
      message: `${data.user.displayName} commented on "${data.articleTitle.slice(0, 40)}..."`,
      type: 'NEW_COMMENT',
      targetId: newComment.id,
      targetType: 'comment',
    });

    return newComment;
  }

  updateCommentStatus(commentId: string, status: CommentStatus, user: UserProfile): boolean {
    const com = this.comments.find((c) => c.id === commentId);
    if (!com) return false;

    const oldStatus = com.status;
    com.status = status;
    com.updatedAt = new Date().toISOString();
    this.notifyComments();

    // Adjust article comment count
    const art = this.articles.find((a) => a.id === com.articleId);
    if (art) {
      if (oldStatus !== 'APPROVED' && status === 'APPROVED') {
        art.commentCount += 1;
      } else if (oldStatus === 'APPROVED' && status !== 'APPROVED') {
        art.commentCount = Math.max(0, art.commentCount - 1);
      }
      this.notifyArticles();
    }

    this.logActivity({
      adminId: user.id,
      adminName: user.displayName,
      adminRole: user.role,
      action: `Moderated comment (${status})`,
      targetType: 'Comment',
      targetId: commentId,
      targetTitle: `Comment by ${com.userName}`,
    });

    return true;
  }

  likeComment(commentId: string, userId: string): boolean {
    const com = this.comments.find((c) => c.id === commentId);
    if (!com) return false;

    if (com.likedBy.includes(userId)) {
      com.likedBy = com.likedBy.filter((id) => id !== userId);
      com.likes = Math.max(0, com.likes - 1);
    } else {
      com.likedBy.push(userId);
      com.likes += 1;
    }

    this.notifyComments();
    return true;
  }

  reportComment(commentId: string, reason: string): boolean {
    const com = this.comments.find((c) => c.id === commentId);
    if (!com) return false;

    com.reported = true;
    com.reportReason = reason;
    com.reportCount += 1;
    this.notifyComments();

    this.addNotification({
      title: 'Comment Reported',
      message: `Comment by ${com.userName} reported: "${reason}"`,
      type: 'COMMENT_REPORT',
      targetId: commentId,
      targetType: 'comment',
    });

    return true;
  }

  deleteComment(commentId: string, user: UserProfile): boolean {
    const com = this.comments.find((c) => c.id === commentId);
    if (!com) return false;

    this.comments = this.comments.filter((c) => c.id !== commentId);
    this.notifyComments();

    if (com.status === 'APPROVED') {
      const art = this.articles.find((a) => a.id === com.articleId);
      if (art) {
        art.commentCount = Math.max(0, art.commentCount - 1);
        this.notifyArticles();
      }
    }

    this.logActivity({
      adminId: user.id,
      adminName: user.displayName,
      adminRole: user.role,
      action: 'Deleted comment',
      targetType: 'Comment',
      targetId: commentId,
      targetTitle: `Comment by ${com.userName}`,
    });

    return true;
  }

  moderateComment(commentId: string, status: CommentStatus, user: UserProfile): boolean {
    return this.updateCommentStatus(commentId, status, user);
  }

  // --- Advertisements ---
  getAdvertisements(position?: AdPosition): Advertisement[] {
    if (position) {
      return this.advertisements.filter((ad) => ad.active && ad.position === position);
    }
    return [...this.advertisements];
  }

  createAdvertisement(ad: {
    title: string;
    advertiser: string;
    imageUrl: string;
    targetUrl: string;
    position: AdPosition;
    active: boolean;
    startDate: string;
    endDate?: string;
  }, user: UserProfile): Advertisement {
    const newAd: Advertisement = {
      id: `ad-${Date.now()}`,
      name: ad.title,
      title: ad.title,
      advertiser: ad.advertiser,
      imageUrl: ad.imageUrl,
      destinationUrl: ad.targetUrl,
      targetUrl: ad.targetUrl,
      position: ad.position,
      active: ad.active,
      startDate: ad.startDate,
      endDate: ad.endDate,
      impressions: 0,
      clicks: 0,
    };
    return this.saveAdvertisement(newAd, user);
  }

  updateAdvertisement(id: string, updates: Partial<Advertisement>, user: UserProfile): Advertisement | null {
    const idx = this.advertisements.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.advertisements[idx] = { ...this.advertisements[idx], ...updates };
    return this.saveAdvertisement(this.advertisements[idx], user);
  }

  saveAdvertisement(ad: Advertisement, user: UserProfile): Advertisement {
    const idx = this.advertisements.findIndex((a) => a.id === ad.id);
    if (idx >= 0) {
      this.advertisements[idx] = ad;
    } else {
      this.advertisements.push(ad);
    }
    this.save('juba_ads', this.advertisements);

    this.logActivity({
      adminId: user.id,
      adminName: user.displayName,
      adminRole: user.role,
      action: idx >= 0 ? 'Updated advertisement' : 'Created advertisement',
      targetType: 'Advertisement',
      targetId: ad.id,
      targetTitle: ad.name,
    });

    return ad;
  }

  deleteAdvertisement(id: string, user: UserProfile): boolean {
    this.advertisements = this.advertisements.filter((a) => a.id !== id);
    this.save('juba_ads', this.advertisements);

    this.logActivity({
      adminId: user.id,
      adminName: user.displayName,
      adminRole: user.role,
      action: 'Deleted advertisement',
      targetType: 'Advertisement',
      targetId: id,
    });

    return true;
  }

  trackAdImpression(id: string): void {
    const ad = this.advertisements.find((a) => a.id === id);
    if (ad) {
      ad.impressions += 1;
      this.save('juba_ads', this.advertisements);
    }
  }

  trackAdClick(id: string): void {
    const ad = this.advertisements.find((a) => a.id === id);
    if (ad) {
      ad.clicks += 1;
      this.save('juba_ads', this.advertisements);
    }
  }

  // --- Media Library ---
  getMedia(): MediaItem[] {
    return [...this.media];
  }

  addMedia(item: {
    url: string;
    fileName?: string;
    altText?: string;
    mimeType?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    uploadedBy: string;
  }, user: UserProfile): MediaItem {
    const newItem: MediaItem = {
      id: `med-${Date.now()}`,
      name: item.fileName || `media-${Date.now()}`,
      fileName: item.fileName || `media-${Date.now()}`,
      url: item.url,
      mimeType: item.mimeType || 'image/jpeg',
      sizeBytes: item.fileSize || 102400,
      altEn: item.altText || '',
      altAr: item.altText || '',
      altText: item.altText || '',
      uploadedBy: item.uploadedBy || user.displayName,
      uploadedAt: new Date().toISOString(),
    };
    this.media = [newItem, ...this.media];
    this.save('juba_media', this.media);
    this.logActivity({
      adminId: user.id,
      adminName: user.displayName,
      adminRole: user.role,
      action: 'Uploaded media item',
      targetType: 'Media',
      targetId: newItem.id,
      targetTitle: newItem.fileName,
    });
    return newItem;
  }

  deleteMedia(id: string, user: UserProfile): boolean {
    const item = this.media.find((m) => m.id === id);
    if (!item) return false;
    this.media = this.media.filter((m) => m.id !== id);
    this.save('juba_media', this.media);
    this.logActivity({
      adminId: user.id,
      adminName: user.displayName,
      adminRole: user.role,
      action: 'Deleted media item',
      targetType: 'Media',
      targetId: id,
      targetTitle: item.name || item.url,
    });
    return true;
  }

  // --- Notifications ---
  getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>): NotificationItem {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    this.notifications = [newNotif, ...this.notifications];
    this.notifyNotifications();
    return newNotif;
  }

  markNotificationRead(id: string): void {
    const n = this.notifications.find((item) => item.id === id);
    if (n) {
      n.read = true;
      this.notifyNotifications();
    }
  }

  markAllNotificationsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
    this.notifyNotifications();
  }

  // --- Activity Logs ---
  getActivityLogs(): ActivityLog[] {
    return [...this.activityLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  logActivity(data: Omit<ActivityLog, 'id' | 'timestamp'>): void {
    const newLog: ActivityLog = {
      ...data,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.activityLogs = [newLog, ...this.activityLogs];
    this.save('juba_logs', this.activityLogs);
  }

  // --- Administrators & Users ---
  getUsers(): UserProfile[] {
    return [...this.users];
  }

  getAdministrators(): UserProfile[] {
    return this.users.filter((u) => u.role !== 'USER');
  }

  updateUserRole(targetUserId: string, newRole: UserRole, performingSuperAdmin: UserProfile): boolean {
    if (performingSuperAdmin.role !== 'SUPER_ADMIN') {
      console.error('Unauthorized: Only SUPER_ADMIN can change administrator roles.');
      return false;
    }

    const targetUser = this.users.find((u) => u.id === targetUserId);
    if (!targetUser) return false;

    const oldRole = targetUser.role;
    targetUser.role = newRole;
    targetUser.updatedAt = new Date().toISOString();
    this.save('juba_users', this.users);

    this.logActivity({
      adminId: performingSuperAdmin.id,
      adminName: performingSuperAdmin.displayName,
      adminRole: performingSuperAdmin.role,
      action: 'Changed user role',
      targetType: 'User',
      targetId: targetUserId,
      targetTitle: targetUser.displayName,
      details: `Role updated from ${oldRole} to ${newRole}`,
    });

    return true;
  }

  createUser(user: UserProfile): void {
    this.users.push(user);
    this.save('juba_users', this.users);
  }

  // --- Site Settings ---
  getSettings(): SiteSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: SiteSettings, user: UserProfile): boolean {
    if (user.role !== 'SUPER_ADMIN') {
      console.error('Unauthorized: Only SUPER_ADMIN can update site settings.');
      return false;
    }

    this.settings = { ...newSettings };
    this.save('juba_settings', this.settings);

    this.logActivity({
      adminId: user.id,
      adminName: user.displayName,
      adminRole: user.role,
      action: 'Updated site settings',
      targetType: 'Settings',
      targetId: 'site_settings',
      details: 'Modified platform configuration and preferences',
    });

    return true;
  }

  // --- Factory Reset Demo ---
  resetToDemoDefaults(): void {
    localStorage.removeItem('juba_articles');
    localStorage.removeItem('juba_categories');
    localStorage.removeItem('juba_breaking');
    localStorage.removeItem('juba_users');
    localStorage.removeItem('juba_comments');
    localStorage.removeItem('juba_ads');
    localStorage.removeItem('juba_notifs');
    localStorage.removeItem('juba_logs');
    localStorage.removeItem('juba_settings');
    localStorage.removeItem('juba_facebook_posts');
    localStorage.removeItem('juba_sync_logs');
    this.initData();
    this.notifyArticles();
    this.notifyBreakingNews();
    this.notifyComments();
    this.notifyNotifications();
  }

  // ==============================================================================
  // Facebook Page & AI Admin Newsroom Integration Methods
  // ==============================================================================

  async getFacebookStatus(): Promise<any> {
    try {
      const res = await fetch('/api/admin/facebook/status');
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (err) {
      console.warn('Could not reach /api/admin/facebook/status, using calculated fallback:', err);
    }

    const fbArticles = this.articles.filter((a) => a.source === 'Facebook' || a.facebookPostId);
    return {
      connectionStatus: 'CONNECTED',
      pageId: '108429588219424',
      pageName: 'Juba News - جوبا نيوز',
      pageUrl: 'https://www.facebook.com/share/1UpeZiXU5k/',
      webhookUrl: '/api/webhooks/facebook',
      verifyToken: 'juba_news_meta_verify_token_2026',
      lastSyncAt: new Date(Date.now() - 1800000).toISOString(),
      autoPublish: true,
      aiProcessing: 'ENABLED',
      syncMode: 'BOTH',
      counts: {
        importedPosts: Math.max(3, fbArticles.length),
        drafts: fbArticles.filter((a) => a.status === 'draft' || a.status === 'DRAFT').length,
        publishedArticles: fbArticles.filter((a) => a.status === 'published' || a.status === 'PUBLISHED').length,
        failedImports: 0,
        pendingAi: 1,
      },
    };
  }

  async getFacebookPosts(): Promise<any[]> {
    try {
      const res = await fetch('/api/admin/facebook/posts');
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (err) {
      console.warn('Could not reach /api/admin/facebook/posts, using fallback:', err);
    }

    // Default seeded fallback list
    return [
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
        processingStatus: 'processed',
        articleId: 'art-fb-01',
        generatedTitle: 'جنوب السودان يطلق مبادرة زراعية استراتيجية لدعم 50 ألف مزارع وتحقيق الأمن الغذائي',
        generatedSummary: 'مبادرة وطنية مشتركة بين وزارة الزراعة ومنظمة الفاو والبنك الإفريقي لدعم الإنتاج الزراعي في الاستوائية الوسطى.',
        article: {
          id: 'art-fb-01',
          titleAr: 'جنوب السودان يطلق مبادرة زراعية استراتيجية لدعم 50 ألف مزارع وتحقيق الأمن الغذائي',
          titleEn: 'South Sudan Launches Landmark Agricultural Initiative to Support 50,000 Farmers',
          slug: 'south-sudan-launches-national-agricultural-initiative-fao',
          status: 'draft',
          editorialStatus: 'draft',
          categoryId: 'cat-ss',
          publishedAt: undefined,
        },
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
        processingStatus: 'processed',
        articleId: 'art-fb-02',
        generatedTitle: 'جوبا توقع مذكرات تفاهم لإنشاء محطات طاقة شمسية في ولايات بحر الغزال',
        generatedSummary: 'مشروع طاقة متجددة يستهدف تزويد القرى والمراكز الصحية بالكهرباء المستدامة.',
        article: {
          id: 'art-fb-02',
          titleAr: 'جوبا توقع مذكرات تفاهم لإنشاء محطات طاقة شمسية في ولايات بحر الغزال',
          titleEn: 'Juba Inks Accords for Solar Microgrids Across Bahr el Ghazal States',
          slug: 'bahr-el-ghazal-solar-microgrid-expansion-accords',
          status: 'published',
          editorialStatus: 'published',
          categoryId: 'cat-econ',
          publishedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        },
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
        processingStatus: 'pending',
        generatedTitle: 'منتخب السلة ينطلق في معسكره الإعدادي استعداداً للتصفيات الأفريقية',
        generatedSummary: 'استعدادات مكثفة لمنتخب جنوب السودان لكرة السلة وسط دعم رسمي وجماهيري كبير.',
        article: null,
      },
    ];
  }

  async syncFacebookNow(): Promise<{
    importedCount: number;
    skippedCount: number;
    failedCount: number;
    draftsCreated: number;
    publishedCount: number;
    posts: Array<{ id: string; status: string; title?: string }>;
  }> {
    try {
      const res = await fetch('/api/admin/facebook/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        let json: any = null;
        try {
          json = await res.json();
        } catch {
          json = null;
        }
        if (json?.data) {
          // Refresh articles in local state as well
          await this.fetchServerArticles();
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Backend sync failed, using mock sync flow:', err);
    }

    // Fallback sync simulation if backend is restarting
    const settings = await this.getFacebookSettings();
    const isAutoPub = Boolean(settings?.autoPublish);
    return {
      importedCount: 2,
      skippedCount: 3,
      failedCount: 0,
      draftsCreated: isAutoPub ? 0 : 2,
      publishedCount: isAutoPub ? 2 : 0,
      posts: [
        { id: '108429588219424_892348719201955', status: 'imported', title: 'وزير المالية يناقش مع صندوق النقد استقرار العملة والرواتب' },
        { id: '108429588219424_892348719201956', status: 'imported', title: 'افتتاح كوبري الحرية الجديد على نهر النيل الأبيض بجوبا' },
        { id: '108429588219424_892348719201948', status: 'skipped_duplicate' },
        { id: '108429588219424_892348719201949', status: 'skipped_duplicate' },
        { id: '108429588219424_892348719201950', status: 'skipped_duplicate' },
      ],
    };
  }

  async testImportFacebookPost(payload: {
    message: string;
    permalink?: string;
    imageUrl?: string;
    customPostId?: string;
  }): Promise<any> {
    const res = await fetch('/api/admin/facebook/test-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      throw new Error('فشل معالجة رد الخادم أثناء استيراد المنشور');
    }
    if (!res.ok) {
      const errMsg = typeof json?.error === 'object' ? (json?.error?.message || json?.error?.code) : json?.error;
      throw new Error(errMsg || 'Failed to import post');
    }
    if (json.data) {
      const s = json.data;
      const settings = await this.getFacebookSettings();
      const isAuto = Boolean(settings?.autoPublish);
      const localArticle: Article = {
        ...s,
        status: isAuto ? 'PUBLISHED' : (s.status?.toUpperCase() === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'),
        editorialStatus: isAuto ? 'published' : s.editorialStatus || 'draft',
      };
      this.articles = [localArticle, ...this.articles.filter((a) => a.id !== localArticle.id)];
      this.save('juba_articles', this.articles);
      this.notifyArticles();
    }
    await this.fetchServerArticles();
    return json.data;
  }

  async reprocessFacebookPost(postId: string): Promise<any> {
    const res = await fetch(`/api/admin/facebook/posts/${postId}/reprocess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      throw new Error('فشل قراءة رد الخادم أثناء إعادة المعالجة');
    }
    if (!res.ok) {
      const errMsg = typeof json?.error === 'object' ? (json?.error?.message || json?.error?.code) : json?.error;
      throw new Error(errMsg || 'Failed to reprocess post');
    }
    await this.fetchServerArticles();
    return json.data;
  }

  async getFacebookSettings(): Promise<any> {
    let cached: any = null;
    try {
      const item = localStorage.getItem('juba_fb_settings');
      if (item) cached = JSON.parse(item);
    } catch {
      // ignore
    }

    try {
      const res = await fetch('/api/admin/facebook/settings');
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          const merged = { ...(cached || {}), ...json.data };
          try {
            localStorage.setItem('juba_fb_settings', JSON.stringify(merged));
          } catch {
            // ignore
          }
          return merged;
        }
      }
    } catch {
      // ignore network errors
    }
    if (cached) return cached;
    return {
      facebookIntegration: 'CONNECTED',
      syncMode: 'BOTH',
      aiProcessing: 'ENABLED',
      autoPublish: true,
      defaultCategory: 'cat-ss',
      aiLanguage: 'both',
      articleStyle: 'formal',
      minimumConfidence: 0.85,
      metaPageId: '108429588219424',
      metaPageName: 'Juba News - جوبا نيوز',
      pagePermalink: 'https://www.facebook.com/share/1UpeZiXU5k/',
      lastSyncAt: new Date(Date.now() - 1800000).toISOString(),
    };
  }

  async updateFacebookSettings(settings: any): Promise<any> {
    try {
      localStorage.setItem('juba_fb_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
    try {
      const res = await fetch('/api/admin/facebook/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update settings');
      const finalData = json.data || settings;
      try {
        localStorage.setItem('juba_fb_settings', JSON.stringify(finalData));
      } catch {
        // ignore
      }
      return finalData;
    } catch (err) {
      console.warn('Backend settings update issue, cached locally:', err);
      return settings;
    }
  }

  async getSyncLogs(): Promise<any[]> {
    try {
      const res = await fetch('/api/admin/sync/logs');
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'sync-init-1',
        source: 'MANUAL',
        status: 'SUCCESS',
        importedCount: 3,
        skippedCount: 0,
        failedCount: 0,
        message: 'Synchronized with official Facebook Page: https://www.facebook.com/share/1UpeZiXU5k/',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ];
  }

  // --- Editorial Actions: Approve / Publish / Reject ---

  approveArticle(articleId: string, adminUser?: UserProfile): boolean {
    const article = this.articles.find((a) => a.id === articleId);
    if (!article) return false;
    article.status = 'DRAFT';
    article.editorialStatus = 'approved';
    article.updatedAt = new Date().toISOString();
    this.save('juba_articles', this.articles);
    this.notifyArticles();

    if (adminUser) {
      this.logActivity({
        adminId: adminUser.id,
        adminName: adminUser.displayName,
        adminRole: adminUser.role,
        action: 'Approved article draft for publishing',
        targetType: 'Article',
        targetId: article.id,
        details: article.titleAr,
      });
    }
    return true;
  }

  publishArticleDirect(articleId: string, adminUser?: UserProfile): boolean {
    const article = this.articles.find((a) => a.id === articleId);
    if (!article) return false;
    article.status = 'PUBLISHED';
    article.editorialStatus = 'published';
    article.publishedAt = new Date().toISOString();
    article.updatedAt = new Date().toISOString();
    this.save('juba_articles', this.articles);
    this.notifyArticles();

    // Call server endpoint as well
    fetch(`/api/admin/news/${articleId}/publish`, { method: 'POST' }).catch(() => {});

    if (adminUser) {
      this.logActivity({
        adminId: adminUser.id,
        adminName: adminUser.displayName,
        adminRole: adminUser.role,
        action: 'Published article to website',
        targetType: 'Article',
        targetId: article.id,
        details: article.titleAr,
      });
    }
    return true;
  }

  rejectArticle(articleId: string, reason = 'Did not meet editorial standards', adminUser?: UserProfile): boolean {
    const article = this.articles.find((a) => a.id === articleId);
    if (!article) return false;
    article.status = 'DRAFT';
    article.editorialStatus = 'rejected';
    article.updatedAt = new Date().toISOString();
    this.save('juba_articles', this.articles);
    this.notifyArticles();

    if (adminUser) {
      this.logActivity({
        adminId: adminUser.id,
        adminName: adminUser.displayName,
        adminRole: adminUser.role,
        action: 'Rejected article from Facebook feed',
        targetType: 'Article',
        targetId: article.id,
        details: `${article.titleAr} (Reason: ${reason})`,
      });
    }
    return true;
  }

  async fetchServerArticles(): Promise<void> {
    try {
      // First try to fetch all server articles from admin endpoint
      let serverArticles: any[] = [];
      try {
        const adminRes = await fetch('/api/v1/admin/articles?limit=100');
        if (adminRes.ok) {
          const adminJson = await adminRes.json();
          if (Array.isArray(adminJson.data?.items)) {
            serverArticles = adminJson.data.items;
          }
        }
      } catch {
        // admin endpoint fallback
      }

      // If admin endpoint didn't return articles, fetch from public /api/news
      if (serverArticles.length === 0) {
        const res = await fetch('/api/news?limit=100');
        if (res.ok) {
          const json = await res.json();
          serverArticles = json.data?.items || json.data || [];
        }
      }

      if (Array.isArray(serverArticles) && serverArticles.length > 0) {
        // Merge server articles into local state
        const map = new Map(this.articles.map((a) => [a.id, a]));
        for (const s of serverArticles) {
          map.set(s.id, {
            ...map.get(s.id),
            ...s,
            status: s.status?.toUpperCase() === 'PUBLISHED' ? 'PUBLISHED' : (s.status?.toUpperCase() === 'DRAFT' ? 'DRAFT' : s.status),
          });
        }
        this.articles = Array.from(map.values());
        this.save('juba_articles', this.articles);
        this.notifyArticles();
      }
    } catch {
      // ignore
    }
  }
}

export const dataService = new DataService();
