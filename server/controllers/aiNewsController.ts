import { Request, Response } from 'express';
import { AiNewsGeneratorService } from '../services/aiNewsService';

export class AiNewsController {
  /**
   * Generates a new article via Gemini AI and returns the structured payload.
   * Can be called directly by the editorial client to auto-publish or prefill.
   */
  static async generate(req: Request, res: Response): Promise<void> {
    try {
      const { topic, information, contentType, language, style, categorySlug, focus } = req.body || {};

      const article = await AiNewsGeneratorService.generateArticle({
        topic: typeof topic === 'string' ? topic : undefined,
        information: typeof information === 'string' ? information : undefined,
        contentType: typeof contentType === 'string' ? (contentType as any) : undefined,
        language: typeof language === 'string' ? (language as any) : undefined,
        style: typeof style === 'string' ? (style as any) : undefined,
        categorySlug: typeof categorySlug === 'string' ? categorySlug : undefined,
        focus: typeof focus === 'string' ? focus : undefined
      });

      res.status(200).json({
        success: true,
        data: article,
        generatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('AI News Generation Error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate news with AI'
      });
    }
  }
}
