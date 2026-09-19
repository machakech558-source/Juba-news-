import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Trash2, 
  Filter, 
  Search, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { useRouter } from '../../contexts/RouterContext';
import { dataService } from '../../services/dataService';
import type { Comment, CommentStatus } from '../../types';

export const CommentModerationPage: React.FC = () => {
  const { currentUser, isSuperAdmin } = useAuth();
  const { language, t } = useThemeLanguage();
  const { navigate } = useRouter();

  const [comments, setComments] = useState<Comment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [onlyReported, setOnlyReported] = useState(false);

  useEffect(() => {
    const unsub = dataService.subscribeComments((data) => {
      setComments(data);
    });
    return () => unsub();
  }, []);

  const handleStatusChange = (commentId: string, newStatus: CommentStatus) => {
    if (!currentUser) return;
    dataService.moderateComment(commentId, newStatus, currentUser);
  };

  const handleDelete = (commentId: string) => {
    if (!currentUser) return;
    dataService.deleteComment(commentId, currentUser);
  };

  const filteredComments = comments.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (onlyReported && (!c.reports || c.reports.length === 0)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black font-editorial text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-red-600" />
          <span>{language === 'ar' ? 'الرقابة التحريرية على التعليقات' : 'Comment Moderation Desk'}</span>
        </h1>
        <p className="text-xs text-stone-500">
          {language === 'ar'
            ? 'مراجعة واعتماد أو رفض تعليقات القراء، والتعامل مع البلاغات عن المحتوى المخالف.'
            : 'Enforce editorial guidelines, clear pending submissions, and investigate flagged reader reports.'}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-semibold focus:outline-none"
          >
            <option value="ALL">All Comments ({comments.length})</option>
            <option value="PENDING">Pending Moderation</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SPAM">Marked as Spam</option>
          </select>

          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={onlyReported}
              onChange={(e) => setOnlyReported(e.target.checked)}
              className="rounded text-red-600 focus:ring-red-500"
            />
            <span className="text-red-700 dark:text-red-400 font-bold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              Only Flagged Reports
            </span>
          </label>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {filteredComments.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
            No comments found matching current filter criteria.
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className="p-5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={comment.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <span className="font-bold text-xs text-stone-900 dark:text-stone-100 block">
                      {comment.userName}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      Filed on {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      comment.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : comment.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {comment.status}
                  </span>

                  <button
                    onClick={() => navigate(`/article/${comment.articleSlug}`)}
                    className="flex items-center gap-1 text-[11px] text-red-600 hover:underline"
                  >
                    <span>View Story</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Comment Text */}
              <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
                "{comment.content}"
              </p>

              {/* If reported, show alert box */}
              {comment.reports && comment.reports.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900 text-xs">
                  <p className="font-bold text-red-800 dark:text-red-300 flex items-center gap-1.5 mb-1">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    Flagged by readers ({comment.reports.length} reports):
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-stone-700 dark:text-stone-300 text-[11px]">
                    {comment.reports.map((r, i) => (
                      <li key={i}>{r.reason} ({new Date(r.reportedAt).toLocaleDateString()})</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                {comment.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleStatusChange(comment.id, 'APPROVED')}
                    className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                )}

                {comment.status !== 'REJECTED' && (
                  <button
                    onClick={() => handleStatusChange(comment.id, 'REJECTED')}
                    className="flex items-center gap-1 px-3 py-1 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-lg text-xs font-bold transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}

                {comment.status !== 'SPAM' && (
                  <button
                    onClick={() => handleStatusChange(comment.id, 'SPAM')}
                    className="flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Spam</span>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(comment.id)}
                  className="p-1.5 text-stone-400 hover:text-red-600 rounded transition"
                  title="Delete comment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
