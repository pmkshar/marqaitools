// Copyright 2024 Marqai. All rights reserved.
// SPDX-License-Identifier: proprietary

import 'package:flutter/material.dart';

import '../../core/theme.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/marqai_scaffold.dart';
import 'module_list_page.dart';

/// Generic "coming soon" placeholder for modules without a dedicated mobile
/// implementation yet. Renders the matching module metadata (icon, label,
/// description) and a button to open the web app for the full experience.
class ModulePlaceholder extends StatelessWidget {
  const ModulePlaceholder({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context) {
    final MarqaiModule? module = kMarqaiModules.firstWhere(
      (MarqaiModule m) => m.slug == slug,
      orElse: () => MarqaiModule(
        slug: slug,
        label: _humanize(slug),
        description: 'Module preview not available.',
        icon: Icons.extension_outlined,
        color: MarqaiTheme.primary,
        route: '/module/$slug',
      ),
    );

    return MarqaiScaffold(
      title: module.label,
      body: EmptyState(
        icon: module.icon,
        title: '${module.label} is coming soon',
        subtitle:
            'The mobile experience for this module is on our roadmap. Open the '
            'Marqai web app to use it today — your account syncs automatically.',
        actionLabel: 'Open web app',
        onAction: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Open https://marqaitools.vercel.app on your computer to use '
                'the full Marqai suite.',
              ),
            ),
          );
        },
      ),
    );
  }

  String _humanize(String slug) {
    return slug
        .split('-')
        .map((String s) => s.isEmpty ? s : '${s[0].toUpperCase()}${s.substring(1)}')
        .join(' ');
  }
}
