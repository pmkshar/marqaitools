// Copyright 2024 Marqai. All rights reserved.
// SPDX-License-Identifier: proprietary

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/config.dart';
import '../../core/theme.dart';
import '../../shared/widgets/marqai_scaffold.dart';
import '../auth/auth_provider.dart';

/// Settings — account / API / about.
///
/// Sections:
///   1. Account — name, email, org, role, plan, sign out.
///   2. API — current base URL, edit field, save, reset to default.
///   3. About — version, build, web app link.
class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  late final TextEditingController _apiCtrl;

  @override
  void initState() {
    super.initState();
    final AuthProvider auth = context.read<AuthProvider>();
    _apiCtrl = TextEditingController(text: auth.apiBaseUrl);
  }

  @override
  void dispose() {
    _apiCtrl.dispose();
    super.dispose();
  }

  Future<void> _saveApi() async {
    final AuthProvider auth = context.read<AuthProvider>();
    await auth.setApiBaseUrl(_apiCtrl.text);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('API base URL saved.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _resetApi() async {
    final AuthProvider auth = context.read<AuthProvider>();
    await auth.resetApiBaseUrl();
    _apiCtrl.text = auth.apiBaseUrl;
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('API base URL reset to default.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _signOut() async {
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (BuildContext ctx) => AlertDialog(
        title: const Text('Sign out?'),
        content: const Text(
          'You will be returned to the login screen. Demo data is cleared.',
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: FilledButton.styleFrom(backgroundColor: MarqaiTheme.danger),
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
    if (confirm ?? false) {
      if (!mounted) return;
      await context.read<AuthProvider>().logout();
    }
  }

  Future<void> _openWebApp() async {
    final Uri? uri = Uri.tryParse(MarqaiConfig.webAppUrl);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final AuthProvider auth = context.watch<AuthProvider>();

    return MarqaiScaffold(
      title: 'Settings',
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: <Widget>[
          // ---- Account ----
          const _SectionTitle(text: 'Account'),
          const SizedBox(height: 10),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          gradient: MarqaiTheme.logoGradient,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          auth.user?.initials ?? 'M',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text(
                              auth.user?.name ?? 'Not signed in',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: MarqaiTheme.ink,
                              ),
                            ),
                            Text(
                              auth.user?.email ?? '—',
                              style: const TextStyle(
                                fontSize: 12,
                                color: MarqaiTheme.inkMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const Divider(),
                  const SizedBox(height: 10),
                  _MetaRow(label: 'Organization', value: auth.user?.orgName ?? '—'),
                  _MetaRow(label: 'Role', value: auth.user?.displayRole ?? '—'),
                  _MetaRow(label: 'Plan', value: auth.user?.plan ?? '—'),
                  if (auth.isDemoMode)
                    const _MetaRow(
                      label: 'Mode',
                      value: 'Demo (offline)',
                      valueColor: MarqaiTheme.secondary,
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: _signOut,
            icon: const Icon(Icons.logout_outlined, size: 18),
            label: const Text('Sign out'),
            style: FilledButton.styleFrom(
              backgroundColor: MarqaiTheme.danger,
              foregroundColor: Colors.white,
            ),
          ),

          // ---- API ----
          const SizedBox(height: 28),
          const _SectionTitle(text: 'API'),
          const SizedBox(height: 10),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const Text(
                    'Base URL',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: MarqaiTheme.ink,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _apiCtrl,
                    keyboardType: TextInputType.url,
                    autocorrect: false,
                    decoration: const InputDecoration(
                      hintText: 'https://marqaitools.vercel.app',
                      prefixIcon: Icon(Icons.link_outlined, size: 20),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: <Widget>[
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: _saveApi,
                          icon: const Icon(Icons.save_outlined, size: 18),
                          label: const Text('Save'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton.icon(
                        onPressed: _resetApi,
                        icon: const Icon(Icons.refresh_outlined, size: 18),
                        label: const Text('Reset'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Changes are picked up immediately by the API client. Use '
                    'http://10.0.2.2:3000 for an Android emulator hitting a '
                    'local Next.js dev server.',
                    style: TextStyle(
                      fontSize: 11,
                      color: MarqaiTheme.inkMuted,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ---- About ----
          const SizedBox(height: 28),
          const _SectionTitle(text: 'About'),
          const SizedBox(height: 10),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: <Widget>[
                  _MetaRow(label: 'App', value: MarqaiConfig.appName),
                  _MetaRow(label: 'Version', value: MarqaiConfig.appVersion),
                  _MetaRow(label: 'Build', value: MarqaiConfig.appBuildNumber),
                  _MetaRow(
                    label: 'Debug',
                    value: MarqaiConfig.isDebug ? 'On' : 'Off',
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _openWebApp,
            icon: const Icon(Icons.open_in_new_rounded, size: 18),
            label: const Text('Open Marqai web app'),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: MarqaiTheme.inkMuted,
        letterSpacing: 1.2,
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  const _MetaRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: <Widget>[
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              color: MarqaiTheme.inkMuted,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: valueColor ?? MarqaiTheme.ink,
            ),
          ),
        ],
      ),
    );
  }
}
