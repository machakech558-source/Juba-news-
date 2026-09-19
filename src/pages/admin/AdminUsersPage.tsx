import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, AlertCircle, CheckCircle2, Lock, KeyRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useRouter } from '../../contexts/RouterContext';
import { dataService } from '../../services/dataService';
import type { User, UserRole } from '../../types';

export const AdminUsersPage: React.FC = () => {
  const { currentUser, isSuperAdmin } = useAuth();
  const { language, t } = useThemeLanguage();
  const { navigate } = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setUsers(dataService.getUsers());
  }, []);

  if (!isSuperAdmin) {
    return (
      <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
        <Lock className="w-8 h-8 text-red-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold font-editorial mb-2">Access Restricted: Super Admin Only</h2>
        <p className="text-xs text-stone-500 max-w-md mx-auto">
          This administrative configuration section is restricted to the Super Admin role.
        </p>
      </div>
    );
  }

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (!currentUser) return;
    dataService.updateUserRole(userId, newRole, currentUser);
    setUsers(dataService.getUsers());
    setSuccessMessage(`Updated role to ${newRole}`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-editorial text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-red-600" />
            <span>{language === 'ar' ? 'إدارة طاقم التحرير والمديرين الثلاثة' : 'The Three Admins & Users Governance'}</span>
          </h1>
          <p className="text-xs text-stone-500">
            {language === 'ar'
              ? 'إدارة حسابات الأدمن الثلاثة (Super Admin و AI Admin و Admin One) ومستخدمي المنصة.'
              : 'Governance for the 3 Admin roles (Super Admin, AI Admin, Admin One) and platform users.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/passwords')}
          className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
        >
          <KeyRound className="w-4 h-4" />
          <span>{language === 'ar' ? 'لوحة شفرة البوابة وكلمات السر' : 'Gate & Passwords Console'}</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Permissions Matrix Explanation Card */}
      <div className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-3">
          {language === 'ar' ? 'مستويات الصلاحيات التحريرية' : 'Editorial Access Levels'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
            <span className="font-black text-red-700 dark:text-red-400 block mb-1">
              {language === 'ar' ? 'الإشراف العام (Super Admin)' : 'Super Admin'}
            </span>
            <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-[11px]">
              {language === 'ar'
                ? 'صلاحيات عليا كاملة: إدارة المقالات، الأخبار العاجلة، الوسائط، إعدادات المنصة، وسجلات الأمان.'
                : 'Full root privileges: editorial articles, breaking news, media library, system settings, and security audit logs.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
            <span className="font-black text-amber-600 dark:text-amber-400 block mb-1">
              {language === 'ar' ? 'رئاسة التحرير (Editorial Director)' : 'Editorial Director'}
            </span>
            <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-[11px]">
              {language === 'ar'
                ? 'إدارة محتوى النشر: اعتماد ونشر التقارير والتحقيقات، وإدارة التغطيات والمحتوى الإعلامي.'
                : 'Complete editorial control: compose, review, and publish dispatches; manage media and breaking coverage.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
            <span className="font-black text-blue-600 dark:text-blue-400 block mb-1">
              {language === 'ar' ? 'محرر الأخبار (Associate Editor)' : 'Newsroom Editor'}
            </span>
            <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-[11px]">
              {language === 'ar'
                ? 'تحرير الأخبار اليومية، التقارير الميدانية، متابعة التعليقات والتحديثات العاجلة.'
                : 'News reporting, dispatch composition, comment moderation, and real-time updates.'}
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4 text-start">User Profile</th>
                <th className="py-3 px-3 text-start">Email</th>
                <th className="py-3 px-3 text-center">Assigned Role</th>
                <th className="py-3 px-3 text-center">Role Modification</th>
                <th className="py-3 px-4 text-end">Security Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <span className="font-bold text-stone-900 dark:text-stone-100 block">
                          {u.displayName}
                        </span>
                        <span className="text-[10px] text-stone-400">{u.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-stone-600 dark:text-stone-300">
                    {u.email}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                      u.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                      u.role === 'AI_ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                      u.role === 'ADMIN_ONE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                      u.role === 'ADMIN_TWO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="p-1.5 rounded bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-semibold focus:outline-none"
                    >
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      <option value="AI_ADMIN">AI_ADMIN</option>
                      <option value="ADMIN_ONE">ADMIN_ONE</option>
                      <option value="USER">USER (Reader)</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-end">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Verified Active</span>
                    </span>
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
