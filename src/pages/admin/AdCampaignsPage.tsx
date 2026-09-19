import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, CheckCircle2, XCircle, ExternalLink, BarChart2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { dataService } from '../../services/dataService';
import type { Advertisement, AdPosition } from '../../types';

export const AdCampaignsPage: React.FC = () => {
  const { currentUser, isSuperAdmin } = useAuth();
  const { language, t } = useThemeLanguage();

  const [ads, setAds] = useState<Advertisement[]>([]);
  const [title, setTitle] = useState('');
  const [advertiser, setAdvertiser] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [position, setPosition] = useState<AdPosition>('HOMEPAGE_TOP');

  useEffect(() => {
    setAds(dataService.getAdvertisements());
  }, []);

  const handleCreateAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentUser) return;

    dataService.createAdvertisement({
      title: title.trim(),
      advertiser: advertiser.trim(),
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80',
      targetUrl: targetUrl.trim() || '#',
      position,
      active: true,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    }, currentUser);

    setAds(dataService.getAdvertisements());
    setTitle('');
    setAdvertiser('');
    setImageUrl('');
    setTargetUrl('');
  };

  const handleToggle = (ad: Advertisement) => {
    if (!currentUser) return;
    dataService.updateAdvertisement(ad.id, { active: !ad.active }, currentUser);
    setAds(dataService.getAdvertisements());
  };

  const handleDelete = (id: string) => {
    if (!currentUser) return;
    dataService.deleteAdvertisement(id, currentUser);
    setAds(dataService.getAdvertisements());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black font-editorial text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-red-600" />
          <span>{language === 'ar' ? 'إدارة الحملات الإعلانية والرعايات' : 'Advertisement & Sponsor Desk'}</span>
        </h1>
        <p className="text-xs text-stone-500">
          {language === 'ar' ? 'ضبط البانرات الإعلانية المعتمدة وقياس نسب الظهور والنقر.' : 'Configure promotional placements, track impressions, and calculate CTR.'}
        </p>
      </div>

      {/* New Campaign Form */}
      <form onSubmit={handleCreateAd} className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-red-600" />
          <span>Create New Campaign Placement</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
              Campaign Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Nile Telecom 5G Rollout"
              className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
              Advertiser / Brand Name
            </label>
            <input
              type="text"
              value={advertiser}
              onChange={(e) => setAdvertiser(e.target.value)}
              placeholder="e.g. Nile Telecom South Sudan"
              className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
              Slot Placement
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as AdPosition)}
              className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none font-semibold"
            >
              <option value="HOMEPAGE_TOP">Homepage Top Banner</option>
              <option value="HOMEPAGE_MIDDLE">Homepage Middle Banner</option>
              <option value="ARTICLE_TOP">Article Top</option>
              <option value="ARTICLE_MIDDLE">Article Middle Stream</option>
              <option value="ARTICLE_BOTTOM">Article Bottom</option>
              <option value="SIDEBAR">Sidebar Slot</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
              Creative Banner URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
              Target Landing Link
            </label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://client-landing-page.com"
              className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            Launch Campaign
          </button>
        </div>
      </form>

      {/* Campaigns Table */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800/70 border-b border-stone-200 dark:border-stone-800 text-stone-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4 text-start">Campaign & Brand</th>
                <th className="py-3 px-3 text-start">Placement</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Impressions</th>
                <th className="py-3 px-3 text-center">Clicks</th>
                <th className="py-3 px-3 text-center">CTR</th>
                <th className="py-3 px-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
              {ads.map((ad) => {
                const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00';
                return (
                  <tr key={ad.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-stone-900 dark:text-stone-100">{ad.title}</p>
                        <span className="text-[10px] text-stone-400">{ad.advertiser}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-stone-600 dark:text-stone-300">
                      {ad.position}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        ad.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                      }`}>
                        {ad.active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{ad.impressions.toLocaleString()}</td>
                    <td className="py-3 px-3 text-center font-mono">{ad.clicks.toLocaleString()}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600">{ctr}%</td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggle(ad)}
                          className="px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-[11px] font-semibold"
                        >
                          {ad.active ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          className="p-1 text-stone-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
