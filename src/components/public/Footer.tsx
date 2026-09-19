import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, ShieldCheck, CheckCircle2, MessageCircle, MessageSquare } from 'lucide-react';
import { JubaNewsEmblem } from '../common/JubaNewsLogo';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useRouter } from '../../contexts/RouterContext';
import { dataService } from '../../services/dataService';

export const Footer: React.FC = () => {
  const { language, t } = useThemeLanguage();
  const { navigate } = useRouter();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const categories = dataService.getCategories().filter(c => c.enabled);
  const settings = dataService.getSettings();

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSuccess(true);
    setNewsletterEmail('');
    setTimeout(() => setNewsletterSuccess(false), 4000);
  };

  return (
    <footer className="mt-16 bg-stone-900 text-stone-300 dark:bg-stone-950 border-t-4 border-red-700 transition-colors">
      {/* Sample Data Notice Banner (Mandated by Section 37) */}
      <div className="bg-stone-950/80 border-b border-stone-800 text-[11px] py-1.5 px-4 text-stone-400 text-center font-medium">
        <span>⚠️ {t('sampleDataNotice')}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Identity & About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <JubaNewsEmblem size={44} idSuffix="footer" />
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-editorial text-xl font-black tracking-tight text-white uppercase flex items-center gap-1">
                    <span className="text-red-500">JUBA</span>
                    <span className="text-blue-400">NEWS</span>
                  </span>
                </div>
                <p className="text-[10px] text-red-400 font-bold">
                  {language === 'ar' ? 'صحيفة جنوب السودان وأفريقيا المستقلة' : 'South Sudan & Africa Independent Press'}
                </p>
              </div>
            </div>
            
            <div className="p-2.5 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-400">
              <span className="text-stone-300 font-semibold">{language === 'ar' ? 'الاعتماد الصحفي: ' : 'Press Accreditation: '}</span>
              <span className="text-stone-400 font-mono">SS-JUBA-2024</span>
            </div>

            <p className="text-xs text-amber-300/90 font-medium leading-relaxed">
              {language === 'ar' ? 'عينك على جنوب السودان، إفريقيا والعالم' : 'Your eyes on South Sudan, Africa and the World'}
            </p>
            <div className="space-y-2 text-xs text-stone-400 pt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>{language === 'ar' ? settings.addressAr : settings.addressEn}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <a 
                  href={`tel:${(settings.contactPhone || '+211 922 225 964').replace(/\s+/g, '')}`} 
                  className="hover:text-white transition"
                  dir="ltr"
                >
                  {settings.contactPhone || '+211 922 225 964'}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <a 
                  href={`mailto:${settings.contactEmail || 'media@juba-news.com'}`} 
                  className="hover:text-white transition"
                  dir="ltr"
                >
                  {settings.contactEmail || 'media@juba-news.com'}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a 
                  href={`https://wa.me/${(settings.whatsappNumber || '+211 922 225 964').replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-emerald-300 transition"
                  dir="ltr"
                >
                  {settings.whatsappNumber || '+211 922 225 964'}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <a 
                  href={settings.messengerUrl || 'https://m.me/jubanews'} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-blue-300 transition"
                >
                  {settings.messengerName || 'Juba-News جوبا-نيوز'}
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Sections & Coverage */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4 border-b border-stone-800 pb-2">
              {language === 'ar' ? 'الأقسام والملفات' : 'News Desks'}
            </h4>
            <ul className="grid grid-cols-2 gap-2 text-xs">
              {categories.slice(0, 10).map((cat) => (
                <li key={cat.slug}>
                  <button
                    onClick={() => navigate(`/${cat.slug}`)}
                    className="hover:text-red-400 transition hover:underline text-start"
                  >
                    {language === 'ar' ? cat.nameAr : cat.nameEn}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Editorial Standards & Governance */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4 border-b border-stone-800 pb-2">
              {language === 'ar' ? 'المعايير والشفافية' : 'Editorial Trust'}
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button onClick={() => navigate('/about')} className="hover:text-red-400 transition text-start">
                  {t('aboutUs')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/about')} className="hover:text-red-400 transition text-start">
                  {t('editorialStandards')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/privacy')} className="hover:text-red-400 transition text-start">
                  {t('privacyPolicy')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/terms')} className="hover:text-red-400 transition text-start">
                  {t('termsOfService')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/contact')} className="hover:text-red-400 transition text-start">
                  {t('contactUs')}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Newsletter Subscription */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4 border-b border-stone-800 pb-2">
              {language === 'ar' ? 'النشرة الإخبارية العاجلة' : 'Breaking News Alerts'}
            </h4>
            <p className="text-xs text-stone-400 mb-3 leading-relaxed">
              {language === 'ar' 
                ? 'اشترك لتصلك أهم التقارير والتحليلات الحصرية حول جنوب السودان وأفريقيا مباشرة إلى بريدك الإلكتروني.'
                : 'Receive breaking national alerts and high-level East African analyses delivered directly to your inbox.'}
            </p>

            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={t('email')}
                  className="w-full px-3 py-2 text-xs bg-stone-800 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'اشتراك مجاني' : 'Subscribe Free'}</span>
              </button>
            </form>

            {newsletterSuccess && (
              <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'شكراً لاشتراكك في النشرة!' : 'Successfully subscribed!'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} {language === 'ar' ? settings.siteNameAr : settings.siteNameEn}. {t('rightsReserved')}</p>
          <div className="flex items-center gap-4">
            <span>Juba, South Sudan</span>
            <span>•</span>
            <span>Independent Journalism</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
