// Copyright 2024 Marqai. All rights reserved.
// SPDX-License-Identifier: proprietary

import 'package:flutter/material.dart';

import '../../core/theme.dart';
import '../../shared/widgets/marqai_scaffold.dart';

/// Dashboard — the landing screen after sign-in.
///
/// Currently shows mock KPI data (Reach, Scheduled Posts, Open Rate, AI
/// Tools Tested) plus three quick-action tiles. Pull-to-refresh re-runs
/// the mock data generator with a fresh jitter so the demo feels live.
class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  late List<KpiCard> _kpis;

  @override
  void initState() {
    super.initState();
    _kpis = _generateKpis();
  }

  Future<void> _refresh() async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
    setState(() => _kpis = _generateKpis());
  }

  List<KpiCard> _generateKpis() {
    final int base = DateTime.now().millisecond;
    return <KpiCard>[
      KpiCard(
        label: 'Reach',
        value: _formatNumber(12000 + base * 37),
        delta: '+12.4%',
        icon: Icons.people_alt_outlined,
        color: MarqaiTheme.primary,
      ),
      KpiCard(
        label: 'Scheduled Posts',
        value: '${8 + (base % 6)}',
        delta: '+2 today',
        icon: Icons.event_outlined,
        color: MarqaiTheme.secondary,
      ),
      KpiCard(
        label: 'Open Rate',
        value: '${42 + (base % 9)}%',
        delta: '+3.1%',
        icon: Icons.mark_email_open_outlined,
        color: MarqaiTheme.info,
      ),
      KpiCard(
        label: 'AI Tools Tested',
        value: '${27 + (base % 5)}',
        delta: '+5 this week',
        icon: Icons.bug_report_outlined,
        color: MarqaiTheme.success,
      ),
    ];
  }

  String _formatNumber(int n) {
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return n.toString();
  }

  @override
  Widget build(BuildContext context) {
    return MarqaiScaffold(
      title: 'Dashboard',
      onRefresh: _refresh,
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: <Widget>[
          const _GreetingHeader(),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.05,
            ),
            itemCount: _kpis.length,
            itemBuilder: (BuildContext context, int i) => _kpis[i],
          ),
          const SizedBox(height: 28),
          const _SectionHeader(title: 'Quick actions'),
          const SizedBox(height: 12),
          Row(
            children: <Widget>[
              Expanded(
                child: _QuickAction(
                  icon: Icons.edit_outlined,
                  label: 'New Post',
                  color: MarqaiTheme.primary,
                  onTap: () {
                    Navigator.of(context).pushNamed('/module/social');
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _QuickAction(
                  icon: Icons.brush_outlined,
                  label: 'Generate Logo',
                  color: MarqaiTheme.secondary,
                  onTap: () {
                    Navigator.of(context).pushNamed('/logo-builder');
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _QuickAction(
                  icon: Icons.person_search_outlined,
                  label: 'Find Leads',
                  color: MarqaiTheme.info,
                  onTap: () {
                    Navigator.of(context).pushNamed('/leads');
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),
          const _SectionHeader(title: 'Explore modules'),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () {
              Navigator.of(context).pushNamed('/modules');
            },
            icon: const Icon(Icons.apps_outlined, size: 18),
            label: const Text('View all 15 modules'),
          ),
        ],
      ),
    );
  }
}

class _GreetingHeader extends StatelessWidget {
  const _GreetingHeader();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
      decoration: BoxDecoration(
        gradient: MarqaiTheme.brandGradient,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            _greeting(),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Here\'s your marketing at a glance.',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }

  String _greeting() {
    final int hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning ☀️';
    if (hour < 17) return 'Good afternoon 👋';
    return 'Good evening 🌙';
  }
}

class KpiCard extends StatelessWidget {
  const KpiCard({
    super.key,
    required this.label,
    required this.value,
    required this.delta,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final String delta;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: <Widget>[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: <Widget>[
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 18),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: MarqaiTheme.success.withOpacity(0.10),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    delta,
                    style: const TextStyle(
                      fontSize: 10,
                      color: MarqaiTheme.success,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: MarqaiTheme.ink,
              ),
            ),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: MarqaiTheme.inkMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        color: MarqaiTheme.ink,
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
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
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(height: 8),
              Text(
                label,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: MarqaiTheme.ink,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
