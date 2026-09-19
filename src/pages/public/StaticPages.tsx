import React, { useState } from 'react';
import { Mail, MapPin, Phone, MessageCircle, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { dataService } from '../../services/dataService';
import { SEOHead } from '../../components/common/SEOHead';

export const AboutPage: React.FC = () => {
  const { language } = useThemeLanguage();
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <SEOHead title={language === 'ar' ? 'من نحن - المعايير والميثاق' : 'About Us - Editorial Charter'} />
      <div className="bg-stone-900 p-6 sm:p-10 rounded-2xl border border-stone-800 shadow-xs">
        <h1 className="text-3xl font-black font-editorial mb-6 border-b border-stone-800 pb-4 text-stone-100">
          {language === 'ar' ? 'عن صحيفة جوبا نيوز' : 'About Juba News'}
        </h1>
        <div className="space-y-4 text-sm sm:text-base text-stone-300 leading-relaxed">
          <p>
            {language === 'ar'
              ? 'تأسست صحيفة جوبا نيوز (Juba News) كمؤسسة إعلامية مستقلة تلتزم بتقديم تغطية صحفية موضوعية ودقيقة وشاملة لتطورات الأوضاع في جمهورية جنوب السودان ومنطقة شرق أفريقيا والعالم.'
              : 'Juba News is an independent, non-partisan digital news organization dedicated to delivering rigorous, truthful, and verified reporting on South Sudan, the greater East African region, and global geopolitics.'}
          </p>
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 my-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-xs text-red-400 font-bold block uppercase tracking-wider">
                {language === 'ar' ? 'القيادة التحريرية الصحفية' : 'Editorial Leadership'}
              </span>
              <span className="text-lg font-black font-editorial text-stone-100 block mt-0.5">
                {language === 'ar' ? 'رئيس التحرير: أنور يل يوال' : 'Editor-in-Chief: Anwar Yiel Yuol'}
              </span>
            </div>
            <span className="text-xs text-amber-300 font-semibold">
              {language === 'ar' ? 'عينك على جنوب السودان، إفريقيا والعالم' : 'Your eyes on South Sudan, Africa and the World'}
            </span>
          </div>
          <h2 className="text-xl font-bold font-editorial text-stone-100 mt-6 mb-2">
            {language === 'ar' ? 'ميثاق الشرف الصحفي والمعايير التحريرية' : 'Editorial Charter & Integrity Standards'}
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>{language === 'ar' ? 'التحقق الصارم والمزدوج من المصادر والوثائق قبل النشر.' : 'Rigorous double-source fact-checking before story dissemination.'}</li>
            <li>{language === 'ar' ? 'فصل الرأي عن الخبر، وإبراز التحليلات في أقسام مخصصة بوضوح.' : 'Clear delineation between news reporting and editorial commentary.'}</li>
            <li>{language === 'ar' ? 'احترام الخصوصية والالتزام بمكافحة الأخبار الزائفة وخطاب الكراهية.' : 'Zero tolerance for hate speech, ethnic incitement, or sensationalist misinformation.'}</li>
            <li>{language === 'ar' ? 'دعم السلام والتنمية المستدامة والشفافية المؤسسية في جنوب السودان.' : 'Advancing sustainable peace, economic empowerment, and accountable governance in South Sudan.'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const { language, t } = useThemeLanguage();
  const settings = dataService.getSettings();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <SEOHead title={language === 'ar' ? 'اتصل بهيئة التحرير' : 'Contact Editorial Desk'} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-stone-900 p-6 sm:p-8 rounded-2xl border border-stone-800 shadow-xs">
          <h1 className="text-2xl font-black font-editorial mb-4 text-stone-100">
            {language === 'ar' ? 'معلومات التواصل • Contact info' : 'Contact info'}
          </h1>
          <p className="text-xs text-stone-300 mb-6 leading-relaxed">
            {language === 'ar'
              ? 'نرحب بتواصل القراء والصحفيين والمؤسسات. يمكنك التواصل المباشر عبر الهاتف، البريد الإلكتروني، واتساب أو مسنجر.'
              : 'Direct communication channels for news tips, editorial enquiries, press releases, and media desk.'}
          </p>

          {/* Contact info Box matching official credentials */}
          <div className="space-y-4 text-sm text-stone-200 border-t border-stone-800 pt-5">
            {/* Phone */}
            <div className="flex items-center gap-4 group">
              <div className="w-9 h-9 rounded-full bg-stone-800 flex items-center justify-center shrink-0 text-stone-300 group-hover:bg-red-950/50 group-hover:text-red-400 transition">
                <Phone className="w-5 h-5" />
              </div>
              <a 
                href={`tel:${(settings.contactPhone || '+211 922 225 964').replace(/\s+/g, '')}`} 
                className="font-semibold hover:text-red-400 transition tracking-wide text-sm sm:text-base"
                dir="ltr"
              >
                {settings.contactPhone || '+211 922 225 964'}
              </a>
            </div>

            {/* Email */}
            <div className="flex items-center gap-4 group">
              <div className="w-9 h-9 rounded-full bg-stone-800 flex items-center justify-center shrink-0 text-stone-300 group-hover:bg-red-950/50 group-hover:text-red-400 transition">
                <Mail className="w-5 h-5" />
              </div>
              <a 
                href={`mailto:${settings.contactEmail || 'media@juba-news.com'}`} 
                className="font-semibold hover:text-red-400 transition tracking-wide text-sm sm:text-base"
                dir="ltr"
              >
                {settings.contactEmail || 'media@juba-news.com'}
              </a>
            </div>

            {/* WhatsApp */}
            <div className="flex items-center gap-4 group">
              <div className="w-9 h-9 rounded-full bg-emerald-950/40 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <MessageCircle className="w-5 h-5" />
              </div>
              <a 
                href={`https://wa.me/${(settings.whatsappNumber || '+211 922 225 964').replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-semibold hover:text-emerald-400 transition tracking-wide text-sm sm:text-base"
                dir="ltr"
              >
                {settings.whatsappNumber || '+211 922 225 964'}
              </a>
            </div>

            {/* Messenger / Facebook */}
            <div className="flex items-center gap-4 group">
              <div className="w-9 h-9 rounded-full bg-blue-950/40 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <MessageSquare className="w-5 h-5" />
              </div>
              <a 
                href={settings.messengerUrl || 'https://m.me/jubanews'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-semibold hover:text-blue-400 transition tracking-wide text-sm sm:text-base"
              >
                {settings.messengerName || 'Juba-News جوبا-نيوز'}
              </a>
            </div>

            {/* Location */}
            <div className="flex items-start gap-4 pt-2 border-t border-stone-800 text-xs text-stone-400">
              <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{language === 'ar' ? settings.addressAr : settings.addressEn}</span>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-stone-900 p-6 sm:p-8 rounded-2xl border border-stone-800 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1">
                {t('fullName')}
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-2 text-xs rounded bg-stone-800 border border-stone-700 focus:outline-none focus:border-red-500 text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1">
                {t('email')}
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-2 text-xs rounded bg-stone-800 border border-stone-700 focus:outline-none focus:border-red-500 text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1">
                {language === 'ar' ? 'الموضوع' : 'Subject'}
              </label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full p-2 text-xs rounded bg-stone-800 border border-stone-700 focus:outline-none focus:border-red-500 text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1">
                {language === 'ar' ? 'الرسالة أو البلاغ الإخباري' : 'Message or News Tip'}
              </label>
              <textarea
                rows={4}
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full p-2 text-xs rounded bg-stone-800 border border-stone-700 focus:outline-none focus:border-red-500 text-stone-100 resize-none"
              />
            </div>

            {submitted && (
              <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{language === 'ar' ? 'شكراً لك، تم إرسال رسالتك إلى هيئة التحرير بنجاح.' : 'Thank you, your dispatch has been received by our newsroom.'}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'إرسال الرسالة' : 'Send Message'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export const PrivacyPage: React.FC = () => {
  const { language } = useThemeLanguage();
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <SEOHead title={language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'} />
      <div className="bg-stone-900 p-6 sm:p-10 rounded-2xl border border-stone-800 shadow-xs space-y-4 text-sm text-stone-300 leading-relaxed">
        <h1 className="text-2xl font-black font-editorial mb-4 text-stone-100">
          {language === 'ar' ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy Policy'}
        </h1>
        <p>
          {language === 'ar'
            ? 'تلتزم صحيفة جوبا نيوز بحماية خصوصية جميع مستخدمي وقراء المنصة الرقمية. نحن لا نبيع ولا نشارك البيانات الشخصية مع أي أطراف ثالثة لأغراض دعائية غير مصرح بها.'
            : 'Juba News is committed to safeguarding user privacy and personal data. We do not sell or monetize personally identifiable information.'}
        </p>
        <p>
          {language === 'ar'
            ? 'تُستخدم ملفات تعريف الارتباط وتقنيات القياس حصرياً لتحسين تجربة التصفح وتقديم المحتوى باللغة المناسبة وقياس نسب القراءة التحريرية.'
            : 'Cookies and local storage are utilized exclusively to preserve your theme, language preferences, and deliver optimized reading performance.'}
        </p>
      </div>
    </div>
  );
};
