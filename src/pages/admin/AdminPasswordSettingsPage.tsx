import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Check, 
  Copy, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Cpu, 
  UserCog, 
  GitBranch, 
  Shield, 
  Sliders
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { adminSecurityService } from '../../services/adminSecurityService';
import type { AdminAccountConfig } from '../../types';

export const AdminPasswordSettingsPage: React.FC = () => {
  const { currentUser, isSuperAdmin } = useAuth();
  const { language } = useThemeLanguage();

  // Self Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSelfNewPass, setShowSelfNewPass] = useState(false);
  const [selfSuccess, setSelfSuccess] = useState<string | null>(null);
  const [selfError, setSelfError] = useState<string | null>(null);
  const [isSubmittingSelf, setIsSubmittingSelf] = useState(false);

  // Super Admin: Gate Security State
  const [gatePasscode, setGatePasscode] = useState('');
  const [showGatePass, setShowGatePass] = useState(false);
  const [isGateEnforced, setIsGateEnforced] = useState(true);
  const [gateCustomInput, setGateCustomInput] = useState('');
  const [gateSuccess, setGateSuccess] = useState<string | null>(null);
  const [gateError, setGateError] = useState<string | null>(null);
  const [copiedGate, setCopiedGate] = useState(false);

  // Super Admin: 3 Admins Accounts Management State
  const [adminsList, setAdminsList] = useState<AdminAccountConfig[]>([]);
  const [selectedAdminToReset, setSelectedAdminToReset] = useState<AdminAccountConfig | null>(null);
  const [adminResetNewPass, setAdminResetNewPass] = useState('');
  const [showAdminResetPass, setShowAdminResetPass] = useState(false);
  const [adminResetSuccess, setAdminResetSuccess] = useState<string | null>(null);
  const [adminResetError, setAdminResetError] = useState<string | null>(null);
  const [copiedAdminPass, setCopiedAdminPass] = useState(false);

  // Load Initial Data
  useEffect(() => {
    refreshData();
  }, [currentUser]);

  const refreshData = () => {
    setAdminsList(adminSecurityService.getAdminAccounts());
    setIsGateEnforced(adminSecurityService.isGateEnforced());

    if (currentUser && isSuperAdmin) {
      const gateRes = adminSecurityService.getGatePasscode(currentUser);
      if (gateRes.success && gateRes.passcode) {
        setGatePasscode(gateRes.passcode);
        setGateCustomInput(gateRes.passcode);
      }
    }
  };

  // Password strength calculator
  const calculateStrength = (pwd: string): { score: number; labelEn: string; labelAr: string; color: string } => {
    if (!pwd) return { score: 0, labelEn: 'Empty', labelAr: 'فارغة', color: 'bg-stone-700' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score, labelEn: 'Weak', labelAr: 'ضعيفة', color: 'bg-red-500' };
    if (score <= 4) return { score, labelEn: 'Moderate', labelAr: 'متوسطة', color: 'bg-amber-500' };
    return { score, labelEn: 'Very Strong', labelAr: 'قوية جداً', color: 'bg-emerald-500' };
  };

  const selfStrength = calculateStrength(newPassword);

  // 1. Handle Self Password Change
  const handleSelfPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelfError(null);
    setSelfSuccess(null);

    if (!currentUser?.email) {
      setSelfError(language === 'ar' ? 'جلسة المشرف غير معرّفة.' : 'Admin session is invalid.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSelfError(language === 'ar' ? 'كلمتا المرور الجديدتان غير متطابقتين.' : 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setSelfError(language === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' : 'Password must be at least 8 characters.');
      return;
    }

    setIsSubmittingSelf(true);
    const result = adminSecurityService.changeOwnPassword(currentUser.email, currentPassword, newPassword);
    setIsSubmittingSelf(false);

    if (result.success) {
      setSelfSuccess(language === 'ar' ? 'تم تحديث كلمة المرور الخاصة بك بنجاح!' : 'Your password has been updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      refreshData();
      setTimeout(() => setSelfSuccess(null), 4000);
    } else {
      setSelfError(result.error || (language === 'ar' ? 'فشل تحديث كلمة المرور.' : 'Failed to update password.'));
    }
  };

  // 2. Handle Gate Security (Super Admin Alone)
  const handleUpdateGatePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isSuperAdmin) return;
    setGateError(null);
    setGateSuccess(null);

    const res = adminSecurityService.updateGatePasscode(gateCustomInput, currentUser);
    if (res.success) {
      setGatePasscode(gateCustomInput);
      setGateSuccess(language === 'ar' ? 'تم تحديث وتشفير شفرة بوابة الإدارة بنجاح!' : 'Master Gate passcode updated and encrypted successfully!');
      setTimeout(() => setGateSuccess(null), 4000);
    } else {
      setGateError(res.error || 'Failed to update gate passcode.');
    }
  };

  const handleGenerateNewGateCode = () => {
    if (!currentUser || !isSuperAdmin) return;
    setGateError(null);
    setGateSuccess(null);

    const res = adminSecurityService.generateCryptographicGatePasscode(currentUser);
    if (res.success && res.newPasscode) {
      setGatePasscode(res.newPasscode);
      setGateCustomInput(res.newPasscode);
      setShowGatePass(true);
      setGateSuccess(language === 'ar' ? 'تم توليد شفرة أمان مشفرة جديدة للبوابة بنجاح!' : 'New cryptographic Gate passcode generated successfully!');
      setTimeout(() => setGateSuccess(null), 4000);
    } else {
      setGateError(res.error || 'Failed to generate gate passcode.');
    }
  };

  const handleToggleGateEnforcement = (enable: boolean) => {
    if (!currentUser || !isSuperAdmin) return;
    const res = adminSecurityService.toggleGateEnforcement(enable, currentUser);
    if (res.success) {
      setIsGateEnforced(enable);
      setGateSuccess(enable 
        ? (language === 'ar' ? 'تم تفعيل فرض شفرة البوابة لجميع عمليات الدخول الإدارية.' : 'Gate passcode is now enforced.')
        : (language === 'ar' ? 'تم تعطيل فرض شفرة البوابة مؤقتاً.' : 'Gate passcode requirement bypassed.'));
      setTimeout(() => setGateSuccess(null), 4000);
    }
  };

  const copyToClipboard = (text: string, type: 'gate' | 'admin') => {
    navigator.clipboard.writeText(text);
    if (type === 'gate') {
      setCopiedGate(true);
      setTimeout(() => setCopiedGate(false), 2000);
    } else {
      setCopiedAdminPass(true);
      setTimeout(() => setCopiedAdminPass(false), 2000);
    }
  };

  // 3. Handle 3 Admins Password Reset (Super Admin Alone)
  const handleSuperAdminResetTargetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isSuperAdmin || !selectedAdminToReset) return;
    setAdminResetError(null);
    setAdminResetSuccess(null);

    if (adminResetNewPass.length < 8) {
      setAdminResetError(language === 'ar' ? 'كلمة المرور يجب ألا تقل عن 8 أحرف.' : 'Password must be at least 8 characters.');
      return;
    }

    const res = adminSecurityService.setAdminPasswordBySuperAdmin(
      selectedAdminToReset.email,
      adminResetNewPass,
      currentUser
    );

    if (res.success) {
      setAdminResetSuccess(language === 'ar' 
        ? `تم تعيين كلمة سر جديدة لحساب (${selectedAdminToReset.displayNameAr}) بنجاح!` 
        : `Password updated for ${selectedAdminToReset.displayName}!`);
      refreshData();
      setTimeout(() => {
        setAdminResetSuccess(null);
        setSelectedAdminToReset(null);
        setAdminResetNewPass('');
      }, 3000);
    } else {
      setAdminResetError(res.error || 'Failed to update admin password.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="border-b border-stone-800 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-950/60 border border-red-800/80 text-red-400 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'منظومة الأمان والتحكم السيبراني' : 'Security & Access Control Matrix'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-editorial text-stone-100 flex items-center gap-3">
              <KeyRound className="w-7 h-7 text-red-600 shrink-0" />
              <span>{language === 'ar' ? 'لوحة ضبط دخل الإدارة وتغيير كلمة السر' : 'Admin Security & Password Governance'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 mt-1">
              {language === 'ar'
                ? 'إدارة حسابات الأدمن الثلاثة، تشفير شفرة بوابة الإدارة بواسطة Super Admin، وتحديث كلمات المرور بأمان تام.'
                : 'Governance for the 3 Admin accounts, Super Admin Master Gate passcode, and credential security.'}
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-stone-300">
              {language === 'ar' ? 'المشرف النشط:' : 'Active Admin:'}{' '}
              <strong className="text-red-400 uppercase">{currentUser?.role}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* GitHub Anti-Leak Protection Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-md">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 shrink-0 mt-0.5">
            <GitBranch className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-stone-100">
                {language === 'ar' ? 'حماية بيانات الدخول من الرفع إلى GitHub' : 'GitHub Anti-Leak & Secret Isolation Shield'}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                Active & Enforced
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              {language === 'ar'
                ? 'تم استبعاد وتأمين كافة كلمات السر، الإيميلات الخاصة، وشفرة بوابة الإدارة عبر .gitignore ومنع إدراجها نهائياً في .env.example. تخزن الشفرات محلياً بصيغة تجزئة مع أملاح تشفير (Salting) دون أي تسريب في كود المستودع العام.'
                : 'All credentials, private admin emails, and the Gate passcode are strictly excluded via .gitignore and stripped from .env.example. Secrets are stored encrypted and isolated.'}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: MASTER ADMIN GATE SECURITY (SUPER ADMIN ALONE) */}
      <div className="p-6 rounded-2xl bg-stone-900 border border-red-900/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-950/80 border border-red-800 text-red-500">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-stone-100">
                  {language === 'ar' ? 'شفرة بوابة الإدارة المشفرة (Admin Security Gate)' : 'Master Gate Access Code'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-950 text-red-300 border border-red-800 uppercase tracking-wider">
                  Super Admin Alone
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {language === 'ar'
                  ? 'بوابة الدخول محصورة بشفرة يشفرها ويتحكم بها السوبر أدمن وحده، ويُشترط إدخالها قبل تسجيل الدخول.'
                  : 'Encrypted entrance gate controlled exclusively by the Super Admin.'}
              </p>
            </div>
          </div>

          {/* Super Admin Status or Restricted Notice */}
          {isSuperAdmin ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400">
                {language === 'ar' ? 'حالة فرض الشفرة:' : 'Gate Enforcement:'}
              </span>
              <button
                type="button"
                onClick={() => handleToggleGateEnforcement(!isGateEnforced)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  isGateEnforced
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                    : 'bg-stone-800 text-stone-400 border border-stone-700 hover:bg-stone-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isGateEnforced ? 'bg-emerald-400' : 'bg-stone-500'}`} />
                <span>{isGateEnforced ? (language === 'ar' ? 'مفعلة وإلزامية' : 'Enforced') : (language === 'ar' ? 'معطلة مؤقتاً' : 'Bypassed')}</span>
              </button>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-lg bg-stone-800/80 border border-stone-700 text-stone-400 text-xs flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === 'ar' ? 'محصورة بالسوبر أدمن فقط' : 'Super Admin Only'}</span>
            </div>
          )}
        </div>

        {gateSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{gateSuccess}</span>
          </div>
        )}

        {gateError && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{gateError}</span>
          </div>
        )}

        {isSuperAdmin ? (
          <div className="space-y-4">
            {/* Active Gate Passcode Display Card */}
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  {language === 'ar' ? 'شفرة بوابة الإدارة النشطة حالياً (Master Code)' : 'Active Master Gate Passcode'}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-base sm:text-lg font-bold text-stone-100 tracking-wider">
                    {showGatePass ? gatePasscode : '••••••••••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowGatePass(!showGatePass)}
                    className="p-1.5 text-stone-400 hover:text-stone-200 transition"
                    title={showGatePass ? 'Hide' : 'Reveal'}
                  >
                    {showGatePass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(gatePasscode, 'gate')}
                    className="p-1.5 text-stone-400 hover:text-stone-200 transition"
                    title="Copy passcode"
                  >
                    {copiedGate ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateNewGateCode}
                  className="px-3 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'ar' ? 'توليد شفرة مشفرة جديدة' : 'Generate Cryptographic Code'}</span>
                </button>
              </div>
            </div>

            {/* Custom Gate Passcode Form */}
            <form onSubmit={handleUpdateGatePasscode} className="flex flex-wrap sm:flex-nowrap gap-2.5">
              <input
                type="text"
                value={gateCustomInput}
                onChange={(e) => setGateCustomInput(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل شفرة مخصصة للبوابة (6 خانات على الأقل)' : 'Set custom master gate passcode'}
                className="flex-1 px-3.5 py-2.5 text-xs bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-red-600 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-red-700 hover:bg-red-800 active:scale-[0.99] text-white text-xs font-bold rounded-xl transition shadow-sm whitespace-nowrap"
              >
                {language === 'ar' ? 'تحديث شفرة البوابة' : 'Update Gate Code'}
              </button>
            </form>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800/80 text-center">
            <Lock className="w-6 h-6 text-stone-600 mx-auto mb-2" />
            <p className="text-xs text-stone-400 font-medium">
              {language === 'ar'
                ? 'شفرة بوابة الإدارة مشفرة وخاضعة حصرياً لتحكم السوبر أدمن (Super Admin Alone). لا يمكن للمشرفين الآخرين تعديلها أو عرضها.'
                : 'The Master Gate Passcode is strictly encrypted and accessible only by the Super Admin.'}
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: GOVERNANCE OF THE 3 OFFICIAL ADMINS (SUPER ADMIN ALONE) */}
      <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 shadow-md">
        <div className="flex items-center justify-between mb-5 border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-stone-800 text-stone-300">
              <UserCog className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-stone-100">
                  {language === 'ar' ? 'هيئة المديرين الثلاثة الرسميين (The Three Admins)' : 'The Three System Administrators'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-stone-800 text-stone-300 border border-stone-700">
                  3 Official Roles
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {language === 'ar'
                  ? 'تم تقنين منظومة الإدارة في ثلاثة أدمن محددين (Super Admin و AI Admin و Admin One).'
                  : 'Platform governance restricted to Super Admin, AI Admin, and Admin One.'}
              </p>
            </div>
          </div>
        </div>

        {/* The 3 Admins Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {adminsList.map((admin) => {
            const isSuper = admin.role === 'SUPER_ADMIN';
            const isAi = admin.role === 'AI_ADMIN';
            const isOne = admin.role === 'ADMIN_ONE';

            return (
              <div 
                key={admin.id}
                className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                  isSuper ? 'bg-red-950/20 border-red-900/50' :
                  isAi ? 'bg-purple-950/20 border-purple-900/50' :
                  'bg-stone-950 border-stone-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      isSuper ? 'bg-red-900/60 text-red-200 border border-red-700' :
                      isAi ? 'bg-purple-900/60 text-purple-200 border border-purple-700' :
                      'bg-blue-900/60 text-blue-200 border border-blue-700'
                    }`}>
                      {admin.role}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                    {isAi && <Cpu className="w-4 h-4 text-purple-400" />}
                    {isSuper && <Shield className="w-4 h-4 text-red-400" />}
                    {isOne && <Sliders className="w-4 h-4 text-blue-400" />}
                    <span>{language === 'ar' ? admin.displayNameAr : admin.displayName}</span>
                  </h3>

                  <p className="font-mono text-xs text-stone-400 mt-1 mb-2 select-all">
                    {admin.email}
                  </p>

                  <p className="text-[11px] text-stone-400 leading-relaxed min-h-[38px]">
                    {language === 'ar' ? admin.descriptionAr : admin.descriptionEn}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-800/80">
                  <div className="text-[10px] text-stone-500 mb-2 flex items-center justify-between">
                    <span>{language === 'ar' ? 'آخر تحديث لكلمة السر:' : 'Last Password Update:'}</span>
                    <span>{admin.lastPasswordChangedAt ? new Date(admin.lastPasswordChangedAt).toLocaleDateString() : 'Initial'}</span>
                  </div>

                  {isSuperAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAdminToReset(admin);
                        setAdminResetNewPass(adminSecurityService.generateStrongPassword());
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                      <span>{language === 'ar' ? 'إعادة ضبط كلمة السر' : 'Reset Password'}</span>
                    </button>
                  ) : (
                    <div className="text-center py-1 text-[11px] text-stone-600">
                      {language === 'ar' ? 'خاضع لتحكم السوبر أدمن' : 'Super Admin Controlled'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal / Dialog for Super Admin to Reset Target Admin Password */}
        {selectedAdminToReset && isSuperAdmin && (
          <div className="mt-6 p-5 rounded-xl bg-stone-950 border border-stone-800 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-stone-200 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>
                  {language === 'ar' 
                    ? `إعادة تعيين كلمة السر لحساب: ${selectedAdminToReset.displayNameAr} (${selectedAdminToReset.email})`
                    : `Set new password for: ${selectedAdminToReset.displayName} (${selectedAdminToReset.email})`}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedAdminToReset(null)}
                className="text-xs text-stone-400 hover:text-stone-200"
              >
                ✕ {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>

            {adminResetSuccess && (
              <div className="mb-3 p-3 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{adminResetSuccess}</span>
              </div>
            )}

            {adminResetError && (
              <div className="mb-3 p-3 rounded-lg bg-red-950 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{adminResetError}</span>
              </div>
            )}

            <form onSubmit={handleSuperAdminResetTargetPassword} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showAdminResetPass ? 'text' : 'password'}
                    value={adminResetNewPass}
                    onChange={(e) => setAdminResetNewPass(e.target.value)}
                    placeholder={language === 'ar' ? 'كلمة المرور الجديدة' : 'Enter new password'}
                    required
                    className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-stone-100 font-mono pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminResetPass(!showAdminResetPass)}
                    className="absolute right-9 top-2.5 text-stone-400 hover:text-stone-200"
                  >
                    {showAdminResetPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(adminResetNewPass, 'admin')}
                    className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-200"
                    title="Copy password"
                  >
                    {copiedAdminPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setAdminResetNewPass(adminSecurityService.generateStrongPassword())}
                  className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-lg transition flex items-center gap-1 shrink-0"
                  title="Generate another strong password"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'توليد عشوائي' : 'Regenerate'}</span>
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedAdminToReset(null)}
                  className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-lg transition"
                >
                  {language === 'ar' ? 'حفظ وتثبيت كلمة السر' : 'Confirm Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* SECTION 3: CHANGE OWN PASSWORD (AVAILABLE TO ANY LOGGED IN ADMIN) */}
      <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 shadow-md">
        <div className="flex items-center gap-3 mb-5 border-b border-stone-800 pb-4">
          <div className="p-2 rounded-xl bg-stone-800 text-stone-300">
            <Lock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-black text-stone-100">
              {language === 'ar' ? 'تغيير كلمة المرور الخاصة بحسابك' : 'Update Your Personal Admin Password'}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {language === 'ar'
                ? `تحديث كلمة السر للمشرف المسجل حالياً (${currentUser?.displayName || currentUser?.email}).`
                : `Change the password for the active authenticated admin session (${currentUser?.email}).`}
            </p>
          </div>
        </div>

        {selfSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{selfSuccess}</span>
          </div>
        )}

        {selfError && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{selfError}</span>
          </div>
        )}

        <form onSubmit={handleSelfPasswordSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1.5">
              {language === 'ar' ? 'كلمة المرور الحالية *' : 'Current Password *'}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 text-xs bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none focus:border-red-600 font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-stone-300">
                {language === 'ar' ? 'كلمة المرور الجديدة *' : 'New Password *'}
              </label>
              <button
                type="button"
                onClick={() => {
                  const gen = adminSecurityService.generateStrongPassword();
                  setNewPassword(gen);
                  setConfirmPassword(gen);
                  setShowSelfNewPass(true);
                }}
                className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
              >
                <Sparkles className="w-3 h-3" />
                <span>{language === 'ar' ? 'اقتراح كلمة سر قوية' : 'Suggest Strong Password'}</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showSelfNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={language === 'ar' ? '8 أحرف على الأقل مع أرقام ورموز' : 'Minimum 8 characters with numbers & symbols'}
                required
                className="w-full px-3.5 py-2.5 text-xs bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none focus:border-red-600 font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSelfNewPass(!showSelfNewPass)}
                className="absolute right-3 top-3 text-stone-500 hover:text-stone-300"
              >
                {showSelfNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength Meter Bar */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full bg-stone-800 rounded-full overflow-hidden flex gap-1">
                  <div className={`h-full flex-1 transition-all ${selfStrength.score >= 1 ? selfStrength.color : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 transition-all ${selfStrength.score >= 2 ? selfStrength.color : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 transition-all ${selfStrength.score >= 3 ? selfStrength.color : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 transition-all ${selfStrength.score >= 4 ? selfStrength.color : 'bg-transparent'}`} />
                  <div className={`h-full flex-1 transition-all ${selfStrength.score >= 5 ? selfStrength.color : 'bg-transparent'}`} />
                </div>
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>{language === 'ar' ? 'مستوى قوة كلمة السر:' : 'Strength:'}</span>
                  <span className="font-bold text-stone-200">
                    {language === 'ar' ? selfStrength.labelAr : selfStrength.labelEn}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1.5">
              {language === 'ar' ? 'تأكيد كلمة المرور الجديدة *' : 'Confirm New Password *'}
            </label>
            <input
              type={showSelfNewPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 text-xs bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none focus:border-red-600 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingSelf}
            className="w-full py-2.5 bg-red-700 hover:bg-red-800 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <KeyRound className="w-4 h-4" />
            <span>{isSubmittingSelf ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ كلمة المرور الجديدة' : 'Update Password')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
