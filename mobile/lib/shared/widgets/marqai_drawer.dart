// Copyright 2024 Marqai. All rights reserved.
// SPDX-License-Identifier: proprietary

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme.dart';
import '../../features/auth/auth_provider.dart';
import '../models/user.dart';

/// Single source of truth for the navigation drawer.
///
/// Every entry maps to a route name registered in [MarqaiApp]. Tapping a
/// module entry navigates to the implementation if one exists
/// (`/leads`, `/logo-builder`) or to a generic "coming soon" placeholder
/// otherwise.
class MarqaiDrawer extends StatelessWidget {
  const MarqaiDrawer({super.key});

  static const List<_DrawerModule> _modules = <_DrawerModule>[
    _DrawerModule(label: 'Dashboard', icon: Icons.dashboard_outlined, route: '/dashboard'),
    _DrawerModule(label: 'SEO Analyzer', icon: Icons.search_outlined, route: '/module/seo'),
    _DrawerModule(label: 'Social Marketing', icon: Icons.share_outlined, route: '/module/social'),
    _DrawerModule(label: 'Scheduler', icon: Icons.event_outlined, route: '/module/scheduler'),
    _DrawerModule(label: 'Image Studio', icon: Icons.image_outlined, route: '/module/image'),
    _DrawerModule(label: 'Video Studio', icon: Icons.videocam_outlined, route: '/module/video'),
    _DrawerModule(label: 'Logo Builder', icon: Icons.brush_outlined, route: '/logo-builder'),
    _DrawerModule(label: 'Website Builder', icon: Icons.web_outlined, route: '/module/website-builder'),
    _DrawerModule(label: 'Leads Generator', icon: Icons.person_search_outlined, route: '/leads'),
    _DrawerModule(label: 'Email Automation', icon: Icons.mail_outlined, route: '/module/email'),
    _DrawerModule(label: 'Website Analyzer', icon: Icons.analytics_outlined, route: '/module/analyzer'),
    _DrawerModule(label: 'AI Tool Testing', icon: Icons.bug_report_outlined, route: '/module/ai-testing'),
    _DrawerModule(label: 'Subscription/Billing', icon: Icons.credit_card_outlined, route: '/module/billing'),
    _DrawerModule(label: 'Wiki / Docs', icon: Icons.menu_book_outlined, route: '/module/wiki'),
    _DrawerModule(label: 'Settings', icon: Icons.settings_outlined, route: '/settings'),
  ];

  @override
  Widget build(BuildContext context) {
    final AuthProvider auth = context.watch<AuthProvider>();
    final MarqaiUser? user = auth.user;
    final String currentRoute = ModalRoute.of(context)?.settings.name ?? '';

    return Drawer(
      backgroundColor: MarqaiTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.horizontal(right: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Column(
          children: <Widget>[
            _Header(user: user),
            const Divider(height: 1),
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: _modules.length,
                separatorBuilder: (_, __) => const SizedBox(height: 2),
                itemBuilder: (BuildContext context, int index) {
                  final _DrawerModule m = _modules[index];
                  final bool selected = currentRoute == m.route ||
                      (m.route == '/dashboard' && currentRoute == '/');
                  return _DrawerTile(
                    module: m,
                    selected: selected,
                    onTap: () {
                      Navigator.of(context).pop();
                      if (!selected) {
                        Navigator.of(context).pushReplacementNamed(m.route);
                      }
                    },
                  );
                },
              ),
            ),
            const Divider(height: 1),
            _Footer(version: auth.appVersion),
          ],
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.user});

  final MarqaiUser? user;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      child: Row(
        children: <Widget>[
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient: MarqaiTheme.logoGradient,
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: const Text(
              'M',
              style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const Text(
                  'Marqai',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: MarqaiTheme.ink,
                  ),
                ),
                if (user != null)
                  Text(
                    '${user!.name} · ${user!.displayRole}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: MarqaiTheme.inkMuted,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  )
                else
                  const Text(
                    'Not signed in',
                    style: TextStyle(fontSize: 12, color: MarqaiTheme.inkMuted),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DrawerTile extends StatelessWidget {
  const _DrawerTile({
    required this.module,
    required this.selected,
    required this.onTap,
  });

  final _DrawerModule module;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? MarqaiTheme.primary.withOpacity(0.08) : Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          child: Row(
            children: <Widget>[
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: selected
                      ? MarqaiTheme.primary.withOpacity(0.16)
                      : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  module.icon,
                  size: 20,
                  color: selected ? MarqaiTheme.primary : MarqaiTheme.inkMuted,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  module.label,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                    color: selected ? MarqaiTheme.primary : MarqaiTheme.ink,
                  ),
                ),
              ),
              if (selected)
                const Icon(Icons.chevron_right_rounded, color: MarqaiTheme.primary, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _Footer extends StatelessWidget {
  const _Footer({required this.version});
  final String version;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: <Widget>[
          const Text(
            '© 2024 Marqai',
            style: TextStyle(fontSize: 11, color: MarqaiTheme.inkMuted),
          ),
          Text(
            'v$version',
            style: const TextStyle(fontSize: 11, color: MarqaiTheme.inkMuted),
          ),
        ],
      ),
    );
  }
}

class _DrawerModule {
  const _DrawerModule({
    required this.label,
    required this.icon,
    required this.route,
  });

  final String label;
  final IconData icon;
  final String route;
}
