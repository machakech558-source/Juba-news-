import React, { useEffect } from 'react';
import type { Article } from '../../types';

interface SEOHeadProps {
  title: string;
  description?: string;
  article?: Article;
  canonicalUrl?: string;
  ogImage?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  article,
  canonicalUrl,
  ogImage,
}) => {
  useEffect(() => {
    // Update Title
    const fullTitle = `${title} | Juba News - جوبا نيوز`;
    document.title = fullTitle;

    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    const finalDesc = description || (article ? (article.excerptEn || article.excerptAr) : 'Professional South Sudan, Africa & World News');
    metaDesc.setAttribute('content', finalDesc);

    // Update Open Graph
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', fullTitle);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', finalDesc);

    if (ogImage || article?.featuredImage) {
      let ogImg = document.querySelector('meta[property="og:image"]');
      if (!ogImg) {
        ogImg = document.createElement('meta');
        ogImg.setAttribute('property', 'og:image');
        document.head.appendChild(ogImg);
      }
      ogImg.setAttribute('content', ogImage || article!.featuredImage);
    }

    // Structured Data JSON-LD
    let scriptTag = document.getElementById('jsonld-schema') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'jsonld-schema';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    if (article) {
      const newsArticleSchema = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.titleEn || article.titleAr,
        image: [article.featuredImage],
        datePublished: article.publishedAt || article.createdAt,
        dateModified: article.updatedAt || article.publishedAt || article.createdAt,
        author: [{
          '@type': 'Person',
          name: article.authorName,
          jobTitle: article.authorRole,
        }],
        publisher: {
          '@type': 'Organization',
          name: 'Juba News',
          logo: {
            '@type': 'ImageObject',
            url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=300&auto=format&fit=crop&q=80',
          },
        },
        description: article.excerptEn || article.excerptAr,
        articleSection: article.categoryNameEn,
      };
      scriptTag.textContent = JSON.stringify(newsArticleSchema);
    } else {
      const orgSchema = {
        '@context': 'https://schema.org',
        '@type': 'NewsMediaOrganization',
        name: 'Juba News | جوبا نيوز',
        url: window.location.origin,
        foundingLocation: {
          '@type': 'Place',
          name: 'Juba, South Sudan',
        },
        description: 'Independent digital news platform covering South Sudan, Africa and the World.',
      };
      scriptTag.textContent = JSON.stringify(orgSchema);
    }
  }, [title, description, article, canonicalUrl, ogImage]);

  return null;
};
