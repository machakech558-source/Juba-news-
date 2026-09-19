import React, { useEffect, useState } from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import type { Advertisement, AdPosition } from '../../types';

interface AdBannerProps {
  position: AdPosition;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = () => {
  // Advertisements bar has been removed per editorial policy
  return null;
};
