// Copyright 2024 Marqai. All rights reserved.
// SPDX-License-Identifier: proprietary

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/config.dart';
import '../../core/theme.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_view.dart';
import '../../shared/widgets/loading_indicator.dart';
import '../../shared/widgets/marqai_scaffold.dart';

/// Logo Builder — wraps `POST /api/marqai/generate-logo`.
///
/// Inputs: brand name, tagline, industry, style (7 options), 3-color
/// palette, mode toggle (AI / Template). On submit the API is called and
/// the returned image URL is previewed via [CachedNetworkImage]. If the
/// backend is unreachable, a locally-generated SVG (same palette / brand
/// initial) is rendered via [flutter_svg] so the preview UI is always
/// useful.
class LogoBuilderPage extends StatefulWidget {
  const LogoBuilderPage({super.key});

  @override
  State<LogoBuilderPage> createState() => _LogoBuilderPageState();
}

class _LogoBuilderPageState extends State<LogoBuilderPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _brandCtrl = TextEditingController(text: 'Marqai');
  final TextEditingController _taglineCtrl = TextEditingController(text: 'AI marketing, on the go.');
  final TextEditingController _industryCtrl = TextEditingController(text: 'SaaS');

  String _style = 'minimal';
  List<Color> _palette = const <Color>[
    Color(0xFF0D9488),
    Color(0xFFF59E0B),
    Color(0xFF0F172A),
  ];
  bool _aiMode = true;

  bool _loading = false;
  String? _imageUrl;
  String? _fallbackSvg;
  String? _error;
  String? _debugInfo;

  static const List<_LogoStyle> _styles = <_LogoStyle>[
    _LogoStyle(slug: 'minimal', label: 'Minimal'),
    _LogoStyle(slug: 'wordmark', label: 'Wordmark'),
    _LogoStyle(slug: 'emblem', label: 'Emblem'),
    _LogoStyle(slug: 'mascot', label: 'Mascot'),
    _LogoStyle(slug: 'abstract', label: 'Abstract'),
    _LogoStyle(slug: 'monogram', label: 'Monogram'),
    _LogoStyle(slug: 'gradient', label: 'Gradient'),
  ];

  static const List<List<Color>> _palettePresets = <List<Color>>[
    <Color>[Color(0xFF0D9488), Color(0xFFF59E0B), Color(0xFF0F172A)],
    <Color>[Color(0xFF3B82F6), Color(0xFFEC4899), Color(0xFF0F172A)],
    <Color>[Color(0xFF22C55E), Color(0xFF06B6D4), Color(0xFF0F172A)],
    <Color>[Color(0xFFEF4444), Color(0xFFF59E0B), Color(0xFF111827)],
    <Color>[Color(0xFF8B5CF6), Color(0xFF06B6D4), Color(0xFF0F172A)],
    <Color>[Color(0xFF111827), Color(0xFF64748B), Color(0xFFFFFFFF)],
  ];

  Future<void> _generate() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _loading = true;
      _error = null;
      _debugInfo = null;
      _imageUrl = null;
      _fallbackSvg = null;
    });

    final ApiClient api = context.read<ApiClient>();
    final ApiResult<String> result = await api.post<String>(
      MarqaiConfig.generateLogoPath(api.baseUrl),
      body: <String, dynamic>{
        'brandName': _brandCtrl.text.trim(),
        'tagline': _taglineCtrl.text.trim(),
        'industry': _industryCtrl.text.trim(),
        'style': _style,
        'palette': _palette
            .map((Color c) => '#${_hex(c)}')
            .toList(),
        'mode': _aiMode ? 'ai' : 'template',
      },
      fromJson: (Map<String, dynamic> json) {
        final String? url = json['imageUrl'] as String? ?? json['url'] as String?;
        return url ?? '';
      },
    );

    if (result.isOk && (result.data?.isNotEmpty ?? false)) {
      setState(() {
        _imageUrl = result.data;
        _loading = false;
      });
    } else {
      // Fallback: synthesize an inline SVG logo so the preview UI is
      // always visible even without a backend.
      setState(() {
        _fallbackSvg = _fallbackSvgMarkup();
        _loading = false;
        _error = result.error;
        _debugInfo = 'POST ${MarqaiConfig.generateLogoPath(api.baseUrl)}\n'
            '→ ${result.error ?? "fallback to local SVG"}\n'
            'Status: ${result.statusCode ?? "n/a"}';
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Backend unreachable — showing placeholder logo.'),
            backgroundColor: MarqaiTheme.secondary,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  String _hex(Color c) => c.value.toRadixString(16).substring(2).toUpperCase();

  String _fallbackSvgMarkup() {
    final String hex1 = '#${_hex(_palette[0])}';
    final String hex2 = '#${_hex(_palette[1])}';
    final String initial = _brandCtrl.text.trim().isEmpty
        ? 'M'
        : _brandCtrl.text.trim()[0].toUpperCase();
    final String brand = _brandCtrl.text.trim().isEmpty ? 'Brand' : _brandCtrl.text.trim();
    return '''
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="$hex1"/>
      <stop offset="100%" stop-color="$hex2"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" rx="80" fill="url(#g)"/>
  <text x="200" y="220" font-family="Arial, sans-serif"
        font-size="180" font-weight="800"
        text-anchor="middle" fill="white">$initial</text>
  <text x="200" y="320" font-family="Arial, sans-serif"
        font-size="28" font-weight="600"
        text-anchor="middle" fill="white" opacity="0.85">$brand</text>
</svg>''';
  }

  Future<void> _download() async {
    // TODO: implement gallery save via the `gal` plugin or
    // image_gallery_saver. For now, surface a hint via a SnackBar.
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Download is wired up in a follow-up — long-press the preview to share instead.',
        ),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MarqaiScaffold(
      title: 'Logo Builder',
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: <Widget>[
            _Field(
              label: 'Brand name',
              controller: _brandCtrl,
              hint: 'e.g. Marqai',
              validator: _required,
            ),
            const SizedBox(height: 14),
            _Field(
              label: 'Tagline',
              controller: _taglineCtrl,
              hint: 'e.g. AI marketing, on the go.',
              validator: _required,
            ),
            const SizedBox(height: 14),
            _Field(
              label: 'Industry',
              controller: _industryCtrl,
              hint: 'e.g. SaaS',
              validator: _required,
            ),
            const SizedBox(height: 18),
            const _Label(text: 'Style'),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _styles.map((_LogoStyle s) {
                final bool selected = s.slug == _style;
                return ChoiceChip(
                  label: Text(s.label),
                  selected: selected,
                  selectedColor: MarqaiTheme.primary,
                  labelStyle: TextStyle(
                    color: selected ? Colors.white : MarqaiTheme.ink,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                  onSelected: (_) => setState(() => _style = s.slug),
                );
              }).toList(),
            ),
            const SizedBox(height: 18),
            const _Label(text: 'Color palette'),
            const SizedBox(height: 8),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: _palettePresets.map((List<Color> p) {
                final bool selected = _listEquals(p, _palette);
                return GestureDetector(
                  onTap: () => setState(() => _palette = List<Color>.from(p)),
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: selected ? MarqaiTheme.primary : const Color(0xFFE2E8F0),
                        width: selected ? 2 : 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: p
                          .map((Color c) => Container(
                                width: 24,
                                height: 24,
                                decoration: BoxDecoration(
                                  color: c,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ))
                          .toList(),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 18),
            const _Label(text: 'Mode'),
            const SizedBox(height: 8),
            SegmentedButton<bool>(
              segments: const <ButtonSegment<bool>>[
                ButtonSegment<bool>(
                  value: true,
                  icon: Icon(Icons.auto_awesome_outlined, size: 18),
                  label: Text('AI'),
                ),
                ButtonSegment<bool>(
                  value: false,
                  icon: Icon(Icons.grid_view_outlined, size: 18),
                  label: Text('Template'),
                ),
              ],
              selected: <bool>{_aiMode},
              onSelectionChanged: (Set<bool> s) => setState(() => _aiMode = s.first),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _loading ? null : _generate,
              icon: const Icon(Icons.brush_outlined, size: 18),
              label: const Text('Generate logo'),
            ),
            const SizedBox(height: 24),
            const _Label(text: 'Preview'),
            const SizedBox(height: 8),
            if (_loading)
              const LoadingIndicator(label: 'Generating logo…', inline: true)
            else if (_imageUrl == null && _fallbackSvg == null && _error == null)
              const EmptyState(
                icon: Icons.image_outlined,
                title: 'No logo yet',
                subtitle: 'Pick a style and tap Generate to see a preview here.',
              )
            else if (_imageUrl == null && _fallbackSvg == null && _error != null)
              ErrorView(
                title: 'Generation failed',
                message: _error!,
                debugInfo: _debugInfo,
                onRetry: _generate,
              )
            else
              _Preview(
                imageUrl: _imageUrl,
                svgMarkup: _fallbackSvg,
                onDownload: _download,
              ),
          ],
        ),
      ),
    );
  }

  String? _required(String? v) =>
      (v == null || v.trim().isEmpty) ? 'This field is required' : null;

  bool _listEquals(List<Color> a, List<Color> b) {
    if (a.length != b.length) return false;
    for (int i = 0; i < a.length; i++) {
      if (a[i].value != b[i].value) return false;
    }
    return true;
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
        _Label(text: label),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          validator: validator,
          decoration: InputDecoration(hintText: hint),
        ),
      ],
    );
  }
}

class _Label extends StatelessWidget {
  const _Label({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: MarqaiTheme.ink,
      ),
    );
  }
}

class _Preview extends StatelessWidget {
  const _Preview({
    required this.imageUrl,
    required this.svgMarkup,
    required this.onDownload,
  });

  final String? imageUrl;
  final String? svgMarkup;
  final VoidCallback onDownload;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: AspectRatio(
            aspectRatio: 1,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: _renderImage(),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: <Widget>[
            Expanded(
              child: OutlinedButton.icon(
                onPressed: onDownload,
                icon: const Icon(Icons.download_outlined, size: 18),
                label: const Text('Download'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _renderImage() {
    if (imageUrl != null) {
      return CachedNetworkImage(
        imageUrl: imageUrl!,
        fit: BoxFit.contain,
        placeholder: (_, __) => const LoadingIndicator(inline: true),
        errorWidget: (_, __, ___) => const ErrorView(
          title: 'Image failed',
          message: 'Could not load the preview image.',
        ),
      );
    }
    return SvgPicture.string(
      svgMarkup!,
      fit: BoxFit.contain,
    );
  }
}

class _LogoStyle {
  const _LogoStyle({required this.slug, required this.label});
  final String slug;
  final String label;
}
