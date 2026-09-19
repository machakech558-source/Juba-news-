import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, Copy, Check, Trash2, Search, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { dataService } from '../../services/dataService';
import type { MediaItem } from '../../types';

export const MediaLibraryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { language, t } = useThemeLanguage();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadAlt, setUploadAlt] = useState('');
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  useEffect(() => {
    setMedia(dataService.getMedia());
  }, []);

  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl.trim() || !currentUser) return;

    const item = dataService.addMedia({
      url: uploadUrl.trim(),
      fileName: `image-${Date.now()}.jpg`,
      altText: uploadAlt.trim() || 'Juba News Editorial Photo',
      mimeType: 'image/jpeg',
      fileSize: 845000,
      width: 1200,
      height: 800,
      uploadedBy: currentUser.displayName,
    }, currentUser);

    setMedia(dataService.getMedia());
    setUploadUrl('');
    setUploadAlt('');
  };

  const handleCopy = (item: MediaItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = (id: string) => {
    if (!currentUser) return;
    dataService.deleteMedia(id, currentUser);
    setMedia(dataService.getMedia());
  };

  const filteredMedia = media.filter((m) => {
    if (!search.trim()) return true;
    return m.fileName.toLowerCase().includes(search.toLowerCase()) || m.altText.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black font-editorial text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-red-600" />
          <span>{language === 'ar' ? 'مكتبة الوسائط والصور الصحفية' : 'Media & Asset Library'}</span>
        </h1>
        <p className="text-xs text-stone-500">
          {language === 'ar' ? 'إدارة الصور والرسوم البيانية المعتمدة في التقارير الإخبارية.' : 'Upload, catalog, and access high-resolution news photography and verified captions.'}
        </p>
      </div>

      {/* Upload Box */}
      <form onSubmit={handleAddMedia} className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-2">
          <Upload className="w-4 h-4 text-red-600" />
          <span>Add Media Item</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
              Image URL *
            </label>
            <input
              type="url"
              required
              value={uploadUrl}
              onChange={(e) => setUploadUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
              Alt Text / Editorial Caption
            </label>
            <input
              type="text"
              value={uploadAlt}
              onChange={(e) => setUploadAlt(e.target.value)}
              placeholder="e.g. Juba International Airport terminal upgrade ceremony"
              className="w-full p-2.5 text-xs rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-none focus:border-red-600"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            Add to Library
          </button>
        </div>
      </form>

      {/* Search & Grid */}
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 absolute top-2.5 left-2.5" />
        </div>
        <span className="text-xs text-stone-500">{filteredMedia.length} assets</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredMedia.map((item) => (
          <div
            key={item.id}
            className="group relative bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs"
          >
            <div className="aspect-[16/10] bg-stone-100 dark:bg-stone-800 overflow-hidden relative">
              <img
                src={item.url}
                alt={item.altText}
                className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                <button
                  onClick={() => setPreviewItem(item)}
                  className="p-1.5 bg-white/90 text-stone-900 rounded-full hover:bg-white transition"
                  title="Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleCopy(item)}
                  className="p-1.5 bg-white/90 text-stone-900 rounded-full hover:bg-white transition"
                  title="Copy URL"
                >
                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="p-2.5">
              <p className="text-[11px] font-bold text-stone-800 dark:text-stone-200 truncate">
                {item.altText}
              </p>
              <span className="text-[9px] text-stone-400 block truncate">
                {item.fileName} • {item.width}x{item.height}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-2xl w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl">
            <div className="aspect-[16/10] rounded-xl overflow-hidden mb-4 bg-stone-950">
              <img src={previewItem.url} alt="" className="w-full h-full object-contain" />
            </div>
            <p className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-1">{previewItem.altText}</p>
            <p className="text-xs text-stone-500 font-mono mb-4 break-all">{previewItem.url}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 text-xs bg-stone-200 dark:bg-stone-800 rounded-lg font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
