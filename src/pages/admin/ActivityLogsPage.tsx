import React, { useState, useEffect } from 'react';
import { History, Search, Shield, Filter, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { dataService } from '../../services/dataService';
import type { ActivityLog } from '../../types';

export const ActivityLogsPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const { language } = useThemeLanguage();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLogs(dataService.getActivityLogs());
  }, []);

  if (!isSuperAdmin) {
    return (
      <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
        <Shield className="w-8 h-8 text-red-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold font-editorial mb-2">Access Restricted: Super Admin Only</h2>
        <p className="text-xs text-stone-500">Security audit logs are restricted to Super Administrator privileges.</p>
      </div>
    );
  }

  const filteredLogs = logs.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return l.userName.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || (l.targetTitle && l.targetTitle.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-editorial text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <History className="w-6 h-6 text-red-600" />
            <span>{language === 'ar' ? 'سجل العمليات والرقابة الأمنية' : 'Audit Trail & Activity Logs'}</span>
          </h1>
          <p className="text-xs text-stone-500">
            {language === 'ar'
              ? 'سجل غير قابل للتعديل يوثق جميع الأنشطة التحريرية والتغييرات التي قام بها أعضاء هيئة التحرير.'
              : 'Immutable record documenting all dispatch publications, status transitions, and administrative modifications.'}
          </p>
        </div>

        <div className="relative w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 absolute top-2.5 left-2.5" />
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4 text-start">Staff Member</th>
                <th className="py-3 px-3 text-start">Role</th>
                <th className="py-3 px-3 text-start">Action</th>
                <th className="py-3 px-3 text-start">Subject / Target</th>
                <th className="py-3 px-4 text-end">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                  <td className="py-3 px-4 font-bold text-stone-900 dark:text-stone-100">
                    {log.userName}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {log.userRole}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-red-700 dark:text-red-400">
                    {log.action}
                  </td>
                  <td className="py-3 px-3 text-stone-700 dark:text-stone-300 max-w-xs truncate">
                    {log.targetTitle || log.targetId || '-'}
                  </td>
                  <td className="py-3 px-4 text-end font-mono text-[11px] text-stone-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
