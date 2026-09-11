'use client';

import React from 'react';
import { HomepageSectionType, StoreHomepageSection } from '@commerce/types';
import HeroSection from './HeroSection';
import FeaturedProductsSection from './FeaturedProductsSection';
import FeaturedCategoriesSection from './FeaturedCategoriesSection';
import PromoBannerSection from './PromoBannerSection';
import TextSection from './TextSection';
import ImageSection from './ImageSection';
import CtaSection from './CtaSection';

export default function HomepageSectionRenderer({ section }: { section: StoreHomepageSection }) {
  if (!section || !section.isActive) return null;

  switch (section.type) {
    case HomepageSectionType.HERO:
      return <HeroSection section={section} />;
    case HomepageSectionType.FEATURED_PRODUCTS:
      return <FeaturedProductsSection section={section} />;
    case HomepageSectionType.FEATURED_CATEGORIES:
      return <FeaturedCategoriesSection section={section} />;
    case HomepageSectionType.PROMO_BANNER:
      return <PromoBannerSection section={section} />;
    case HomepageSectionType.TEXT:
      return <TextSection section={section} />;
    case HomepageSectionType.IMAGE:
      return <ImageSection section={section} />;
    case HomepageSectionType.CTA:
      return <CtaSection section={section} />;
    default:
      return null;
  }
}
