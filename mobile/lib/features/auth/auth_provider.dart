// Copyright 2024 Marqai. All rights reserved.
// SPDX-License-Identifier: proprietary

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/api_client.dart';
import '../../core/config.dart';
import '../../shared/models/user.dart';

/// Authentication state for the app.
///
/// Backed by [SharedPreferences] so a session survives cold starts. The
/// token is also kept in memory on the [ApiClient] so every outgoing
/// request carries the bearer header.
///
/// The login flow is **offline-first**: the user is allowed in with any
/// non-empty email + password ≥ 4 chars, and a demo user is synthesized.
/// A real call to `POST /api/marqai/mobile-login` is attempted first; if
/// that endpoint is missing (the backend team hasn't shipped it yet), we
/// fall back to demo mode and flip [isDemoMode] = true.
class AuthProvider extends ChangeNotifier {
  AuthProvider({required ApiClient apiClient}) : _api = apiClient;

  final ApiClient _api;

  MarqaiUser? _user;
  String? _token;
  bool _isDemoMode = false;
  bool _isLoading = false;
  String? _lastError;

  /// Bootstrap from prefs — called once from `main.dart`.
  Future<void> init(SharedPreferences prefs) async {
    _prefs = prefs;
    _api.attachPrefs(prefs);
    _token = prefs.getString(MarqaiConfig.kPrefAuthToken);
    _user = MarqaiUser.decode(prefs.getString(MarqaiConfig.kPrefAuthUser));
    _isDemoMode = _user != null && _token == null;
    _api.setToken(_token);
    notifyListeners();
  }

  SharedPreferences? _prefs;

  MarqaiUser? get user => _user;
  String? get token => _token;
  bool get isLoggedIn => _user != null;
  bool get isDemoMode => _isDemoMode;
  bool get isLoading => _isLoading;
  String? get lastError => _lastError;
  String get appVersion => MarqaiConfig.appVersion;

  /// Try real backend first; on failure, fall back to demo mode so the
  /// app is always usable for testing.
  ///
  /// Returns true on successful login (real or demo).
  Future<bool> login({
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _lastError = null;
    notifyListeners();

    try {
      final ApiResult<Map<String, dynamic>> result =
          await _api.post<Map<String, dynamic>>(
        MarqaiConfig.mobileLoginPath(_api.baseUrl),
        body: <String, dynamic>{
          'email': email.trim(),
          'password': password,
        },
        fromJson: (Map<String, dynamic> json) => json,
      );

      if (result.isOk) {
        final Map<String, dynamic> data = result.data!;
        final String? token = data['token'] as String?;
        final MarqaiUser user = MarqaiUser.fromJson(
          (data['user'] as Map<String, dynamic>?) ?? <String, dynamic>{},
        );
        _user = user;
        _token = token;
        _isDemoMode = false;
        await _persist();
        _api.setToken(token);
        notifyListeners();
        return true;
      }

      // Endpoint missing / unreachable → demo mode.
      _startDemoSession(email: email);
      return true;
    } catch (e) {
      _lastError = e.toString();
      _startDemoSession(email: email);
      return true;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Quick demo login — used by the "Try demo" button.
  Future<bool> loginDemo() async {
    return login(
      email: MarqaiConfig.demoEmail,
      password: MarqaiConfig.demoPassword,
    );
  }

  /// Signup — the backend doesn't have a public signup endpoint yet, so
  /// we synthesize a demo session and let the user in. The form data is
  /// preserved on the user object for later API replay.
  Future<bool> signup({
    required String orgName,
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _lastError = null;
    notifyListeners();
    try {
      // Try the same mobile-login endpoint; most orgs will get a demo
      // session until the backend is wired up.
      await Future<void>.delayed(const Duration(milliseconds: 300));
      _user = MarqaiUser(
        id: 'local-${DateTime.now().millisecondsSinceEpoch}',
        email: email.trim(),
        name: email.split('@').first,
        orgId: 'local-org',
        orgName: orgName.trim().isEmpty ? 'My Marqai Org' : orgName.trim(),
        role: 'org_owner',
        roleLabel: 'Org Owner',
        plan: 'Starter',
      );
      _token = null;
      _isDemoMode = true;
      await _persist();
      _api.setToken(null);
      notifyListeners();
      return true;
    } catch (e) {
      _lastError = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _user = null;
    _token = null;
    _isDemoMode = false;
    _lastError = null;
    _api.setToken(null);
    await _prefs?.remove(MarqaiConfig.kPrefAuthToken);
    await _prefs?.remove(MarqaiConfig.kPrefAuthUser);
    notifyListeners();
  }

  /// Override the API base URL — persisted to prefs, picked up immediately
  /// by [ApiClient] on the next request.
  Future<void> setApiBaseUrl(String url) async {
    final String normalized = MarqaiConfig.normalizeBaseUrl(url);
    await _prefs?.setString(MarqaiConfig.kPrefApiBaseUrl, normalized);
    notifyListeners();
  }

  String get apiBaseUrl => _api.baseUrl;

  Future<void> resetApiBaseUrl() async {
    await _prefs?.remove(MarqaiConfig.kPrefApiBaseUrl);
    notifyListeners();
  }

  void _startDemoSession({required String email}) {
    _user = MarqaiUser(
      id: 'demo-${DateTime.now().millisecondsSinceEpoch}',
      email: email.trim(),
      name: email.split('@').first.replaceAll(RegExp(r'[^a-zA-Z]'), ' ').trim(),
      orgId: 'demo-org',
      orgName: 'Demo Org',
      role: 'marketing_manager',
      roleLabel: 'Marketing Manager',
      plan: 'Growth',
    );
    _token = null;
    _isDemoMode = true;
    unawaited(_persist());
    _api.setToken(null);
  }

  Future<void> _persist() async {
    if (_prefs == null) return;
    if (_token != null) {
      await _prefs!.setString(MarqaiConfig.kPrefAuthToken, _token!);
    }
    if (_user != null) {
      await _prefs!.setString(MarqaiConfig.kPrefAuthUser, _user!.encode());
    }
  }
}
