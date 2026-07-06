// Copyright 2024 Marqai. All rights reserved.
// SPDX-License-Identifier: proprietary

import 'package:flutter/foundation.dart';

/// Global runtime configuration for the Marqai app.
///
/// The API base URL can be overridden at runtime from the Settings screen;
/// the override is persisted to `SharedPreferences` and re-read on launch
/// by [ApiClient].
class MarqaiConfig {
  MarqaiConfig._();

  /// Production API base URL. Always ends without a trailing slash.
  static const String defaultApiBaseUrl = 'https://marqaitools.vercel.app';

  /// Public web app URL (used by url_launcher for "open in browser" links).
  static const String webAppUrl = 'https://marqaitools.vercel.app';

  /// Demo credentials surfaced by the "Try demo" button on the login page.
  static const String demoEmail = 'demo@marqai.app';
  static const String demoPassword = 'demo';

  /// SharedPreferences keys.
  static const String kPrefApiBaseUrl = 'marqai.apiBaseUrl';
  static const String kPrefAuthToken = 'marqai.authToken';
  static const String kPrefAuthUser = 'marqai.authUser';

  /// App metadata surfaced in Settings.
  static const String appName = 'Marqai';
  static const String appVersion = '1.0.0';
  static const String appBuildNumber = '1';

  /// True when running in debug mode (e.g. `flutter run`).
  static bool get isDebug => kDebugMode;

  /// API endpoints, derived from [baseUrl].
  ///
  /// All endpoints live under `/api/marqai/...` and are documented in
  /// `docs/07-api-reference.md` of the web app.
  static String mobileLoginPath(String baseUrl) => '$baseUrl/api/marqai/mobile-login';
  static String generateLeadsPath(String baseUrl) => '$baseUrl/api/marqai/generate-leads';
  static String generateLogoPath(String baseUrl) => '$baseUrl/api/marqai/generate-logo';

  /// Normalize a user-provided URL: trims trailing slashes, defaults to HTTPS.
  static String normalizeBaseUrl(String input) {
    String value = input.trim();
    if (value.isEmpty) return defaultApiBaseUrl;
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      value = 'https://$value';
    }
    while (value.endsWith('/')) {
      value = value.substring(0, value.length - 1);
    }
    return value;
  }
}
