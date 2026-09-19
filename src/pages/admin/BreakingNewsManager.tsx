import React, { useState, useEffect } from 'react';
import { Flame, Plus, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { dataService } from '../../services/dataService';
import type { BreakingNewsItem } from '../../types';

export const BreakingNewsManager: React.FC = () => {
  const { currentUser } = useAuth();
  const { language, t } = useThemeLanguage();

  const [items, setItems] = useState<BreakingNewsItem[]>([]);
  const [textEn, setTextEn] = useState('');
  const [textAr, setTextAr] = useState('');
  const [url, setUrl] = useState('');
  const [priority, setPriority] = useState(1);
  const [hoursActive, setHoursActive] = useState(6);

  useEffect(() => {
    const unsub = dataService.subscribeBreakingNews((data) => {
      setItems(data);
    });
    return () => unsub();
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textEn.trim() || !currentUser) return;

    const expiresAt = new Date(Date.now() + hoursActive * 3600 * 1000).toISOString();

    dataService.createBreakingNews({
      titleEn: textEn.trim(),
      titleAr: textAr.trim() || textEn.trim(),
      articleSlug: url.trim() || undefined,
      active: true,
      priority,
      expiresAt,
      createdBy: currentUser.displayName,
    }, currentUser);

    setTextEn('');
    setTextAr('');
    setUrl('');
  };

  const handleToggle = (item: BreakingNewsItem) => {
    if (!currentUser) return;
    dataService.updateBreakingNews(item.id, { active: !item.active }, currentUser);
  };

  const handleDelete = (id: string) => {
    if (!currentUser) return;
    dataService.deleteBreakingNews(id, currentUser);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black font-editorial text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Flame className="w-6 h-6 text-red-600" />
          <span>{language === 'ar' ? 'إدارة شريط الأخبار العاجلة' : 'Breaking News Flash Manager'}</span>
        </h1>
        <p className="text-xs text-stone-500">
          {language === 'ar'
            ? 'تحديث وبث الأنباء العاجلة التي تظهر فورياً في أعلى الموقع لجميع الزوار.'
            : 'Publish live breaking dispatches that broadcast synchronously across all reader viewports.'}
        </p>
      </div>

      {/* Add New Alert Form */}
      <form onSubmit={handleAdd} className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>{language === 'ar' ? 'إضافة خبر عاجل جديد' : 'Broadcast New Breaking Alert'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Breaking Text (English) *
            </label>
            <input
              type="text"
              required
              value={textEn}
              onChange={(e) => setTextEn(e.target.value)}
              placeholder="e.g. BREAKING: South Sudan Ceasefire Monitoring Body releases quarterly verification report"
              className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
            />
          </div>

          <div dir="rtl">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              نص الخبر العاجل (بالعربية)
            </label>
            <input
              type="text"
              value={textAr}
              onChange={(e) => setTextAr(e.target.value)}
              placeholder="مثال: عاجل: آلية مراقبة وقف إطلاق النار تصدر تقرير التحقق الفصلي"
              className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
              Destination URL / Slug (Optional)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/article/..."
              className="w-full p-2 text-xs rounded bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
              Active Duration (Hours)
            </label>
            <input
              type="number"
              min={1}
              max={72}
              value={hoursActive}
              onChange={(e) => setHoursActive(Number(e.target.value))}
              className="w-full p-2 text-xs rounded bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{language === 'ar' ? 'بث الخبر العاجل' : 'Broadcast Alert'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* List of Breaking Alerts */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <span className="font-bold text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400">
            Active & Past Alerts ({items.length})
          </span>
        </div>

        <div className="divide-y divide-stone-200 dark:divide-stone-800">
          {items.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400">
              No breaking news alerts recorded.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        item.active
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {item.active ? 'LIVE ON SITE' : 'INACTIVE'}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      Added {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    {item.titleEn}
                  </p>
                  <p className="text-xs text-stone-600 dark:text-stone-400 font-sans" dir="rtl">
                    {item.titleAr}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      item.active
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {item.active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{item.active ? 'Deactivate' : 'Activate'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                    title="Delete alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
