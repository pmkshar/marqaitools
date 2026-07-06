// Copyright 2024 Marqai. All rights reserved.
// SPDX-License-Identifier: proprietary

import 'dart:convert';
import 'dart:developer' as developer;

import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'config.dart';

/// Generic envelope returned by Marqai endpoints.
///
/// Most Marqai routes return either:
///   { "ok": true,  "data": <T> }
///   { "ok": false, "error": "..." }
class ApiResult<T> {
  ApiResult({required this.ok, this.data, this.error, this.statusCode});

  final bool ok;
  final T? data;
  final String? error;
  final int? statusCode;

  bool get isOk => ok && data != null;

  factory ApiResult.success(T data, {int? statusCode}) =>
      ApiResult<T>(ok: true, data: data, statusCode: statusCode);

  factory ApiResult.failure(String error, {int? statusCode}) =>
      ApiResult<T>(ok: false, error: error, statusCode: statusCode);
}

/// Dio-based HTTP client with auth-token injection + debug logging.
///
/// The base URL is read from `SharedPreferences` on every request via the
/// [MarqaiInterceptor]; this means changes from the Settings screen are
/// picked up immediately, with no need to recreate the client.
class ApiClient {
  ApiClient({Dio? dio, SharedPreferences? prefs})
      : _dio = dio ?? Dio(),
        _prefs = prefs {
    _configureDio();
  }

  final Dio _dio;
  SharedPreferences? _prefs;

  /// Allow the auth provider to inject the live [SharedPreferences] after
  /// the client is constructed (chicken-and-egg during bootstrap).
  // ignore: use_setters_to_change_properties
  void attachPrefs(SharedPreferences prefs) => _prefs = prefs;

  /// Cached bearer token — kept in memory for speed, mirrored to prefs by
  /// the auth provider. Updated via [setToken].
  String? _token;
  String? get token => _token;
  void setToken(String? token) => _token = token;

  /// Current base URL — either from prefs (user override) or the default.
  String get baseUrl {
    final String? stored = _prefs?.getString(MarqaiConfig.kPrefApiBaseUrl);
    return MarqaiConfig.normalizeBaseUrl(stored ?? MarqaiConfig.defaultApiBaseUrl);
  }

  void _configureDio() {
    _dio
      ..connectTimeout = const Duration(seconds: 30)
      ..receiveTimeout = const Duration(seconds: 30)
      ..sendTimeout = const Duration(seconds: 30)
      ..options.followRedirects = true
      ..options.validateStatus = (int? status) =>
          status != null && status >= 200 && status < 300
      ..interceptors.add(MarqaiInterceptor(this));
  }

  /// POST helper that returns a typed [ApiResult].
  ///
  /// `fromJson` decodes the response body (the `data` field of the standard
  /// Marqai envelope). On any failure — network, non-2xx, malformed body —
  /// an [ApiResult.failure] is returned with a human-readable message.
  Future<ApiResult<T>> post<T>(
    String pathKey, {
    required Map<String, dynamic> body,
    required T Function(Map<String, dynamic> json) fromJson,
  }) async {
    final String url = pathKey;
    try {
      final Response<Map<String, dynamic>> response = await _dio.post<Map<String, dynamic>>(
        url,
        data: body,
        options: Options(headers: <String, String>{
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }),
      );
      final Map<String, dynamic> payload = response.data ?? <String, dynamic>{};
      final bool ok = (payload['ok'] as bool?) ?? false;
      if (!ok) {
        final String msg = (payload['error'] as String?) ?? 'Unknown API error';
        return ApiResult<T>.failure(msg, statusCode: response.statusCode);
      }
      final dynamic data = payload['data'] ?? payload;
      if (data is! Map<String, dynamic>) {
        return ApiResult<T>.failure(
          'Malformed response: expected JSON object, got ${data.runtimeType}',
          statusCode: response.statusCode,
        );
      }
      return ApiResult<T>.success(fromJson(data), statusCode: response.statusCode);
    } on DioException catch (e, st) {
      developer.log('DioException on POST $url', error: e, stackTrace: st);
      return ApiResult<T>.failure(_dioErrorToString(e), statusCode: e.response?.statusCode);
    } catch (e, st) {
      developer.log('Unexpected error on POST $url', error: e, stackTrace: st);
      return ApiResult<T>.failure(e.toString());
    }
  }

  /// GET helper — used by the dashboard to fetch KPIs once the endpoint
  /// exists. Currently unused; reserved for future use.
  Future<ApiResult<T>> get<T>(
    String url, {
    required T Function(Map<String, dynamic> json) fromJson,
  }) async {
    try {
      final Response<Map<String, dynamic>> response =
          await _dio.get<Map<String, dynamic>>(url);
      final Map<String, dynamic> payload = response.data ?? <String, dynamic>{};
      final bool ok = (payload['ok'] as bool?) ?? false;
      if (!ok) {
        return ApiResult<T>.failure(
          (payload['error'] as String?) ?? 'Unknown API error',
          statusCode: response.statusCode,
        );
      }
      final dynamic data = payload['data'] ?? payload;
      return data is Map<String, dynamic>
          ? ApiResult<T>.success(fromJson(data), statusCode: response.statusCode)
          : ApiResult<T>.failure('Malformed response');
    } on DioException catch (e) {
      return ApiResult<T>.failure(_dioErrorToString(e), statusCode: e.response?.statusCode);
    } catch (e) {
      return ApiResult<T>.failure(e.toString());
    }
  }

  String _dioErrorToString(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Network timeout. Check your connection and try again.';
      case DioExceptionType.connectionError:
        return 'Could not reach the Marqai server. The endpoint may not exist yet '
            '(backend is still being wired up).';
      case DioExceptionType.badResponse:
        final int? code = e.response?.statusCode;
        final String? serverError =
            (e.response?.data is Map<String, dynamic>)
                ? (e.response!.data as Map<String, dynamic>)['error'] as String?
                : null;
        return serverError ?? 'Server returned $code.';
      case DioExceptionType.cancel:
        return 'Request was cancelled.';
      case DioExceptionType.badCertificate:
        return 'TLS certificate error.';
      case DioExceptionType.unknown:
        return e.message ?? 'Unknown network error.';
    }
  }
}

/// Interceptor that injects the bearer token + reads the base URL from
/// SharedPreferences on every request.
class MarqaiInterceptor extends Interceptor {
  MarqaiInterceptor(this._client);

  final ApiClient _client;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    options.baseUrl = '';
    final String? token = _client.token;
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    if (MarqaiConfig.isDebug) {
      developer.log(
        '→ ${options.method} ${options.path}\n'
        '  headers: ${options.headers}\n'
        '  body: ${jsonEncode(options.data ?? <String, dynamic>{})}',
        name: 'marqai.api',
      );
    }
    handler.next(options);
  }

  @override
  void onResponse(Response<dynamic> response, ResponseInterceptorHandler handler) {
    if (MarqaiConfig.isDebug) {
      developer.log(
        '← ${response.statusCode} ${response.requestOptions.path}\n'
        '  body: ${jsonEncode(response.data)}',
        name: 'marqai.api',
      );
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (MarqaiConfig.isDebug) {
      developer.log(
        '✗ ${err.requestOptions.method} ${err.requestOptions.path} → ${err.type} ${err.message}',
        name: 'marqai.api',
        error: err,
      );
    }
    handler.next(err);
  }
}
