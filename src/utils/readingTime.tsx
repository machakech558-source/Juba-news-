import React from 'react';
import { Clock } from 'lucide-react';
import type { Article } from '../types';

export interface ArticleTextSource {
  contentAr?: string;
  contentEn?: string;
  excerptAr?: string;
  excerptEn?: string;
  titleAr?: string;
  titleEn?: string;
  readingTimeMinutes?: number;
}

/**
 * Standard adult silent reading speed for news articles:
 * ~200-220 words per minute for English, ~180-200 words per minute for Arabic.
 */
const WORDS_PER_MINUTE_EN = 200;
const WORDS_PER_MINUTE_AR = 180;

/**
 * Strips HTML, Markdown, and extraneous punctuation, then calculates accurate word count.
 * Works seamlessly with Arabic (including diacritics/tashkeel), English, and mixed multilingual texts.
 */
export function countWords(text?: string | null): number {
  if (!text || typeof text !== 'string') return 0;

  // 1. Remove HTML tags
  const noHtml = text.replace(/<[^>]*>/g, ' ');

  // 2. Remove Markdown links, images, code blocks, bold/italics
  const cleanMarkdown = noHtml
    .replace(/!\[.*?\]\(.*?\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`.*?`/g, ' ')
    .replace(/[*_~#]/g, ' ');

  // 3. Remove URLs
  const noUrls = cleanMarkdown.replace(/https?:\/\/\S+/gi, ' ');

  // 4. Normalize Arabic diacritics (harakat/tatweel) so they don't break word matching
  const normalized = noUrls
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .trim();

  if (!normalized) return 0;

  // 5. Split by whitespace and filter valid word tokens (contain at least one letter or number)
  const tokens = normalized.split(/\s+/).filter(token => {
    // Unicode regex: match any letter (L) or number (N)
    return /[\p{L}\p{N}]/u.test(token);
  });

  return tokens.length;
}

/**
 * Calculates estimated reading time in minutes based on word count.
 * Returns at least 1 minute.
 */
export function calculateReadingTimeMinutes(
  textOrWordCount: string | number,
  language: 'ar' | 'en' = 'ar'
): number {
  const wpm = language === 'ar' ? WORDS_PER_MINUTE_AR : WORDS_PER_MINUTE_EN;
  const words = typeof textOrWordCount === 'number' 
    ? textOrWordCount 
    : countWords(textOrWordCount);

  if (words <= 0) return 1;

  const minutes = Math.ceil(words / wpm);
  return Math.max(1, minutes);
}

/**
 * Calculates accurate reading time for an Article object based on actual word count.
 * Uses content of current language, falls back to the other language or excerpt.
 */
export function getArticleReadingTime(
  article: ArticleTextSource,
  language: 'ar' | 'en' = 'ar'
): number {
  if (!article) return 1;

  // Determine primary and secondary text based on active language
  const primaryContent = language === 'ar' 
    ? (article.contentAr || article.excerptAr || '')
    : (article.contentEn || article.excerptEn || '');

  const secondaryContent = language === 'ar'
    ? (article.contentEn || article.excerptEn || '')
    : (article.contentAr || article.excerptAr || '');

  const primaryWordCount = countWords(primaryContent);

  if (primaryWordCount >= 30) {
    return calculateReadingTimeMinutes(primaryWordCount, language);
  }

  const secondaryWordCount = countWords(secondaryContent);
  if (secondaryWordCount >= 30) {
    return calculateReadingTimeMinutes(secondaryWordCount, language === 'ar' ? 'en' : 'ar');
  }

  // If content is short but non-empty (e.g. short brief or Facebook post)
  if (primaryWordCount > 0) {
    return calculateReadingTimeMinutes(primaryWordCount, language);
  }

  if (secondaryWordCount > 0) {
    return calculateReadingTimeMinutes(secondaryWordCount, language === 'ar' ? 'en' : 'ar');
  }

  // Fallback to pre-saved readingTimeMinutes if present
  if (article.readingTimeMinutes && article.readingTimeMinutes > 0) {
    return article.readingTimeMinutes;
  }

  return 2;
}

/**
 * Returns the exact word count for an article in the active language.
 */
export function getArticleWordCount(
  article: ArticleTextSource,
  language: 'ar' | 'en' = 'ar'
): number {
  if (!article) return 0;
  const content = language === 'ar'
    ? (article.contentAr || article.excerptAr || '')
    : (article.contentEn || article.excerptEn || '');
  return countWords(content);
}

/**
 * Formats the reading time minutes into a natural, grammatically correct phrase in Arabic or English.
 */
export function formatReadingTime(
  minutes: number,
  language: 'ar' | 'en' = 'ar',
  options?: { short?: boolean }
): string {
  const safeMinutes = Math.max(1, Math.round(minutes));

  if (language === 'ar') {
    if (options?.short) {
      return `${safeMinutes} د قراءة`;
    }
    if (safeMinutes === 1) return 'دقيقة واحدة للقراءة';
    if (safeMinutes === 2) return 'دقيقتان للقراءة';
    if (safeMinutes >= 3 && safeMinutes <= 10) return `${safeMinutes} دقائق قراءة`;
    return `${safeMinutes} دقيقة قراءة`;
  }

  // English
  if (options?.short) {
    return `${safeMinutes}m read`;
  }
  return safeMinutes === 1 ? '1 min read' : `${safeMinutes} min read`;
}

/**
 * Calculates and formats estimated reading time in a single convenient call.
 */
export function getArticleReadingTimeDisplay(
  article: ArticleTextSource,
  language: 'ar' | 'en' = 'ar',
  options?: { short?: boolean }
): string {
  const minutes = getArticleReadingTime(article, language);
  return formatReadingTime(minutes, language, options);
}

/**
 * React Component for displaying the estimated reading time badge with an icon.
 */
interface ReadingTimeBadgeProps {
  article: Article | ArticleTextSource;
  language: 'ar' | 'en';
  showIcon?: boolean;
  short?: boolean;
  className?: string;
  iconClassName?: string;
  showWordCount?: boolean;
}

export const ReadingTimeBadge: React.FC<ReadingTimeBadgeProps> = ({
  article,
  language,
  showIcon = true,
  short = false,
  className = '',
  iconClassName = 'w-3 h-3 text-red-500',
  showWordCount = false,
}) => {
  const minutes = getArticleReadingTime(article, language);
  const formattedTime = formatReadingTime(minutes, language, { short });
  const wordCount = showWordCount ? getArticleWordCount(article, language) : 0;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {showIcon && <Clock className={iconClassName} />}
      <span>{formattedTime}</span>
      {showWordCount && wordCount > 0 && (
        <span className="opacity-75">
          ({wordCount} {language === 'ar' ? 'كلمة' : 'words'})
        </span>
      )}
    </span>
  );
};
