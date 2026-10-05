/**
 * Default content for each web page — extracted from the original
 * hand-built website pages so the CMS starts populated (nothing lost)
 * and the website has a fallback when no DB row exists yet.
 */

export const PAGE_DEFAULTS: Record<string, any> = {
  'home': {
    hero: {
      slides: [
        {
          image: '/image/Slider1.jpg',
          badge: 'Malaysia Premier Classification Society',
          title: 'Ensuring Safety & Quality Standards',
          subtitle: 'Your trusted partner in maritime classification, certification, and consultancy services since 1994.',
        },
        {
          image: '/image/Slider2.jpg',
          badge: 'Member of Asian Classification Society',
          title: 'Excellence in Maritime Services',
          subtitle: 'Delivering world-class classification and certification services for the maritime industry.',
        },
      ],
      ctaPrimaryLabel: 'About Us',
      ctaPrimaryHref: '/about',
      ctaSecondaryLabel: 'Our Services',
      ctaSecondaryHref: '/services',
    },
    intro: {
      welcomeLabel: 'Welcome to',
      welcomeTitle: 'Malaysia Premier Classification Society',
      welcomeLinkLabel: 'About Us',
      welcomeLinkHref: '/about/about-us',
      cards: [
        { icon: 'bi-people', title: 'Who We Are', text: 'We are the national premier Classification Society in Malaysia since 1994. We are also a member of the Asian Classification Society (ACS).' },
        { icon: 'bi-clipboard-check', title: 'What We Do', text: 'We carry out both Classification and non-Classification works for vessels. We have classified more than 1,000 Malaysian registered vessels to date, and counting.' },
        { icon: 'bi-award', title: 'Why Choose Us', text: 'Everything we do is based on the highest standard of quality, delivered consistently and professionally to our valued customers.' },
      ],
    },
    stats: {
      brandImage: '/image/scm-min.png',
      items: [
        { icon: 'bi-emoji-smile-fill', value: '300', suffix: '+', label: 'Satisfied Clients' },
        { icon: 'bi-patch-check-fill', value: '100', suffix: '%', label: 'Quality Control System' },
        { icon: 'bi-award-fill', value: '100', suffix: '%', label: 'Professional & Qualified' },
      ],
    },
    services: {
      tag: 'What We Do',
      title: 'Our **Services**',
      subtitle: 'Comprehensive maritime classification, certification, and consultancy services for the industry.',
      items: [
        { icon: 'bi-clipboard-check', title: 'Survey & Inspection', description: 'Comprehensive classification and statutory surveys throughout a vessel\u2019s lifecycle — from class entry to periodic and renewal surveys.', href: '/services/classification/survey-inspection' },
        { icon: 'bi-rulers', title: 'Plan Approval & Newbuilding', description: 'Design review and newbuilding supervision — verifying structural integrity, stability, and compliance from drawing board to delivery.', href: '/services/classification/plan-approval' },
        { icon: 'bi-patch-check', title: 'Audit & Certification', description: 'Classification and statutory certification for vessels, components, and marine equipment, backed by rigorous audits.', href: '/services/certification' },
        { icon: 'bi-shield-check', title: 'Certification Services', description: 'Statutory and security audits on behalf of flag administrations — ISM, ISPS, MLC, and marine facility security compliance.', href: '/services/classification/audit-certification' },
        { icon: 'bi-lightbulb', title: 'Consultancy & Advisory', description: 'Independent technical consultancy — condition assessments, pre-purchase surveys, project management, and repair supervision.', href: '/services/consultancy' },
      ],
    },
    values: {
      eyebrow: 'We believe in',
      heading: 'Our Strong **Core Values** :',
      image: '/image/core-value.jpg',
      items: [
        { icon: 'bi-gem', title: 'Quality', text: 'We ensure the value of our work is always at the highest quality which consists of task completion, interactions and deliverables.' },
        { icon: 'bi-people-fill', title: 'Teamwork', text: 'We value the collaborative efforts of every team member to achieve a common goal efficiently.' },
        { icon: 'bi-shield-check', title: 'Integrity', text: 'We aim to always deliver our work with honesty and truthfulness in line with our corporate business ethics.' },
      ],
    },
    compromise: {
      eyebrow: 'In everything we do',
      heading: 'We Never **Compromise On** :',
      image: '/image/bg-compromise-on.jpg',
      items: [
        { icon: 'bi-hand-thumbs-up-fill', title: 'Safety', text: 'We will not compromise on safety of our people, our customers and our workplace.' },
        { icon: 'bi-heart-fill', title: 'Respect', text: 'We treat everyone honestly, fairly and courteously in our business affairs and life.' },
        { icon: 'bi-globe2', title: 'Sustainability', text: 'We act responsibly, always considering our impact on the people and environment in which we operate.' },
      ],
    },
  },

  'about/about-us': {
    hero: {
      title: 'About Us',
      image: '/image/banner-about.jpg',
    },
    overview: {
      image: '/image/core-value.jpg',
      badgeNumber: '28',
      badgeText: 'Years of Establishment',
      tag: 'Corporate Overview',
      title: 'Let\'s grow together',
      body: '<p>Ships Classification Malaysia Sdn. Bhd. (SCM) was established in 1994, near Kuala Lumpur, Malaysia, inspired by the awareness between local professionals and entrepreneurs that the need for a Classification Society is clearly evident considering the development in our maritime industry.</p><p>In addition to its headquarters, SCM had established operation offices in East and West Malaysia to effectively cater to its customers in both Classification and non-Classification of ships.</p><p>Since its inception as a national Classification Society, SCM has continuously been promoting safety of life at sea and marine environmental protection. SCM is also an ISO 9001 QMS certified and R.O. Code compliant company. SCM confines the classification activities largely to Malaysian-registered ships and continues to grow and serve the nation with pride.</p>',
    },
    mission: {
      bgImage: '/image/bg-our-mission.jpg',
      title: 'Our Mission',
      text: 'To consistently enrich our resource capabilities by extending quality of services for the safety of life and property at sea, promoting the protection of the marine environment, enhancing maritime security of ships and ensuring acceptable living conditions for seafarers.',
      values: [
        { label: 'Quality' },
        { label: 'Teamwork' },
        { label: 'Integrity' },
        { label: 'Safety' },
        { label: 'Respect' },
        { label: 'Sustainability' },
      ],
    },
    ethicsVision: {
      ethicsTitle: 'Code of **Ethics**',
      ethicsBody: 'Our people always uphold our Code of Ethics while performing their work — they shall be free from any pressures which might affect their judgment in performing statutory certification and services. Any decisions made with regard to the technical services rendered by SCM will not be influenced by external sources.',
      visionTitle: 'Our Vision',
      visionBody: 'To become a classification society of choice in Malaysia.',
    },
    mdMessage: {
      tag: 'Leadership',
      title: 'Message from the Managing Director',
      body: '<p>Malaysia, as an emerging economy, had experienced a huge expansion of the maritime transportation sector between East Malaysia, West Malaysia, and the ASEAN region. It was this expansion that inspired the formation of a local classification society to provide classification and statutory certification services for Malaysian registered ships.</p><p>Founded in 1994 with the objective of providing support to the maritime industry, SCM is the first local Classification Society to obtain authorization from the Government of Malaysia to provide Classification and statutory certification services for all the major IMO conventions that Malaysia is signatory to.</p><p>Presently, SCM not only conducts surveys and inspections for classification of ships and other floating structures, we also provide inspection and certification services to vessels owned and operated by the Malaysian Royal Navy and training institutions, and carry out inspections on behalf of other Government agencies.</p>',
    },
    quality: {
      image: '/image/quality-policy.jpg',
      tag: 'Our Commitment',
      title: 'Quality Policy',
      body: '<p>Being a premier national classification body, Ships Classification Malaysia is fully committed to providing quality services for safety of life and property at sea, promoting the protection and preservation of the marine environment, enhancing maritime security of ships and ensuring acceptable living conditions for seafarers.</p><p>SCM observes the relevant international conventions, codes, national laws, standards and other regulatory and statutory guidelines, in addition to its own rules and regulations, in providing quality services to its clients and interested parties.</p><p>SCM has established a documented quality management system to meet these requirements appropriately and efficiently by clarifying responsibilities and authority relating to quality to all employees, whose performance is continuously improved through planning, assurance, training and management review.</p><p>SCM keeps pace with the latest technologies and developments in the digital revolution and survey perspectives, in line with technological advancement and the changes required to meet the reduction in GHG emissions in accordance with the aspirations of our government and the IMO.</p>',
    },
  },

  'about/vision-mission': {
    hero: {
      label: 'Our Direction & Purpose',
      title: 'Vision & Mission',
      desc: 'The principles that guide Ships Classification Malaysia in promoting safety of life at sea and protection of the marine environment.',
    },
    vision: {
      label: 'Our Vision',
      title: 'To Become a Classification Society of Choice in Malaysia',
      body: '<p>As Malaysia\'s national premier Classification Society since 1994, SCM aspires to be the trusted authority for ship classification and statutory certification — recognised for technical excellence, integrity, and an unwavering commitment to maritime safety.</p><p>We envision a maritime industry where every Malaysian-registered vessel operates safely, efficiently, and in harmony with the marine environment.</p>',
      highlight: 'Promoting safety of life and property at sea.',
    },
    mission: {
      label: 'Our Mission',
      title: 'Advancing Maritime Safety & Quality',
      intro: 'To consistently enrich our resource capabilities by extending quality services for the safety of life and property at sea, protecting the marine environment, enhancing maritime security, and ensuring acceptable living conditions for seafarers.',
      points: [
        { icon: 'bi-clipboard-check', title: 'Classification & Surveys', desc: 'Conduct classification and statutory surveys on vessels throughout their lifecycle in line with SCM Rules and IMO conventions.' },
        { icon: 'bi-patch-check', title: 'Statutory Certification', desc: 'Issue classification and statutory certificates on behalf of the flag administration for Malaysian-registered ships.' },
        { icon: 'bi-water', title: 'Marine Environmental Protection', desc: 'Promote the protection and preservation of the marine environment through compliance with MARPOL and related conventions.' },
        { icon: 'bi-shield-check', title: 'Maritime Security', desc: 'Enhance the maritime security of ships and marine facilities through ISPS and related audits.' },
        { icon: 'bi-people', title: 'Seafarer Welfare', desc: 'Ensure acceptable living and working conditions for seafarers in accordance with the MLC 2006.' },
        { icon: 'bi-gear-wide-connected', title: 'Continuous Improvement', desc: 'Keep pace with technological advancement and digital survey practices to meet evolving industry and IMO requirements.' },
      ],
    },
    values: {
      tag: 'What We Stand For',
      title: 'Our Core Values',
      subtitle: 'The six principles that define how we serve the maritime industry.',
      items: [
        { icon: 'bi-gem', title: 'Quality', desc: 'We ensure the value of our work is always at the highest quality — in task completion, interactions, and deliverables.', color: 'av-blue' },
        { icon: 'bi-people-fill', title: 'Teamwork', desc: 'We value the collaborative efforts of every team member to achieve a common goal efficiently.', color: 'av-teal' },
        { icon: 'bi-shield-fill-check', title: 'Integrity', desc: 'We deliver our work with honesty and truthfulness, in line with our corporate business ethics.', color: 'av-navy' },
        { icon: 'bi-hand-thumbs-up-fill', title: 'Safety', desc: 'We will not compromise on the safety of our people, our customers, and our workplace.', color: 'av-blue' },
        { icon: 'bi-heart-fill', title: 'Respect', desc: 'We treat everyone honestly, fairly, and courteously in our business affairs and life.', color: 'av-teal' },
        { icon: 'bi-globe2', title: 'Sustainability', desc: 'We act responsibly, always considering our impact on the people and environment in which we operate.', color: 'av-navy' },
      ],
    },
    commitment: {
      tag: 'Our Commitment',
      title: 'Trusted by the Nation\'s Maritime Industry',
      body: '<p>Since 1994, SCM has been the first local Classification Society authorised by the Government of Malaysia to provide classification and statutory certification services for the major IMO conventions Malaysia is signatory to.</p><p>We serve Malaysian-registered ships, the Royal Malaysian Navy, training institutions, and other government agencies — always upholding our ISO 9001 quality management system and R.O. Code commitments.</p>',
      pills: [
        { label: 'ISO 9001 QMS Certified' }, { label: 'R.O. Code Compliant' },
        { label: 'Government Authorised' }, { label: 'Member of ACS' },
      ],
      metrics: [
        { num: '1994', label: 'Established', icon: 'bi-calendar-check-fill' },
        { num: '1,000+', label: 'Vessels Classified', icon: 'bi-clipboard-check-fill' },
        { num: 'ISO 9001', label: 'QMS Certified', icon: 'bi-patch-check-fill' },
        { num: 'Nationwide', label: 'East & West Malaysia', icon: 'bi-geo-alt-fill' },
      ],
    },
    cta: {
      title: 'Partner with Malaysia\'s Premier Classification Society',
      desc: 'Contact SCM for classification, certification, and consultancy services.',
    },
  },

  'about/certifications': {
    hero: {
      label: 'Verified & Compliant',
      title: 'Certifications & **Compliance**',
      desc: 'SCM operates under rigorous quality and regulatory frameworks — ISO 9001 certified, R.O. Code compliant, and authorised by the Government of Malaysia to deliver classification and statutory certification services.',
    },
    stats: {
      items: [
        { value: 'ISO 9001', label: 'QMS Certified', icon: 'bi-patch-check' },
        { value: 'R.O. Code', label: 'Compliant', icon: 'bi-shield-check' },
        { value: '1,000+', label: 'Vessels Classified', icon: 'bi-clipboard-check' },
        { value: '1994', label: 'Serving Since', icon: 'bi-calendar-check' },
      ],
    },
    categories: {
      items: [
        {
          icon: 'bi-award-fill', title: 'Quality & Management System', color: 'cert-navy',
          desc: 'Internationally recognised quality standards governing every aspect of our operations.',
          certs: [
            { name: 'ISO 9001:2015 Quality Management System', code: 'ISO 9001', status: 'Certified', year: '', desc: 'Certified quality management system ensuring consistent, high-quality classification and certification services.' },
            { name: 'Recognised Organization (R.O.) Code', code: 'R.O. Code', status: 'Compliant', year: '', desc: 'Compliance with the IMO R.O. Code governing organisations authorised to act on behalf of flag administrations.' },
          ],
        },
        {
          icon: 'bi-bank2', title: 'Statutory Authorisation', color: 'cert-blue',
          desc: 'Official authorisation to act on behalf of the Government of Malaysia.',
          certs: [
            { name: 'Government of Malaysia Authorisation', code: 'Flag State', status: 'Active', year: '1994', desc: 'First local Classification Society authorised to provide classification and statutory certification for Malaysian-registered ships.' },
            { name: 'Marine Department Malaysia (JLM)', code: 'Delegated', status: 'Active', year: '1994', desc: 'Delegated authority to conduct statutory surveys and certification on behalf of the flag administration.' },
          ],
        },
        {
          icon: 'bi-globe2', title: 'International Conventions', color: 'cert-teal',
          desc: 'Surveys and certification aligned with the major IMO conventions Malaysia is signatory to.',
          certs: [
            { name: 'SOLAS — Safety of Life at Sea', code: 'SOLAS', status: 'Compliant', year: '', desc: 'Cargo Ship Safety Construction, Equipment, and Radio certification under the SOLAS Convention.' },
            { name: 'MARPOL — Marine Pollution', code: 'MARPOL', status: 'Compliant', year: '', desc: 'IOPP and IAPP certification for the prevention of pollution from ships.' },
            { name: 'International Load Line Convention 1966', code: 'ILLC 1966', status: 'Compliant', year: '', desc: 'Load line survey and certification ensuring safe freeboard and stability.' },
            { name: 'International Tonnage Convention 1969', code: 'ITC 1969', status: 'Compliant', year: '', desc: 'Tonnage measurement and certification of vessels.' },
          ],
        },
        {
          icon: 'bi-shield-fill-check', title: 'Codes & Standards', color: 'cert-green',
          desc: 'Management and security codes governing safe ship operation.',
          certs: [
            { name: 'International Safety Management (ISM) Code', code: 'ISM Code', status: 'Compliant', year: '', desc: 'Audit and certification of safety management systems for ships and companies.' },
            { name: 'International Ship & Port Facility Security (ISPS) Code', code: 'ISPS Code', status: 'Compliant', year: '', desc: 'Ship and port facility security assessments, plans, and audits.' },
            { name: 'Maritime Labour Convention (MLC) 2006', code: 'MLC 2006', status: 'Compliant', year: '', desc: 'Inspection and certification ensuring decent working and living conditions for seafarers.' },
          ],
        },
      ],
    },
    trust: {
      title: 'Why Our Certifications Matter',
      body: '<p>As Malaysia\'s national premier Classification Society, SCM\'s authority is backed by government authorisation, international recognition, and a certified quality management system. Ship owners, operators, and flag administrations trust SCM to uphold the highest standards of maritime safety.</p><p>Our ISO 9001 certification and R.O. Code compliance ensure that every survey, audit, and certificate we issue meets rigorous, internationally accepted criteria.</p>',
      checks: [
        { text: 'ISO 9001:2015 certified quality management system' },
        { text: 'Compliant with the IMO Recognised Organization (R.O.) Code' },
        { text: 'Authorised by the Government of Malaysia since 1994' },
        { text: 'Surveys aligned with SOLAS, MARPOL, Load Line & Tonnage' },
        { text: 'ISM, ISPS & MLC audit and certification capability' },
        { text: 'Member of the Asian Classification Society (ACS)' },
      ],
    },
    cta: {
      title: 'Need Certified Classification Services?',
      desc: 'Work with a government-authorised, ISO-certified Classification Society. Contact SCM today.',
    },
  },

  'solutions/structured-cabling': {
    hero: {
      tag: 'TIA/EIA Certified', title: 'Structured', titleHighlight: 'Cabling System',
      desc: 'The foundation of every reliable network. ATLINE SDN BHD designs and installs professional structured cabling systems compliant with TIA/EIA-568 and ISO/IEC 11801 international standards.',
      stats: [
        { value: 'TIA/EIA', label: 'Compliant' },
        { value: 'ISO 11801', label: 'Standard' },
        { value: 'Fluke', label: 'Certified Testing' },
        { value: '12M', label: 'Workmanship Warranty' },
      ],
    },
    cables: {
      title: 'Cable Types We Install', subtitle: 'Selecting the right cable type is critical for performance and future-proofing.',
      items: [
        { type: 'Cat5e', speed: '1 Gbps', freq: '100 MHz', use: 'Standard LAN, VoIP', color: '#059652' },
        { type: 'Cat6', speed: '1 Gbps', freq: '250 MHz', use: 'High-performance LAN', color: '#0f7ea8' },
        { type: 'Cat6A', speed: '10 Gbps', freq: '500 MHz', use: '10GbE, PoE++', color: '#37517e' },
        { type: 'OM3/OM4', speed: '100 Gbps', freq: '—', use: 'Fibre backbone, DC', color: '#2c4b8e' },
        { type: 'OS2', speed: '100+ Gbps', freq: '—', use: 'Long-distance, outdoor', color: '#1a2a4a' },
      ],
    },
    process: {
      tag: 'How We Work', title: 'Our Installation Process', subtitle: 'A proven, systematic approach from initial survey to final certification.',
      items: [
        { num: '01', icon: 'bi-search', title: 'Site Survey', desc: 'Comprehensive assessment of your facility, existing infrastructure, and future requirements.' },
        { num: '02', icon: 'bi-diagram-3', title: 'Design & Planning', desc: 'Detailed cabling design, route planning, materials list, and project timeline.' },
        { num: '03', icon: 'bi-box-seam', title: 'Supply & Procurement', desc: 'Quality-assured materials sourced from certified manufacturers at competitive pricing.' },
        { num: '04', icon: 'bi-tools', title: 'Installation', desc: 'Professional installation by certified technicians following TIA/EIA-568 standards.' },
        { num: '05', icon: 'bi-clipboard-data', title: 'Testing & Certification', desc: 'Fluke DSX-8000 cable analyser testing with full pass/fail certification reports.' },
        { num: '06', icon: 'bi-file-earmark-check', title: 'Handover & Documentation', desc: 'As-built drawings, test reports, labelling schedules, and warranty documentation.' },
      ],
    },
    standards: {
      title: 'Standards We Comply With',
      body: 'Every ATLINE cabling installation adheres to internationally recognised standards. Compliance ensures your infrastructure is compatible with any network equipment, interoperable across vendors, and fully warrantied by manufacturers.',
      items: [
        { org: 'TIA', code: 'TIA/EIA-568', title: 'Commercial Building Telecom Cabling Standard' },
        { org: 'ISO', code: 'ISO/IEC 11801', title: 'Generic Cabling for Customer Premises' },
        { org: 'TIA', code: 'TIA-942', title: 'Data Centre Telecommunications Infrastructure' },
        { org: 'SIRIM', code: 'MS IEC 61084', title: 'Cable Trunking & Ducting Systems' },
      ],
      scope: [
        { icon: 'bi-building', title: 'Office Buildings', desc: 'Horizontal cabling, telecoms rooms, floor distribution' },
        { icon: 'bi-mortarboard', title: 'Educational Campuses', desc: 'Multi-building backbone, labs, lecture halls' },
        { icon: 'bi-server', title: 'Data Centres', desc: 'High-density patching, structured cable management' },
        { icon: 'bi-hospital', title: 'Healthcare Facilities', desc: 'Nurse call systems, patient monitoring, LAN' },
        { icon: 'bi-building-gear', title: 'Industrial Facilities', desc: 'Ruggedised cabling, IP cameras, factory LAN' },
        { icon: 'bi-house-door', title: 'Residential Complexes', desc: 'Structured home cabling, CCTV, intercom' },
      ],
    },
    cta: { title: 'Ready to Build Your Cabling Infrastructure?', desc: 'Get a free site survey and quotation from our certified cabling engineers.' },
  },

  'solutions/active-network': {
    hero: {
      tag: 'Cisco · HP · Fortinet · D-Link Partners', title: 'Active Network', titleHighlight: 'Devices',
      desc: 'Intelligent hardware that powers your network. ATLINE SDN BHD certified engineers design, supply, configure and deploy enterprise-grade network devices — ensuring maximum performance, security and reliability.',
      certs: [
        { name: 'Cisco CCNA', sub: 'Routing & Switching' },
        { name: 'Cisco CCNP', sub: 'Enterprise Networking' },
        { name: 'Fortinet NSE', sub: 'Network Security' },
        { name: 'HP/Aruba', sub: 'Certified Partner' },
      ],
    },
    devices: {
      items: [
        { icon: 'bi-diagram-2-fill', name: 'Network Switches', brands: 'Cisco Catalyst, HP Aruba, D-Link, Ruijie', specs: 'Layer 2 & Layer 3 managed, PoE/PoE+ support, VLAN & QoS config, 1G to 10G uplinks', color: 'and-blue' },
        { icon: 'bi-arrow-left-right', name: 'Routers & WAN', brands: 'Cisco ISR, MikroTik, Fortigate, pfSense', specs: 'SD-WAN ready, Dual WAN failover, VPN (IPsec/SSL), BGP/OSPF routing', color: 'and-teal' },
        { icon: 'bi-shield-lock-fill', name: 'Firewalls & UTM', brands: 'Fortinet FortiGate, Cisco ASA, Sophos, Palo Alto', specs: 'NGFW & IPS/IDS, Application control, SSL deep inspection, Centralised mgmt', color: 'and-navy' },
        { icon: 'bi-wifi', name: 'Wireless Access Points', brands: 'Cisco Meraki, HP Aruba, Ubiquiti, D-Link', specs: 'Wi-Fi 5 & Wi-Fi 6, Controller-based/cloud, Guest network isolation, RF site survey', color: 'and-blue' },
        { icon: 'bi-hdd-rack', name: 'Network Controllers', brands: 'Aruba Central, Cisco DNA, FortiManager, Unifi', specs: 'Centralised management, Network access control, Policy-based mgmt, Real-time analytics', color: 'and-teal' },
        { icon: 'bi-camera-video-fill', name: 'IP Surveillance NVR', brands: 'Hikvision, Dahua, Uniview, Axis', specs: 'POE camera support, H.265+ compression, Remote monitoring, RAID storage', color: 'and-navy' },
      ],
    },
    approach: {
      title: 'End-to-End Network Device Services',
      body: "<p>ATLINE SDN BHD doesn't just supply boxes. Our certified engineers handle every stage of your network device lifecycle — from initial requirements assessment and architecture design to physical installation, hardened configuration, and ongoing support.</p><p>We follow vendor best-practice configuration guides and industry security hardening frameworks, ensuring your devices are not just functional — but optimised and protected from day one.</p>",
      points: [
        { text: 'Network topology design and documentation' },
        { text: 'Vendor-certified configuration and testing' },
        { text: 'Security hardening and vulnerability assessment' },
        { text: 'Staff training and knowledge transfer' },
        { text: 'Ongoing support via helpdesk.atline.com.my' },
      ],
    },
    cta: { title: 'Need Expert Network Device Deployment?', desc: 'Our certified engineers are ready to design and deploy your network infrastructure.' },
  },

  'solutions/network-peripherals': {
    hero: {
      tag: 'Solutions · Network Infrastructure', title: 'Network', titleHighlight: 'Peripherals',
      desc: 'The supporting components that make every network installation complete, organised, and maintainable. From racks and patch panels to PDUs and cabling tools — quality-assured and professionally supplied by ATLINE SDN BHD.',
    },
    categories: {
      tag: 'Product Range', title: 'Everything You Need', subtitle: 'A complete range of network peripherals for professional installations.',
      items: [
        { icon: 'bi-server', title: 'Racks & Cabinets', items: [
          { name: '19" Open Frame Rack', desc: '6U to 42U, adjustable depth, with cable management' },
          { name: 'Enclosed Network Cabinet', desc: 'Lockable, glass door, with fan and PDU slots' },
          { name: 'Wall Mount Cabinet', desc: '6U–12U, ideal for small telecoms rooms' },
          { name: 'Portable Rack', desc: 'Foldable, lightweight for temporary deployments' },
        ] },
        { icon: 'bi-grid-3x3', title: 'Patch Panels', items: [
          { name: 'Cat6A 24-port Patch Panel', desc: '1U, tool-less termination, angled or flat' },
          { name: 'Fibre LC Patch Panel', desc: '24-port, loaded or unloaded, SC/LC options' },
          { name: 'Cat5e 48-port Panel', desc: '2U, 568A/B wiring, numbered ports' },
          { name: 'Blanking Panels', desc: '1U steel blanking for unused rack spaces' },
        ] },
        { icon: 'bi-plug', title: 'Patch Cables', items: [
          { name: 'Cat6 Patch Leads', desc: '0.5m to 10m, multiple colours, snagless boot' },
          { name: 'Fibre Patch Cords', desc: 'LC-LC, SC-SC, LC-SC, 1m to 10m' },
          { name: 'Crossover Cables', desc: 'For direct device-to-device connections' },
          { name: 'Colour Coding Kits', desc: 'VLAN identification with coloured boots/cables' },
        ] },
        { icon: 'bi-lightning-charge', title: 'Power Distribution Units', items: [
          { name: 'Basic Rack PDU', desc: '8–16 outlets, 13A or 16A, 1U horizontal mount' },
          { name: 'Metered PDU', desc: 'Per-outlet metering, LCD display, remote monitoring' },
          { name: 'Switched PDU', desc: 'Individual outlet switching, web/SNMP management' },
          { name: 'Vertical PDU (0U)', desc: 'Space-saving side-mount, up to 24 outlets' },
        ] },
        { icon: 'bi-tools', title: 'Cabling Tools', items: [
          { name: 'Punch Down Tool', desc: 'Impact type, dual-blade 66/110, with bits' },
          { name: 'Cable Stripper', desc: 'For Cat5e/Cat6/Cat6A coaxial cables' },
          { name: 'RJ45 Crimper', desc: 'Ratchet crimper with built-in cutter and stripper' },
          { name: 'Cable Tester', desc: 'Network cable continuity and wire map tester' },
        ] },
        { icon: 'bi-wind', title: 'Cooling & Airflow', items: [
          { name: 'Rack Fan Unit', desc: '1U/2U rackmount, thermostat-controlled speed' },
          { name: 'Blanking Panels', desc: 'Steel/plastic, 1U–4U to prevent airflow bypass' },
          { name: 'Vented Cable Tray', desc: 'Improves hot/cold aisle separation' },
          { name: 'Temperature Sensor', desc: 'SNMP-enabled, alert on threshold breach' },
        ] },
      ],
    },
    why: {
      title: 'Why Source from ATLINE?',
      desc: 'One-stop supply for all your network peripherals with quality assurance, competitive pricing, and complete project support.',
      items: [
        { icon: 'bi-award', title: 'Genuine Products Only', desc: 'Sourced from authorised distributors. No grey market or counterfeit equipment.' },
        { icon: 'bi-tag-fill', title: 'Competitive Pricing', desc: 'Volume procurement advantages passed on to clients — especially for project supplies.' },
        { icon: 'bi-box-seam', title: 'Complete Package Supply', desc: 'We supply full peripheral packages — no partial orders or missing components.' },
        { icon: 'bi-truck', title: 'Site Delivery', desc: 'Delivery directly to your project site across Malaysia, on time.' },
        { icon: 'bi-shield-check', title: 'Warranty Managed', desc: 'Manufacturer warranty registration and management handled on your behalf.' },
        { icon: 'bi-headset', title: 'Technical Guidance', desc: 'Our engineers help you select the right products for your specific requirements.' },
      ],
    },
    cta: { title: 'Need Network Peripherals for Your Project?', desc: "Send us your requirements or bill of materials — we'll provide a competitive quotation." },
  },

  'solutions/ict-products': {
    hero: {
      badge: 'Complete ICT Procurement', title: 'ICT Products', titleHighlight: 'Peripherals',
      desc: 'From workstations to servers, printers to displays — ATLINE SDN BHD provides end-to-end ICT product procurement, delivery, installation, and support. Your one-stop ICT partner in Malaysia.',
      brands: 'Lenovo, HP, Dell, Asus, Acer, Apple, Samsung, Canon, Epson, Logitech, Brother, Cisco',
      stats: [
        { v: '6', l: 'Product Categories' },
        { v: '12+', l: 'Brand Partners' },
        { v: '100%', l: 'Genuine Products' },
        { v: '50+', l: 'Clients Supplied' },
      ],
    },
    products: {
      tag: 'What We Supply', title: 'Our Product Range', subtitle: 'Comprehensive ICT products for all organisational needs — sourced, delivered, and installed by ATLINE.',
      items: [
        { icon: 'bi-laptop', title: 'Computers & Laptops', desc: 'Business desktops, all-in-ones, and laptops for every user profile.', brands: 'Lenovo · HP · Dell · Asus · Acer' },
        { icon: 'bi-hdd-rack', title: 'Servers & Storage', desc: 'Tower, rack-mount servers and NAS/DAS storage for business applications.', brands: 'HP ProLiant · Dell PowerEdge · Synology' },
        { icon: 'bi-printer', title: 'Printers & MFP', desc: 'Laser and inkjet printers, multifunction devices for document-heavy environments.', brands: 'Canon · Epson · HP · Brother · Konica' },
        { icon: 'bi-display', title: 'Monitors & Displays', desc: 'Professional monitors, smart boards, and large-format displays.', brands: 'Samsung · LG · Dell · ViewSonic · BenQ' },
        { icon: 'bi-keyboard', title: 'Peripherals & Accessories', desc: 'Keyboards, mice, headsets, webcams, UPS, and docking stations.', brands: 'Logitech · HP · Microsoft · APC · Belkin' },
        { icon: 'bi-phone', title: 'IP Phones & UC', desc: 'VoIP desk phones, conference speakerphones, and IP PABX systems.', brands: 'Cisco · Yealink · Poly · Grandstream' },
      ],
    },
    process: {
      tag: 'How It Works', title: 'Our Procurement Process',
      items: [
        { num: '01', icon: 'bi-clipboard-check', title: 'Requirements', desc: 'We review specs, budget, and user needs to shortlist suitable products.' },
        { num: '02', icon: 'bi-tag', title: 'Quotation', desc: 'Detailed quote with multiple options and total cost of ownership analysis.' },
        { num: '03', icon: 'bi-box-seam', title: 'Procurement', desc: 'Purchase from authorised channels — genuine products with warranties.' },
        { num: '04', icon: 'bi-truck', title: 'Delivery & Setup', desc: 'Delivery, installation, configuration, and user handover.' },
      ],
    },
    cta: { title: 'Ready to Refresh Your ICT Equipment?', desc: "Send us your requirements — we'll prepare a comprehensive procurement proposal." },
  },

  'services/consulting': {
    hero: {
      badge: 'Independent ICT Consultants', title: 'Strategic ICT', titleAccent: 'Consulting', titleSub: 'Services',
      desc: "Make confident technology decisions. ATLINE SDN BHD's certified consultants deliver independent analysis, strategic planning and actionable recommendations that align every ICT investment with your organisational goals.",
      pills: 'Infrastructure Assessment, Network Architecture, Security Advisory, Technology Roadmap',
    },
    areas: {
      tag: 'What We Offer', title: 'Our Consulting Areas', subtitle: "End-to-end ICT consulting tailored to your organisation's size, sector and strategic ambitions.",
      items: [
        { icon: 'bi-search', title: 'Infrastructure Assessment', desc: 'Comprehensive evaluation of your existing ICT environment — identifying gaps, risks and optimisation opportunities through detailed site audits.' },
        { icon: 'bi-diagram-3', title: 'Network Architecture Design', desc: 'Custom topology and architecture engineered to scale with your business, ensuring compatibility with future technology demands and vendor ecosystems.' },
        { icon: 'bi-shield-check', title: 'Security Consulting', desc: 'Risk analysis, security policy development, vulnerability assessment and remediation planning to safeguard your critical digital infrastructure.' },
        { icon: 'bi-cloud-upload', title: 'Digital Transformation', desc: 'Strategic roadmap for modernising your ICT stack — cloud-migration planning, hybrid-infrastructure design and cost-efficiency modelling.' },
        { icon: 'bi-graph-up-arrow', title: 'Technology Roadmapping', desc: "Multi-year, budget-aligned technology plans that synchronise ICT investments with your organisation's operational and strategic objectives." },
        { icon: 'bi-people', title: 'Vendor Advisory', desc: 'Independent, vendor-neutral selection support — RFP preparation, technical scoring, shortlisting and contract negotiation assistance.' },
      ],
    },
    methodology: {
      tag: 'Our Process', title: 'The ATLINE Consulting Methodology', subtitle: 'A structured, transparent process that delivers clear outcomes at every phase.',
      items: [
        { num: '01', icon: 'bi-binoculars', title: 'Discover', desc: 'Stakeholder interviews, site walk-throughs, system audits and requirements-gathering workshops.' },
        { num: '02', icon: 'bi-lightbulb', title: 'Analyse', desc: 'Gap analysis, risk mapping, benchmarking against Malaysian and international standards, priority scoring.' },
        { num: '03', icon: 'bi-map', title: 'Recommend', desc: 'Detailed strategy report with costed options, implementation roadmap and projected ROI metrics.' },
        { num: '04', icon: 'bi-rocket-takeoff', title: 'Support', desc: 'Advisory oversight during execution, milestone reviews, change management and post-implementation evaluation.' },
      ],
    },
    industries: {
      title: "Trusted Across Malaysia's Key Industries",
      body: "From government ministries and public institutions to private enterprises, ATLINE has delivered consulting engagements across Malaysia's critical sectors since our inception.",
      items: [
        { icon: 'bi-bank2', label: 'Government Agencies' },
        { icon: 'bi-mortarboard', label: 'Politeknik & Kolej Komuniti' },
        { icon: 'bi-hospital', label: 'Healthcare Facilities' },
        { icon: 'bi-building', label: 'Corporate Enterprises' },
        { icon: 'bi-building-gear', label: 'Manufacturing & Industrial' },
        { icon: 'bi-house-door', label: 'Property & Real Estate' },
      ],
    },
    why: {
      title: 'What Sets Our Consulting Apart',
      items: [
        { icon: 'bi-patch-check-fill', title: 'Vendor-Neutral Advice', desc: 'We hold no vendor agreements that bias our recommendations — our advice is purely in your interest.' },
        { icon: 'bi-clock-history', title: '100+ Years Combined Experience', desc: 'Deep domain knowledge spanning government and private sector ICT projects across Malaysia.' },
        { icon: 'bi-file-earmark-check', title: 'Deliverable-Led Engagements', desc: 'Every project ends with clear, documented outputs — reports, roadmaps and actionable plans, not just slides.' },
      ],
    },
    cta: { title: 'Ready for Expert ICT Guidance?', desc: 'Book a no-obligation session with our senior ICT consultants today.' },
  },

  'services/network-engineering': {
    hero: {
      status: 'ATLINE NETWORK ENGINEERING DIVISION — OPERATIONAL', title: 'Network', titleAccent: 'Engineering', titleSub: 'Services',
      desc: "Design. Deploy. Optimise. ATLINE SDN BHD's certified network engineers build resilient, high-performance network infrastructure for Malaysia's government institutions and private enterprises — on time and to specification.",
      certs: 'CCNA, CCNP, NSE4, Aruba CX',
    },
    capabilities: {
      tag: 'What We Do', title: 'Engineering Capabilities', subtitle: 'Full-spectrum network engineering from greenfield builds to complex upgrades and migrations.',
      items: [
        { icon: 'bi-diagram-3-fill', title: 'Network Design & Architecture', desc: 'End-to-end logical and physical network design — from LAN/WAN topology to VLAN segmentation, QoS policies and redundancy planning.', tag: 'Core' },
        { icon: 'bi-tools', title: 'Installation & Deployment', desc: 'Physical rack-and-stack, cabling management, device mounting, patch-panel organisation and full site readiness verification.', tag: 'Core' },
        { icon: 'bi-gear-wide-connected', title: 'Configuration & Optimisation', desc: 'Vendor-certified configuration of switches, routers, firewalls and APs; performance tuning; VLAN, QoS, STP and routing protocol setup.', tag: 'Core' },
        { icon: 'bi-wifi', title: 'Wireless Network (WLAN)', desc: 'RF site surveys, channel planning, access-point placement and controller-based management for seamless enterprise Wi-Fi 5/6 coverage.', tag: 'Specialist' },
        { icon: 'bi-shield-lock', title: 'Network Security Hardening', desc: 'Security baseline review, NGFW policy configuration, access-control lists, port security, 802.1X NAC and penetration test support.', tag: 'Specialist' },
        { icon: 'bi-cloud-check', title: 'SD-WAN & VPN Solutions', desc: 'SD-WAN deployment, site-to-site IPSec/SSL VPN configuration and hybrid cloud connectivity — enabling secure, resilient multi-site networks.', tag: 'Advanced' },
      ],
    },
    technologies: {
      title: 'Platforms & Technologies We Work With',
      items: [
        { label: 'Cisco IOS / NX-OS', cat: 'Routing & Switching' },
        { label: 'HP / Aruba CX', cat: 'Routing & Switching' },
        { label: 'MikroTik RouterOS', cat: 'Routing & Switching' },
        { label: 'FortiGate NGFW', cat: 'Security' },
        { label: 'Cisco ASA / FTD', cat: 'Security' },
        { label: 'Palo Alto PAN-OS', cat: 'Security' },
        { label: 'Cisco Meraki', cat: 'Cloud Managed' },
        { label: 'Ubiquiti UniFi', cat: 'Cloud Managed' },
        { label: 'Fortinet FortiManager', cat: 'Cloud Managed' },
        { label: 'OSPF / BGP / EIGRP', cat: 'Protocols' },
        { label: 'VLAN / 802.1Q', cat: 'Protocols' },
        { label: 'IPSec / SSL VPN', cat: 'Protocols' },
      ],
    },
    deliverables: {
      title: 'Project Deliverables',
      body: 'Every ATLINE network engineering engagement concludes with comprehensive documentation — so your team has a complete record for operations, audits and future upgrades.',
      items: [
        { icon: 'bi-file-earmark-ruled', label: 'Network Topology Diagrams (Visio/draw.io)' },
        { icon: 'bi-file-earmark-text', label: 'IP Address Management (IPAM) Documentation' },
        { icon: 'bi-file-earmark-code', label: 'Device Configuration Backups' },
        { icon: 'bi-clipboard2-pulse', label: 'Acceptance Test Plans & Sign-Off Reports' },
        { icon: 'bi-file-earmark-check', label: 'As-Built Network Documentation' },
        { icon: 'bi-journal-text', label: 'Operations & Maintenance Runbooks' },
      ],
    },
    cta: { title: 'Need Certified Network Engineers?', desc: 'Our team is ready to design, build and support your network infrastructure.' },
  },

  'services/project-management': {
    hero: {
      badge: 'PMBOK · PRINCE2 · Agile', title: 'ICT Project', titleAccent: 'Management', titleSub: 'Done Right',
      desc: 'Delivering complex ICT projects on time and within budget requires more than technical skills — it demands structured governance, proactive risk management and crystal-clear communication. ATLINE SDN BHD provides certified project management across the full ICT project lifecycle.',
    },
    metrics: {
      items: [
        { value: '98%', label: 'On-Time Delivery Rate' },
        { value: '100%', label: 'Within Budget Projects' },
        { value: '50+', label: 'Projects Delivered' },
        { value: '12+', label: 'Years Experience' },
      ],
    },
    phases: {
      tag: 'Our Framework', title: 'Project Lifecycle Phases', subtitle: 'A structured three-phase approach that ensures every project is delivered with full governance.',
      items: [
        { id: 'P1', icon: 'bi-clipboard2-check', title: 'Initiation & Planning', color: 'pm-blue', items: 'Project charter definition, Stakeholder identification, Scope of work finalisation, Risk register preparation, Resource & budget planning' },
        { id: 'P2', icon: 'bi-kanban', title: 'Execution & Monitoring', color: 'pm-teal', items: 'Team deployment & coordination, Daily/weekly progress tracking, Issue & change management, Quality assurance checkpoints, Stakeholder communication' },
        { id: 'P3', icon: 'bi-patch-check', title: 'Delivery & Closure', color: 'pm-orange', items: 'Acceptance testing (UAT), As-built documentation, Staff handover & training, Lessons-learned review, Post-implementation support' },
      ],
    },
    services: {
      tag: 'Our Services', title: 'What We Manage For You', subtitle: 'Comprehensive project management services covering every dimension of your ICT project.',
      items: [
        { icon: 'bi-calendar-range', title: 'Scope & Timeline Management', desc: 'Detailed work-breakdown structure, Gantt scheduling, critical-path analysis and proactive milestone tracking to keep projects on track.' },
        { icon: 'bi-currency-exchange', title: 'Budget Control & Reporting', desc: 'Cost-baseline setting, variance analysis, procurement oversight and transparent reporting to stakeholders throughout the project lifecycle.' },
        { icon: 'bi-people-fill', title: 'Stakeholder Engagement', desc: 'Structured RACI matrices, communication plans, executive briefings and client-facing dashboards that keep everyone aligned and informed.' },
        { icon: 'bi-exclamation-triangle', title: 'Risk & Issue Management', desc: 'Proactive risk identification, probability-impact scoring, mitigation planning and issue escalation frameworks to protect project success.' },
        { icon: 'bi-award', title: 'Quality Assurance', desc: 'Inspection checklists, test-acceptance criteria, standards compliance reviews and corrective-action management at every stage.' },
        { icon: 'bi-shield-check', title: 'Compliance & Governance', desc: 'Alignment with government procurement regulations, ICT security policies, MAMPU guidelines and client-specific governance frameworks.' },
      ],
    },
    frameworks: {
      items: [
        { name: 'PMBOK', sub: 'Project Management Body of Knowledge' },
        { name: 'PRINCE2', sub: 'Projects in Controlled Environments' },
        { name: 'Agile / Scrum', sub: 'Iterative delivery methodology' },
        { name: 'ITIL v4', sub: 'IT service management alignment' },
      ],
    },
    cta: { title: 'Have an ICT Project That Needs Delivery?', desc: 'Our certified project managers are ready to take the wheel — from kickoff to handover.' },
  },

  'services/training': {
    hero: {
      badge: 'Certificate of Completion Provided', title: 'ICT Training', titleAccent: '& Workshop', titleSub: 'Programs',
      desc: "Build practical, job-ready ICT skills. ATLINE SDN BHD's hands-on training programs are designed by practising engineers — grounded in real-world scenarios, aligned to international standards and delivered at your pace.",
    },
    stats: {
      items: [
        { value: '500+', label: 'Professionals Trained' },
        { value: '20+', label: 'Training Programs' },
        { value: '95%', label: 'Participant Satisfaction' },
        { value: '10+', label: 'Corporate Clients' },
      ],
    },
    programs: {
      tag: 'Our Curriculum', title: 'Training Programs', subtitle: 'Practical, certification-aligned programs for every level of ICT professional.',
      items: [
        { icon: 'bi-ethernet', level: 'Foundational', levelColor: 'tr-green', title: 'Network Fundamentals', duration: '2 Days', audience: 'IT Support, Technicians', topics: 'OSI & TCP/IP model, IP addressing & subnetting, LAN/WAN concepts, Basic switch & router config, Troubleshooting methodology' },
        { icon: 'bi-diagram-2', level: 'Intermediate', levelColor: 'tr-blue', title: 'Structured Cabling Practices', duration: '3 Days', audience: 'Field Engineers, Technicians', topics: 'TIA/EIA-568 standards, Copper & fibre cabling, Termination techniques, Cable testing & certification, Documentation & labelling' },
        { icon: 'bi-shield-lock', level: 'Intermediate', levelColor: 'tr-blue', title: 'Network Security Essentials', duration: '2 Days', audience: 'Network/IT Administrators', topics: 'Firewall policies & ACLs, VLAN-based segmentation, 802.1X port authentication, VPN configuration basics, Security incident response' },
        { icon: 'bi-tools', level: 'Advanced', levelColor: 'tr-purple', title: 'Network Troubleshooting', duration: '2 Days', audience: 'Senior Engineers, Admins', topics: 'Systematic fault isolation, Protocol analysis with Wireshark, Layer 1–7 diagnostics, Wireless interference analysis, High-availability scenarios' },
        { icon: 'bi-building-gear', level: 'Advanced', levelColor: 'tr-purple', title: 'Data Centre Networking', duration: '3 Days', audience: 'DC Engineers, Architects', topics: 'Spine-leaf topology, High-density cabling management, Power & cooling best practices, Redundancy & failover design, Monitoring & alerting tools' },
        { icon: 'bi-gear-wide-connected', level: 'Custom', levelColor: 'tr-gold', title: 'Custom Bespoke Workshops', duration: 'Flexible', audience: 'All Levels', topics: 'Tailored to your technology stack, Organisation-specific scenarios, Vendor equipment hands-on, Pre/post-assessment included, Certificate of completion' },
      ],
    },
    formats: {
      items: [
        { icon: 'bi-building2', title: 'On-Site Training', desc: 'We come to your facility — using your own equipment and real-world network environment for maximum relevance and immediate application.' },
        { icon: 'bi-pc-display-horizontal', title: 'Classroom Instructor-Led', desc: 'Structured training at our or your designated classroom venue, with dedicated lab stations and structured curriculum materials.' },
        { icon: 'bi-camera-video', title: 'Virtual Live Sessions', desc: 'Live instructor-led training via video conference with virtual lab access — ideal for multi-location teams and remote staff.' },
        { icon: 'bi-people-fill', title: 'Group Workshops', desc: 'Team-based hands-on workshops focused on solving real operational challenges in a collaborative, problem-solving format.' },
      ],
    },
    roles: {
      title: 'Ideal For These Roles',
      body: "Our training programs are designed for professionals who work with or around ICT infrastructure — whether you're just starting out or looking to deepen specialist skills.",
      items: [
        { icon: 'bi-person-gear', label: 'IT Administrators' },
        { icon: 'bi-tools', label: 'Field & Site Engineers' },
        { icon: 'bi-headset', label: 'IT Helpdesk & Support' },
        { icon: 'bi-diagram-3', label: 'Network Technicians' },
        { icon: 'bi-building2', label: 'Facilities Managers' },
        { icon: 'bi-mortarboard', label: 'Politeknik / TVET Students' },
      ],
    },
    cta: { title: 'Ready to Upskill Your Team?', desc: "Contact us to discuss a training program tailored to your organisation's needs." },
  },

  'business/tender': {
    hero: {
      badge: '3 Active Tenders — Open for Submission', title: 'Tender', titleAccent: 'Opportunities', titleSub: 'Portal',
      desc: 'ATLINE SDN BHD publishes ICT infrastructure tender invitations for government institutions and private sector clients across Malaysia. Qualified companies are invited to submit competitive bids for works across all ICT categories.',
      stats: [
        { value: '3', label: 'Open Tenders' },
        { value: 'RM 1M+', label: 'Total Value' },
        { value: '6', label: 'Categories' },
        { value: '50+', label: 'Past Awards' },
      ],
    },
    tenders: {
      tag: 'Current Listings', title: 'Active Tender Opportunities', subtitle: 'Review open and upcoming tender invitations. Download tender documents and submit your bid before the closing date.',
    },
    categories: {
      items: [
        { icon: 'bi-ethernet', label: 'Network Infrastructure', count: '12 tenders' },
        { icon: 'bi-pc-display', label: 'ICT Equipment Supply', count: '8 tenders' },
        { icon: 'bi-hdd-rack', label: 'Active Network Devices', count: '6 tenders' },
        { icon: 'bi-tools', label: 'Maintenance & Support', count: '9 tenders' },
        { icon: 'bi-camera-video', label: 'Surveillance Systems', count: '5 tenders' },
        { icon: 'bi-building-gear', label: 'Data Centre Solutions', count: '4 tenders' },
      ],
    },
    howto: {
      items: [
        { num: '01', icon: 'bi-search', title: 'Identify Tender', desc: "Browse active tender listings and identify opportunities matching your company's capabilities and registration categories." },
        { num: '02', icon: 'bi-download', title: 'Download Documents', desc: 'Download the complete tender document package including BOQ, specifications, terms and conditions from the tender reference page.' },
        { num: '03', icon: 'bi-file-earmark-text', title: 'Prepare Submission', desc: 'Prepare your technical and financial proposal according to the tender requirements. Ensure all mandatory documents are included.' },
        { num: '04', icon: 'bi-send-check', title: 'Submit Bid', desc: 'Submit your completed tender via the designated method (online portal or physical submission) before the stated closing date.' },
      ],
    },
    eligibility: {
      criteria: [
        { icon: 'bi-building', text: 'Valid SSM / ROB / ROC company registration' },
        { icon: 'bi-file-earmark-check', text: 'MOF registration (for government tenders)' },
        { icon: 'bi-shield-check', text: 'Relevant CIDB grade (where applicable)' },
        { icon: 'bi-award', text: 'Proven track record in ICT infrastructure works' },
        { icon: 'bi-people', text: 'Minimum workforce capability per tender scope' },
        { icon: 'bi-bank', text: 'Financial capacity evidenced by bank statements' },
      ],
      faqs: [
        { q: 'How do I get notified of new tenders?', a: 'Register as an ATLINE approved supplier through our Procurement portal. Registered suppliers receive direct email notifications for all new tender invitations matching their service categories.' },
        { q: 'Is there a tender deposit or participation fee?', a: 'Selected tenders may require a tender document fee or performance bond. All requirements are detailed in the individual tender document. Most routine tenders carry no participation fee.' },
        { q: 'Can foreign companies participate?', a: 'Government-related tenders are open to Malaysian-registered companies only, in compliance with MAMPU and MOF guidelines. Private sector tenders may accept foreign entities — refer to individual tender conditions.' },
        { q: 'What is the typical evaluation period?', a: 'Evaluation typically takes 4–8 weeks after tender closing date, depending on complexity. Shortlisted bidders will be contacted for clarification or presentation if required.' },
      ],
    },
    cta: { title: 'Want to Be Notified of New Tenders?', desc: 'Register as an approved supplier and receive direct tender invitations matching your category.' },
  },

  'business/procurement': {
    hero: {
      badge: 'Approved Vendor Portal — Open for Registration',
      title: 'Supplier &', titleAccent: 'Procurement', titleSub: 'Portal',
      desc: 'ATLINE SDN BHD invites qualified companies to register as approved suppliers. Join our Approved Vendor List (AVL) to receive direct RFQs, tender invitations and purchase orders for ICT infrastructure procurement across Malaysia.',
      stats: [
        { value: '50+', label: 'Active Suppliers' },
        { value: 'RM 5M+', label: 'Annual Procurement' },
        { value: '6', label: 'Categories' },
      ],
    },
    categories: {
      tag: 'What We Procure', title: 'Procurement Categories', subtitle: 'ATLINE actively sources suppliers across these ICT infrastructure categories.',
      items: [
        { icon: 'bi-ethernet', title: 'Network Infrastructure', desc: 'Structured cabling, fibre optic, copper, patch panels and trunking systems.' },
        { icon: 'bi-hdd-rack', title: 'Active Network Devices', desc: 'Switches, routers, firewalls, access points and network controllers.' },
        { icon: 'bi-pc-display', title: 'ICT Hardware & Equipment', desc: 'Computers, laptops, servers, storage systems and peripheral devices.' },
        { icon: 'bi-camera-video', title: 'IP Surveillance Systems', desc: 'IP cameras, NVRs, DVRs, access control and intercom systems.' },
        { icon: 'bi-tools', title: 'Installation Materials', desc: 'Cable trays, conduits, racks, cabinets and supporting hardware.' },
        { icon: 'bi-box-seam', title: 'General ICT Supplies', desc: 'Consumables, accessories, connectors, tools and miscellaneous ICT items.' },
      ],
    },
    process: {
      tag: 'Supplier Journey', title: 'How the Registration Process Works', subtitle: 'A streamlined four-step process from registration to receiving your first purchase order.',
      ctaText: 'Ready to start? Registration takes approximately 10–15 minutes.',
      items: [
        { num: '01', icon: 'bi-person-plus', title: 'Register as Supplier', desc: 'Complete the online Supplier Registration Form with your company details, compliance documents and service categories.' },
        { num: '02', icon: 'bi-file-earmark-check', title: 'Application Review', desc: 'Our procurement team evaluates your submission for completeness, compliance status and capability alignment.' },
        { num: '03', icon: 'bi-patch-check', title: 'Approval & On-boarding', desc: 'Approved suppliers receive a welcome notice and are added to the ATLINE Approved Vendor List (AVL).' },
        { num: '04', icon: 'bi-send-check', title: 'Receive RFQs & POs', desc: 'Approved vendors are invited to quote for relevant procurement exercises and awarded purchase orders directly.' },
      ],
    },
    requirements: {
      tag: 'What You Need', title: 'Registration Requirements', desc: 'Ensure you have the following documents and information ready before you begin your supplier registration.',
      items: [
        { icon: 'bi-building', label: 'Valid SSM / ROB / ROC registration' },
        { icon: 'bi-file-earmark-ruled', label: 'Company profile and business overview' },
        { icon: 'bi-shield-check', label: 'MOF / CIDB certification (where applicable)' },
        { icon: 'bi-bank', label: 'Bank account details for payment processing' },
        { icon: 'bi-person-badge', label: 'Director / proprietor identification details' },
        { icon: 'bi-graph-up-arrow', label: 'Latest financial statements or bank statement' },
      ],
    },
    benefits: {
      tag: 'Why Register', title: 'Benefits of Being an ATLINE Supplier',
      items: [
        { icon: 'bi-megaphone', title: 'Direct Procurement Access', desc: "Receive RFQs and tender invitations directly from ATLINE's procurement team for matching categories." },
        { icon: 'bi-clock-history', title: 'Timely Payment Terms', desc: 'Structured payment milestones and clear terms ensure timely settlement upon delivery and acceptance.' },
        { icon: 'bi-handshake', title: 'Long-term Partnership', desc: 'Build a sustained business relationship with ATLINE through repeat engagements and framework agreements.' },
        { icon: 'bi-graph-up', title: 'Business Growth Opportunity', desc: "Access government and private sector projects through ATLINE's established project pipeline across Malaysia." },
      ],
    },
    cta: { title: 'Ready to Join Our Supplier Network?', desc: 'Register today and start receiving procurement opportunities from ATLINE SDN BHD.' },
  },

  'business/strategic-partners': {
    hero: {
      badge: 'Partner Programme — Now Open',
      title: 'Strategic', titleAccent: 'Partnership', titleSub: 'Programme',
      desc: "Build a growth-driven alliance with ATLINE SDN BHD. Our structured partner programme connects technology vendors, system integrators and channel partners with Malaysia's government and enterprise ICT project opportunities.",
      stats: [
        { value: '15+', label: 'Technology Partners' },
        { value: '4', label: 'Partner Tiers' },
        { value: '6', label: 'Partnership Types' },
      ],
    },
    tiers: {
      tag: 'Partner Levels', title: 'Partnership Tiers', subtitle: 'Four structured tiers designed to reward commitment, performance and strategic alignment.',
      items: [
        { level: 'Platinum', icon: 'bi-gem', color: 'sp-plat', tagline: 'Elite Strategic Alliance', revenue: 'RM 2M+', benefits: 'Dedicated account manager\nCo-branding & co-marketing rights\nPriority project referrals\nJoint proposal & bid preparation\nExecutive-level business reviews\nAccess to all ATLINE resources\nExclusive early-access opportunities' },
        { level: 'Gold', icon: 'bi-award-fill', color: 'sp-gold', tagline: 'Preferred Business Partner', revenue: 'RM 500K+', benefits: 'Named partner account manager\nCo-branded marketing materials\nRegular project referrals\nJoint tender submissions\nQuarterly business reviews\nPartner training & certification\nPriority listing on partner directory' },
        { level: 'Silver', icon: 'bi-shield-star', color: 'sp-silv', tagline: 'Certified Business Partner', revenue: 'RM 100K+', benefits: 'Partner portal access\nATLINE partner badge & branding\nProject collaboration opportunities\nAnnual partner review\nMarketing support materials\nTechnical resource access\nPartner event invitations' },
        { level: 'Associate', icon: 'bi-person-check-fill', color: 'sp-assoc', tagline: 'Entry-Level Alliance', revenue: 'New / Growing', benefits: 'Listed on ATLINE partner directory\nPartner welcome kit\nAccess to partner news & updates\nReferral programme eligibility\nAnnual partnership review\nPathway to Silver tier' },
      ],
    },
    types: {
      tag: 'Who Can Partner', title: 'Partnership Types', subtitle: 'We welcome partnerships across multiple collaboration models.',
      items: [
        { icon: 'bi-cpu', title: 'Technology Partners', desc: "OEM vendors, hardware/software manufacturers and technology innovators whose products power ATLINE's infrastructure solutions." },
        { icon: 'bi-gear-wide-connected', title: 'System Integrators', desc: 'Certified integrators with complementary technical expertise who collaborate on end-to-end ICT infrastructure project delivery.' },
        { icon: 'bi-shop', title: 'Channel & Resellers', desc: "Authorised resellers and channel partners who extend ATLINE's product and solution reach across Malaysia's government and private sectors." },
        { icon: 'bi-diagram-2', title: 'Joint Venture', desc: 'Formal joint ventures established to pursue large-scale or complex ICT infrastructure opportunities requiring combined expertise and capital.' },
        { icon: 'bi-building-gear', title: 'Subcontractors', desc: 'Specialised technical contractors who execute defined scopes of work within ATLINE-led projects under formal subcontract agreements.' },
        { icon: 'bi-mortarboard', title: 'Training Partners', desc: 'Academic institutions, training bodies and certification centres who collaborate on skills development programmes for ICT professionals.' },
      ],
    },
    benefits: {
      tag: 'Why Partner With Us', title: 'Partnership Benefits', subtitle: 'What you gain when you partner with ATLINE SDN BHD.',
      items: [
        { icon: 'bi-graph-up-arrow', title: 'Revenue Growth', desc: "Tap into ATLINE's established government and enterprise project pipeline to accelerate your revenue growth." },
        { icon: 'bi-megaphone', title: 'Market Visibility', desc: "Co-branding, joint marketing initiatives and listing on ATLINE's partner directory to elevate your brand presence." },
        { icon: 'bi-people-fill', title: 'Shared Expertise', desc: "Leverage ATLINE's 100+ years of combined ICT engineering experience to strengthen your technical delivery capability." },
        { icon: 'bi-hand-index-thumb', title: 'Priority Referrals', desc: 'Receive direct business referrals and tender invitations for opportunities that align with your capabilities.' },
      ],
    },
    partners: {
      tag: 'Our Network', title: 'Technology Partners', subtitle: 'Trusted brands we work with to deliver world-class ICT infrastructure.',
      items: [
        { name: 'Cisco Systems', cat: 'Technology', icon: 'bi-hdd-network-fill', tier: 'Platinum' },
        { name: 'HP / Aruba Networks', cat: 'Technology', icon: 'bi-wifi', tier: 'Gold' },
        { name: 'Fortinet', cat: 'Security', icon: 'bi-shield-lock-fill', tier: 'Gold' },
        { name: 'Hikvision', cat: 'Surveillance', icon: 'bi-camera-video-fill', tier: 'Silver' },
        { name: 'D-Link', cat: 'Technology', icon: 'bi-ethernet', tier: 'Silver' },
        { name: 'Ubiquiti / UniFi', cat: 'Wireless', icon: 'bi-broadcast', tier: 'Silver' },
      ],
    },
    cta: { title: 'Ready to Grow Together?', desc: 'Apply for our partner programme and unlock new business opportunities across Malaysia.' },
  },

  'projects': {
    hero: {
      badge: 'Project Portfolio — Updated 2026', title: 'Delivering ICT', titleAccent: 'Infrastructure', titleSub: 'Across Malaysia',
      desc: 'From single-building office networks to nationwide multi-site rollouts — ATLINE SDN BHD has delivered 50+ ICT infrastructure projects for government institutions, universities, hospitals and private enterprises.',
    },
    stats: {
      items: [
        { value: '50+', label: 'Projects Delivered', icon: 'bi-clipboard-check-fill' },
        { value: 'RM 5M+', label: 'Total Project Value', icon: 'bi-currency-exchange' },
        { value: '8', label: 'States Covered', icon: 'bi-geo-alt-fill' },
        { value: '100%', label: 'On-Time Delivery', icon: 'bi-patch-check-fill' },
      ],
    },
    list: {
      items: [
        { title: 'Campus Network Overhaul', client: 'Politeknik Shah Alam', sector: 'Government', category: 'Network Infrastructure', year: '2025', location: 'Shah Alam, Selangor', value: 'RM 480,000', icon: 'bi-diagram-3-fill', color: '#3b82f6', tags: 'Structured Cabling, Core Switching, Wi-Fi 6, Fibre Backbone', desc: 'End-to-end structured cabling and active network device deployment spanning 6 academic blocks, a library building and student residential wings — 1,400+ cable runs, 10 GbE fibre backbone.', featured: 'yes' },
        { title: 'Multi-Site Network Rollout', client: 'Kolej Komuniti Malaysia', sector: 'Government', category: 'Network Infrastructure', year: '2024', location: 'Nationwide', value: 'RM 720,000', icon: 'bi-geo-alt-fill', color: '#8b5cf6', tags: '12 Campuses, Structured Cabling, Active Devices, Project Management', desc: 'Simultaneous structured cabling and active network device deployment across 12 Kolej Komuniti campuses in 8 Malaysian states — planned, coordinated and delivered within 16 weeks.', featured: 'yes' },
        { title: 'Secure WAN & NGFW Deployment', client: 'Federal Ministry (Confidential)', sector: 'Government', category: 'Network Security', year: '2024', location: 'Kuala Lumpur', value: 'RM 310,000', icon: 'bi-shield-lock-fill', color: '#10b981', tags: 'FortiGate NGFW, SD-WAN, IPSec VPN, HA Clustering', desc: 'Design and implementation of a dual-ISP SD-WAN solution with FortiGate NGFW at the primary ministry site and 5 branch offices — full redundancy and failover under 30 seconds.', featured: 'yes' },
        { title: 'Wi-Fi 6 Campus Deployment', client: 'Public University, Selangor', sector: 'Education', category: 'Wireless', year: '2023', location: 'Selangor', value: 'RM 240,000', icon: 'bi-wifi', color: '#f59e0b', tags: 'Wi-Fi 6, Aruba AP-515, RF Survey, Controller-based', desc: "Malaysia's first Wi-Fi 6 campus-wide wireless deployment — RF site survey, 180 Aruba AP-515 access points, centralised Aruba controller and ClearPass NAC for 12,000 concurrent users.", featured: 'no' },
        { title: 'Data Centre Fit-Out & Cabling', client: 'Private Corporation, KL', sector: 'Private', category: 'Data Centre', year: '2023', location: 'Kuala Lumpur', value: 'RM 195,000', icon: 'bi-server', color: '#06b6d4', tags: 'Cat 6A, OM4 Fibre, Panduit, Rack Management', desc: 'Full data centre structured cabling fit-out — Cat 6A copper for server access, OM4 multimode fibre for storage area networking, high-density cable management, and Panduit labelling.', featured: 'no' },
        { title: 'IP Surveillance System', client: 'Industrial Complex, Selangor', sector: 'Private', category: 'Surveillance', year: '2024', location: 'Klang, Selangor', value: 'RM 165,000', icon: 'bi-camera-video-fill', color: '#ef4444', tags: 'Hikvision, 64 IP Cameras, NVR, Remote Monitoring', desc: '64-camera IP surveillance system across a 12-hectare industrial compound — outdoor PTZ cameras, internal fixed cameras, 128-channel NVR with RAID storage, and mobile remote monitoring app.', featured: 'no' },
        { title: 'Corporate Office Network', client: 'Financial Services Firm, KL', sector: 'Private', category: 'Network Infrastructure', year: '2022', location: 'KLCC, Kuala Lumpur', value: 'RM 130,000', icon: 'bi-building', color: '#3b82f6', tags: '3 Floors, Cat 6A, Cisco Meraki, VLAN Segmentation', desc: '3-floor office network build for a financial services company — Cat 6A structured cabling, Cisco Meraki cloud-managed switches and APs, VLAN segmentation for traders, compliance and guest networks.', featured: 'no' },
        { title: 'Hospital Network Upgrade', client: 'Private Hospital, Selangor', sector: 'Healthcare', category: 'Network Infrastructure', year: '2022', location: 'Petaling Jaya, Selangor', value: 'RM 285,000', icon: 'bi-hospital', color: '#10b981', tags: 'EMR System, Nurse Call, Redundant Core, PoE+', desc: 'Network infrastructure upgrade for a 150-bed private hospital — new core switching with full redundancy, PoE+ for nurse call stations, dedicated VLAN for EMR/PACS systems, and wireless for ward rounds.', featured: 'no' },
        { title: 'ICT Training Centre Setup', client: 'TVET Centre, Johor', sector: 'Education', category: 'Network Infrastructure', year: '2021', location: 'Johor Bahru, Johor', value: 'RM 98,000', icon: 'bi-mortarboard-fill', color: '#8b5cf6', tags: 'Lab Setup, 80 Workstations, Structured Cabling, Cisco Training Kit', desc: 'Full ICT lab fit-out for a TVET centre — 80-node structured cabling, rack installation, Cisco training switches, and teacher presentation system with AV integration.', featured: 'no' },
      ],
    },
    sectors: {
      items: [
        { icon: 'bi-building-fill', label: 'Government', count: '30+', desc: 'Federal ministries, state agencies, statutory bodies' },
        { icon: 'bi-mortarboard-fill', label: 'Education', count: '20+', desc: 'Politeknik, Kolej Komuniti, universities, TVET centres' },
        { icon: 'bi-briefcase-fill', label: 'Private', count: '15+', desc: 'Corporates, SMEs, financial services, manufacturing' },
        { icon: 'bi-hospital', label: 'Healthcare', count: '5+', desc: 'Private hospitals, clinics, medical centres' },
      ],
    },
    cta: { title: 'Have an ICT Infrastructure Project?', desc: 'Tell us about your requirements and our engineers will prepare a detailed proposal.' },
  },

  'resources/faq': {
    hero: {
      tag: 'Frequently Asked Questions', title: 'Got Questions?', titleAccent: 'We Have Answers.',
      desc: "Find answers to common questions about SCM, our classification and certification services, surveys, approved vendors, and careers. Can't find what you're looking for? Contact us directly.",
    },
    categories: {
      items: [
        {
          cat: 'General', icon: 'bi-info-circle', color: 'fq-general',
          items: [
            { q: 'What is a Classification Society?', a: 'A Classification Society is an independent, non-governmental organisation that establishes and applies technical standards (Rules) for the design, construction and survey of ships and offshore structures. It verifies that vessels comply with these standards throughout their operational life, promoting safety of life and property at sea and protection of the marine environment.' },
            { q: 'What is Ships Classification Malaysia (SCM)?', a: 'Ships Classification Malaysia (SCM) is the national premier Classification Society of Malaysia. We provide classification, statutory certification and consultancy services for the maritime industry, and we are also a member of the Asian Classification Society (ACS).' },
            { q: 'When and why was SCM established?', a: 'SCM was established in 1994, near Kuala Lumpur, inspired by the awareness among local professionals and entrepreneurs that a national Classification Society was needed to support Malaysia\u2019s growing maritime industry \u2014 particularly the expansion of maritime transport between East Malaysia, West Malaysia and the ASEAN region.' },
            { q: 'Is SCM recognised by the Government of Malaysia?', a: 'Yes. SCM is the first local Classification Society authorised by the Government of Malaysia to provide classification and statutory certification services for all the major IMO conventions to which Malaysia is a signatory. SCM is also an ISO 9001 certified and R.O. Code compliant organisation.' },
            { q: 'Which vessels does SCM classify?', a: 'SCM largely confines its classification activities to Malaysian-registered ships. In addition, we provide inspection and certification services to vessels owned and operated by the Malaysian Royal Navy and training institutions, and carry out inspections on behalf of other government agencies.' },
            { q: 'Is SCM part of any international maritime organisations?', a: 'SCM is a member of the Asian Classification Society (ACS). We also observe the relevant international conventions, codes and standards set by the International Maritime Organization (IMO) and align with international best practices.' },
            { q: 'Where is SCM located?', a: 'SCM\u2019s headquarters is at Wisma SCM, No. 2 & 3, Block 2, Presint Alami, Persiaran Akuatik, Seksyen 13, 40675 Shah Alam, Selangor. We have also established operation offices in East and West Malaysia to serve clients effectively.' },
          ],
        },
        {
          cat: 'Classification & Surveys', icon: 'bi-clipboard-check', color: 'fq-services',
          items: [
            { q: 'What types of surveys does SCM conduct?', a: 'SCM conducts a full range of classification and statutory surveys, including class entry; annual, intermediate and renewal (Special) surveys; dry-docking and in-water surveys; boiler surveys; damage and repair surveys; and statutory surveys for SOLAS, MARPOL, COLREG, Load Line, IOPP, IAPP and more.' },
            { q: 'What is class entry?', a: 'Class entry is the process of admitting a vessel into classification with SCM. For newbuildings it involves plan approval and construction survey; for existing ships it involves a review of the vessel\u2019s documentation and an entry survey to confirm compliance with SCM Rules and applicable conventions.' },
            { q: 'What is the survey cycle for a classed vessel?', a: 'Classed vessels follow a five-year survey cycle. This typically includes Annual Surveys each year, an Intermediate Survey (between the 2nd and 3rd annual), and a Renewal/Special Survey every 5 years, along with periodic dry-docking or in-water surveys.' },
            { q: 'How do I request a survey?', a: 'You can request a survey through our Contact page or by emailing infohq@myscm.com.my. Please provide your vessel particulars, the type of survey required, and the intended location and date. Our team will confirm the requirements and assign an attending surveyor.' },
            { q: 'What happens if a survey identifies deficiencies?', a: 'If deficiencies are found, the surveyor may issue Conditions of Class or recommendations with a timeframe for rectification. Depending on severity, some items must be corrected before the vessel continues in service, while others may be addressed by an agreed date.' },
            { q: 'Can SCM attend vessels outside Malaysia?', a: 'Yes. SCM can arrange surveys at ports and shipyards where vessels operate, subject to logistics and scheduling. Please contact us in advance so we can coordinate an attending surveyor.' },
            { q: 'What is the difference between a dry-docking and an in-water survey?', a: 'A dry-docking survey examines the underwater portion of the hull with the vessel out of the water in a dry dock. An in-water survey (IWS) allows examination of the underwater parts while the vessel remains afloat, using approved divers/service suppliers \u2014 available to eligible vessels as an alternative to one of the dockings.' },
          ],
        },
        {
          cat: 'Plan Approval & Newbuilding', icon: 'bi-rulers', color: 'fq-projects',
          items: [
            { q: 'What is plan approval?', a: 'Plan approval is the technical review of a vessel\u2019s design drawings and calculations to verify compliance with SCM Rules and statutory requirements before and during construction. It covers structural, stability, machinery, electrical and safety aspects.' },
            { q: 'What documents are required for plan approval?', a: 'Typical submissions include the general arrangement, structural drawings, tonnage and load line calculations, stability information, safety plans and relevant system diagrams. Our technical team will advise on the exact documentation for your project.' },
            { q: 'Does SCM supervise newbuilding construction?', a: 'Yes. SCM provides newbuilding construction supervision and can act as Owner\u2019s Representative, verifying hull compliance and workmanship during construction and conducting surveys through to delivery.' },
            { q: 'Does SCM handle EEDI, EEXI and SEEMP verification?', a: 'Yes. SCM provides EEDI and EEXI verification and SEEMP review as part of our plan approval and newbuilding services, supporting compliance with IMO energy-efficiency and greenhouse-gas reduction requirements.' },
          ],
        },
        {
          cat: 'Certification & Audit', icon: 'bi-patch-check', color: 'fq-technical',
          items: [
            { q: 'What certificates does SCM issue?', a: 'SCM issues classification certificates and statutory certificates for vessels, as well as component and equipment certification \u2014 including class certification, component certification, and certificates related to the ISM Code, ISPS Code and Maritime Labour Convention (MLC).' },
            { q: 'What is statutory certification?', a: 'Statutory certification confirms that a vessel complies with international maritime conventions and flag-state requirements. SCM performs the necessary surveys and audits and issues the corresponding statutory certificates on behalf of the administration.' },
            { q: 'What statutory audits does SCM perform?', a: 'SCM performs ISM (International Safety Management) audits, ISPS (International Ship and Port Facility Security) audits, MLC & ILO inspections, vendor audits, and Marine Facility Security Assessments (MFSA) and Plans (MFSP).' },
            { q: 'How long are certificates valid?', a: 'Validity depends on the certificate type and applicable convention \u2014 most full-term certificates are valid for up to five years, subject to the vessel maintaining class and passing the required intermediate and annual endorsements/surveys.' },
            { q: 'How can I verify the authenticity of an SCM certificate?', a: 'You can verify a certificate by contacting SCM directly at infohq@myscm.com.my with the certificate and vessel details. Our team will confirm its validity against our records.' },
          ],
        },
        {
          cat: 'Vendors & Suppliers', icon: 'bi-people', color: 'fq-vendors',
          items: [
            { q: 'How can my company become an approved SCM vendor or service supplier?', a: 'Companies wishing to become approved vendors can apply to SCM and undergo an approval assessment (including a vendor audit where applicable). Once approved, your company is listed by service category. Contact us for the registration requirements and application form.' },
            { q: 'Where can I find the list of approved vendors?', a: 'The full list of SCM approved vendors and service suppliers is available under Resources \u2192 Technical Information \u2192 Vendors, organised by service category with contact details and validity (expiry) dates.' },
            { q: 'What services require an SCM-approved supplier?', a: 'Approved suppliers are required for services such as ultrasonic thickness measurement, in-water survey, radio communication equipment survey, VDR/SVDR performance tests, fire-fighting equipment and SCBA servicing, inflatable liferaft/lifejacket servicing, lifeboat and launching appliance servicing, and BWMS commissioning testing.' },
            { q: 'How long is vendor approval valid?', a: 'Each approved vendor listing carries a validity (expiry) date. Vendors must renew their approval before expiry to remain on the approved list. Expiry dates are shown against each company on the Vendors page.' },
          ],
        },
        {
          cat: 'Fees & Documentation', icon: 'bi-file-earmark-text', color: 'fq-fees',
          items: [
            { q: 'How are survey and certification fees determined?', a: 'Fees depend on factors such as vessel type and size, scope of survey, location and attendance requirements. Please contact us with your vessel and service details for a quotation.' },
            { q: 'Where can I find SCM circulars?', a: 'Official SCM circulars are published under Resources \u2192 Technical Information \u2192 Circulars, where they can be browsed by year and viewed or downloaded as PDF documents.' },
            { q: 'Where can I download SCM forms and documents?', a: 'Forms, company documents and guidelines are available under Resources \u2192 Forms & Documents. Some documents may require email verification before download.' },
          ],
        },
        {
          cat: 'Careers', icon: 'bi-briefcase', color: 'fq-careers',
          items: [
            { q: 'How do I apply for a job at SCM?', a: 'Visit our Careers page to view current openings and submit your application online through the application form. If there are no matching roles at the moment, you may send your CV to careers@myscm.com.my for future opportunities.' },
            { q: 'Does SCM offer training and professional development?', a: 'Yes. SCM invests in its people through sponsorship of professional certifications, technical workshops and continuous development, helping surveyors and engineers build long-term careers in maritime classification.' },
            { q: 'What qualifications does SCM look for in a surveyor?', a: 'We typically look for candidates with a degree in Marine Engineering, Naval Architecture or a related field, relevant marine survey or shipboard experience, familiarity with IMO conventions and class rules, and strong reporting and communication skills.' },
          ],
        },
      ],
    },
  },

  'resources/achievement': {
    hero: {
      tag: '2015 — 2026', title: 'A Decade of', titleAccent: 'Excellence & Growth',
      desc: "From a small networking firm to one of Malaysia's trusted ICT infrastructure partners — explore the milestones, achievements, and recognitions that define our journey.",
    },
    stats: {
      items: [
        { value: '11+', label: 'Years in Operation', icon: 'bi-calendar-range' },
        { value: '50+', label: 'Projects Completed', icon: 'bi-clipboard-check' },
        { value: '30+', label: 'Government Clients', icon: 'bi-building-fill' },
        { value: '100+', label: 'Years Combined Experience', icon: 'bi-award' },
      ],
    },
    milestones: {
      items: [
        { year: '2015', title: 'Company Founded', desc: "KF Legacy Resources Sdn Bhd incorporated in November 2015, laying the foundation for what would become ATLINE SDN BHD — Malaysia's trusted ICT infrastructure partner.", icon: 'bi-flag-fill', side: 'left' },
        { year: '2016', title: 'First Government Contract', desc: "Secured our first structured cabling contract with a federal agency in Selangor, establishing ATLINE's credibility in the government ICT sector.", icon: 'bi-building', side: 'right' },
        { year: '2017', title: 'Politeknik Malaysia Partnership', desc: 'Commenced network infrastructure deployments across Politeknik campuses nationwide — a partnership that continues to define our expertise in education sector ICT.', icon: 'bi-mortarboard-fill', side: 'left' },
        { year: '2018', title: 'Team Expansion & Certifications', desc: 'Grew the engineering team to 15 professionals. Team members obtained Cisco CCNA, Fortinet NSE, and structured cabling certifications from leading industry bodies.', icon: 'bi-award-fill', side: 'right' },
        { year: '2019', title: 'Kolej Komuniti Network Rollout', desc: 'Completed network infrastructure overhauls at 12 Kolej Komuniti sites across Malaysia — one of our largest multi-site deployments to date.', icon: 'bi-diagram-3-fill', side: 'left' },
        { year: '2020', title: 'Remote Work Infrastructure Support', desc: 'Pivoted to support clients with SD-WAN and VPN infrastructure during the pandemic, ensuring business continuity for government and private sector clients.', icon: 'bi-laptop-fill', side: 'right' },
        { year: '2021', title: 'ATLINE SDN BHD Rebranding', desc: 'Rebranded to ATLINE SDN BHD to reflect our expanded service portfolio, larger team, and strengthened market position as a full-service ICT engineering company.', icon: 'bi-lightning-charge-fill', side: 'left' },
        { year: '2022', title: 'Wi-Fi 6 Deployment Milestone', desc: "Completed Malaysia's first Wi-Fi 6 (802.11ax) campus-wide deployment for a public university — earning recognition from our technology partners.", icon: 'bi-wifi', side: 'right' },
        { year: '2023', title: '50+ Projects Completed', desc: 'Surpassed the 50-project milestone, with a portfolio spanning structured cabling, active network devices, wireless deployments, and ICT consulting across Malaysia.', icon: 'bi-clipboard-check-fill', side: 'left' },
        { year: '2024', title: 'Helpdesk Platform Launch', desc: 'Launched dedicated helpdesk portal at helpdesk.atline.com.my — providing 24/7 ticket management and remote support to all maintenance contract clients.', icon: 'bi-headset', side: 'right' },
        { year: '2025', title: 'Cybersecurity Practice Expansion', desc: 'Expanded into network security consulting and UTM/NGFW deployments, earning Fortinet Partner certification and adding 4 security-certified engineers to the team.', icon: 'bi-shield-fill-check', side: 'left' },
        { year: '2026', title: 'Nationwide Growth', desc: 'Extending services beyond Selangor into East Malaysia and other regions, with new government and private sector engagements in Sabah, Sarawak, and Johor.', icon: 'bi-geo-alt-fill', side: 'right' },
      ],
    },
    certs: {
      items: [
        { icon: 'bi-shield-fill-check', title: 'Fortinet NSE Partner', body: 'Certified Fortinet Network Security Expert partner for UTM and NGFW deployments.' },
        { icon: 'bi-cpu-fill', title: 'Cisco Registered Partner', body: 'Official Cisco Registered Partner enabling access to Cisco enterprise products and training.' },
        { icon: 'bi-ethernet', title: 'TIA-568 Compliance', body: 'All structured cabling installations comply with TIA-568-C.2 international standards.' },
        { icon: 'bi-file-earmark-check', title: 'SSM Registered', body: 'Registered with Suruhanjaya Syarikat Malaysia (SSM) — No. 201503318537.' },
        { icon: 'bi-mortarboard-fill', title: 'Aruba Certified', body: 'Aruba Networks certified partner for wireless access point deployments and campus Wi-Fi.' },
        { icon: 'bi-person-check-fill', title: 'CCNA Certified Engineers', body: 'Multiple team members hold Cisco Certified Network Associate (CCNA) certifications.' },
      ],
    },
    cta: { title: 'Become Part of Our Success Story', desc: 'Let us bring the same level of excellence to your ICT infrastructure project.' },
  },

  'resources/download': {
    hero: {
      tag: 'Free Downloads',
      title: 'Forms & Documents',
      titleSub: 'At Your Fingertips',
      desc: 'Access SCM forms, company documents, guidelines and technical resources for the maritime industry — all in one place.',
      statFreeLabel: 'Free',
      statFreeSub: 'No Charge',
    },
    library: {
      tag: 'Document Library',
      title: 'Browse & Download',
      subtitle: 'Files marked with a lock require email verification before download.',
    },
    cta: { title: 'Need a Specific Document?', desc: 'Request forms, technical reports or documentation for your vessel or project.' },
  },

  'resources/products': {
    hero: {
      tag: 'ICT Equipment Catalog',
      title: 'Enterprise-Grade',
      titleSub: 'Network Products',
      desc: 'Source the right ICT equipment for your infrastructure project. ATLINE supplies and installs enterprise-grade networking hardware from globally trusted brands — with professional configuration and post-installation support included.',
    },
    catalog: {
      tag: 'Product Categories',
      title: 'Complete ICT Hardware Portfolio',
      subtitle: 'From edge devices to core infrastructure — we supply, configure, and maintain all major ICT equipment categories.',
    },
    brands: {
      tag: 'Trusted Brands',
      title: 'Our Featured Suppliers',
      subtitle: 'We partner with globally recognised ICT brands to ensure quality, warranty coverage, and long-term support for every deployment.',
      items: [
        { name: 'Cisco', icon: 'bi-router' },
        { name: 'Aruba / HPE', icon: 'bi-wifi' },
        { name: 'Fortinet', icon: 'bi-shield-fill-check' },
        { name: 'Ubiquiti', icon: 'bi-broadcast' },
        { name: 'MikroTik', icon: 'bi-hdd-network-fill' },
        { name: 'Panduit', icon: 'bi-ethernet' },
        { name: 'APC / Schneider', icon: 'bi-plug-fill' },
        { name: 'Fluke Networks', icon: 'bi-tools' },
      ],
    },
    cta: { title: 'Need a Full Infrastructure Build-Out?', desc: 'We handle supply, installation, configuration, and testing — end to end.' },
  },

  'resources/gallery': {
    hero: {
      tag: 'Photo Gallery',
      title: 'Our Work, Our Team,',
      titleSub: 'Our Story',
      desc: "A visual journey through ATLINE's projects, milestones, team culture, and the infrastructure we've built across Malaysia. Click any item to view the full photo collection.",
    },
    cta: { title: 'Want to See Our Work Up Close?', desc: 'Contact us to arrange a site visit or request a detailed project portfolio.' },
  },
};
