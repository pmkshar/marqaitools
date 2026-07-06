// Copyright 2024 Marqai. All rights reserved.
// SPDX-License-Identifier: proprietary

import 'dart:convert';

/// The signed-in Marqai user.
///
/// Mirrors the principal shape produced by the web app's `auth.ts` + RBAC
/// engine — only the fields the mobile app actually needs are kept here.
class MarqaiUser {
  MarqaiUser({
    required this.id,
    required this.email,
    required this.name,
    required this.orgId,
    required this.orgName,
    required this.role,
    this.roleLabel,
    this.plan = 'Starter',
    this.avatarUrl,
  });

  factory MarqaiUser.fromJson(Map<String, dynamic> json) {
    return MarqaiUser(
      id: json['id'] as String? ?? '',
      email: json['email'] as String? ?? '',
      name: json['name'] as String? ?? json['email'] as String? ?? 'Marqai user',
      orgId: json['orgId'] as String? ?? json['organizationId'] as String? ?? '',
      orgName: json['orgName'] as String? ?? json['organizationName'] as String? ?? 'Marqai',
      role: json['role'] as String? ?? 'viewer',
      roleLabel: json['roleLabel'] as String?,
      plan: json['plan'] as String? ?? 'Starter',
      avatarUrl: json['avatarUrl'] as String?,
    );
  }

  final String id;
  final String email;
  final String name;
  final String orgId;
  final String orgName;
  final String role;
  final String? roleLabel;
  final String plan;
  final String? avatarUrl;

  /// User-friendly role label (falls back to the slug capitalized).
  String get displayRole => roleLabel ?? _capitalize(role);

  /// Two-letter avatar initials (e.g. "Jane Doe" → "JD").
  String get initials {
    final List<String> parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return 'M';
    if (parts.length == 1) {
      return parts.first[0].toUpperCase();
    }
    final String first = parts.first[0];
    final String second = parts[1][0];
    return '$first$second'.toUpperCase();
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'email': email,
        'name': name,
        'orgId': orgId,
        'orgName': orgName,
        'role': role,
        'roleLabel': roleLabel,
        'plan': plan,
        'avatarUrl': avatarUrl,
      };

  /// Compact JSON for SharedPreferences persistence.
  String encode() => jsonEncode(toJson());

  static MarqaiUser? decode(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    try {
      return MarqaiUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  MarqaiUser copyWith({
    String? id,
    String? email,
    String? name,
    String? orgId,
    String? orgName,
    String? role,
    String? roleLabel,
    String? plan,
    String? avatarUrl,
  }) {
    return MarqaiUser(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      orgId: orgId ?? this.orgId,
      orgName: orgName ?? this.orgName,
      role: role ?? this.role,
      roleLabel: roleLabel ?? this.roleLabel,
      plan: plan ?? this.plan,
      avatarUrl: avatarUrl ?? this.avatarUrl,
    );
  }

  static String _capitalize(String s) =>
      s.isEmpty ? s : '${s[0].toUpperCase()}${s.substring(1)}';

  @override
  String toString() => 'MarqaiUser($email @ $orgName as $role)';
}
