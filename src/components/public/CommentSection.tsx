import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  ThumbsUp, 
  Flag, 
  Send, 
  CornerDownRight, 
  AlertCircle, 
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import type { Comment, Article } from '../../types';

interface CommentSectionProps {
  article: Article;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ article }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { language, t } = useThemeLanguage();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    const unsubscribe = dataService.subscribeComments((allComments) => {
      // Show approved comments for this article
      const filtered = allComments.filter(
        (c) => c.articleId === article.id && c.status === 'APPROVED'
      );
      setComments(filtered);
    });
    return () => unsubscribe();
  }, [article.id]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUser) return;

    setIsSubmitting(true);
    const added = dataService.addComment({
      articleId: article.id,
      articleSlug: article.slug,
      articleTitle: article.titleEn,
      content: newCommentText.trim(),
      user: currentUser,
    });

    setNewCommentText('');
    setIsSubmitting(false);

    if (added.status === 'APPROVED') {
      setSubmitFeedback(language === 'ar' ? 'تم نشر تعليقك بنجاح!' : 'Your comment has been published!');
    } else {
      setSubmitFeedback(language === 'ar' ? 'شكراً لك. تعليقك قيد المراجعة التحريرية وسينشر قريباً.' : 'Thank you. Your comment has been submitted for editorial moderation.');
    }

    setTimeout(() => setSubmitFeedback(null), 5000);
  };

  const handleLike = (commentId: string) => {
    if (!currentUser) return;
    dataService.likeComment(commentId, currentUser.id);
  };

  const handleReportSubmit = (commentId: string) => {
    if (!reportReason.trim()) return;
    dataService.reportComment(commentId, reportReason.trim());
    setReportingCommentId(null);
    setReportReason('');
  };

  return (
    <section className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl sm:text-2xl font-bold font-editorial text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-red-600" />
          <span>{t('comments')} ({comments.length})</span>
        </h3>
        <span className="text-xs text-stone-500 dark:text-stone-400">
          {language === 'ar' ? 'مجتمع جوبا نيوز التفاعلي' : 'Juba News Community Forum'}
        </span>
      </div>

      {/* Submit Comment Form */}
      {currentUser ? (
        <form onSubmit={handlePostComment} className="mb-8 p-4 bg-stone-900 rounded-xl border border-stone-800 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
              alt={currentUser.displayName}
              className="w-8 h-8 rounded-full object-cover border border-stone-700"
            />
            <div>
              <span className="font-bold text-xs text-stone-200 block">
                {currentUser.displayName}
              </span>
              <span className="text-[10px] text-stone-400">
                {currentUser.role !== 'USER' ? `Editorial Desk (${currentUser.role})` : t('citizen')}
              </span>
            </div>
          </div>

          <textarea
            rows={3}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={t('commentPlaceholder')}
            className="w-full p-3 text-sm rounded-lg bg-stone-800/80 border border-stone-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-100 resize-none transition"
            maxLength={1000}
            required
          />

          {submitFeedback && (
            <div className="mt-2 text-xs flex items-center gap-1.5 text-emerald-400 bg-emerald-950/50 p-2 rounded border border-emerald-800/50">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{submitFeedback}</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px] text-stone-400">
              {newCommentText.length}/1000
            </span>
            <button
              type="submit"
              disabled={isSubmitting || !newCommentText.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t('submitComment')}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 mb-8 bg-stone-900 border border-stone-800 rounded-xl text-center text-xs text-stone-400">
          {language === 'ar' ? 'يرجى تسجيل الدخول أو اختيار هوية قارئ للمشاركة في التعليقات.' : 'Please sign in to join the conversation and post a comment.'}
        </div>
      )}

      {/* List of Comments */}
      {comments.length === 0 ? (
        <div className="py-8 text-center text-stone-400 text-xs">
          {language === 'ar' ? 'لا توجد تعليقات بعد. كن أول من يشارك برأيه!' : 'No comments yet. Be the first to share your thoughts on this story!'}
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const hasLiked = currentUser && comment.likedBy.includes(currentUser.id);
            const dateStr = new Intl.DateTimeFormat(language === 'ar' ? 'ar-SS' : 'en-GB', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(comment.createdAt));

            return (
              <div
                key={comment.id}
                className="p-4 rounded-xl bg-stone-900 border border-stone-800 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={comment.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                      alt={comment.userName}
                      className="w-7 h-7 rounded-full object-cover border border-stone-700"
                    />
                    <div>
                      <span className="font-bold text-xs text-stone-200">
                        {comment.userName}
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        {dateStr}
                      </span>
                    </div>
                  </div>

                  {/* Report Button */}
                  <button
                    onClick={() => setReportingCommentId(comment.id)}
                    className="text-stone-400 hover:text-red-500 text-xs transition p-1"
                    title={t('report')}
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-stone-700 dark:text-stone-300 text-xs sm:text-sm leading-relaxed mb-3">
                  {comment.content}
                </p>

                {/* Actions: Like */}
                <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
                  <button
                    onClick={() => handleLike(comment.id)}
                    className={`flex items-center gap-1.5 font-medium transition ${
                      hasLiked ? 'text-red-600 dark:text-red-400' : 'hover:text-stone-700 dark:hover:text-stone-200'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
                    <span>{comment.likes}</span>
                  </button>
                </div>

                {/* Reporting Modal / Box */}
                {reportingCommentId === comment.id && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900 text-xs">
                    <p className="font-semibold text-red-800 dark:text-red-300 mb-1.5">
                      {language === 'ar' ? 'سبب الإبلاغ عن هذا التعليق:' : 'Reason for reporting this comment:'}
                    </p>
                    <input
                      type="text"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder={language === 'ar' ? 'محتوى مسيء، أخبار مضللة، سباب...' : 'Spam, harassment, hate speech...'}
                      className="w-full p-1.5 rounded bg-white dark:bg-stone-800 border border-red-300 dark:border-red-800 text-xs mb-2"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setReportingCommentId(null)}
                        className="px-2.5 py-1 text-stone-600 dark:text-stone-300 hover:underline"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        onClick={() => handleReportSubmit(comment.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-700"
                      >
                        {t('report')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
