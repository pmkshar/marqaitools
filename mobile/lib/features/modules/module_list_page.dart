// Copyright 2024 Marqai. All rights reserved.
// SPDX-License-Identifier: proprietary

import 'package:flutter/material.dart';

import '../../core/theme.dart';
import '../../shared/widgets/marqai_scaffold.dart';

/// Definition of a Marqai module surfaced on the modules grid.
class MarqaiModule {
  const MarqaiModule({
    required this.slug,
    required this.label,
    required this.description,
    required this.icon,
    required this.color,
    required this.route,
    this.implemented = false,
  });

  final String slug;
  final String label;
  final String description;
  final IconData icon;
  final Color color;
  final String route;
  final bool implemented;
}

/// All 15 Marqai modules in the canonical order used by the web sidebar.
const List<MarqaiModule> kMarqaiModules = <MarqaiModule>[
  MarqaiModule(
    slug: 'dashboard',
    label: 'Dashboard',
    description: 'KPIs and quick actions',
    icon: Icons.dashboard_outlined,
    color: MarqaiTheme.primary,
    route: '/dashboard',
    implemented: true,
  ),
  MarqaiModule(
    slug: 'seo',
    label: 'SEO Analyzer',
    description: 'Audit any page for SEO issues',
    icon: Icons.search_outlined,
    color: Color(0xFF3B82F6),
    route: '/module/seo',
  ),
  MarqaiModule(
    slug: 'social',
    label: 'Social Marketing',
    description: 'Plan & schedule posts',
    icon: Icons.share_outlined,
    color: Color(0xFFEC4899),
    route: '/module/social',
  ),
  MarqaiModule(
    slug: 'scheduler',
    label: 'Scheduler',
    description: 'Queue posts across channels',
    icon: Icons.event_outlined,
    color: Color(0xFF8B5CF6),
    route: '/module/scheduler',
  ),
  MarqaiModule(
    slug: 'image',
    label: 'Image Studio',
    description: 'AI image generation',
    icon: Icons.image_outlined,
    color: Color(0xFF06B6D4),
    route: '/module/image',
  ),
  MarqaiModule(
    slug: 'video',
    label: 'Video Studio',
    description: 'AI video generation',
    icon: Icons.videocam_outlined,
    color: Color(0xFFF43F5E),
    route: '/module/video',
  ),
  MarqaiModule(
    slug: 'logo-builder',
    label: 'Logo Builder',
    description: 'Brand & logo generation',
    icon: Icons.brush_outlined,
    color: MarqaiTheme.secondary,
    route: '/logo-builder',
    implemented: true,
  ),
  MarqaiModule(
    slug: 'website-builder',
    label: 'Website Builder',
    description: 'AI website generation',
    icon: Icons.web_outlined,
    color: Color(0xFF14B8A6),
    route: '/module/website-builder',
  ),
  MarqaiModule(
    slug: 'leads',
    label: 'Leads Generator',
    description: 'Scored prospect discovery',
    icon: Icons.person_search_outlined,
    color: MarqaiTheme.success,
    route: '/leads',
    implemented: true,
  ),
  MarqaiModule(
    slug: 'email',
    label: 'Email Automation',
    description: 'Sequences and broadcasts',
    icon: Icons.mail_outlined,
    color: Color(0xFF0EA5E9),
    route: '/module/email',
  ),
  MarqaiModule(
    slug: 'analyzer',
    label: 'Website Analyzer',
    description: 'Performance & tech audit',
    icon: Icons.analytics_outlined,
    color: Color(0xFF6366F1),
    route: '/module/analyzer',
  ),
  MarqaiModule(
    slug: 'ai-testing',
    label: 'AI Tool Testing',
    description: 'QA your AI integrations',
    icon: Icons.bug_report_outlined,
    color: Color(0xFFF97316),
    route: '/module/ai-testing',
  ),
  MarqaiModule(
    slug: 'billing',
    label: 'Subscription/Billing',
    description: 'Plan, invoices, usage',
    icon: Icons.credit_card_outlined,
    color: MarqaiTheme.primary,
    route: '/module/billing',
  ),
  MarqaiModule(
    slug: 'wiki',
    label: 'Wiki / Docs',
    description: 'In-app knowledge base',
    icon: Icons.menu_book_outlined,
    color: Color(0xFF84CC16),
    route: '/module/wiki',
  ),
  MarqaiModule(
    slug: 'settings',
    label: 'Settings',
    description: 'Profile, API, sign out',
    icon: Icons.settings_outlined,
    color: MarqaiTheme.inkMuted,
    route: '/settings',
    implemented: true,
  ),
];

class ModuleListPage extends StatelessWidget {
  const ModuleListPage({super.key});

  @override
  Widget build(BuildContext context) {
    return MarqaiScaffold(
      title: 'All modules',
      body: GridView.builder(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.92,
        ),
        itemCount: kMarqaiModules.length,
        itemBuilder: (BuildContext context, int i) {
          final MarqaiModule m = kMarqaiModules[i];
          return _ModuleTile(
            module: m,
            onTap: () {
              if (m.route == '/dashboard') {
                Navigator.of(context).pushReplacementNamed(m.route);
              } else {
                Navigator.of(context).pushNamed(m.route);
              }
            },
          );
        },
      ),
    );
  }
}

class _ModuleTile extends StatelessWidget {
  const _ModuleTile({required this.module, required this.onTap});

  final MarqaiModule module;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: MarqaiTheme.surface,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: <Widget>[
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: module.color.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(module.icon, color: module.color, size: 20),
                  ),
                  if (module.implemented)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: MarqaiTheme.success.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'Live',
                        style: TextStyle(
                          fontSize: 9,
                          color: MarqaiTheme.success,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'Soon',
                        style: TextStyle(
                          fontSize: 9,
                          color: MarqaiTheme.inkMuted,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                ],
              ),
              const Spacer(),
              Text(
                module.label,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: MarqaiTheme.ink,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                module.description,
                style: const TextStyle(
                  fontSize: 11,
                  color: MarqaiTheme.inkMuted,
                  height: 1.3,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
