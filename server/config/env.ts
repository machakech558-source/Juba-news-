import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: 3000,
  host: '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET || 'juba-news-secure-jwt-secret-key-prod-2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'juba-news-secure-jwt-refresh-secret-2026',
  accessTokenExpiresInMinutes: 15,
  refreshTokenExpiresInDays: 7,
  adminRateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  adminMaxLoginAttempts: 5, // Lock after 5 attempts
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  initialSuperAdminEmail: process.env.INITIAL_ADMIN_EMAIL || 'anwar.youal@jubanews.org',
  initialSuperAdminPassword: process.env.INITIAL_ADMIN_PASSWORD || 'Lucky#2021.super',
  meta: {
    appId: process.env.META_APP_ID || '',
    appSecret: process.env.META_APP_SECRET || '',
    pageId: process.env.META_PAGE_ID || '108429588219424',
    pageAccessToken: process.env.META_PAGE_ACCESS_TOKEN || '',
    verifyToken: process.env.META_VERIFY_TOKEN || 'juba_news_meta_verify_token_2026',
    apiVersion: process.env.META_API_VERSION || 'v21.0',
    pageUrl: 'https://www.facebook.com/share/1UpeZiXU5k/',
  },
};
