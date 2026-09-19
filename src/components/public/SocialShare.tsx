import React, { useState } from 'react';
import { Share2, Check, Copy, MessageCircle, Send } from 'lucide-react';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';

interface SocialShareProps {
  url?: string;
  title: string;
}

export const SocialShare: React.FC<SocialShareProps> = ({ url, title }) => {
  const { t, language } = useThemeLanguage();
  const [copied, setCopied] = useState(false);

  const shareUrl = url || window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 py-4 border-y border-stone-200 dark:border-stone-800 my-6">
      <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 flex items-center gap-1.5 mr-2">
        <Share2 className="w-3.5 h-3.5 text-red-600" />
        {t('shareStory')}:
      </span>

      {/* WhatsApp */}
      <a
        href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition shadow-xs"
        title="Share on WhatsApp"
      >
        <MessageCircle className="w-3.5 h-3.5 fill-current" />
        <span>WhatsApp</span>
      </a>

      {/* X / Twitter */}
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-medium transition shadow-xs"
        title="Share on X"
      >
        <span className="font-bold text-xs">𝕏</span>
        <span>Twitter</span>
      </a>

      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition shadow-xs"
        title="Share on Facebook"
      >
        <span className="font-black text-xs">f</span>
        <span>Facebook</span>
      </a>

      {/* Telegram */}
      <a
        href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium transition shadow-xs"
        title="Share on Telegram"
      >
        <Send className="w-3 h-3" />
        <span>Telegram</span>
      </a>

      {/* Copy Link */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium transition border border-stone-300 dark:border-stone-700"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        <span>{copied ? (language === 'ar' ? 'تم النسخ!' : 'Copied!') : (language === 'ar' ? 'نسخ الرابط' : 'Copy Link')}</span>
      </button>
    </div>
  );
};
