/**
 * Web CMS — page field schemas.
 * Each page (keyed by route slug) declares groups of fields.
 * The admin editor renders these as proper controls (no raw HTML),
 * and the website reads the saved JSON document.
 *
 * Field types:
 *   text      — single line
 *   textarea  — multi-line plain text
 *   richtext  — formatted text (bold/italic/lists/links) stored as HTML
 *   image     — uploaded image (base64 data URL)
 *   list      — repeater of sub-items (each item has its own fields)
 *   select    — choice from options
 */

export type FieldType = 'text' | 'textarea' | 'richtext' | 'image' | 'list' | 'select';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  hint?: string;
  options?: string[];          // for select
  itemFields?: FieldDef[];      // for list
  itemLabel?: string;           // singular noun for list items
}

export interface GroupDef {
  key: string;
  label: string;
  icon: string;
  fields: FieldDef[];
}

export interface PageSchema {
  slug: string;
  title: string;
  /** website path this maps to, for the "View live" link */
  livePath: string;
  groups: GroupDef[];
}

/* ─────────────────────────────────────────────────────────────
   HOME   (mirrors /)
   ───────────────────────────────────────────────────────────── */
const home: PageSchema = {
  slug: 'home',
  title: 'Home',
  livePath: '/',
  groups: [
    {
      key: 'hero', label: 'Hero Slider', icon: 'bi-images',
      fields: [
        {
          key: 'slides', label: 'Slides', type: 'list', itemLabel: 'Slide',
          itemFields: [
            { key: 'image', label: 'Background Image', type: 'image' },
            { key: 'badge', label: 'Badge Text', type: 'text' },
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
          ],
        },
        { key: 'ctaPrimaryLabel', label: 'Primary Button — Label', type: 'text' },
        { key: 'ctaPrimaryHref', label: 'Primary Button — Link', type: 'text' },
        { key: 'ctaSecondaryLabel', label: 'Secondary Button — Label', type: 'text' },
        { key: 'ctaSecondaryHref', label: 'Secondary Button — Link', type: 'text' },
      ],
    },
    {
      key: 'intro', label: 'Intro / Welcome', icon: 'bi-info-circle-fill',
      fields: [
        { key: 'welcomeLabel', label: 'Welcome Eyebrow', type: 'text', hint: 'Small line above the welcome title' },
        { key: 'welcomeTitle', label: 'Welcome Title', type: 'text' },
        { key: 'welcomeLinkLabel', label: 'Welcome Link — Label', type: 'text' },
        { key: 'welcomeLinkHref', label: 'Welcome Link — URL', type: 'text' },
        {
          key: 'cards', label: 'Info Cards', type: 'list', itemLabel: 'Card',
          itemFields: [
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'text', label: 'Text', type: 'textarea' },
          ],
        },
      ],
    },
    {
      key: 'stats', label: 'Stats', icon: 'bi-bar-chart-fill',
      fields: [
        { key: 'brandImage', label: 'Brand Image (SCM wordmark)', type: 'image' },
        {
          key: 'items', label: 'Stat Items', type: 'list', itemLabel: 'Stat',
          itemFields: [
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
            { key: 'value', label: 'Value (number)', type: 'text', hint: 'Numeric only, e.g. 300' },
            { key: 'suffix', label: 'Suffix', type: 'text', hint: 'e.g. + or %' },
            { key: 'label', label: 'Label', type: 'text' },
          ],
        },
      ],
    },
    {
      key: 'services', label: 'Our Services', icon: 'bi-gear-fill',
      fields: [
        { key: 'tag', label: 'Section Eyebrow', type: 'text' },
        { key: 'title', label: 'Title', type: 'text', hint: 'Wrap highlighted words in **double asterisks**' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
        {
          key: 'items', label: 'Services', type: 'list', itemLabel: 'Service',
          itemFields: [
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'href', label: 'Link', type: 'text' },
          ],
        },
      ],
    },
    {
      key: 'values', label: 'Core Values', icon: 'bi-gem',
      fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'heading', label: 'Heading', type: 'text', hint: 'Wrap highlighted words in **double asterisks**' },
        { key: 'image', label: 'Side Image', type: 'image' },
        {
          key: 'items', label: 'Values', type: 'list', itemLabel: 'Value',
          itemFields: [
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'text', label: 'Text', type: 'textarea' },
          ],
        },
      ],
    },
    {
      key: 'compromise', label: 'Never Compromise On', icon: 'bi-shield-check',
      fields: [
        { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
        { key: 'heading', label: 'Heading', type: 'text', hint: 'Wrap highlighted words in **double asterisks**' },
        { key: 'image', label: 'Side Image', type: 'image' },
        {
          key: 'items', label: 'Items', type: 'list', itemLabel: 'Item',
          itemFields: [
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'text', label: 'Text', type: 'textarea' },
          ],
        },
      ],
    },
  ],
};

/* ─────────────────────────────────────────────────────────────
   ABOUT → ABOUT US   (mirrors /about/about-us)
   ───────────────────────────────────────────────────────────── */
const aboutUs: PageSchema = {
  slug: 'about/about-us',
  title: 'About Us',
  livePath: '/about/about-us',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'title', label: 'Page Title', type: 'text' },
        { key: 'image', label: 'Banner Image', type: 'image' },
      ],
    },
    {
      key: 'overview', label: 'Corporate Overview', icon: 'bi-building',
      fields: [
        { key: 'image', label: 'Image', type: 'image' },
        { key: 'badgeNumber', label: 'Badge Number', type: 'text', hint: 'e.g. 28' },
        { key: 'badgeText', label: 'Badge Text', type: 'text', hint: 'e.g. Years of Establishment' },
        { key: 'tag', label: 'Section Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'body', label: 'Body', type: 'richtext' },
      ],
    },
    {
      key: 'mission', label: 'Our Mission', icon: 'bi-bullseye',
      fields: [
        { key: 'bgImage', label: 'Background Image', type: 'image' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'text', label: 'Mission Text', type: 'textarea' },
        {
          key: 'values', label: 'Value Chips', type: 'list', itemLabel: 'Value',
          itemFields: [
            { key: 'label', label: 'Label', type: 'text' },
          ],
        },
      ],
    },
    {
      key: 'ethicsVision', label: 'Ethics & Vision', icon: 'bi-shield-lock-fill',
      fields: [
        { key: 'ethicsTitle', label: 'Ethics — Title', type: 'text', hint: 'Wrap highlighted words in **double asterisks**' },
        { key: 'ethicsBody', label: 'Ethics — Body', type: 'textarea' },
        { key: 'visionTitle', label: 'Vision — Title', type: 'text' },
        { key: 'visionBody', label: 'Vision — Body', type: 'textarea' },
      ],
    },
    {
      key: 'mdMessage', label: 'MD Message', icon: 'bi-chat-quote-fill',
      fields: [
        { key: 'tag', label: 'Section Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'body', label: 'Body', type: 'richtext' },
      ],
    },
    {
      key: 'quality', label: 'Quality Policy', icon: 'bi-patch-check-fill',
      fields: [
        { key: 'image', label: 'Image', type: 'image' },
        { key: 'tag', label: 'Section Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'body', label: 'Body', type: 'richtext' },
      ],
    },
  ],
};

/* ─────────────────────────────────────────────────────────────
   VISION & MISSION   (mirrors /about/vision-mission)
   ───────────────────────────────────────────────────────────── */
const visionMission: PageSchema = {
  slug: 'about/vision-mission',
  title: 'Vision & Mission',
  livePath: '/about/vision-mission',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'label', label: 'Eyebrow Label', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ],
    },
    {
      key: 'vision', label: 'Vision', icon: 'bi-eye-fill',
      fields: [
        { key: 'label', label: 'Card Label', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'body', label: 'Body', type: 'richtext' },
        { key: 'highlight', label: 'Highlight Quote', type: 'text' },
      ],
    },
    {
      key: 'mission', label: 'Mission', icon: 'bi-bullseye',
      fields: [
        { key: 'label', label: 'Card Label', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'intro', label: 'Intro', type: 'textarea' },
        {
          key: 'points', label: 'Mission Points', type: 'list', itemLabel: 'Point',
          itemFields: [
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'desc', label: 'Description', type: 'textarea' },
          ],
        },
      ],
    },
    {
      key: 'values', label: 'Core Values', icon: 'bi-gem',
      fields: [
        { key: 'tag', label: 'Section Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
        {
          key: 'items', label: 'Values', type: 'list', itemLabel: 'Value',
          itemFields: [
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'desc', label: 'Description', type: 'textarea' },
            { key: 'color', label: 'Colour', type: 'select', options: ['av-blue', 'av-teal', 'av-navy'] },
          ],
        },
      ],
    },
    {
      key: 'commitment', label: 'Commitment', icon: 'bi-hand-thumbs-up-fill',
      fields: [
        { key: 'tag', label: 'Section Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'body', label: 'Body', type: 'richtext' },
        {
          key: 'pills', label: 'Pills', type: 'list', itemLabel: 'Pill',
          itemFields: [{ key: 'label', label: 'Label', type: 'text' }],
        },
        {
          key: 'metrics', label: 'Metrics', type: 'list', itemLabel: 'Metric',
          itemFields: [
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
            { key: 'num', label: 'Number', type: 'text' },
            { key: 'label', label: 'Label', type: 'text' },
          ],
        },
      ],
    },
    {
      key: 'cta', label: 'Bottom CTA', icon: 'bi-megaphone-fill',
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ],
    },
  ],
};

/* ─────────────────────────────────────────────────────────────
   CERTIFICATIONS   (mirrors /about/certifications)
   ───────────────────────────────────────────────────────────── */
const certifications: PageSchema = {
  slug: 'about/certifications',
  title: 'Certifications',
  livePath: '/about/certifications',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'label', label: 'Eyebrow Label', type: 'text' },
        { key: 'title', label: 'Title', type: 'text', hint: 'Wrap highlighted word in **double asterisks**' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ],
    },
    {
      key: 'stats', label: 'Stats Strip', icon: 'bi-bar-chart-fill',
      fields: [
        {
          key: 'items', label: 'Stats', type: 'list', itemLabel: 'Stat',
          itemFields: [
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
            { key: 'value', label: 'Value', type: 'text' },
            { key: 'label', label: 'Label', type: 'text' },
          ],
        },
      ],
    },
    {
      key: 'categories', label: 'Certification Categories', icon: 'bi-patch-check-fill',
      fields: [
        {
          key: 'items', label: 'Categories', type: 'list', itemLabel: 'Category',
          itemFields: [
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'desc', label: 'Description', type: 'textarea' },
            { key: 'color', label: 'Colour', type: 'select', options: ['cert-navy', 'cert-blue', 'cert-teal', 'cert-green'] },
            {
              key: 'certs', label: 'Certificates', type: 'list', itemLabel: 'Certificate',
              itemFields: [
                { key: 'name', label: 'Name', type: 'text' },
                { key: 'code', label: 'Code', type: 'text' },
                { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Certified', 'Compliant'] },
                { key: 'year', label: 'Year', type: 'text' },
                { key: 'desc', label: 'Description', type: 'textarea' },
              ],
            },
          ],
        },
      ],
    },
    {
      key: 'trust', label: 'Trust Statement', icon: 'bi-shield-lock-fill',
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'body', label: 'Body', type: 'richtext' },
        {
          key: 'checks', label: 'Checklist', type: 'list', itemLabel: 'Item',
          itemFields: [{ key: 'text', label: 'Text', type: 'text' }],
        },
      ],
    },
    {
      key: 'cta', label: 'Bottom CTA', icon: 'bi-megaphone-fill',
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ],
    },
  ],
};

/* Shared CTA group used by many pages */
const ctaGroup: GroupDef = {
  key: 'cta', label: 'Bottom CTA', icon: 'bi-megaphone-fill',
  fields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'desc', label: 'Description', type: 'textarea' },
  ],
};

/* ─────────────────────────────────────────────────────────────
   SOLUTIONS → STRUCTURED CABLING
   ───────────────────────────────────────────────────────────── */
const structuredCabling: PageSchema = {
  slug: 'solutions/structured-cabling',
  title: 'Structured Cabling',
  livePath: '/solutions/structured-cabling',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'titleHighlight', label: 'Title Highlight (2nd line)', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
        {
          key: 'stats', label: 'Hero Stats', type: 'list', itemLabel: 'Stat',
          itemFields: [{ key: 'value', label: 'Value', type: 'text' }, { key: 'label', label: 'Label', type: 'text' }],
        },
      ],
    },
    {
      key: 'cables', label: 'Cable Types', icon: 'bi-ethernet',
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
        {
          key: 'items', label: 'Cable Types', type: 'list', itemLabel: 'Cable',
          itemFields: [
            { key: 'type', label: 'Type', type: 'text' },
            { key: 'speed', label: 'Max Speed', type: 'text' },
            { key: 'freq', label: 'Frequency', type: 'text' },
            { key: 'use', label: 'Best For', type: 'text' },
            { key: 'color', label: 'Colour (hex)', type: 'text' },
          ],
        },
      ],
    },
    {
      key: 'process', label: 'Process', icon: 'bi-list-ol',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
        {
          key: 'items', label: 'Steps', type: 'list', itemLabel: 'Step',
          itemFields: [
            { key: 'num', label: 'Number', type: 'text' },
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'desc', label: 'Description', type: 'textarea' },
          ],
        },
      ],
    },
    {
      key: 'standards', label: 'Standards & Scope', icon: 'bi-patch-check-fill',
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'body', label: 'Body', type: 'textarea' },
        {
          key: 'items', label: 'Standards', type: 'list', itemLabel: 'Standard',
          itemFields: [
            { key: 'org', label: 'Org Badge', type: 'text' },
            { key: 'code', label: 'Code', type: 'text' },
            { key: 'title', label: 'Title', type: 'text' },
          ],
        },
        {
          key: 'scope', label: 'Scope (Ideal For)', type: 'list', itemLabel: 'Scope',
          itemFields: [
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'desc', label: 'Description', type: 'text' },
          ],
        },
      ],
    },
    {
      key: 'cta', label: 'Bottom CTA', icon: 'bi-megaphone-fill',
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ],
    },
  ],
};

/* ─────────────────────────────────────────────────────────────
   SOLUTIONS → ACTIVE NETWORK DEVICES
   ───────────────────────────────────────────────────────────── */
const activeNetwork: PageSchema = {
  slug: 'solutions/active-network',
  title: 'Active Network Devices',
  livePath: '/solutions/active-network',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'tag', label: 'Tag (partners line)', type: 'text' },
        { key: 'title', label: 'Title (line 1)', type: 'text' },
        { key: 'titleHighlight', label: 'Title (line 2)', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
        {
          key: 'certs', label: 'Cert Badges', type: 'list', itemLabel: 'Badge',
          itemFields: [{ key: 'name', label: 'Name', type: 'text' }, { key: 'sub', label: 'Subtitle', type: 'text' }],
        },
      ],
    },
    {
      key: 'devices', label: 'Device Portfolio', icon: 'bi-hdd-network-fill',
      fields: [
        {
          key: 'items', label: 'Devices', type: 'list', itemLabel: 'Device',
          itemFields: [
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'brands', label: 'Brands (comma separated)', type: 'text' },
            { key: 'specs', label: 'Specs (comma separated)', type: 'textarea' },
            { key: 'color', label: 'Colour', type: 'select', options: ['and-blue', 'and-teal', 'and-navy'] },
          ],
        },
      ],
    },
    {
      key: 'approach', label: 'Our Approach', icon: 'bi-diagram-3-fill',
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'body', label: 'Body', type: 'richtext' },
        {
          key: 'points', label: 'Points', type: 'list', itemLabel: 'Point',
          itemFields: [{ key: 'text', label: 'Text', type: 'text' }],
        },
      ],
    },
    ctaGroup,
  ],
};

/* ─────────────────────────────────────────────────────────────
   SOLUTIONS → NETWORK PERIPHERALS
   ───────────────────────────────────────────────────────────── */
const networkPeripherals: PageSchema = {
  slug: 'solutions/network-peripherals',
  title: 'Network Peripherals',
  livePath: '/solutions/network-peripherals',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'tag', label: 'Category Tag', type: 'text' },
        { key: 'title', label: 'Title (line 1)', type: 'text' },
        { key: 'titleHighlight', label: 'Title (line 2)', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ],
    },
    {
      key: 'categories', label: 'Product Categories', icon: 'bi-grid-3x3-gap-fill',
      fields: [
        { key: 'tag', label: 'Section Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
        {
          key: 'items', label: 'Categories', type: 'list', itemLabel: 'Category',
          itemFields: [
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
            { key: 'title', label: 'Title', type: 'text' },
            {
              key: 'items', label: 'Products', type: 'list', itemLabel: 'Product',
              itemFields: [{ key: 'name', label: 'Name', type: 'text' }, { key: 'desc', label: 'Description', type: 'text' }],
            },
          ],
        },
      ],
    },
    {
      key: 'why', label: 'Why Source From Us', icon: 'bi-award-fill',
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
        {
          key: 'items', label: 'Benefits', type: 'list', itemLabel: 'Benefit',
          itemFields: [
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'desc', label: 'Description', type: 'textarea' },
          ],
        },
      ],
    },
    {
      key: 'cta', label: 'Bottom CTA', icon: 'bi-megaphone-fill',
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ],
    },
  ],
};

/* ─────────────────────────────────────────────────────────────
   SOLUTIONS → ICT PRODUCTS & PERIPHERALS
   ───────────────────────────────────────────────────────────── */
const ictProducts: PageSchema = {
  slug: 'solutions/ict-products',
  title: 'ICT Products & Peripherals',
  livePath: '/solutions/ict-products',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'badge', label: 'Badge', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'titleHighlight', label: 'Title Highlight', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
        { key: 'brands', label: 'Brand Pills (comma separated)', type: 'textarea' },
        {
          key: 'stats', label: 'Hero Stats', type: 'list', itemLabel: 'Stat',
          itemFields: [{ key: 'v', label: 'Value', type: 'text' }, { key: 'l', label: 'Label', type: 'text' }],
        },
      ],
    },
    {
      key: 'products', label: 'Product Range', icon: 'bi-box-seam-fill',
      fields: [
        { key: 'tag', label: 'Section Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
        {
          key: 'items', label: 'Products', type: 'list', itemLabel: 'Product',
          itemFields: [
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'desc', label: 'Description', type: 'textarea' },
            { key: 'brands', label: 'Brands', type: 'text' },
          ],
        },
      ],
    },
    {
      key: 'process', label: 'Procurement Process', icon: 'bi-list-ol',
      fields: [
        { key: 'tag', label: 'Section Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        {
          key: 'items', label: 'Steps', type: 'list', itemLabel: 'Step',
          itemFields: [
            { key: 'num', label: 'Number', type: 'text' },
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'desc', label: 'Description', type: 'textarea' },
          ],
        },
      ],
    },
    {
      key: 'cta', label: 'Bottom CTA', icon: 'bi-megaphone-fill',
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ],
    },
  ],
};

/* ─────────────────────────────────────────────────────────────
   SERVICES → CONSULTING
   ───────────────────────────────────────────────────────────── */
const consulting: PageSchema = {
  slug: 'services/consulting',
  title: 'Consulting Services',
  livePath: '/services/consulting',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'badge', label: 'Badge', type: 'text' },
        { key: 'title', label: 'Title (line 1)', type: 'text' },
        { key: 'titleAccent', label: 'Title Accent (line 2)', type: 'text' },
        { key: 'titleSub', label: 'Title (line 3)', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
        { key: 'pills', label: 'Pills (comma separated)', type: 'textarea' },
      ],
    },
    {
      key: 'areas', label: 'Consulting Areas', icon: 'bi-grid-3x3-gap-fill',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
        {
          key: 'items', label: 'Areas', type: 'list', itemLabel: 'Area',
          itemFields: [
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'desc', label: 'Description', type: 'textarea' },
          ],
        },
      ],
    },
    {
      key: 'methodology', label: 'Methodology', icon: 'bi-list-ol',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
        {
          key: 'items', label: 'Steps', type: 'list', itemLabel: 'Step',
          itemFields: [
            { key: 'num', label: 'Number', type: 'text' }, { key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'desc', label: 'Description', type: 'textarea' },
          ],
        },
      ],
    },
    {
      key: 'industries', label: 'Industries', icon: 'bi-building',
      fields: [
        { key: 'title', label: 'Title', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' },
        {
          key: 'items', label: 'Industries', type: 'list', itemLabel: 'Industry',
          itemFields: [{ key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'label', label: 'Label', type: 'text' }],
        },
      ],
    },
    {
      key: 'why', label: 'Why Choose Us', icon: 'bi-patch-check-fill',
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        {
          key: 'items', label: 'Reasons', type: 'list', itemLabel: 'Reason',
          itemFields: [{ key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'desc', label: 'Description', type: 'textarea' }],
        },
      ],
    },
    ctaGroup,
  ],
};

/* ─────────────────────────────────────────────────────────────
   SERVICES → NETWORK ENGINEERING
   ───────────────────────────────────────────────────────────── */
const networkEngineering: PageSchema = {
  slug: 'services/network-engineering',
  title: 'Network Engineering',
  livePath: '/services/network-engineering',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'status', label: 'Status Bar Text', type: 'text' },
        { key: 'title', label: 'Title (line 1)', type: 'text' },
        { key: 'titleAccent', label: 'Title (line 2)', type: 'text' },
        { key: 'titleSub', label: 'Title (line 3)', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
        { key: 'certs', label: 'Cert Tags (comma separated)', type: 'text' },
      ],
    },
    {
      key: 'capabilities', label: 'Capabilities', icon: 'bi-grid-3x3-gap-fill',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
        {
          key: 'items', label: 'Capabilities', type: 'list', itemLabel: 'Capability',
          itemFields: [
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'desc', label: 'Description', type: 'textarea' },
            { key: 'tag', label: 'Tag', type: 'select', options: ['Core', 'Specialist', 'Advanced'] },
          ],
        },
      ],
    },
    {
      key: 'technologies', label: 'Technologies', icon: 'bi-cpu-fill',
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        {
          key: 'items', label: 'Technologies', type: 'list', itemLabel: 'Technology',
          itemFields: [{ key: 'label', label: 'Label', type: 'text' }, { key: 'cat', label: 'Category', type: 'text' }],
        },
      ],
    },
    {
      key: 'deliverables', label: 'Deliverables', icon: 'bi-file-earmark-check-fill',
      fields: [
        { key: 'title', label: 'Title', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' },
        {
          key: 'items', label: 'Deliverables', type: 'list', itemLabel: 'Deliverable',
          itemFields: [{ key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'label', label: 'Label', type: 'text' }],
        },
      ],
    },
    ctaGroup,
  ],
};

/* ─────────────────────────────────────────────────────────────
   SERVICES → PROJECT MANAGEMENT
   ───────────────────────────────────────────────────────────── */
const projectManagement: PageSchema = {
  slug: 'services/project-management',
  title: 'Project Management',
  livePath: '/services/project-management',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'badge', label: 'Badge', type: 'text' },
        { key: 'title', label: 'Title (line 1)', type: 'text' },
        { key: 'titleAccent', label: 'Title (line 2)', type: 'text' },
        { key: 'titleSub', label: 'Title (line 3)', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ],
    },
    {
      key: 'metrics', label: 'Metrics', icon: 'bi-bar-chart-fill',
      fields: [{
        key: 'items', label: 'Metrics', type: 'list', itemLabel: 'Metric',
        itemFields: [{ key: 'value', label: 'Value', type: 'text' }, { key: 'label', label: 'Label', type: 'text' }],
      }],
    },
    {
      key: 'phases', label: 'Lifecycle Phases', icon: 'bi-kanban-fill',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
        {
          key: 'items', label: 'Phases', type: 'list', itemLabel: 'Phase',
          itemFields: [
            { key: 'id', label: 'ID', type: 'text' }, { key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'title', label: 'Title', type: 'text' },
            { key: 'color', label: 'Colour', type: 'select', options: ['pm-blue', 'pm-teal', 'pm-orange'] },
            { key: 'items', label: 'Items (comma separated)', type: 'textarea' },
          ],
        },
      ],
    },
    {
      key: 'services', label: 'What We Manage', icon: 'bi-gear-fill',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
        {
          key: 'items', label: 'Services', type: 'list', itemLabel: 'Service',
          itemFields: [{ key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'desc', label: 'Description', type: 'textarea' }],
        },
      ],
    },
    {
      key: 'frameworks', label: 'Frameworks', icon: 'bi-diagram-2-fill',
      fields: [{
        key: 'items', label: 'Frameworks', type: 'list', itemLabel: 'Framework',
        itemFields: [{ key: 'name', label: 'Name', type: 'text' }, { key: 'sub', label: 'Subtitle', type: 'text' }],
      }],
    },
    ctaGroup,
  ],
};

/* ─────────────────────────────────────────────────────────────
   SERVICES → TRAINING & WORKSHOP
   ───────────────────────────────────────────────────────────── */
const training: PageSchema = {
  slug: 'services/training',
  title: 'Training & Workshop',
  livePath: '/services/training',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'badge', label: 'Badge', type: 'text' },
        { key: 'title', label: 'Title (line 1)', type: 'text' },
        { key: 'titleAccent', label: 'Title (line 2)', type: 'text' },
        { key: 'titleSub', label: 'Title (line 3)', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ],
    },
    {
      key: 'stats', label: 'Stats', icon: 'bi-bar-chart-fill',
      fields: [{
        key: 'items', label: 'Stats', type: 'list', itemLabel: 'Stat',
        itemFields: [{ key: 'value', label: 'Value', type: 'text' }, { key: 'label', label: 'Label', type: 'text' }],
      }],
    },
    {
      key: 'programs', label: 'Programs', icon: 'bi-mortarboard-fill',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
        {
          key: 'items', label: 'Programs', type: 'list', itemLabel: 'Program',
          itemFields: [
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'level', label: 'Level', type: 'text' },
            { key: 'levelColor', label: 'Level Colour', type: 'select', options: ['tr-green', 'tr-blue', 'tr-purple', 'tr-gold'] },
            { key: 'title', label: 'Title', type: 'text' }, { key: 'duration', label: 'Duration', type: 'text' }, { key: 'audience', label: 'Audience', type: 'text' },
            { key: 'topics', label: 'Topics (comma separated)', type: 'textarea' },
          ],
        },
      ],
    },
    {
      key: 'formats', label: 'Delivery Formats', icon: 'bi-easel-fill',
      fields: [{
        key: 'items', label: 'Formats', type: 'list', itemLabel: 'Format',
        itemFields: [{ key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'desc', label: 'Description', type: 'textarea' }],
      }],
    },
    {
      key: 'roles', label: 'Who Should Attend', icon: 'bi-people-fill',
      fields: [
        { key: 'title', label: 'Title', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea' },
        {
          key: 'items', label: 'Roles', type: 'list', itemLabel: 'Role',
          itemFields: [{ key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'label', label: 'Label', type: 'text' }],
        },
      ],
    },
    ctaGroup,
  ],
};

/* ─────────────────────────────────────────────────────────────
   BUSINESS → TENDER
   ───────────────────────────────────────────────────────────── */
const tender: PageSchema = {
  slug: 'business/tender',
  title: 'Tender',
  livePath: '/business/tender',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'badge', label: 'Badge Text', type: 'text' },
        { key: 'title', label: 'Title (line 1)', type: 'text' },
        { key: 'titleAccent', label: 'Title (line 2)', type: 'text' },
        { key: 'titleSub', label: 'Title (line 3)', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
        {
          key: 'stats', label: 'Hero Stats', type: 'list', itemLabel: 'Stat',
          itemFields: [{ key: 'value', label: 'Value', type: 'text' }, { key: 'label', label: 'Label', type: 'text' }],
        },
      ],
    },
    {
      key: 'tenders', label: 'Active Tenders Heading', icon: 'bi-file-earmark-text-fill',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
      ],
    },
    {
      key: 'categories', label: 'Tender Categories', icon: 'bi-grid-3x3-gap-fill',
      fields: [{
        key: 'items', label: 'Categories', type: 'list', itemLabel: 'Category',
        itemFields: [{ key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'label', label: 'Label', type: 'text' }, { key: 'count', label: 'Count Text', type: 'text' }],
      }],
    },
    {
      key: 'howto', label: 'How to Apply', icon: 'bi-list-ol',
      fields: [{
        key: 'items', label: 'Steps', type: 'list', itemLabel: 'Step',
        itemFields: [
          { key: 'num', label: 'Number', type: 'text' }, { key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'desc', label: 'Description', type: 'textarea' },
        ],
      }],
    },
    {
      key: 'eligibility', label: 'Eligibility & FAQ', icon: 'bi-patch-check-fill',
      fields: [
        {
          key: 'criteria', label: 'Eligibility Criteria', type: 'list', itemLabel: 'Criterion',
          itemFields: [{ key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'text', label: 'Text', type: 'text' }],
        },
        {
          key: 'faqs', label: 'FAQs', type: 'list', itemLabel: 'FAQ',
          itemFields: [{ key: 'q', label: 'Question', type: 'text' }, { key: 'a', label: 'Answer', type: 'textarea' }],
        },
      ],
    },
    ctaGroup,
  ],
};

/* ─────────────────────────────────────────────────────────────
   BUSINESS → PROCUREMENT
   ───────────────────────────────────────────────────────────── */
const procurement: PageSchema = {
  slug: 'business/procurement',
  title: 'Procurement',
  livePath: '/business/procurement',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'badge', label: 'Badge Text', type: 'text' },
        { key: 'title', label: 'Title (line 1)', type: 'text' },
        { key: 'titleAccent', label: 'Title (line 2)', type: 'text' },
        { key: 'titleSub', label: 'Title (line 3)', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
        {
          key: 'stats', label: 'Hero Stats', type: 'list', itemLabel: 'Stat',
          itemFields: [{ key: 'value', label: 'Value', type: 'text' }, { key: 'label', label: 'Label', type: 'text' }],
        },
      ],
    },
    {
      key: 'categories', label: 'Procurement Categories', icon: 'bi-grid-3x3-gap-fill',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
        {
          key: 'items', label: 'Categories', type: 'list', itemLabel: 'Category',
          itemFields: [{ key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'desc', label: 'Description', type: 'textarea' }],
        },
      ],
    },
    {
      key: 'process', label: 'Registration Process', icon: 'bi-list-ol',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
        { key: 'ctaText', label: 'Bottom Note', type: 'text' },
        {
          key: 'items', label: 'Steps', type: 'list', itemLabel: 'Step',
          itemFields: [
            { key: 'num', label: 'Number', type: 'text' }, { key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'desc', label: 'Description', type: 'textarea' },
          ],
        },
      ],
    },
    {
      key: 'requirements', label: 'Requirements', icon: 'bi-check2-square',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
        {
          key: 'items', label: 'Requirements', type: 'list', itemLabel: 'Requirement',
          itemFields: [{ key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'label', label: 'Text', type: 'text' }],
        },
      ],
    },
    {
      key: 'benefits', label: 'Benefits', icon: 'bi-stars',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        {
          key: 'items', label: 'Benefits', type: 'list', itemLabel: 'Benefit',
          itemFields: [{ key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'desc', label: 'Description', type: 'textarea' }],
        },
      ],
    },
    ctaGroup,
  ],
};

/* ─────────────────────────────────────────────────────────────
   BUSINESS → STRATEGIC PARTNERS
   ───────────────────────────────────────────────────────────── */
const strategicPartners: PageSchema = {
  slug: 'business/strategic-partners',
  title: 'Strategic Partners',
  livePath: '/business/strategic-partners',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'badge', label: 'Badge Text', type: 'text' },
        { key: 'title', label: 'Title (line 1)', type: 'text' },
        { key: 'titleAccent', label: 'Title (line 2)', type: 'text' },
        { key: 'titleSub', label: 'Title (line 3)', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
        {
          key: 'stats', label: 'Hero Stats', type: 'list', itemLabel: 'Stat',
          itemFields: [{ key: 'value', label: 'Value', type: 'text' }, { key: 'label', label: 'Label', type: 'text' }],
        },
      ],
    },
    {
      key: 'tiers', label: 'Partnership Tiers', icon: 'bi-layers-fill',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
        {
          key: 'items', label: 'Tiers', type: 'list', itemLabel: 'Tier',
          itemFields: [
            { key: 'level', label: 'Level', type: 'text' },
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
            { key: 'color', label: 'Colour Class', type: 'select', options: ['sp-plat', 'sp-gold', 'sp-silv', 'sp-assoc'] },
            { key: 'tagline', label: 'Tagline', type: 'text' },
            { key: 'revenue', label: 'Min Revenue', type: 'text' },
            { key: 'benefits', label: 'Benefits (one per line)', type: 'textarea' },
          ],
        },
      ],
    },
    {
      key: 'types', label: 'Partnership Types', icon: 'bi-diagram-3-fill',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
        {
          key: 'items', label: 'Types', type: 'list', itemLabel: 'Type',
          itemFields: [{ key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'desc', label: 'Description', type: 'textarea' }],
        },
      ],
    },
    {
      key: 'benefits', label: 'Benefits', icon: 'bi-stars',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
        {
          key: 'items', label: 'Benefits', type: 'list', itemLabel: 'Benefit',
          itemFields: [{ key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'desc', label: 'Description', type: 'textarea' }],
        },
      ],
    },
    {
      key: 'partners', label: 'Technology Partners', icon: 'bi-hexagon-fill',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
        {
          key: 'items', label: 'Partners', type: 'list', itemLabel: 'Partner',
          itemFields: [
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'cat', label: 'Category', type: 'text' },
            { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
            { key: 'tier', label: 'Tier', type: 'select', options: ['Platinum', 'Gold', 'Silver', 'Associate'] },
          ],
        },
      ],
    },
    ctaGroup,
  ],
};

const projects: PageSchema = {
  slug: 'projects',
  title: 'Projects',
  livePath: '/projects',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'badge', label: 'Badge', type: 'text' },
        { key: 'title', label: 'Title (line 1)', type: 'text' },
        { key: 'titleAccent', label: 'Title (line 2)', type: 'text' },
        { key: 'titleSub', label: 'Title (line 3)', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ],
    },
    {
      key: 'stats', label: 'Stats', icon: 'bi-bar-chart-fill',
      fields: [{
        key: 'items', label: 'Stats', type: 'list', itemLabel: 'Stat',
        itemFields: [{ key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'value', label: 'Value', type: 'text' }, { key: 'label', label: 'Label', type: 'text' }],
      }],
    },
    {
      key: 'list', label: 'Projects', icon: 'bi-folder-fill',
      fields: [{
        key: 'items', label: 'Projects', type: 'list', itemLabel: 'Project',
        itemFields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'client', label: 'Client', type: 'text' },
          { key: 'sector', label: 'Sector', type: 'select', options: ['Government', 'Education', 'Private', 'Healthcare'] },
          { key: 'category', label: 'Category', type: 'text' },
          { key: 'year', label: 'Year', type: 'text' },
          { key: 'location', label: 'Location', type: 'text' },
          { key: 'value', label: 'Value', type: 'text' },
          { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
          { key: 'color', label: 'Colour (hex)', type: 'text' },
          { key: 'tags', label: 'Tags (comma separated)', type: 'text' },
          { key: 'desc', label: 'Description', type: 'textarea' },
          { key: 'featured', label: 'Featured?', type: 'select', options: ['yes', 'no'] },
        ],
      }],
    },
    {
      key: 'sectors', label: 'Industry Coverage', icon: 'bi-pie-chart-fill',
      fields: [{
        key: 'items', label: 'Sectors', type: 'list', itemLabel: 'Sector',
        itemFields: [
          { key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'label', label: 'Label', type: 'text' },
          { key: 'count', label: 'Count', type: 'text' }, { key: 'desc', label: 'Description', type: 'text' },
        ],
      }],
    },
    ctaGroup,
  ],
};

/* ─────────────────────────────────────────────────────────────
   RESOURCES → FAQ
   ───────────────────────────────────────────────────────────── */
const faq: PageSchema = {
  slug: 'resources/faq',
  title: 'FAQ',
  livePath: '/resources/faq',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' },
        { key: 'title', label: 'Title (line 1)', type: 'text' },
        { key: 'titleAccent', label: 'Title (line 2)', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ],
    },
    {
      key: 'categories', label: 'FAQ Categories', icon: 'bi-question-circle-fill',
      fields: [{
        key: 'items', label: 'Categories', type: 'list', itemLabel: 'Category',
        itemFields: [
          { key: 'cat', label: 'Category Name', type: 'text' },
          { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
          { key: 'color', label: 'Colour Class', type: 'select', options: ['fq-general', 'fq-services', 'fq-projects', 'fq-technical', 'fq-pricing', 'fq-vendors', 'fq-fees', 'fq-careers'] },
          {
            key: 'items', label: 'Questions', type: 'list', itemLabel: 'Q&A',
            itemFields: [{ key: 'q', label: 'Question', type: 'text' }, { key: 'a', label: 'Answer', type: 'textarea' }],
          },
        ],
      }],
    },
  ],
};

/* ─────────────────────────────────────────────────────────────
   RESOURCES → ACHIEVEMENT
   ───────────────────────────────────────────────────────────── */
const achievement: PageSchema = {
  slug: 'resources/achievement',
  title: 'Achievement',
  livePath: '/resources/achievement',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'tag', label: 'Tag (year range)', type: 'text' },
        { key: 'title', label: 'Title (line 1)', type: 'text' },
        { key: 'titleAccent', label: 'Title (line 2)', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ],
    },
    {
      key: 'stats', label: 'Stats', icon: 'bi-bar-chart-fill',
      fields: [{
        key: 'items', label: 'Stats', type: 'list', itemLabel: 'Stat',
        itemFields: [{ key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'value', label: 'Value', type: 'text' }, { key: 'label', label: 'Label', type: 'text' }],
      }],
    },
    {
      key: 'milestones', label: 'Milestones Timeline', icon: 'bi-clock-history',
      fields: [{
        key: 'items', label: 'Milestones', type: 'list', itemLabel: 'Milestone',
        itemFields: [
          { key: 'year', label: 'Year', type: 'text' }, { key: 'title', label: 'Title', type: 'text' },
          { key: 'desc', label: 'Description', type: 'textarea' }, { key: 'icon', label: 'Icon (bi-*)', type: 'text' },
          { key: 'side', label: 'Side', type: 'select', options: ['left', 'right'] },
        ],
      }],
    },
    {
      key: 'certs', label: 'Awards & Certifications', icon: 'bi-award-fill',
      fields: [{
        key: 'items', label: 'Certifications', type: 'list', itemLabel: 'Certification',
        itemFields: [{ key: 'icon', label: 'Icon (bi-*)', type: 'text' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'body', label: 'Description', type: 'textarea' }],
      }],
    },
    ctaGroup,
  ],
};

/* ─────────────────────────────────────────────────────────────
   RESOURCES → DOWNLOAD  (page content only — the file list itself
   is managed via real uploads in the "Downloads" tab at /web/downloads)
   ───────────────────────────────────────────────────────────── */
const resourcesDownload: PageSchema = {
  slug: 'resources/download',
  title: 'Forms & Documents',
  livePath: '/resources/document',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'tag', label: 'Tag Text', type: 'text' },
        { key: 'title', label: 'Title (line 1)', type: 'text' },
        { key: 'titleSub', label: 'Title (line 2)', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
        { key: 'statFreeLabel', label: 'Stat — Free Label', type: 'text' },
        { key: 'statFreeSub', label: 'Stat — Free Sublabel', type: 'text' },
      ],
    },
    {
      key: 'library', label: 'Library Heading', icon: 'bi-collection-fill',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
      ],
    },
    ctaGroup,
  ],
};

/* ─────────────────────────────────────────────────────────────
   RESOURCES → PRODUCTS  (Page Content tab; the catalog cards
   are managed via real records in the "Product Table" tab)
   ───────────────────────────────────────────────────────────── */
const resourcesProducts: PageSchema = {
  slug: 'resources/products',
  title: 'Products',
  livePath: '/resources/products',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'tag', label: 'Tag Text', type: 'text' },
        { key: 'title', label: 'Title (line 1)', type: 'text' },
        { key: 'titleSub', label: 'Title (line 2)', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ],
    },
    {
      key: 'catalog', label: 'Catalog Heading', icon: 'bi-grid-3x3-gap-fill',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
      ],
    },
    {
      key: 'brands', label: 'Trusted Brands', icon: 'bi-patch-check-fill',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text' },
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
        {
          key: 'items', label: 'Brand List', type: 'list', itemLabel: 'Brand',
          itemFields: [
            { key: 'name', label: 'Brand Name', type: 'text' },
            { key: 'icon', label: 'Icon (bootstrap-icons)', type: 'text', hint: 'e.g. bi-router' },
          ],
        },
      ],
    },
    ctaGroup,
  ],
};

/* ─────────────────────────────────────────────────────────────
   RESOURCES → GALLERY  (Page Content tab; albums + photos are
   managed via real uploads in the "Gallery" tab)
   ───────────────────────────────────────────────────────────── */
const resourcesGallery: PageSchema = {
  slug: 'resources/gallery',
  title: 'Gallery',
  livePath: '/resources/gallery',
  groups: [
    {
      key: 'hero', label: 'Hero', icon: 'bi-image-fill',
      fields: [
        { key: 'tag', label: 'Tag Text', type: 'text' },
        { key: 'title', label: 'Title (line 1)', type: 'text' },
        { key: 'titleSub', label: 'Title (line 2)', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ],
    },
    {
      key: 'cta', label: 'Bottom CTA', icon: 'bi-megaphone-fill',
      fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'desc', label: 'Description', type: 'textarea' },
      ],
    },
  ],
};

export const PAGE_SCHEMAS: Record<string, PageSchema> = {
  [home.slug]: home,
  [aboutUs.slug]: aboutUs,
  [visionMission.slug]: visionMission,
  [certifications.slug]: certifications,
  [structuredCabling.slug]: structuredCabling,
  [activeNetwork.slug]: activeNetwork,
  [networkPeripherals.slug]: networkPeripherals,
  [ictProducts.slug]: ictProducts,
  [consulting.slug]: consulting,
  [networkEngineering.slug]: networkEngineering,
  [projectManagement.slug]: projectManagement,
  [training.slug]: training,
  [tender.slug]: tender,
  [procurement.slug]: procurement,
  [strategicPartners.slug]: strategicPartners,
  [projects.slug]: projects,
  [faq.slug]: faq,
  [achievement.slug]: achievement,
  [resourcesDownload.slug]: resourcesDownload,
  [resourcesProducts.slug]: resourcesProducts,
  [resourcesGallery.slug]: resourcesGallery,
};

export function getSchema(slug: string): PageSchema | null {
  return PAGE_SCHEMAS[slug] || null;
}
