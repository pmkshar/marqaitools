// Copyright 2024 Marqai. All rights reserved.
// SPDX-License-Identifier: proprietary

import 'dart:io';

import 'package:csv/csv.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/config.dart';
import '../../core/theme.dart';
import '../../shared/models/lead.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_view.dart';
import '../../shared/widgets/loading_indicator.dart';
import '../../shared/widgets/marqai_scaffold.dart';

/// Leads Generator — wraps `POST /api/marqai/generate-leads`.
///
/// Form fields: product name, product category, target market, count
/// slider (3–25). On submit the API is called; results are rendered as
/// a list of scored lead cards with color-coded fit chips. The user can
/// export the current batch to CSV (saved to the app's documents dir, the
/// path is surfaced via a SnackBar).
class LeadsPage extends StatefulWidget {
  const LeadsPage({super.key});

  @override
  State<LeadsPage> createState() => _LeadsPageState();
}

class _LeadsPageState extends State<LeadsPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _productCtrl = TextEditingController(text: 'Marqai Suite');
  final TextEditingController _categoryCtrl = TextEditingController(text: 'SaaS Marketing');
  final TextEditingController _marketCtrl = TextEditingController(text: 'US / SMB');

  double _count = 10;
  List<Lead> _leads = <Lead>[];
  bool _loading = false;
  String? _error;
  String? _debugInfo;

  @override
  void dispose() {
    _productCtrl.dispose();
    _categoryCtrl.dispose();
    _marketCtrl.dispose();
    super.dispose();
  }

  Future<void> _generate() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _loading = true;
      _error = null;
      _debugInfo = null;
    });

    final ApiClient api = context.read<ApiClient>();
    final ApiResult<List<Lead>> result = await api.post<List<Lead>>(
      MarqaiConfig.generateLeadsPath(api.baseUrl),
      body: <String, dynamic>{
        'productName': _productCtrl.text.trim(),
        'productCategory': _categoryCtrl.text.trim(),
        'targetMarket': _marketCtrl.text.trim(),
        'count': _count.round(),
      },
      fromJson: (Map<String, dynamic> json) {
        final dynamic raw = json['leads'] ?? json['items'] ?? <dynamic>[];
        if (raw is List) {
          return raw
              .whereType<Map<String, dynamic>>()
              .map(Lead.fromJson)
              .toList(growable: false);
        }
        return <Lead>[];
      },
    );

    if (result.isOk) {
      setState(() {
        _leads = result.data!;
        _loading = false;
      });
    } else {
      // Demo fallback: synthesize mock leads so the user can still see the
      // list UI in action when the backend isn't reachable.
      final List<Lead> mock = _mockLeads(_count.round());
      setState(() {
        _leads = mock;
        _loading = false;
        _error = result.error;
        _debugInfo = 'POST ${MarqaiConfig.generateLeadsPath(api.baseUrl)}\n'
            '→ ${result.error ?? "fallback to mock data"}\n'
            'Status: ${result.statusCode ?? "n/a"}';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Backend unreachable — showing mock leads.'),
            backgroundColor: MarqaiTheme.secondary,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _exportCsv() async {
    if (_leads.isEmpty) return;
    try {
      final List<List<String>> rows = <List<String>>[
        <String>[
          'Company', 'Industry', 'Location', 'Size',
          'Contact', 'Email', 'Phone', 'Website', 'Score', 'Fit Reason',
        ],
        ..._leads.map((Lead l) => l.toCsvRow()),
      ];
      final String csv = const ListToCsvConverter().convert(rows);

      final Directory dir = await getApplicationDocumentsDirectory();
      final String stamp = DateTime.now().toIso8601String().replaceAll(':', '-');
      final File file = File('${dir.path}/marqai-leads-$stamp.csv');
      await file.writeAsString(csv);

      if (mounted) {
        await Clipboard.setData(ClipboardData(text: file.path));
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Exported ${_leads.length} leads to ${file.path}'),
            behavior: SnackBarBehavior.floating,
            action: SnackBarAction(
              label: 'Copy path',
              onPressed: () {
                Clipboard.setData(ClipboardData(text: file.path));
              },
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Export failed: $e'),
            backgroundColor: MarqaiTheme.danger,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return MarqaiScaffold(
      title: 'Leads Generator',
      fab: _leads.isNotEmpty
          ? FloatingActionButton.extended(
              onPressed: _exportCsv,
              icon: const Icon(Icons.download_outlined),
              label: const Text('Export CSV'),
              backgroundColor: MarqaiTheme.primary,
              foregroundColor: Colors.white,
            )
          : null,
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
          children: <Widget>[
            _Field(
              label: 'Product name',
              controller: _productCtrl,
              hint: 'e.g. Marqai Suite',
              validator: _required,
            ),
            const SizedBox(height: 14),
            _Field(
              label: 'Product category',
              controller: _categoryCtrl,
              hint: 'e.g. SaaS Marketing',
              validator: _required,
            ),
            const SizedBox(height: 14),
            _Field(
              label: 'Target market',
              controller: _marketCtrl,
              hint: 'e.g. US / SMB',
              validator: _required,
            ),
            const SizedBox(height: 18),
            _CountSlider(value: _count, onChanged: (double v) => setState(() => _count = v)),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: _loading ? null : _generate,
              icon: const Icon(Icons.auto_awesome_outlined, size: 18),
              label: const Text('Generate leads'),
            ),
            const SizedBox(height: 24),
            if (_loading)
              const LoadingIndicator(label: 'Generating leads…')
            else if (_leads.isEmpty && _error == null)
              const EmptyState(
                icon: Icons.person_search_outlined,
                title: 'No leads yet',
                subtitle: 'Fill the form and tap Generate to discover scored prospects.',
              )
            else if (_leads.isEmpty && _error != null)
              ErrorView(
                title: 'Generation failed',
                message: _error!,
                debugInfo: _debugInfo,
                onRetry: _generate,
              )
            else ...<Widget>[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: <Widget>[
                  Text(
                    '${_leads.length} leads',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: MarqaiTheme.ink,
                    ),
                  ),
                  if (_error != null)
                    Text(
                      'Mock data',
                      style: TextStyle(
                        fontSize: 11,
                        color: MarqaiTheme.secondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              for (final Lead lead in _leads) ...<Widget>[
                _LeadCard(lead: lead),
                const SizedBox(height: 10),
              ],
            ],
          ],
        ),
      ),
    );
  }

  String? _required(String? v) =>
      (v == null || v.trim().isEmpty) ? 'This field is required' : null;

  List<Lead> _mockLeads(int count) {
    final List<String> companies = <String>[
      'Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Hooli',
      'Soylent', 'Stark Industries', 'Wayne Enterprises', 'Wonka', 'Cyberdyne',
      'Massive Dynamic', 'Tyrell', 'Vandelay', 'Pied Piper', 'Dunder Mifflin',
      'Wernham Hogg', 'Vehement Capital', 'Foobar Labs', 'Quantic', 'Nakatomi',
      'Aperture Science', 'Black Mesa', 'Rupture Farms', 'E Corp', 'Primatech',
    ];
    final List<String> industries = <String>[
      'B2B SaaS', 'E-commerce', 'FinTech', 'HealthTech', 'EdTech',
      'MarTech', 'CleanTech', 'Logistics', 'Real Estate', 'Manufacturing',
    ];
    final List<String> locations = <String>[
      'San Francisco, CA', 'Austin, TX', 'New York, NY', 'Boston, MA',
      'Seattle, WA', 'Denver, CO', 'Chicago, IL', 'Atlanta, GA',
      'London, UK', 'Toronto, ON',
    ];
    final List<String> reasons = <String>[
      'Strong ICP match on industry + size',
      'Recently raised Series A — likely budget',
      'Hiring for marketing roles — pain signal',
      'Purchased a competitor — switching window',
      'Active content engagement — top-of-funnel',
      'Tech stack overlaps with Marqai integrations',
    ];
    final List<Lead> out = <Lead>[];
    for (int i = 0; i < count; i++) {
      final int score = 40 + ((i * 17) % 60);
      out.add(Lead(
        companyName: companies[i % companies.length],
        industry: industries[i % industries.length],
        location: locations[i % locations.length],
        fitReason: reasons[i % reasons.length],
        score: score,
        size: '${10 + (i * 7) % 500} employees',
        website: 'https://${companies[i % companies.length].toLowerCase().replaceAll(RegExp(r'[^a-z]'), '')}.com',
        email: 'growth@${companies[i % companies.length].toLowerCase().replaceAll(RegExp(r'[^a-z]'), '')}.com',
      ));
    }
    return out;
  }
}

class _Field extends StatelessWidget {
  const _Field({
    required this.label,
    required this.controller,
    required this.hint,
    required this.validator,
  });

  final String label;
  final TextEditingController controller;
  final String hint;
  final String? Function(String?) validator;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 6),
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: MarqaiTheme.ink,
            ),
          ),
        ),
        TextFormField(
          controller: controller,
          validator: validator,
          decoration: InputDecoration(hintText: hint),
        ),
      ],
    );
  }
}

class _CountSlider extends StatelessWidget {
  const _CountSlider({required this.value, required this.onChanged});

  final double value;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: <Widget>[
            const Text(
              'Number of leads',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: MarqaiTheme.ink,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: MarqaiTheme.primary.withOpacity(0.10),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '${value.round()}',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: MarqaiTheme.primary,
                ),
              ),
            ),
          ],
        ),
        Slider(
          value: value,
          min: 3,
          max: 25,
          divisions: 22,
          activeColor: MarqaiTheme.primary,
          label: '${value.round()}',
          onChanged: onChanged,
        ),
      ],
    );
  }
}

class _LeadCard extends StatelessWidget {
  const _LeadCard({required this.lead});
  final Lead lead;

  @override
  Widget build(BuildContext context) {
    final LeadFitCategory fit = lead.fitCategory;
    final Color chipColor;
    final String chipLabel;
    switch (fit) {
      case LeadFitCategory.hot:
        chipColor = MarqaiTheme.success;
        chipLabel = 'Hot';
        break;
      case LeadFitCategory.warm:
        chipColor = MarqaiTheme.warning;
        chipLabel = 'Warm';
        break;
      case LeadFitCategory.cold:
        chipColor = MarqaiTheme.danger;
        chipLabel = 'Cold';
        break;
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        lead.companyName,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: MarqaiTheme.ink,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${lead.industry} · ${lead.location}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: MarqaiTheme.inkMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: chipColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: <Widget>[
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: chipColor,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '${lead.score} · $chipLabel',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: chipColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (lead.fitReason.isNotEmpty) ...<Widget>[
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    const Icon(Icons.lightbulb_outline, size: 16, color: MarqaiTheme.secondary),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        lead.fitReason,
                        style: const TextStyle(
                          fontSize: 12,
                          color: MarqaiTheme.ink,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            if (lead.size != null || lead.email != null || lead.website != null) ...<Widget>[
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: <Widget>[
                  if (lead.size != null) _MetaChip(icon: Icons.group_outlined, text: lead.size!),
                  if (lead.email != null) _MetaChip(icon: Icons.mail_outline, text: lead.email!),
                  if (lead.website != null) _MetaChip(icon: Icons.link_outlined, text: lead.website!),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Icon(icon, size: 12, color: MarqaiTheme.inkMuted),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(
              fontSize: 11,
              color: MarqaiTheme.inkMuted,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
