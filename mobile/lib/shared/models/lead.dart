// Copyright 2024 Marqai. All rights reserved.
// SPDX-License-Identifier: proprietary

/// A single lead returned by `POST /api/marqai/generate-leads`.
///
/// The backend (web app `src/app/api/marqai/generate-leads/route.ts`) returns
/// a JSON object with the fields below; if the backend ever adds more, this
/// model silently preserves them under [extras] so we never drop data.
class Lead {
  Lead({
    required this.companyName,
    required this.industry,
    required this.location,
    required this.fitReason,
    required this.score,
    this.website,
    this.contactName,
    this.email,
    this.phone,
    this.size,
    this.extras,
  });

  factory Lead.fromJson(Map<String, dynamic> json) {
    final Set<String> known = <String>{
      'companyName', 'industry', 'location', 'fitReason', 'score',
      'website', 'contactName', 'email', 'phone', 'size',
    };
    final Map<String, dynamic> extra = Map<String, dynamic>.from(json)
      ..removeWhere((String k, _) => known.contains(k));
    return Lead(
      companyName: (json['companyName'] as String?) ?? (json['company'] as String?) ?? 'Unknown',
      industry: (json['industry'] as String?) ?? '—',
      location: (json['location'] as String?) ?? '—',
      fitReason: (json['fitReason'] as String?) ?? (json['reason'] as String?) ?? '',
      score: ((json['score'] as num?) ?? 0).toInt(),
      website: json['website'] as String?,
      contactName: json['contactName'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      size: json['size'] as String?,
      extras: extra.isEmpty ? null : extra,
    );
  }

  final String companyName;
  final String industry;
  final String location;
  final String fitReason;
  final int score;
  final String? website;
  final String? contactName;
  final String? email;
  final String? phone;
  final String? size;
  final Map<String, dynamic>? extras;

  /// 0–100 fit score bucket, drives the chip color on the leads screen.
  LeadFitCategory get fitCategory {
    if (score >= 80) return LeadFitCategory.hot;
    if (score >= 60) return LeadFitCategory.warm;
    return LeadFitCategory.cold;
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'companyName': companyName,
        'industry': industry,
        'location': location,
        'fitReason': fitReason,
        'score': score,
        if (website != null) 'website': website,
        if (contactName != null) 'contactName': contactName,
        if (email != null) 'email': email,
        if (phone != null) 'phone': phone,
        if (size != null) 'size': size,
        if (extras != null) ...extras!,
      };

  /// Flatten to a CSV row in the canonical export column order.
  List<String> toCsvRow() => <String>[
        companyName,
        industry,
        location,
        size ?? '',
        contactName ?? '',
        email ?? '',
        phone ?? '',
        website ?? '',
        score.toString(),
        fitReason,
      ];

  @override
  String toString() => 'Lead($companyName · $industry · score=$score)';
}

enum LeadFitCategory { hot, warm, cold }
