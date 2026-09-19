import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Shield, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useRouter } from '../../contexts/RouterContext';
import { dataService } from '../../services/dataService';
import type { SiteSettings } from '../../types';

export const AdminSettingsPage: React.FC = () => {
  const { currentUser, isSuperAdmin } = useAuth();
  const { language, isRTL, t } = useThemeLanguage();
  const { navigate } = useRouter();

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setSettings(dataService.getSettings());
  }, []);

  if (!isSuperAdmin) {
    return (
      <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
        <Shield className="w-8 h-8 text-red-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold font-editorial mb-2">Access Restricted: Super Admin Only</h2>
        <p className="text-xs text-stone-500">Only the Super Administrator can modify platform settings.</p>
      </div>
    );
  }

  if (!settings) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    dataService.updateSettings(settings, currentUser);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h1 className="text-2xl font-black font-editorial text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-red-600" />
            <span>{language === 'ar' ? 'إعدادات المنصة والهوية' : 'Global Platform Settings'}</span>
          </h1>
          <p className="text-xs text-stone-500">
            {language === 'ar' ? 'تعديل اسم الصحيفة والشعارات والسياسات التحريرية العامة.' : 'Branding configuration, editorial moderation thresholds, and contact information.'}
          </p>
        </div>

        {success && (
          <div className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* Quick Access Card to Gate Passcode and Password Governance */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/40 via-stone-900 to-stone-900 border border-red-900/50 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-red-950 border border-red-800 text-red-500 shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-stone-100">
                {language === 'ar' ? 'لوحة ضبط دخل الإدارة وتغيير كلمة السر' : 'Admin Security Gate & Passwords Console'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-950 text-red-300 border border-red-800 uppercase">
                Super Admin Alone
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              {language === 'ar'
                ? 'تشفير شفرة بوابة الإدارة، وإدارة كلمات سر الأدمن الثلاثة (Super Admin، AI Admin، Admin One)، وتحديث كلمات المرور بأمان.'
                : 'Configure the Master Gate passcode, 3 Admin roles credentials, and security isolation.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/passwords')}
          className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
        >
          <span>{language === 'ar' ? 'فتح لوحة ضبط كلمات السر والشفرة' : 'Open Passwords & Gate Panel'}</span>
          {isRTL ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branding */}
        <div className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-stone-100">
            Newspaper Branding
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                Site Name (English)
              </label>
              <input
                type="text"
                value={settings.siteNameEn}
                onChange={(e) => setSettings({ ...settings, siteNameEn: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                Site Name (Arabic)
              </label>
              <input
                type="text"
                value={settings.siteNameAr}
                onChange={(e) => setSettings({ ...settings, siteNameAr: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                Tagline (English)
              </label>
              <input
                type="text"
                value={settings.taglineEn}
                onChange={(e) => setSettings({ ...settings, taglineEn: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                Tagline (Arabic)
              </label>
              <input
                type="text"
                value={settings.taglineAr}
                onChange={(e) => setSettings({ ...settings, taglineAr: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>
        </div>

        {/* Editorial Policies */}
        <div className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-stone-100">
            Community & Moderation Rules
          </h3>
          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.commentsEnabled}
                onChange={(e) => setSettings({ ...settings, commentsEnabled: e.target.checked })}
                className="rounded text-red-600"
              />
              <span className="font-medium text-stone-800 dark:text-stone-200">
                Enable Public Commenting on Articles
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireCommentApproval}
                onChange={(e) => setSettings({ ...settings, requireCommentApproval: e.target.checked })}
                className="rounded text-red-600"
              />
              <span className="font-medium text-stone-800 dark:text-stone-200">
                Require Editorial Approval before Comments go Live
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowRegistration}
                onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                className="rounded text-red-600"
              />
              <span className="font-medium text-stone-800 dark:text-stone-200">
                Allow New Public Readers to Register Accounts
              </span>
            </label>
          </div>
        </div>

        {/* Contact info */}
        <div className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-stone-100">
            Bureau & Contact Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                Newsroom Email
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                Newsroom Telephone / Mobile
              </label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                WhatsApp News Line
              </label>
              <input
                type="text"
                value={settings.whatsappNumber || ''}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                Messenger / Facebook Page Name
              </label>
              <input
                type="text"
                value={settings.messengerName || ''}
                onChange={(e) => setSettings({ ...settings, messengerName: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                Physical Bureau Address
              </label>
              <input
                type="text"
                value={settings.addressEn}
                onChange={(e) => setSettings({ ...settings, addressEn: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
