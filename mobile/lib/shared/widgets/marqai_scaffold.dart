// Copyright 2024 Marqai. All rights reserved.
// SPDX-License-Identifier: proprietary

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme.dart';
import '../../features/auth/auth_provider.dart';
import '../models/user.dart';

/// Standard page scaffold for every authenticated screen in the app.
///
/// Renders:
///   - the Marqai app bar with the org badge + role pill on the right,
///   - an optional left drawer (set [drawerEnabled] = true),
///   - an optional "Demo mode" banner across the top when the backend is
///     unreachable (driven by the auth provider's [AuthProvider.isDemoMode]).
class MarqaiScaffold extends StatelessWidget {
  const MarqaiScaffold({
    super.key,
    required this.title,
    required this.body,
    this.actions = const <Widget>[],
    this.fab,
    this.floatingActionButtonLocation,
    this.drawerEnabled = true,
    this.bottom,
    this.onRefresh,
  });

  final String title;
  final Widget body;
  final List<Widget> actions;
  final Widget? fab;
  final FloatingActionButtonLocation? floatingActionButtonLocation;
  final bool drawerEnabled;
  final PreferredSizeWidget? bottom;
  final Future<void> Function()? onRefresh;

  @override
  Widget build(BuildContext context) {
    final AuthProvider auth = context.watch<AuthProvider>();
    final MarqaiUser? user = auth.user;

    final Widget content = onRefresh != null
        ? RefreshIndicator(
            color: MarqaiTheme.primary,
            onRefresh: onRefresh!,
            child: body,
          )
        : body;

    return Scaffold(
      backgroundColor: MarqaiTheme.background,
      appBar: AppBar(
        title: Text(title),
        leading: drawerEnabled
            ? Builder(
                builder: (BuildContext ctx) => IconButton(
                  icon: const Icon(Icons.menu_rounded),
                  tooltip: 'Open menu',
                  onPressed: () => Scaffold.of(ctx).openDrawer(),
                ),
              )
            : null,
        actions: <Widget>[
          ...actions,
          if (user != null) _OrgBadge(user: user),
        ],
        bottom: bottom,
      ),
      drawer: drawerEnabled ? const MarqaiDrawer() : null,
      body: SafeArea(
        child: Column(
          children: <Widget>[
            if (auth.isDemoMode) const _DemoBanner(),
            Expanded(child: content),
          ],
        ),
      ),
      floatingActionButton: fab,
      floatingActionButtonLocation: floatingActionButtonLocation,
    );
  }
}

class _OrgBadge extends StatelessWidget {
  const _OrgBadge({required this.user});

  final MarqaiUser user;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              gradient: MarqaiTheme.logoGradient,
              borderRadius: BorderRadius.circular(8),
            ),
            alignment: Alignment.center,
            child: Text(
              user.initials,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                user.orgName,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: MarqaiTheme.ink,
                ),
              ),
              Text(
                user.displayRole,
                style: const TextStyle(
                  fontSize: 11,
                  color: MarqaiTheme.inkMuted,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DemoBanner extends StatelessWidget {
  const _DemoBanner();

  @override
  Widget build(BuildContext context) {
    return Material(
      color: MarqaiTheme.secondary,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: <Widget>[
              const Icon(Icons.science_outlined, color: Colors.white, size: 18),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Demo mode — backend not connected. API calls will fail gracefully.',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              TextButton(
                onPressed: () {
                  Navigator.of(context).pushNamed('/settings');
                },
                style: TextButton.styleFrom(
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text(
                  'Configure',
                  style: TextStyle(
                    decoration: TextDecoration.underline,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
