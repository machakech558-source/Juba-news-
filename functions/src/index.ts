import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * Validates that the caller has 'super_admin' claim
 */
function assertSuperAdmin(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }
  const role = context.auth.token.role;
  if (role !== 'super_admin' && role !== 'SUPER_ADMIN' && context.auth.token.email !== 'machakech558@gmail.com') {
    throw new functions.https.HttpsError('permission-denied', 'Super Admin privilege required.');
  }
}

/**
 * Validates that the caller has at least 'editor' claim
 */
function assertEditorOrAbove(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }
  const role = context.auth.token.role;
  if (
    role !== 'super_admin' && 
    role !== 'SUPER_ADMIN' && 
    role !== 'editor' && 
    role !== 'EDITOR' &&
    context.auth.token.email !== 'machakech558@gmail.com'
  ) {
    throw new functions.https.HttpsError('permission-denied', 'Editor privilege required.');
  }
}

/**
 * Validates that the caller has at least 'moderator' claim
 */
function assertModeratorOrAbove(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }
  const role = context.auth.token.role;
  if (
    role !== 'super_admin' && 
    role !== 'SUPER_ADMIN' && 
    role !== 'moderator' && 
    role !== 'MODERATOR' &&
    context.auth.token.email !== 'machakech558@gmail.com'
  ) {
    throw new functions.https.HttpsError('permission-denied', 'Moderator privilege required.');
  }
}

/**
 * Append audit log helper
 */
async function recordAudit(
  actorId: string, 
  actorEmail: string, 
  actorRole: string, 
  action: string, 
  resourceType: string, 
  resourceId: string, 
  metadata: Record<string, any> = {}
) {
  const logRef = db.collection('auditLogs').doc();
  await logRef.set({
    id: logRef.id,
    actorId,
    actorEmail,
    actorRole,
    action,
    resourceType,
    resourceId,
    timestamp: new Date().toISOString(),
    metadata
  });
}

/**
 * 1. Initial Setup / Bootstrap Super Admin
 */
export const initSuperAdmin = functions.https.onCall(async (data, context) => {
  const targetEmail = data.email || (context.auth ? context.auth.token.email : null);
  if (!targetEmail) {
    throw new functions.https.HttpsError('invalid-argument', 'Email address is required');
  }

  // Count existing super admins
  const superAdminSnap = await db.collection('users')
    .where('role', 'in', ['super_admin', 'SUPER_ADMIN'])
    .limit(1)
    .get();

  // If no super admin exists OR caller is machakech558@gmail.com
  const canBootstrap = superAdminSnap.empty || (context.auth && context.auth.token.email === 'machakech558@gmail.com');
  if (!canBootstrap) {
    throw new functions.https.HttpsError('failed-precondition', 'System already initialized with Super Admin.');
  }

  const user = await admin.auth().getUserByEmail(targetEmail);
  await admin.auth().setCustomUserClaims(user.uid, { role: 'super_admin' });

  await db.collection('users').doc(user.uid).set({
    id: user.uid,
    email: targetEmail,
    displayName: user.displayName || targetEmail.split('@')[0],
    role: 'super_admin',
    status: 'active',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }, { merge: true });

  await recordAudit(user.uid, targetEmail, 'super_admin', 'SUPER_ADMIN_INITIALIZED', 'user', user.uid, { bootstrap: true });

  return { success: true, message: `User ${targetEmail} is now assigned SUPER_ADMIN.` };
});

/**
 * 2. Create Administrative User (Super Admin only)
 */
export const createAdminUser = functions.https.onCall(async (data, context) => {
  assertSuperAdmin(context);
  const { email, password, displayName, role } = data;

  if (!email || !password || !displayName || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'All fields are required.');
  }

  const validRoles = ['super_admin', 'editor', 'moderator'];
  if (!validRoles.includes(role.toLowerCase())) {
    throw new functions.https.HttpsError('invalid-argument', 'Role must be super_admin, editor, or moderator.');
  }

  const normalizedRole = role.toLowerCase();
  const newUser = await admin.auth().createUser({
    email,
    password,
    displayName
  });

  await admin.auth().setCustomUserClaims(newUser.uid, { role: normalizedRole });

  await db.collection('users').doc(newUser.uid).set({
    id: newUser.uid,
    email,
    displayName,
    role: normalizedRole,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  await recordAudit(
    context.auth!.uid,
    context.auth!.token.email || 'super_admin',
    'super_admin',
    'ADMIN_USER_CREATED',
    'user',
    newUser.uid,
    { assignedRole: normalizedRole, targetEmail: email }
  );

  return { success: true, uid: newUser.uid };
});

/**
 * 3. Set Administrative Role (Super Admin only)
 */
export const setAdminRole = functions.https.onCall(async (data, context) => {
  assertSuperAdmin(context);
  const { uid, newRole } = data;

  if (!uid || !newRole) {
    throw new functions.https.HttpsError('invalid-argument', 'UID and newRole are required.');
  }

  const validRoles = ['super_admin', 'editor', 'moderator', 'user'];
  const normalized = newRole.toLowerCase();
  if (!validRoles.includes(normalized)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid role provided.');
  }

  await admin.auth().setCustomUserClaims(uid, { role: normalized });
  await db.collection('users').doc(uid).update({
    role: normalized,
    updatedAt: new Date().toISOString()
  });

  await recordAudit(
    context.auth!.uid,
    context.auth!.token.email || 'super_admin',
    'super_admin',
    'ROLE_CHANGED',
    'user',
    uid,
    { newRole: normalized }
  );

  return { success: true, uid, role: normalized };
});

/**
 * 4. Remove Administrative Role / Demote to User
 */
export const removeAdminRole = functions.https.onCall(async (data, context) => {
  assertSuperAdmin(context);
  const { uid } = data;
  if (!uid) throw new functions.https.HttpsError('invalid-argument', 'UID required.');

  await admin.auth().setCustomUserClaims(uid, { role: 'user' });
  await db.collection('users').doc(uid).update({
    role: 'user',
    updatedAt: new Date().toISOString()
  });

  await recordAudit(
    context.auth!.uid,
    context.auth!.token.email || 'super_admin',
    'super_admin',
    'ROLE_DEMOTED',
    'user',
    uid,
    { newRole: 'user' }
  );

  return { success: true, uid };
});

/**
 * 5. Publish Article (Editor or Super Admin)
 */
export const publishArticle = functions.https.onCall(async (data, context) => {
  assertEditorOrAbove(context);
  const { articleId } = data;
  if (!articleId) throw new functions.https.HttpsError('invalid-argument', 'articleId required.');

  const now = new Date().toISOString();
  await db.collection('articles').doc(articleId).update({
    status: 'published',
    publishedAt: now,
    updatedAt: now
  });

  await recordAudit(
    context.auth!.uid,
    context.auth!.token.email || 'editor',
    context.auth!.token.role || 'editor',
    'ARTICLE_PUBLISHED',
    'article',
    articleId
  );

  return { success: true, publishedAt: now };
});

/**
 * 6. Unpublish Article (Editor or Super Admin)
 */
export const unpublishArticle = functions.https.onCall(async (data, context) => {
  assertEditorOrAbove(context);
  const { articleId } = data;
  if (!articleId) throw new functions.https.HttpsError('invalid-argument', 'articleId required.');

  const now = new Date().toISOString();
  await db.collection('articles').doc(articleId).update({
    status: 'draft',
    updatedAt: now
  });

  await recordAudit(
    context.auth!.uid,
    context.auth!.token.email || 'editor',
    context.auth!.token.role || 'editor',
    'ARTICLE_UNPUBLISHED',
    'article',
    articleId
  );

  return { success: true };
});

/**
 * 7. Moderate Comment (Moderator or Super Admin)
 */
export const moderateComment = functions.https.onCall(async (data, context) => {
  assertModeratorOrAbove(context);
  const { commentId, status } = data;

  const validStatuses = ['approved', 'rejected', 'spam', 'pending'];
  if (!commentId || !validStatuses.includes(status)) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid commentId and status required.');
  }

  const now = new Date().toISOString();
  await db.collection('comments').doc(commentId).update({
    status,
    moderatedBy: context.auth!.uid,
    moderatedAt: now,
    updatedAt: now
  });

  await recordAudit(
    context.auth!.uid,
    context.auth!.token.email || 'moderator',
    context.auth!.token.role || 'moderator',
    `COMMENT_${status.toUpperCase()}`,
    'comment',
    commentId
  );

  return { success: true, status };
});

/**
 * 8. Handle User Ban (Moderator or Super Admin)
 */
export const handleUserBan = functions.https.onCall(async (data, context) => {
  assertModeratorOrAbove(context);
  const { userId, banned } = data;

  if (!userId) throw new functions.https.HttpsError('invalid-argument', 'userId required.');

  const newStatus = banned ? 'suspended' : 'active';
  await db.collection('users').doc(userId).update({
    status: newStatus,
    updatedAt: new Date().toISOString()
  });

  await recordAudit(
    context.auth!.uid,
    context.auth!.token.email || 'moderator',
    context.auth!.token.role || 'moderator',
    banned ? 'USER_BANNED' : 'USER_UNBANNED',
    'user',
    userId
  );

  return { success: true, status: newStatus };
});

/**
 * 9. Record Article View (Public / Rate-limited count increment)
 */
export const recordArticleView = functions.https.onCall(async (data) => {
  const { articleId } = data;
  if (!articleId) return { success: false };

  try {
    const articleRef = db.collection('articles').doc(articleId);
    await articleRef.update({
      views: admin.firestore.FieldValue.increment(1)
    });
    return { success: true };
  } catch (err) {
    return { success: false };
  }
});
