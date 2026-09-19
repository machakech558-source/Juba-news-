import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole } from '../types';
import { INITIAL_ADMINS } from '../data/sampleData';
import { dataService } from '../services/dataService';
import { adminSecurityService } from '../services/adminSecurityService';

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAiAdmin: boolean;
  isAdminOne: boolean;
  isEditor: boolean;
  isModerator: boolean;
  isAdminTwo: boolean;
  canManageGateCode: boolean;
  canChangeAnyPassword: boolean;
  canManageAdmins: boolean;
  canManageUsers: boolean;
  canModifySettings: boolean;
  canViewLogs: boolean;
  canPublish: boolean;
  canCreateArticle: boolean;
  canEditArticle: boolean;
  canDeleteArticle: boolean;
  canModerateComments: boolean;
  canManageBreakingNews: boolean;
  canManageCategories: boolean;
  canManageMedia: boolean;
  canManageAds: boolean;
  canUseAiNewsroom: boolean;
  loginAsDemo: (role: UserRole) => void;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to regular citizen reader on the public news portal
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const reader = INITIAL_ADMINS.find((u) => u.role === 'USER') || {
      id: 'user-reader',
      email: 'reader@jubanews.org',
      displayName: 'Achol Maker',
      role: 'USER' as UserRole,
      avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
      bio: 'Economics researcher & avid reader based in Juba, South Sudan.',
      createdAt: '2025-03-01T12:00:00Z',
      status: 'active',
    };

    const saved = localStorage.getItem('juba_active_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) return parsed;
      } catch {
        return reader;
      }
    }
    return reader;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('juba_active_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('juba_active_user');
    }
  }, [currentUser]);

  const rawRole = (currentUser?.role || 'USER').toString();
  const lowerRole = rawRole.toLowerCase();

  // The 3 official roles
  const isSuperAdmin = lowerRole === 'super_admin';
  const isAiAdmin = isSuperAdmin || lowerRole === 'ai_admin';
  const isAdminOne = isSuperAdmin || lowerRole === 'admin_one' || lowerRole === 'editor';
  const isAdmin = isSuperAdmin || isAiAdmin || isAdminOne;

  // Backwards compatibility flags
  const isEditor = isSuperAdmin || lowerRole === 'editor' || lowerRole === 'admin_one' || lowerRole === 'ai_admin';
  const isModerator = isSuperAdmin || lowerRole === 'moderator' || lowerRole === 'admin_two' || lowerRole === 'admin_one';
  const isAdminTwo = lowerRole === 'admin_two' || lowerRole === 'moderator';

  // Strict RBAC permission matrix
  // 1. Super Admin ALONE controls Master Gate Code, Password Overrides, System Settings, Audit Logs, and User Deletions
  const canManageGateCode = isSuperAdmin;
  const canChangeAnyPassword = isSuperAdmin;
  const canManageAdmins = isSuperAdmin;
  const canManageUsers = isSuperAdmin;
  const canModifySettings = isSuperAdmin;
  const canViewLogs = isSuperAdmin;
  const canManageAds = isSuperAdmin;
  const canDeleteArticle = isSuperAdmin;

  // 2. AI Admin & Super Admin control AI Newsroom and automated drafts
  const canUseAiNewsroom = isSuperAdmin || lowerRole === 'ai_admin';

  // 3. Admin One & Super Admin control editorial publishing & desks
  const canCreateArticle = isSuperAdmin || isAdminOne || isAiAdmin;
  const canEditArticle = isSuperAdmin || isAdminOne || isAiAdmin;
  const canPublish = isSuperAdmin || isAdminOne;
  const canManageBreakingNews = isSuperAdmin || isAdminOne;
  const canManageCategories = isSuperAdmin || isAdminOne;
  const canManageMedia = isSuperAdmin || isAdminOne;
  const canModerateComments = isSuperAdmin || isAdminOne;

  const role: UserRole = currentUser?.role || 'USER';
  const isAuthenticated = Boolean(currentUser);

  const loginAsDemo = (_demoRole: UserRole) => {
    console.info('Role switching disabled for security.');
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    if (!pass || pass.trim().length === 0) {
      return { success: false, error: 'يرجى إدخال كلمة المرور.' };
    }

    // Verify against secure client-side encrypted credentials vault
    const isPasswordValid = adminSecurityService.verifyPassword(normalizedEmail, pass);
    if (!isPasswordValid) {
      return { 
        success: false, 
        error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' 
      };
    }

    const users = dataService.getUsers();
    let match = users.find((u) => {
      const uEmail = u.email.toLowerCase();
      if (uEmail === normalizedEmail) return true;
      if ((normalizedEmail === 'anwar.youal@jubanews.org' || normalizedEmail === 'superadmin@jubanews.org') && u.role === 'SUPER_ADMIN') {
        return true;
      }
      return false;
    });

    // If matching admin profile from INITIAL_ADMINS is not yet persisted in dataService users, load it
    if (!match) {
      const adminBootstrap = INITIAL_ADMINS.find(u => {
        const uEmail = u.email.toLowerCase();
        if (uEmail === normalizedEmail) return true;
        if ((normalizedEmail === 'anwar.youal@jubanews.org' || normalizedEmail === 'superadmin@jubanews.org') && u.role === 'SUPER_ADMIN') {
          return true;
        }
        return false;
      });
      if (adminBootstrap) {
        dataService.createUser(adminBootstrap);
        match = adminBootstrap;
      }
    }

    if (match) {
      setCurrentUser(match);
      localStorage.setItem('juba_active_user', JSON.stringify(match));

      dataService.logActivity({
        adminId: match.id,
        adminName: match.displayName,
        adminRole: match.role,
        action: 'ADMIN_LOGIN_SUCCESS',
        targetType: 'Auth',
        targetId: match.id,
        targetTitle: match.displayName,
        details: `Administrator (${match.role}) logged in successfully.`,
      });

      return { success: true };
    }

    return { 
      success: false, 
      error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' 
    };
  };

  const registerUser = async (email: string, pass: string, displayName: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail || !pass || pass.length < 6) {
      return { success: false, error: 'يرجى إدخال بريد إلكتروني صحيح وكلمة مرور من 6 أحرف على الأقل.' };
    }

    const users = dataService.getUsers();
    const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return { success: false, error: 'يوجد حساب مسجل بهذا البريد الإلكتروني مسبقاً.' };
    }

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      email: normalizedEmail,
      displayName: displayName.trim() || normalizedEmail.split('@')[0],
      role: 'USER',
      createdAt: new Date().toISOString(),
      status: 'active',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName || normalizedEmail)}`,
      lastLoginAt: new Date().toISOString()
    };

    dataService.createUser(newUser);
    setCurrentUser(newUser);
    localStorage.setItem('juba_active_user', JSON.stringify(newUser));
    return { success: true };
  };

  const resetPassword = async (email: string) => {
    if (!email) return { success: false, error: 'البريد الإلكتروني مطلوب.' };
    const normalizedEmail = email.toLowerCase().trim();
    const users = dataService.getUsers();
    const match = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!match) {
      return { success: false, error: 'لم يتم العثور على حساب مرتبط بهذا البريد الإلكتروني.' };
    }
    return { success: true };
  };

  const logout = () => {
    const guestReader = INITIAL_ADMINS.find((u) => u.role === 'USER') || {
      id: 'user-guest',
      email: 'reader@jubanews.org',
      displayName: 'القارئ',
      role: 'USER' as UserRole,
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    setCurrentUser(guestReader);
    localStorage.removeItem('juba_active_user');
    adminSecurityService.setGateSessionUnlocked(false);
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates, updatedAt: new Date().toISOString() };
    setCurrentUser(updated);
    localStorage.setItem('juba_active_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        isAdmin,
        isSuperAdmin,
        isAiAdmin,
        isAdminOne,
        isEditor,
        isModerator,
        isAdminTwo,
        canManageGateCode,
        canChangeAnyPassword,
        canManageAdmins,
        canManageUsers,
        canModifySettings,
        canViewLogs,
        canPublish,
        canCreateArticle,
        canEditArticle,
        canDeleteArticle,
        canModerateComments,
        canManageBreakingNews,
        canManageCategories,
        canManageMedia,
        canManageAds,
        canUseAiNewsroom,
        loginAsDemo,
        loginWithEmail,
        registerUser,
        resetPassword,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

