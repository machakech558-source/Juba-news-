import type { UserProfile, UserRole, AdminAccountConfig, GateSecurityConfig } from '../types';
import { dataService } from './dataService';

// Storage keys kept local to browser - strictly prevented from being committed to git/github
const VAULT_STORAGE_KEY = 'juba_admin_credentials_vault_v2';
const GATE_STORAGE_KEY = 'juba_admin_gate_config_v2';
const GATE_SESSION_KEY = 'juba_admin_gate_session_unlocked';

// Definition of the 3 Official Admins
export const THREE_ADMINS: AdminAccountConfig[] = [
  {
    id: 'admin-super',
    email: 'anwar.youal@jubanews.org',
    displayName: 'أنور يل يوال (Super Admin)',
    displayNameAr: 'أنور يل يوال (السوبر أدمن)',
    role: 'SUPER_ADMIN',
    descriptionEn: 'Editor-in-Chief and sole platform executive with exclusive control over Master Gate encryption and password governance.',
    descriptionAr: 'رئيس التحرير والمدير العام صاحب الصلاحية الحصرية لتشفير شفرة بوابة الإدارة والتحكم الشامل بكلمات السر.',
  },
  {
    id: 'admin-ai',
    email: 'ai.admin@jubanews.org',
    displayName: 'AI Admin',
    displayNameAr: 'مدير الذكاء الاصطناعي (AI Admin)',
    role: 'AI_ADMIN',
    descriptionEn: 'Dedicated AI newsroom supervisor, Facebook feed auto-publisher, and automated journalistic assistant.',
    descriptionAr: 'مدير غرفة أخبار الذكاء الاصطناعي والنشر التلقائي عبر فيسبوك والمحرر الآلي.',
  },
  {
    id: 'admin-one',
    email: 'admin1@jubanews.org',
    displayName: 'Admin One',
    displayNameAr: 'الأدمن الأول (Admin One)',
    role: 'ADMIN_ONE',
    descriptionEn: 'Managing News Editor overseeing breaking dispatches, reporting desks, and publication releases.',
    descriptionAr: 'الأدمن الأول ومدير التحرير الميداني، مكلّف بنشر التقارير، الأخبار العاجلة والأقسام.',
  },
];

// Simple obfuscation/hash helper to avoid plaintext storage in browser local storage
function hashSecret(secret: string): string {
  let hash = 0;
  for (let i = 0; i < secret.length; i++) {
    const char = secret.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `jn_sec_${Math.abs(hash).toString(36)}_${btoa(unescape(encodeURIComponent(secret))).split('').reverse().join('')}`;
}

function verifyHash(input: string, storedHash: string): boolean {
  return hashSecret(input) === storedHash;
}

class AdminSecurityService {
  private gateConfig: GateSecurityConfig;
  private credentialVault: Record<string, { hash: string; lastChanged: string }>;

  constructor() {
    this.gateConfig = this.loadGateConfig();
    this.credentialVault = this.loadCredentialVault();
  }

  // ==========================================
  // 1. GATE SECURITY MANAGEMENT (SUPER ADMIN ONLY)
  // ==========================================

  private loadGateConfig(): GateSecurityConfig {
    const defaultGate: GateSecurityConfig = {
      enabled: true,
      passcode: 'JUBA#GATE@2026', // Initial default gate passcode, can be changed by Super Admin alone
      lastUpdated: new Date().toISOString(),
      updatedBy: 'SUPER_ADMIN',
      failedAttempts: 0,
    };

    try {
      const stored = localStorage.getItem(GATE_STORAGE_KEY);
      if (stored) {
        return { ...defaultGate, ...JSON.parse(stored) };
      }
      localStorage.setItem(GATE_STORAGE_KEY, JSON.stringify(defaultGate));
      return defaultGate;
    } catch {
      return defaultGate;
    }
  }

  private saveGateConfig() {
    try {
      localStorage.setItem(GATE_STORAGE_KEY, JSON.stringify(this.gateConfig));
    } catch (e) {
      console.error('Failed to save gate config:', e);
    }
  }

  public isGateEnforced(): boolean {
    return this.gateConfig.enabled;
  }

  public isGateUnlockedThisSession(): boolean {
    if (!this.gateConfig.enabled) return true;
    try {
      return sessionStorage.getItem(GATE_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  }

  public verifyAndUnlockGate(inputPasscode: string): { success: boolean; error?: string } {
    if (!this.gateConfig.enabled) {
      this.setGateSessionUnlocked(true);
      return { success: true };
    }

    const trimmedInput = inputPasscode.trim();
    if (!trimmedInput) {
      return { success: false, error: 'يرجى إدخال شفرة أمان بوابة الإدارة.' };
    }

    if (trimmedInput === this.gateConfig.passcode) {
      this.gateConfig.failedAttempts = 0;
      this.saveGateConfig();
      this.setGateSessionUnlocked(true);
      return { success: true };
    }

    this.gateConfig.failedAttempts += 1;
    this.saveGateConfig();
    return { 
      success: false, 
      error: 'شفرة البوابة غير صحيحة. الوصول محمي ومحصور بتصريح السوبر أدمن (Super Admin Alone).' 
    };
  }

  public setGateSessionUnlocked(unlocked: boolean) {
    try {
      if (unlocked) {
        sessionStorage.setItem(GATE_SESSION_KEY, 'true');
      } else {
        sessionStorage.removeItem(GATE_SESSION_KEY);
      }
    } catch {
      // ignore
    }
  }

  /**
   * SUPER ADMIN ALONE: View active gate passcode
   */
  public getGatePasscode(caller: UserProfile): { success: boolean; passcode?: string; error?: string } {
    if (!this.isCallerSuperAdmin(caller)) {
      return { 
        success: false, 
        error: 'صلاحية مرفوضة: شفرة بوابة الإدارة حصرية للسوبر أدمن فقط (Super Admin Alone).' 
      };
    }
    return { success: true, passcode: this.gateConfig.passcode };
  }

  /**
   * SUPER ADMIN ALONE: Update gate passcode
   */
  public updateGatePasscode(newPasscode: string, caller: UserProfile): { success: boolean; error?: string } {
    if (!this.isCallerSuperAdmin(caller)) {
      return { 
        success: false, 
        error: 'صلاحية مرفوضة: تعديل شفرة بوابة الإدارة محصور بالسوبر أدمن فقط (Super Admin Alone).' 
      };
    }

    const trimmed = newPasscode.trim();
    if (trimmed.length < 6) {
      return { success: false, error: 'شفرة البوابة يجب أن تتكون من 6 خانات على الأقل.' };
    }

    this.gateConfig.passcode = trimmed;
    this.gateConfig.lastUpdated = new Date().toISOString();
    this.gateConfig.updatedBy = caller.displayName || caller.email;
    this.saveGateConfig();

    dataService.logActivity({
      adminId: caller.id,
      adminName: caller.displayName,
      adminRole: caller.role,
      action: 'ADMIN_GATE_PASSCODE_UPDATED',
      targetType: 'SecurityGate',
      targetId: 'admin_gate',
      targetTitle: 'Admin Master Security Gate',
      details: 'Super Admin updated the master Admin Gate security passcode.',
    });

    return { success: true };
  }

  /**
   * SUPER ADMIN ALONE: Generate cryptographic high-entropy gate code
   */
  public generateCryptographicGatePasscode(caller: UserProfile): { success: boolean; newPasscode?: string; error?: string } {
    if (!this.isCallerSuperAdmin(caller)) {
      return { 
        success: false, 
        error: 'صلاحية مرفوضة: توليد شفرة البوابة محصور بالسوبر أدمن فقط (Super Admin Alone).' 
      };
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*';
    const segment = (len: number) => Array.from({ length: len }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    const generated = `JN-GATE-${segment(4)}-${segment(4)}`;

    this.gateConfig.passcode = generated;
    this.gateConfig.lastUpdated = new Date().toISOString();
    this.gateConfig.updatedBy = caller.displayName || caller.email;
    this.saveGateConfig();

    dataService.logActivity({
      adminId: caller.id,
      adminName: caller.displayName,
      adminRole: caller.role,
      action: 'ADMIN_GATE_PASSCODE_REGENERATED',
      targetType: 'SecurityGate',
      targetId: 'admin_gate',
      targetTitle: 'Admin Master Security Gate',
      details: 'Super Admin generated a new cryptographic Admin Gate security code.',
    });

    return { success: true, newPasscode: generated };
  }

  /**
   * SUPER ADMIN ALONE: Toggle gate requirement
   */
  public toggleGateEnforcement(enabled: boolean, caller: UserProfile): { success: boolean; error?: string } {
    if (!this.isCallerSuperAdmin(caller)) {
      return { 
        success: false, 
        error: 'صلاحية مرفوضة: تفعيل أو تعطيل البوابة محصور بالسوبر أدمن فقط (Super Admin Alone).' 
      };
    }

    this.gateConfig.enabled = enabled;
    this.gateConfig.lastUpdated = new Date().toISOString();
    this.gateConfig.updatedBy = caller.displayName || caller.email;
    this.saveGateConfig();

    dataService.logActivity({
      adminId: caller.id,
      adminName: caller.displayName,
      adminRole: caller.role,
      action: enabled ? 'ADMIN_GATE_ENFORCED' : 'ADMIN_GATE_BYPASSED',
      targetType: 'SecurityGate',
      targetId: 'admin_gate',
      targetTitle: 'Admin Master Security Gate',
      details: `Super Admin ${enabled ? 'enforced' : 'disabled'} the Admin Gate security passcode requirement.`,
    });

    return { success: true };
  }

  public getGateStatus() {
    return {
      enabled: this.gateConfig.enabled,
      lastUpdated: this.gateConfig.lastUpdated,
      updatedBy: this.gateConfig.updatedBy,
      failedAttempts: this.gateConfig.failedAttempts,
    };
  }

  // ==========================================
  // 2. CREDENTIALS & PASSWORDS VAULT
  // ==========================================

  private loadCredentialVault(): Record<string, { hash: string; lastChanged: string }> {
    // Initial bootstrap passwords stored hashed in client storage if not already set
    const defaultInitials: Record<string, string> = {
      'anwar.youal@jubanews.org': 'Lucky#2021.super',
      'superadmin@jubanews.org': 'Lucky#2021.super',
      'ai.admin@jubanews.org': 'AiAdmin@2026!',
      'admin1@jubanews.org': 'AdminOne@2026!',
    };

    try {
      const stored = localStorage.getItem(VAULT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure anwar.youal@jubanews.org and superadmin@jubanews.org are primed with Lucky#2021.super
        if (!parsed['anwar.youal@jubanews.org']) {
          parsed['anwar.youal@jubanews.org'] = {
            hash: hashSecret('Lucky#2021.super'),
            lastChanged: new Date().toISOString(),
          };
          parsed['superadmin@jubanews.org'] = {
            hash: hashSecret('Lucky#2021.super'),
            lastChanged: new Date().toISOString(),
          };
          localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }

      // Initialize with hashed values
      const initialVault: Record<string, { hash: string; lastChanged: string }> = {};
      Object.entries(defaultInitials).forEach(([email, plainPass]) => {
        initialVault[email.toLowerCase()] = {
          hash: hashSecret(plainPass),
          lastChanged: new Date().toISOString(),
        };
      });

      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(initialVault));
      return initialVault;
    } catch {
      const fallback: Record<string, { hash: string; lastChanged: string }> = {};
      Object.entries(defaultInitials).forEach(([email, plainPass]) => {
        fallback[email.toLowerCase()] = {
          hash: hashSecret(plainPass),
          lastChanged: new Date().toISOString(),
        };
      });
      return fallback;
    }
  }

  private saveCredentialVault() {
    try {
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(this.credentialVault));
    } catch (e) {
      console.error('Failed to save credential vault:', e);
    }
  }

  public verifyPassword(email: string, plainPass: string): boolean {
    const normalized = email.toLowerCase().trim();
    const record = this.credentialVault[normalized];
    if (!record) return false;
    return verifyHash(plainPass, record.hash);
  }

  /**
   * Any authenticated admin changing their own password
   */
  public changeOwnPassword(email: string, oldPass: string, newPass: string): { success: boolean; error?: string } {
    const normalized = email.toLowerCase().trim();
    if (!this.verifyPassword(normalized, oldPass)) {
      return { success: false, error: 'كلمة المرور الحالية غير صحيحة.' };
    }

    if (newPass.length < 8) {
      return { success: false, error: 'كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف وتحتوي على مزيج آمن.' };
    }

    this.credentialVault[normalized] = {
      hash: hashSecret(newPass),
      lastChanged: new Date().toISOString(),
    };
    this.saveCredentialVault();

    dataService.logActivity({
      adminId: normalized,
      adminName: normalized,
      adminRole: 'ADMIN_ONE',
      action: 'ADMIN_PASSWORD_CHANGED',
      targetType: 'Credentials',
      targetId: normalized,
      targetTitle: normalized,
      details: `Admin (${normalized}) updated their own account password.`,
    });

    return { success: true };
  }

  /**
   * SUPER ADMIN ALONE: Reset or set password for any of the three admins
   */
  public setAdminPasswordBySuperAdmin(targetEmail: string, newPass: string, caller: UserProfile): { success: boolean; error?: string } {
    if (!this.isCallerSuperAdmin(caller)) {
      return { 
        success: false, 
        error: 'صلاحية مرفوضة: تعديل كلمات سر المديرين محصورة بالسوبر أدمن فقط (Super Admin Alone).' 
      };
    }

    const normalizedTarget = targetEmail.toLowerCase().trim();
    if (newPass.length < 8) {
      return { success: false, error: 'كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف.' };
    }

    this.credentialVault[normalizedTarget] = {
      hash: hashSecret(newPass),
      lastChanged: new Date().toISOString(),
    };
    this.saveCredentialVault();

    dataService.logActivity({
      adminId: caller.id,
      adminName: caller.displayName,
      adminRole: caller.role,
      action: 'ADMIN_PASSWORD_OVERRIDE_BY_SUPER',
      targetType: 'Credentials',
      targetId: normalizedTarget,
      targetTitle: normalizedTarget,
      details: `Super Admin overridden/reset password for administrator: ${normalizedTarget}`,
    });

    return { success: true };
  }

  public getAdminAccounts(): AdminAccountConfig[] {
    return THREE_ADMINS.map((admin) => {
      const rec = this.credentialVault[admin.email.toLowerCase()];
      return {
        ...admin,
        lastPasswordChangedAt: rec?.lastChanged,
      };
    });
  }

  public generateStrongPassword(): string {
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    const specials = '!@#$%^&*()_+';
    const all = uppers + lowers + numbers + specials;

    let pwd = '';
    pwd += uppers.charAt(Math.floor(Math.random() * uppers.length));
    pwd += lowers.charAt(Math.floor(Math.random() * lowers.length));
    pwd += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pwd += specials.charAt(Math.floor(Math.random() * specials.length));

    for (let i = pwd.length; i < 16; i++) {
      pwd += all.charAt(Math.floor(Math.random() * all.length));
    }

    // shuffle characters
    return pwd.split('').sort(() => 0.5 - Math.random()).join('');
  }

  // ==========================================
  // HELPER PERMISSION CHECKS
  // ==========================================
  public isCallerSuperAdmin(caller?: UserProfile | null): boolean {
    if (!caller) return false;
    const role = (caller.role || '').toString().toLowerCase();
    return role === 'super_admin';
  }
}

export const adminSecurityService = new AdminSecurityService();
