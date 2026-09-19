import React, { useState } from 'react';
import { User, Mail, Shield, MessageSquare, Edit3, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { dataService } from '../../services/dataService';

export const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile, logout } = useAuth();
  const { language, t } = useThemeLanguage();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!currentUser) return null;

  const userComments = dataService.getAllComments().filter((c) => c.userId === currentUser.id);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ displayName, bio });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-stone-200 dark:border-stone-800 pb-6 mb-6">
          <img
            src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80'}
            alt={currentUser.displayName}
            className="w-24 h-24 rounded-full object-cover border-4 border-red-700 shadow-md"
          />

          <div className="flex-1 text-center sm:text-start">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl font-black font-editorial text-stone-900 dark:text-stone-50">
                {currentUser.displayName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200">
                {language === 'ar' ? 'قارئ معتمد' : 'Verified Reader'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mb-3">{currentUser.email}</p>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-xl">
              {currentUser.bio || (language === 'ar' ? 'عضو في مجتمع قراء جوبا نيوز.' : 'Member of Juba News digital community.')}
            </p>
          </div>
        </div>

        {/* Edit Profile Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-red-600" />
            <span>{language === 'ar' ? 'تعديل البيانات' : 'Update Profile'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                {t('fullName')}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                {t('email')}
              </label>
              <input
                type="email"
                value={currentUser.email}
                disabled
                className="w-full p-2.5 text-xs rounded-lg bg-stone-100 dark:bg-stone-800/50 border border-stone-300 dark:border-stone-700 text-stone-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
              {language === 'ar' ? 'النبذة التعريفية (Bio)' : 'Biography / Role note'}
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
            />
          </div>

          {savedSuccess && (
            <div className="text-xs text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('save')}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              {t('save')}
            </button>
          </div>
        </form>
      </div>

      {/* User's Recent Comments */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm">
        <h3 className="text-base font-bold font-editorial text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-red-600" />
          <span>{language === 'ar' ? 'تعليقاتك الأخيرة' : 'Your Recent Comments'} ({userComments.length})</span>
        </h3>

        {userComments.length === 0 ? (
          <p className="text-xs text-stone-500 py-4 text-center">
            {language === 'ar' ? 'لم تقم بإضافة أية تعليقات بعد.' : 'You have not posted any comments yet.'}
          </p>
        ) : (
          <div className="space-y-3">
            {userComments.map((com) => (
              <div key={com.id} className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs">
                <span className="font-semibold text-red-600 dark:text-red-400 block mb-1">
                  {com.articleTitle}
                </span>
                <p className="text-stone-700 dark:text-stone-300 mb-2">{com.content}</p>
                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <span>{new Date(com.createdAt).toLocaleDateString()}</span>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    com.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {com.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
