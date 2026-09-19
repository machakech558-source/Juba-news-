import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from '../../contexts/RouterContext';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import type { UserRole } from '../../types';

interface RoleGuardProps {
  allowedRoles?: UserRole[];
  requireSuperAdmin?: boolean;
  requireAdmin?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  requireSuperAdmin = false,
  requireAdmin = true,
  children,
  fallback,
}) => {
  const { role, isSuperAdmin, isAdmin, isAuthenticated } = useAuth();
  const { language } = useThemeLanguage();
  const { navigate } = useRouter();

  let hasPermission = false;

  if (requireSuperAdmin) {
    hasPermission = isSuperAdmin;
  } else if (allowedRoles && allowedRoles.length > 0) {
    hasPermission = allowedRoles.includes(role);
  } else if (requireAdmin) {
    hasPermission = isAdmin;
  } else {
    hasPermission = isAuthenticated;
  }

  if (hasPermission) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-8 sm:p-12 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs max-w-xl mx-auto my-12">
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold font-editorial text-stone-900 dark:text-stone-100 mb-2">
        {language === 'ar' ? 'صلاحيات غير كافية • Access Restricted' : 'Access Restricted'}
      </h2>
      <p className="text-xs text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
        {language === 'ar'
          ? `يتطلب هذا القسم صلاحيات أعلى. رتبتك الحالية هي [${role}]. يقتصر الوصول على المشرفين المصرح لهم.`
          : `This management section requires elevated privileges. Your current active role is [${role}]. Access is strictly guarded by RBAC rules.`}
      </p>
      <div className="flex justify-center gap-3">
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'العودة للوحة القيادة' : 'Back to Dashboard'}</span>
        </button>
      </div>
    </div>
  );
};

export const PermissionGuard: React.FC<{
  permission: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permission, children, fallback = null }) => {
  if (!permission) return fallback ? <>{fallback}</> : null;
  return <>{children}</>;
};
