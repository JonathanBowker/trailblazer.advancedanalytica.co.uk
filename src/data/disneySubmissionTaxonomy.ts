export const disneyDestinationOptions = [
  {
    value: 'disneyland_paris',
    label: 'Disneyland Paris',
    manifestDestination: 'disneyland_paris',
    disabled: false,
  },
  {
    value: 'walt_disney_world_resort',
    label: 'Walt Disney World Resort',
    manifestDestination: 'walt_disney_world_resort',
    disabled: true,
  },
  {
    value: 'disney_cruise_line',
    label: 'Disney Cruise Line',
    manifestDestination: 'disney_cruise_line',
    disabled: true,
  },
  {
    value: 'multi_brand',
    label: 'Multi-brand',
    manifestDestination: 'multi_brand',
    disabled: true,
  },
] as const;

export const disneyChannelOptions = [
  { value: 'social', label: 'Organic social' },
  { value: 'paid_social', label: 'Paid social' },
  { value: 'email', label: 'Email' },
  { value: 'web', label: 'Web / landing page' },
  { value: 'display', label: 'Display media' },
  { value: 'print', label: 'Print' },
  { value: 'brochure', label: 'Brochure' },
  { value: 'editorial', label: 'Editorial / informational' },
  { value: 'partner', label: 'Partner / co-branded' },
  { value: 'other', label: 'Other' },
] as const;

export const disneyCompositionOptions = [
  { value: 'unknown', label: 'Not sure' },
  { value: 'image_only', label: 'Image only' },
  { value: 'copy_only', label: 'Copy only' },
  { value: 'image_and_copy', label: 'Image & copy' },
  { value: 'photo_montage', label: 'Photo montage / multi-photo' },
  { value: 'multi_page', label: 'Multi-page document' },
] as const;

export const disneyDeclarationOptions = [
  { value: 'unknown', label: 'Not sure' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
] as const;

export const disneyAssetTypes = [
  {
    value: 'paid_social_ad',
    label: 'Paid social ad',
    declaredContentType: 'paid_social_ad',
    reviewProfile: 'paid_social',
    defaultChannel: 'paid_social',
    channels: ['paid_social', 'social'],
    defaultComposition: 'image_and_copy',
    defaultContainsOfferPricing: 'yes',
    defaultContainsDisneyCharacters: 'unknown',
    defaultContainsPartnerBranding: 'unknown',
    ruleProfile: 'offer_paid_social',
  },
  {
    value: 'social_media_post',
    label: 'Social media post',
    declaredContentType: 'social_media_post',
    reviewProfile: 'social_post',
    defaultChannel: 'social',
    channels: ['social'],
    defaultComposition: 'image_and_copy',
    defaultContainsOfferPricing: 'unknown',
    defaultContainsDisneyCharacters: 'unknown',
    defaultContainsPartnerBranding: 'unknown',
    ruleProfile: 'organic_social',
  },
  {
    value: 'display_banner_ad',
    label: 'Display / banner ad',
    declaredContentType: 'display_banner_ad',
    reviewProfile: 'display_banner',
    defaultChannel: 'display',
    channels: ['display', 'web', 'paid_social'],
    defaultComposition: 'image_and_copy',
    defaultContainsOfferPricing: 'unknown',
    defaultContainsDisneyCharacters: 'unknown',
    defaultContainsPartnerBranding: 'unknown',
    ruleProfile: 'short_form_display',
  },
  {
    value: 'email_creative',
    label: 'Email creative',
    declaredContentType: 'email_creative',
    reviewProfile: 'email',
    defaultChannel: 'email',
    channels: ['email'],
    defaultComposition: 'multi_page',
    defaultContainsOfferPricing: 'unknown',
    defaultContainsDisneyCharacters: 'unknown',
    defaultContainsPartnerBranding: 'unknown',
    ruleProfile: 'email_creative',
  },
  {
    value: 'landing_page_web_page',
    label: 'Landing page / web page',
    declaredContentType: 'landing_page_web_page',
    reviewProfile: 'landing_page',
    defaultChannel: 'web',
    channels: ['web'],
    defaultComposition: 'multi_page',
    defaultContainsOfferPricing: 'unknown',
    defaultContainsDisneyCharacters: 'unknown',
    defaultContainsPartnerBranding: 'unknown',
    ruleProfile: 'web_page',
  },
  {
    value: 'print_ad_flyer',
    label: 'Print ad / flyer',
    declaredContentType: 'print_ad_flyer',
    reviewProfile: 'print',
    defaultChannel: 'print',
    channels: ['print'],
    defaultComposition: 'image_and_copy',
    defaultContainsOfferPricing: 'unknown',
    defaultContainsDisneyCharacters: 'unknown',
    defaultContainsPartnerBranding: 'unknown',
    ruleProfile: 'print_ad',
  },
  {
    value: 'brochure_multi_page_pdf',
    label: 'Brochure / multi-page PDF',
    declaredContentType: 'brochure_multi_page_pdf',
    reviewProfile: 'brochure',
    defaultChannel: 'brochure',
    channels: ['brochure', 'print'],
    defaultComposition: 'multi_page',
    defaultContainsOfferPricing: 'unknown',
    defaultContainsDisneyCharacters: 'unknown',
    defaultContainsPartnerBranding: 'unknown',
    ruleProfile: 'brochure_pdf',
  },
  {
    value: 'offer_price_promotion',
    label: 'Offer / price promotion',
    declaredContentType: 'offer_price_promotion',
    reviewProfile: 'offer',
    defaultChannel: 'paid_social',
    channels: ['paid_social', 'email', 'web', 'display', 'print', 'brochure'],
    defaultComposition: 'image_and_copy',
    defaultContainsOfferPricing: 'yes',
    defaultContainsDisneyCharacters: 'unknown',
    defaultContainsPartnerBranding: 'unknown',
    ruleProfile: 'offer_price_promotion',
  },
  {
    value: 'image_only_creative',
    label: 'Image-only creative',
    declaredContentType: 'image_only_creative',
    reviewProfile: 'image_only',
    defaultChannel: 'display',
    channels: ['display', 'web', 'social', 'paid_social', 'print'],
    defaultComposition: 'image_only',
    defaultContainsOfferPricing: 'no',
    defaultContainsDisneyCharacters: 'unknown',
    defaultContainsPartnerBranding: 'unknown',
    ruleProfile: 'image_only',
  },
  {
    value: 'image_and_copy_creative',
    label: 'Image & copy creative',
    declaredContentType: 'image_and_copy_creative',
    reviewProfile: 'image_and_copy',
    defaultChannel: 'display',
    channels: ['display', 'web', 'paid_social', 'social', 'email', 'print'],
    defaultComposition: 'image_and_copy',
    defaultContainsOfferPricing: 'unknown',
    defaultContainsDisneyCharacters: 'unknown',
    defaultContainsPartnerBranding: 'unknown',
    ruleProfile: 'image_copy_region_review',
  },
  {
    value: 'photo_montage',
    label: 'Photo montage / multi-photo',
    declaredContentType: 'photo_montage',
    reviewProfile: 'photo_montage',
    defaultChannel: 'display',
    channels: ['display', 'web', 'paid_social', 'social', 'print'],
    defaultComposition: 'photo_montage',
    defaultContainsOfferPricing: 'no',
    defaultContainsDisneyCharacters: 'unknown',
    defaultContainsPartnerBranding: 'unknown',
    ruleProfile: 'photography_montage_forensic_review',
  },
  {
    value: 'partner_cobranded_creative',
    label: 'Partner / co-branded creative',
    declaredContentType: 'partner_cobranded_creative',
    reviewProfile: 'partner_cobranded',
    defaultChannel: 'partner',
    channels: ['partner', 'paid_social', 'email', 'web', 'display', 'print'],
    defaultComposition: 'image_and_copy',
    defaultContainsOfferPricing: 'unknown',
    defaultContainsDisneyCharacters: 'unknown',
    defaultContainsPartnerBranding: 'yes',
    ruleProfile: 'partner_cobranded',
  },
  {
    value: 'organic_editorial_informational',
    label: 'Organic editorial / informational',
    declaredContentType: 'organic_editorial_informational',
    reviewProfile: 'editorial',
    defaultChannel: 'editorial',
    channels: ['editorial', 'web', 'social'],
    defaultComposition: 'copy_only',
    defaultContainsOfferPricing: 'no',
    defaultContainsDisneyCharacters: 'unknown',
    defaultContainsPartnerBranding: 'unknown',
    ruleProfile: 'editorial_informational',
  },
] as const;

const hiddenDisneyAssetTypeValues = new Set([
  'offer_price_promotion',
  'image_only_creative',
  'image_and_copy_creative',
  'photo_montage',
  'partner_cobranded_creative',
  'organic_editorial_informational',
]);

export const visibleDisneyAssetTypes = disneyAssetTypes.filter(
  (option) => !hiddenDisneyAssetTypeValues.has(option.value)
);

export type DisneyAssetTypeValue = (typeof disneyAssetTypes)[number]['value'];
export type DisneyChannelValue = (typeof disneyChannelOptions)[number]['value'];
export type DisneyCompositionValue = (typeof disneyCompositionOptions)[number]['value'];
export type DisneyDeclarationValue = (typeof disneyDeclarationOptions)[number]['value'];

export function getDisneyDestination(value: string) {
  return disneyDestinationOptions.find((option) => option.value === value);
}

export function getDisneyAssetType(value: string) {
  const normalizedValue =
    value === 'composite_creative'
      ? 'image_and_copy_creative'
      : value === 'montage_composite_image'
        ? 'photo_montage'
        : value;
  return disneyAssetTypes.find((option) => option.value === normalizedValue);
}

export function getDisneyChannel(value: string) {
  return disneyChannelOptions.find((option) => option.value === value);
}

export function getDisneyComposition(value: string) {
  const normalizedValue =
    value === 'composite'
      ? 'image_and_copy'
      : value === 'montage_composite_image'
        ? 'photo_montage'
        : value;
  return disneyCompositionOptions.find((option) => option.value === normalizedValue);
}

export function getDisneyDeclaration(value: string) {
  return disneyDeclarationOptions.find((option) => option.value === value);
}
