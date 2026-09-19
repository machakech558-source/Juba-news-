import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowLeft, 
  AlertCircle, 
  KeyRound, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Cpu, 
  Sliders, 
  ShieldAlert 
} from 'lucide-react';
import { JubaNewsEmblem } from '../../components/common/JubaNewsLogo';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useRouter } from '../../contexts/RouterContext';
import { adminSecurityService } from '../../services/adminSecurityService';

export const AdminLoginPage: React.FC = () => {
  const { loginWithEmail, resetPassword, logout } = useAuth();
  const { language } = useThemeLanguage();
  const { navigate } = useRouter();

  // Gate Security State
  const [isGateUnlocked, setIsGateUnlocked] = useState<boolean>(() => {
    return adminSecurityService.isGateUnlockedThisSession();
  });
  const [gateInput, setGateInput] = useState('');
  const [showGateCode, setShowGateCode] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [isVerifyingGate, setIsVerifyingGate] = useState(false);

  // Admin Login Credentials State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const isGateEnforced = adminSecurityService.isGateEnforced();

  useEffect(() => {
    setIsGateUnlocked(adminSecurityService.isGateUnlockedThisSession());
  }, []);

  // 1. Handle Admin Gate Unlock
  const handleGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGateError(null);
    setIsVerifyingGate(true);

    const res = adminSecurityService.verifyAndUnlockGate(gateInput);
    setIsVerifyingGate(false);

    if (res.success) {
      setIsGateUnlocked(true);
      setGateInput('');
    } else {
      setGateError(res.error || (language === 'ar' ? 'شفرة البوابة غير صحيحة.' : 'Invalid gate passcode.'));
    }
  };

  // 2. Handle Admin Sign In
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setIsLoading(true);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedEmail || !trimmedPass) {
      setError(language === 'ar' ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' : 'Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await loginWithEmail(trimmedEmail, trimmedPass);
      setIsLoading(false);

      if (result.success) {
        const savedUserStr = localStorage.getItem('juba_active_user');
        if (savedUserStr) {
          const userObj = JSON.parse(savedUserStr);
          const role = (userObj.role || '').toLowerCase();
          const isAllowedAdmin = role === 'super_admin' || role === 'ai_admin' || role === 'admin_one' || role === 'editor' || role === 'moderator';

          if (!isAllowedAdmin) {
            logout();
            setError(language === 'ar' 
              ? 'تم التحقق من الحساب ولكن ليس لديك صلاحية للوصول إلى لوحة التحكم الإدارية.' 
              : 'Authentication successful, but this account does not have administrative privileges.');
            return;
          }
        }
        navigate('/admin');
      } else {
        setError(result.error || (language === 'ar' 
          ? 'بيانات الاعتماد غير صالحة أو فشل تسجيل الدخول.' 
          : 'Invalid credentials or authentication error.'));
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || (language === 'ar' ? 'حدث خطأ أثناء تسجيل الدخول.' : 'An error occurred during authentication.'));
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setIsResetting(true);
    setError(null);
    setInfoMessage(null);

    const res = await resetPassword(resetEmail.trim());
    setIsResetting(false);
    if (res.success) {
      setInfoMessage(language === 'ar' 
        ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.' 
        : 'Password reset link has been dispatched to your email.');
      setShowResetModal(false);
    } else {
      setError(res.error || 'Failed to send password reset email.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center px-4 py-12 select-none relative overflow-hidden">
      {/* Background radial accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-red-900/40 rounded-full blur-[160px]" />
      </div>

      {/* STEP 1: ADMIN SECURITY GATE (IF ENFORCED AND NOT UNLOCKED) */}
      {isGateEnforced && !isGateUnlocked ? (
        <div className="relative w-full max-w-md bg-stone-900/95 backdrop-blur-md border border-stone-800 rounded-2xl p-8 shadow-2xl animate-in fade-in">
          <div className="text-center mb-6">
            <div className="inline-flex justify-center mb-4 transition-transform hover:scale-105">
              <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-800 flex items-center justify-center text-red-500 shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/70 border border-red-800/80 text-red-300 text-[11px] font-bold mb-2 uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'بوابة الإدارة المشفرة' : 'Admin Security Gate'}</span>
            </div>
            <h1 className="text-xl font-black font-editorial text-stone-100 tracking-tight">
              {language === 'ar' ? 'شفرة حماية بوابة الإدارة' : 'Master Gate Verification'}
            </h1>
            <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
              {language === 'ar'
                ? 'الدخول إلى بوابة الإدارة مشفر ومحمي برمز وصول خاضع حصرياً لـ Super Admin Alone.'
                : 'Access is guarded by a Master Gate code encrypted & managed by Super Admin alone.'}
            </p>
          </div>

          {gateError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{gateError}</span>
            </div>
          )}

          <form onSubmit={handleGateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5 uppercase tracking-wider">
                {language === 'ar' ? 'شفرة البوابة (Gate Security Passcode)' : 'Gate Security Passcode'}
              </label>
              <div className="relative">
                <input
                  type={showGateCode ? 'text' : 'password'}
                  value={gateInput}
                  onChange={(e) => setGateInput(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل شفرة حماية البوابة...' : 'Enter master gate code...'}
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 pl-10 pr-10 text-xs bg-stone-950 border border-stone-800 focus:border-red-600 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-red-600 font-mono tracking-wider transition"
                />
                <KeyRound className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowGateCode(!showGateCode)}
                  className="absolute right-3.5 top-3 text-stone-500 hover:text-stone-300"
                >
                  {showGateCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifyingGate}
              className="w-full py-3 bg-red-700 hover:bg-red-800 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isVerifyingGate 
                  ? (language === 'ar' ? 'جاري فك التشفير...' : 'Verifying Code...') 
                  : (language === 'ar' ? 'التحقق وفتح بوابة الإدارة' : 'Unlock Admin Gate')}
              </span>
            </button>
          </form>

          {/* Three Admins Note */}
          <div className="mt-6 pt-4 border-t border-stone-800/80 text-center">
            <span className="text-[10px] text-stone-400 block mb-1">
              {language === 'ar' ? 'البوابة مخصصة حصرياً للمديرين الثلاثة المعتمدين:' : 'Restricted to the 3 Official Admins:'}
            </span>
            <div className="flex justify-center gap-1.5 text-[10px] font-bold text-stone-400">
              <span className="text-red-400">Super Admin</span> • <span className="text-purple-400">AI Admin</span> • <span className="text-blue-400">Admin One</span>
            </div>
          </div>

          {/* Return to Live Site */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'العودة إلى الموقع الإخباري' : 'Return to Public Newspaper'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* STEP 2: CREDENTIALS LOGIN FORM (WHEN GATE IS UNLOCKED) */
        <div className="relative w-full max-w-md bg-stone-900/95 backdrop-blur-md border border-stone-800 rounded-2xl p-8 shadow-2xl animate-in fade-in">
          {/* Unlocked Gate Status Indicator */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-800 text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{language === 'ar' ? 'بوابة الإدارة مفتوحة' : 'Gate Verified & Unlocked'}</span>
            </span>
            {isGateEnforced && (
              <button
                type="button"
                onClick={() => {
                  adminSecurityService.setGateSessionUnlocked(false);
                  setIsGateUnlocked(false);
                }}
                className="text-stone-500 hover:text-red-400 transition"
              >
                {language === 'ar' ? 'قفل البوابة' : 'Lock Gate'}
              </button>
            )}
          </div>

          {/* Portal Header */}
          <div className="text-center mb-6">
            <div className="inline-flex justify-center mb-4 transition-transform hover:scale-105">
              <JubaNewsEmblem size={48} idSuffix="admin-login-vault" />
            </div>
            <h1 className="text-2xl font-black font-editorial text-stone-100 tracking-tight">
              {language === 'ar' ? 'بوابة إدارة جوبا نيوز' : 'Juba News CMS Portal'}
            </h1>
            <p className="text-xs text-stone-400 mt-1">
              {language === 'ar'
                ? 'تسجيل الدخول الآمن لهيئة التحرير والإدارة المعتمدة'
                : 'Authorized sign-in for the three administrative accounts'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5 uppercase tracking-wider">
                {language === 'ar' ? 'البريد الإلكتروني للإدارة' : 'Admin Email'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jubanews.org"
                  autoComplete="email"
                  required
                  className="w-full px-3.5 py-2.5 pl-10 text-xs bg-stone-950 border border-stone-800 focus:border-red-600 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-red-600 transition"
                />
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setShowResetModal(true);
                  }}
                  className="text-[11px] text-red-400 hover:text-red-300 transition"
                >
                  {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full px-3.5 py-2.5 pl-10 pr-10 text-xs bg-stone-950 border border-stone-800 focus:border-red-600 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-red-600 font-mono transition"
                />
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-3 text-stone-500 hover:text-stone-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-red-700 hover:bg-red-800 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isLoading
                  ? (language === 'ar' ? 'جاري التحقق...' : 'Authenticating...')
                  : (language === 'ar' ? 'تسجيل الدخول إلى الإدارة' : 'Sign In to Console')}
              </span>
            </button>
          </form>

          {/* Reset Password Modal */}
          {showResetModal && (
            <div className="mt-6 pt-5 border-t border-stone-800">
              <h2 className="text-xs font-bold text-stone-200 flex items-center gap-1.5 mb-2">
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}</span>
              </h2>
              <form onSubmit={handlePasswordReset} className="space-y-2">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="admin@jubanews.org"
                  required
                  className="w-full px-3 py-2 text-xs bg-stone-950 border border-stone-800 rounded-lg text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-red-600"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="flex-1 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg transition"
                  >
                    {isResetting ? 'Sending...' : (language === 'ar' ? 'إرسال الرابط' : 'Send Reset Link')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-3 py-1.5 bg-transparent hover:bg-stone-800 text-stone-400 text-xs rounded-lg transition"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Return to Live Site */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'العودة إلى الموقع الإخباري' : 'Return to Public Newspaper'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
