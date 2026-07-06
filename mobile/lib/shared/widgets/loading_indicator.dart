// Copyright 2024 Marqai. All rights reserved.
// SPDX-License-Identifier: proprietary

import 'package:flutter/material.dart';

import '../../core/theme.dart';

/// Generic full-screen loading spinner used during async operations.
class LoadingIndicator extends StatelessWidget {
  const LoadingIndicator({
    super.key,
    this.label = 'Loading…',
    this.inline = false,
  });

  final String label;
  final bool inline;

  @override
  Widget build(BuildContext context) {
    final Widget content = Column(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        const SizedBox(
          width: 28,
          height: 28,
          child: CircularProgressIndicator(
            strokeWidth: 2.5,
            color: MarqaiTheme.primary,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          label,
          style: const TextStyle(fontSize: 13, color: MarqaiTheme.inkMuted),
        ),
      ],
    );

    if (inline) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
        child: Center(child: content),
      );
    }
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: content,
      ),
    );
  }
}
