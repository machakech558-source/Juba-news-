export type Language = 'en' | 'ar';

export interface Translations {
  siteName: string;
  tagline: string;
  breakingNews: string;
  latestNews: string;
  readMore: string;
  minutesRead: string;
  publishedOn: string;
  updatedOn: string;
  byAuthor: string;
  shareStory: string;
  relatedArticles: string;
  comments: string;
  leaveComment: string;
  submitComment: string;
  commentPlaceholder: string;
  reply: string;
  report: string;
  like: string;
  searchPlaceholder: string;
  searchResultsFor: string;
  noResultsFound: string;
  filterByCategory: string;
  allCategories: string;
  sortBy: string;
  newestFirst: string;
  mostViewed: string;
  viewAll: string;
  sponsored: string;
  adminDashboard: string;
  login: string;
  register: string;
  logout: string;
  profile: string;
  email: string;
  password: string;
  fullName: string;
  role: string;
  status: string;
  actions: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  create: string;
  publish: string;
  unpublish: string;
  draft: string;
  pendingReview: string;
  approved: string;
  scheduled: string;
  superAdmin: string;
  adminOne: string;
  adminTwo: string;
  moderator: string;
  citizen: string;
  aboutUs: string;
  privacyPolicy: string;
  termsOfService: string;
  contactUs: string;
  rightsReserved: string;
  editorialStandards: string;
  pressInquiries: string;
  sampleDataNotice: string;
  southSudanFocus: string;
  quickDemoLogin: string;
  activeRole: string;
  switchRole: string;
  views: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    siteName: 'Juba News',
    tagline: 'The Voice of South Sudan, Africa & The World',
    breakingNews: 'Breaking News',
    latestNews: 'Latest Stories',
    readMore: 'Read Full Story',
    minutesRead: 'min read',
    publishedOn: 'Published',
    updatedOn: 'Updated',
    byAuthor: 'By',
    shareStory: 'Share Story',
    relatedArticles: 'Related Stories',
    comments: 'Comments',
    leaveComment: 'Leave a Comment',
    submitComment: 'Post Comment',
    commentPlaceholder: 'Write your thoughts on this story respectfully...',
    reply: 'Reply',
    report: 'Report',
    like: 'Like',
    searchPlaceholder: 'Search news, topics, leaders, reports...',
    searchResultsFor: 'Search results for',
    noResultsFound: 'No articles found matching your criteria',
    filterByCategory: 'Filter by category',
    allCategories: 'All Categories',
    sortBy: 'Sort by',
    newestFirst: 'Newest First',
    mostViewed: 'Most Viewed',
    viewAll: 'View All',
    sponsored: 'Sponsored Partner',
    adminDashboard: 'Editorial CMS',
    login: 'Sign In',
    register: 'Create Account',
    logout: 'Sign Out',
    profile: 'Profile',
    email: 'Email Address',
    password: 'Password',
    fullName: 'Full Name',
    role: 'Role',
    status: 'Status',
    actions: 'Actions',
    save: 'Save Changes',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit Article',
    create: 'Create New Article',
    publish: 'Publish Now',
    unpublish: 'Send to Draft',
    draft: 'Draft',
    pendingReview: 'Pending Review',
    approved: 'Approved',
    scheduled: 'Scheduled',
    superAdmin: 'Super Administrator',
    adminOne: 'Admin One (Senior Editor)',
    adminTwo: 'Admin Two (Associate Editor)',
    moderator: 'Moderator',
    citizen: 'Verified Reader',
    aboutUs: 'About Juba News',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    contactUs: 'Contact Editorial Desk',
    rightsReserved: 'All rights reserved. Juba News Independent Press.',
    editorialStandards: 'Editorial Standards & Charter',
    pressInquiries: 'Press & Media Inquiries',
    sampleDataNotice: 'DEMO / SAMPLE DATA: Published for demonstration purposes.',
    southSudanFocus: 'South Sudan National Spotlight',
    quickDemoLogin: 'Quick Role Switcher',
    activeRole: 'Active Identity',
    switchRole: 'Switch Identity',
    views: 'views',
  },
  ar: {
    siteName: 'جوبا نيوز',
    tagline: 'صوت جنوب السودان وأفريقيا والعالم',
    breakingNews: 'عاجل',
    latestNews: 'آخر الأخبار',
    readMore: 'قراءة الخبر كاملاً',
    minutesRead: 'دقيقة للقراءة',
    publishedOn: 'نُشر في',
    updatedOn: 'تحديث في',
    byAuthor: 'بقلم',
    shareStory: 'مشاركة الخبر',
    relatedArticles: 'أخبار ذات صلة',
    comments: 'التعليقات',
    leaveComment: 'أضف تعليقك',
    submitComment: 'إرسال التعليق',
    commentPlaceholder: 'شاركنا برأيك باحترام وموضوعية حول هذا الخبر...',
    reply: 'رد',
    report: 'إبلاغ',
    like: 'إعجاب',
    searchPlaceholder: 'ابحث في الأخبار، المواضيع، القيادات والتقارير...',
    searchResultsFor: 'نتائج البحث عن',
    noResultsFound: 'لم يتم العثور على أية أخبار تطابق بحثك',
    filterByCategory: 'تصفية حسب القسم',
    allCategories: 'جميع الأقسام',
    sortBy: 'ترتيب حسب',
    newestFirst: 'الأحدث أولاً',
    mostViewed: 'الأكثر قراءة',
    viewAll: 'عرض المزيد',
    sponsored: 'شريك إعلاني',
    adminDashboard: 'لوحة التحكم التحريرية',
    login: 'تسجيل الدخول',
    register: 'حساب جديد',
    logout: 'تسجيل الخروج',
    profile: 'الملف الشخصي',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    fullName: 'الاسم الكامل',
    role: 'الصلاحية',
    status: 'الحالة',
    actions: 'الإجراءات',
    save: 'حفظ التعديلات',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل الخبر',
    create: 'إنشاء خبر جديد',
    publish: 'نشر فوري',
    unpublish: 'تحويل إلى مسودة',
    draft: 'مسودة',
    pendingReview: 'قيد المراجعة',
    approved: 'معتمد للنشر',
    scheduled: 'مجدول',
    superAdmin: 'المشرف العام (Super Admin)',
    adminOne: 'المدير الأول (رئيس التحرير)',
    adminTwo: 'المدير الثاني (محرر تنفيذي)',
    moderator: 'مشرف تعليقات',
    citizen: 'قارئ معتمد',
    aboutUs: 'عن جوبا نيوز',
    privacyPolicy: 'سياسة الخصوصية',
    termsOfService: 'شروط الاستخدام',
    contactUs: 'اتصل بهيئة التحرير',
    rightsReserved: 'جميع الحقوق محفوظة. جوبا نيوز للصحافة المستقلة.',
    editorialStandards: 'المعايير التحريرية والميثاق المهني',
    pressInquiries: 'استفسارات الصحافة والإعلام',
    sampleDataNotice: 'محتوى تجريبي: يُعرض لأغراض المعاينة والتوضيح التقني.',
    southSudanFocus: 'الملف الوطني: جنوب السودان',
    quickDemoLogin: 'تبديل الصلاحية السريع',
    activeRole: 'الهوية الحالية',
    switchRole: 'تبديل الهوية',
    views: 'مشاهدة',
  },
};
