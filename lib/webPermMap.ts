/**
 * Maps a Web Tools content slug (used by /web/[[...slug]] and WebPageEditor)
 * to its permission module key in rolesData.
 */
const MAP: Record<string, string> = {
  'home': 'web.home',
  'about/about-us': 'web.about.about_us',
  'about/vision-mission': 'web.about.vision_mission',
  'about/certifications': 'web.about.certifications',
  'solutions/structured-cabling': 'web.solutions.structured_cabling',
  'solutions/active-network': 'web.solutions.active_network',
  'solutions/network-peripherals': 'web.solutions.network_peripherals',
  'solutions/ict-products': 'web.solutions.ict_products',
  'services/consulting': 'web.services.consulting',
  'services/network-engineering': 'web.services.network_engineering',
  'services/project-management': 'web.services.project_management',
  'services/training': 'web.services.training',
  'business/procurement': 'web.business.procurement',
  'business/strategic-partners': 'web.business.strategic_partners',
  'projects': 'web.resources.projects',
  'resources/products': 'web.resources.products.content',
  'resources/achievement': 'web.resources.achievement',
  'resources/gallery': 'web.resources.gallery.content',
  'resources/faq': 'web.resources.faq',
};

export function webModuleKey(slug: string): string | undefined {
  return MAP[slug];
}
