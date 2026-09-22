import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Copy,
  Check,
  Download,
  Code2,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  ShieldCheck,
  Globe,
  Sliders,
  Send,
  Layers,
  Sparkles,
  HelpCircle,
  Info,
  Lock
} from 'lucide-react';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useRouter } from '../../contexts/RouterContext';
import { dataService } from '../../services/dataService';
import type { FacebookSettings } from '../../types';

interface N8nAutomationTabProps {
  fbSettings: FacebookSettings;
  onSettingsUpdated: (newSettings: FacebookSettings) => void;
  onRefreshData: () => void;
}

export const N8nAutomationTab: React.FC<N8nAutomationTabProps> = ({
  fbSettings,
  onSettingsUpdated,
  onRefreshData,
}) => {
  const { language, isRTL } = useThemeLanguage();
  const { navigate } = useRouter();

  // Workflow state
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false);
  const [showWorkflowCode, setShowWorkflowCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Simulation test state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [isRegeneratingKey, setIsRegeneratingKey] = useState(false);

  // Sample post inputs for testing
  const [sampleMessage, setSampleMessage] = useState(
    '🔴 عاجل | الخارجية تؤكد وصول وفد وزاري رفيع المستوى إلى جوبا وتوقيع مذكرات تفاهم جديدة لتعزيز التنمية المشتركة وتطوير البنية التحتية والاستقرار الإقليمي.'
  );
  const [sampleImage, setSampleImage] = useState(
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80'
  );

  // Auto Publish toggle
  const [n8nAutoPublish, setN8nAutoPublish] = useState(fbSettings.n8nAutoPublish ?? true);

  // Calculated Webhook URL
  const [currentOrigin, setCurrentOrigin] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentOrigin(window.location.origin);
    }
  }, []);

  const webhookUrl = `${currentOrigin || 'https://juba-news.vercel.app'}/api/integrations/n8n/facebook-post`;
  const n8nApiKey = fbSettings.n8nWebhookSecret || 'juba_n8n_sec_2025';

  // Load workflow template on mount
  useEffect(() => {
    const fetchWorkflow = async () => {
      setIsLoadingWorkflow(true);
      try {
        const data = await dataService.getN8nWorkflow();
        if (data && data.workflow) {
          setWorkflowData(data.workflow);
        }
      } catch (err) {
        console.warn('Could not load n8n workflow:', err);
      } finally {
        setIsLoadingWorkflow(false);
      }
    };
    fetchWorkflow();
  }, []);

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2200);
  };

  const handleDownloadWorkflow = () => {
    if (!workflowData) return;
    const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `juba-news-facebook-n8n-workflow.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRegenerateKey = async () => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من تجديد مفتاح n8n؟ سيتوجب عليك تحديثه في سير عمل n8n لديك.' : 'Are you sure you want to regenerate the n8n API key? You must update it in your n8n workflow.')) {
      return;
    }
    setIsRegeneratingKey(true);
    try {
      const newKey = await dataService.regenerateN8nApiKey();
      const updated = { ...fbSettings, n8nWebhookSecret: newKey };
      onSettingsUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate API key');
    } finally {
      setIsRegeneratingKey(false);
    }
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimulationError(null);
    setSimulationResult(null);

    try {
      const res = await dataService.testN8nPost({
        customMessage: sampleMessage,
        customImage: sampleImage,
        customUrl: `https://www.facebook.com/${fbSettings.metaPageId}/posts/sim-${Date.now()}`,
      });

      setSimulationResult(res);
      onRefreshData();
    } catch (err: any) {
      setSimulationError(err.message || 'Simulation test failed');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleToggleAutoPublish = async (enabled: boolean) => {
    setN8nAutoPublish(enabled);
    const updated = { ...fbSettings, n8nAutoPublish: enabled, autoPublish: enabled };
    await dataService.updateFacebookSettings(updated);
    onSettingsUpdated(updated);
  };

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER: N8N AUTOMATION PIPELINE */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{language === 'ar' ? 'سير عمل n8n متاح وجاهز للاستقبال فورياً' : 'n8n Ingestion Engine Active & Ready'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {language === 'ar'
                ? 'نقل المنشور من صفحة جوبا نيوز على فيسبوك تلقائياً عبر n8n'
                : 'Instant Facebook Post Auto-Ingestion & Publication via n8n'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {language === 'ar'
                ? 'بمجرد نشر أي خبر أو منشور على صفحة جوبا نيوز على فيسبوك، يقوم سير عمل n8n بالتقاط المنشور فورياً وإرساله لموقع جوبا نيوز، حيث يتولى الذكاء الاصطناعي إعادة صياغته صحفياً وترجمته ونشره تلقائياً على الموقع دون أي تدخل يدوي!'
                : 'As soon as a post is published on the Juba News Facebook page, n8n instantly captures and sends it to Juba News, where Gemini AI rewrites, categorizes, and publishes it live with zero delay.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadWorkflow}
              disabled={!workflowData}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{language === 'ar' ? 'تحميل ملف سير العمل (n8n JSON)' : 'Download n8n Workflow JSON'}</span>
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(JSON.stringify(workflowData, null, 2), setCopiedWorkflow)}
              disabled={!workflowData}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-bold text-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {copiedWorkflow ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedWorkflow ? (language === 'ar' ? 'تم نسخ الكود!' : 'Workflow Copied!') : (language === 'ar' ? 'نسخ كود سير العمل كاملاً' : 'Copy Workflow Code')}</span>
            </button>
          </div>
        </div>

        {/* VISUAL 4-STAGE PIPELINE INDICATOR */}
        <div className="mt-8 pt-6 border-t border-indigo-900/60">
          <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-3">
            {language === 'ar' ? 'مسار النقل التلقائي المباشر (End-to-End Pipeline)' : 'Real-Time Ingestion Architecture'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Step 1 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                1
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{language === 'ar' ? 'صفحة فيسبوك جوبا نيوز' : 'Juba News Page'}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {fbSettings.metaPageName || 'Juba News - جوبا نيوز'}
                </div>
                <div className="text-[10px] text-blue-400 font-mono mt-1">ID: {fbSettings.metaPageId}</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                2
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{language === 'ar' ? 'سير عمل n8n' : 'n8n Workflow'}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {language === 'ar' ? 'يلتقط المنشور الجديد فور نشره' : 'Triggers upon new Facebook post'}
                </div>
                <div className="text-[10px] text-emerald-400 mt-1">⚡ Instant Webhook / Poller</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600/30 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                3
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'ar' ? 'معالجة الذكاء الاصطناعي' : 'Gemini AI Processing'}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {language === 'ar' ? 'صياغة صحفية رصينة + ترجمة' : 'Journalistic rewrite & bilingual'}
                </div>
                <div className="text-[10px] text-amber-400 mt-1">Gemini 2.5 Flash</div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                4
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'ar' ? 'موقع جوبا نيوز' : 'Juba News Live'}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {n8nAutoPublish
                    ? (language === 'ar' ? 'نشر مباشر وفوري للجمهور' : 'Auto-Published Live to Website')
                    : (language === 'ar' ? 'حفظ كمسودة للمراجعة' : 'Saved to Editorial Drafts')}
                </div>
                <div className="text-[10px] text-emerald-400 font-bold mt-1">
                  {n8nAutoPublish ? '✓ Live Publication' : 'Draft Review'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CREDENTIALS & WEBHOOK CONFIGURATION CARD */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200 dark:border-stone-800 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-stone-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>{language === 'ar' ? 'بيانات الربط والويب هوك الخاص بـ n8n' : 'n8n Integration & Webhook Credentials'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'ar'
                ? 'استخدم هذه البيانات في عقدة HTTP Request داخل n8n لإرسال منشورات فيسبوك تلقائياً.'
                : 'Configure these details in your n8n HTTP Request node to route posts directly to Juba News.'}
            </p>
          </div>

          {/* Instant Auto-Publish Switch */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-stone-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-stone-700">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {language === 'ar' ? 'النشر المباشر فور الاستلام:' : 'Instant Auto-Publish:'}
            </span>
            <button
              type="button"
              onClick={() => handleToggleAutoPublish(!n8nAutoPublish)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                n8nAutoPublish ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-stone-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  n8nAutoPublish ? (isRTL ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-[11px] font-bold ${n8nAutoPublish ? 'text-emerald-600' : 'text-slate-400'}`}>
              {n8nAutoPublish ? (language === 'ar' ? 'مفعل (نشر فوري)' : 'Active (Live)') : (language === 'ar' ? 'مسودة' : 'Draft')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Target Webhook Ingestion URL */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{language === 'ar' ? 'رابط استقبال المنشورات (Webhook URL)' : 'Webhook Target URL'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                POST
              </span>
            </label>
            <div className="flex items-center gap-2" dir="ltr">
              <div className="relative flex-1 flex items-center min-w-0">
                <div className="absolute left-2.5 z-10 flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/90 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700 pointer-events-none select-none">
                  <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>HTTPS</span>
                </div>
                <input
                  type="text"
                  readOnly
                  dir="ltr"
                  value={webhookUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  onFocus={(e) => e.target.select()}
                  className="w-full pl-22 pr-3.5 py-2.5 bg-slate-50 dark:bg-stone-800 border border-slate-300 dark:border-stone-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left select-all cursor-pointer"
                  title={language === 'ar' ? 'انقر لتحديد الرابط كاملاً' : 'Click to select full URL'}
                />
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(webhookUrl, setCopiedUrl)}
                className="shrink-0 px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedUrl ? (language === 'ar' ? 'تم النسخ!' : 'Copied!') : (language === 'ar' ? 'نسخ' : 'Copy')}</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-1">
              <span>
                {language === 'ar'
                  ? 'ضع هذا الرابط في عقدة n8n في حقل URL مع اختيار طريقة POST.'
                  : 'Insert this URL in the n8n HTTP Request node with POST method.'}
              </span>
              <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800" dir="ltr">
                METHOD: POST
              </span>
            </div>
          </div>

          {/* n8n Webhook Secret Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'ar' ? 'مفتاح أمان n8n (X-N8N-API-KEY)' : 'Security API Key / Secret'}
              </label>
              <button
                type="button"
                onClick={handleRegenerateKey}
                disabled={isRegeneratingKey}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRegeneratingKey ? 'animate-spin' : ''}`} />
                <span>{language === 'ar' ? 'تجديد المفتاح' : 'Regenerate'}</span>
              </button>
            </div>
            <div className="flex items-center gap-2" dir="ltr">
              <div className="relative flex-1 flex items-center min-w-0">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  readOnly
                  dir="ltr"
                  value={n8nApiKey}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  onFocus={(e) => e.target.select()}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-stone-800 border border-slate-300 dark:border-stone-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left select-all cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={showApiKey ? 'إخفاء' : 'إظهار'}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(n8nApiKey, setCopiedKey)}
                className="shrink-0 px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey ? (language === 'ar' ? 'تم النسخ!' : 'Copied!') : (language === 'ar' ? 'نسخ' : 'Copy')}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              {language === 'ar'
                ? 'أرسل هذا المفتاح في ترويسة الطلب: X-N8N-API-KEY أو X-Webhook-Secret.'
                : 'Send this key in HTTP Request Headers: X-N8N-API-KEY or Bearer token.'}
            </p>
          </div>
        </div>

        {/* Expected JSON Payload & HTTP Headers Spec */}
        <div className="bg-slate-50 dark:bg-stone-800/60 rounded-xl p-4 border border-slate-200 dark:border-stone-700 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-indigo-600" />
              <span>{language === 'ar' ? 'صيغة حمولة البيانات التي يقبلها الرابط (JSON Payload)' : 'Accepted JSON Payload Specification'}</span>
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              ✓ Supports Single Post & Arrays
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]" dir="ltr">
            <div className="bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto text-left">
              <div className="text-slate-400 text-[10px] mb-1 font-sans"># Required HTTP Request & Headers</div>
              <div className="text-cyan-300 font-bold break-all">POST {webhookUrl}</div>
              <div className="text-amber-300">Content-Type: application/json</div>
              <div className="text-emerald-300">X-N8N-API-KEY: {n8nApiKey}</div>
            </div>

            <div className="bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto">
              <div className="text-slate-400 text-[10px] mb-1 font-sans"># Post JSON Body</div>
              <pre className="text-indigo-300">
{`{
  "id": "108429588219424_123456",
  "message": "نص منشور صفحة جوبا نيوز...",
  "created_time": "2025-01-01T12:00:00Z",
  "permalink_url": "https://facebook.com/...",
  "full_picture": "https://.../photo.jpg",
  "autoPublish": true
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* 3. STEP-BY-STEP SETUP GUIDE FOR N8N */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200 dark:border-stone-800 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>{language === 'ar' ? 'طريقة تركيب وتشغيل سير العمل في n8n بـ 3 خطوات فقط' : 'Quick 3-Step Setup Guide in n8n'}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'ar'
              ? 'اتبع هذه الخطوات البسيطة لربط n8n بصفحة جوبا نيوز على فيسبوك ونقل الأخبار فورياً.'
              : 'Follow these straightforward steps to import the workflow into your n8n instance and go live.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1 */}
          <div className="border border-slate-200 dark:border-stone-800 rounded-xl p-4 bg-slate-50/50 dark:bg-stone-800/30 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
              1
            </div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">
              {language === 'ar' ? 'استيراد سير العمل في n8n' : 'Import Workflow into n8n'}
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === 'ar'
                ? 'اضغط على زر "تحميل ملف سير العمل" أعلاه، ثم في شاشة n8n اضغط على القائمة (...) واختر "Import from File" أو انسخ كود سير العمل والصقه مباشرة في لوحة n8n.'
                : 'Click "Download n8n Workflow JSON" above, open n8n canvas, and select "Import from File" or paste the copied JSON directly onto the canvas.'}
            </p>
          </div>

          {/* Step 2 */}
          <div className="border border-slate-200 dark:border-stone-800 rounded-xl p-4 bg-slate-50/50 dark:bg-stone-800/30 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              2
            </div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">
              {language === 'ar' ? 'إدخال رمز صفحة فيسبوك' : 'Set Facebook Page Access Token'}
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === 'ar'
                ? 'في العقدة الأولى (Newsroom Configuration)، ستجد معرّف صفحة جوبا نيوز (108429588219424) ورابط الويب هوك مجهّزة تلقائياً. فقط ضع رمز وصول الصفحة (Page Access Token).'
                : 'In the "Newsroom Configuration" node, Juba News Page ID (108429588219424) and endpoint are pre-configured. Just paste your Facebook Page Access Token.'}
            </p>
          </div>

          {/* Step 3 */}
          <div className="border border-slate-200 dark:border-stone-800 rounded-xl p-4 bg-slate-50/50 dark:bg-stone-800/30 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              3
            </div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">
              {language === 'ar' ? 'تفعيل التشغيل التلقائي (Active)' : 'Activate Workflow (Active: ON)'}
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === 'ar'
                ? 'اضغط على زر تفعيل سير العمل (Active: ON). والآن، كل منشور جديد ينشر على صفحة جوبا نيوز سينتقل فورياً للموقع ويتحول لخبر صحفي متكامل مع صورة وعنوان وتصنيف!'
                : 'Switch the toggle in n8n to "Active: ON". From that second forward, every single Facebook post is instantly converted to a published news article on Juba News!'}
            </p>
          </div>
        </div>

        {/* Expandable Workflow JSON Code Viewer */}
        <div className="border border-slate-200 dark:border-stone-800 rounded-xl overflow-hidden">
          <div
            onClick={() => setShowWorkflowCode(!showWorkflowCode)}
            className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-stone-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-stone-750 transition"
          >
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                {language === 'ar' ? 'معاينة كود سير عمل n8n الجاهز (Inspect Workflow Nodes)' : 'Inspect n8n Workflow Code'}
              </span>
            </div>
            <span className="text-xs text-indigo-600 font-bold">
              {showWorkflowCode ? (language === 'ar' ? 'إخفاء ▲' : 'Hide ▲') : (language === 'ar' ? 'إظهار الكود ▼' : 'Show Code ▼')}
            </span>
          </div>

          {showWorkflowCode && workflowData && (
            <div className="p-4 bg-slate-900 text-slate-200 font-mono text-[11px] max-h-72 overflow-y-auto">
              <pre>{JSON.stringify(workflowData, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      {/* 4. ONE-CLICK LIVE TEST SIMULATOR */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200 dark:border-stone-800 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-stone-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-600" />
              <span>{language === 'ar' ? 'تجربة ومحاكاة النقل الفوري عبر n8n بنقرة واحدة' : 'One-Click n8n Post Ingestion Simulator'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'ar'
                ? 'قم بتجربة وصول منشور عبر مسار n8n للتحقق من الصياغة الذكية والنشر الفوري على الموقع مباشرة.'
                : 'Simulate an incoming post through the n8n pipeline to test AI formatting and instant live publication.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSampleMessage(
                '🔴 عاجل | الخارجية تؤكد وصول وفد وزاري رفيع المستوى إلى جوبا وتوقيع مذكرات تفاهم جديدة لتعزيز التنمية المشتركة وتطوير البنية التحتية والاستقرار الإقليمي.'
              );
              setSampleImage('https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80');
            }}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'تعبئة منشور نموذجي عن جوبا' : 'Fill Sample Juba Dispatch'}</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              {language === 'ar' ? 'نص منشور فيسبوك الافتراضي:' : 'Sample Facebook Post Message:'}
            </label>
            <textarea
              rows={3}
              value={sampleMessage}
              onChange={(e) => setSampleMessage(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-stone-800 border border-slate-300 dark:border-stone-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
              placeholder={language === 'ar' ? 'أدخل نص المنشور المراد اختباره...' : 'Enter Facebook post text to simulate...'}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              {language === 'ar' ? 'رابط الصورة المرفقة بالمنشور (اختياري):' : 'Sample Image URL (Optional):'}
            </label>
            <input
              type="text"
              value={sampleImage}
              onChange={(e) => setSampleImage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-stone-800 border border-slate-300 dark:border-stone-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={isSimulating || !sampleMessage.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSimulating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>
                {isSimulating
                  ? (language === 'ar' ? 'جاري المعالجة بالذكاء الاصطناعي والنشر...' : 'Processing via AI & Publishing...')
                  : (language === 'ar' ? 'إرسال وتجربة النقل عبر n8n الآن' : 'Simulate n8n Post Transfer Now')}
              </span>
            </button>
          </div>

          {/* SIMULATION SUCCESS CARD */}
          {simulationResult && simulationResult.article && (
            <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-emerald-500/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{simulationResult.message}</span>
              </div>

              <div className="bg-white dark:bg-stone-900 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {simulationResult.article.titleAr}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {simulationResult.article.titleEn}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-[10px] font-black uppercase">
                      ✓ {simulationResult.article.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {simulationResult.article.id}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(simulationResult.article.url)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'عرض الخبر المنشور على الموقع' : 'View Published Article'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATION ERROR ALERT */}
          {simulationError && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl p-3.5 flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{simulationError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
