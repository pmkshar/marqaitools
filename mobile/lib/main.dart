// Copyright 2024 Marqai. All rights reserved.
// SPDX-License-Identifier: proprietary

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:provider/single_child_widget.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'core/api_client.dart';
import 'features/auth/auth_provider.dart';

Future<void> main() async {
  // Required for async work in main before runApp.
  WidgetsFlutterBinding.ensureInitialized();

  final SharedPreferences prefs = await SharedPreferences.getInstance();
  final ApiClient apiClient = ApiClient(prefs: prefs);

  final AuthProvider authProvider = AuthProvider(apiClient: apiClient);
  await authProvider.init(prefs);

  runApp(
    MultiProvider(
      providers: <SingleChildWidget>[
        Provider<ApiClient>.value(value: apiClient),
        ChangeNotifierProvider<AuthProvider>.value(value: authProvider),
      ],
      child: const MarqaiApp(),
    ),
  );
}
