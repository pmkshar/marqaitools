// Copyright 2024 Marqai. All rights reserved.
// SPDX-License-Identifier: proprietary

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme.dart';
import 'features/auth/auth_provider.dart';
import 'features/auth/login_page.dart';
import 'features/auth/signup_page.dart';
import 'features/dashboard/dashboard_page.dart';
import 'features/leads/leads_page.dart';
import 'features/logo_builder/logo_builder_page.dart';
import 'features/modules/module_list_page.dart';
import 'features/modules/module_placeholder.dart';
import 'features/settings/settings_page.dart';

/// Root widget — owns the [MaterialApp] and the named-route table.
///
/// Listens to [AuthProvider] so the home route flips between the login
/// page and the dashboard when the user's session changes.
class MarqaiApp extends StatelessWidget {
  const MarqaiApp({super.key});

  @override
  Widget build(BuildContext context) {
    final AuthProvider auth = context.watch<AuthProvider>();

    return MaterialApp(
      title: 'Marqai',
      debugShowCheckedModeBanner: false,
      theme: MarqaiTheme.light(),
      darkTheme: MarqaiTheme.dark(),
      themeMode: ThemeMode.light,
      initialRoute: auth.isLoggedIn ? '/dashboard' : '/login',
      onGenerateRoute: (RouteSettings settings) {
        // Handle /module/<slug> for the generic module placeholder.
        if (settings.name?.startsWith('/module/') ?? false) {
          final String slug = settings.name!.split('/').last;
          return MaterialPageRoute<void>(
            settings: settings,
            builder: (_) => ModulePlaceholder(slug: slug),
          );
        }
        final PageBuilder? builder = _routes[settings.name];
        return MaterialPageRoute<void>(
          settings: settings,
          builder: (_) => builder != null
              ? builder(settings)
              : const Scaffold(
                  body: Center(child: Text('Route not found')),
                ),
        );
      },
    );
  }

  // Static so we don't re-allocate per build.
  static final Map<String, PageBuilder> _routes = <String, PageBuilder>{
    '/login': (_) => const LoginPage(),
    '/signup': (_) => const SignupPage(),
    '/dashboard': (_) => const DashboardPage(),
    '/modules': (_) => const ModuleListPage(),
    '/leads': (_) => const LeadsPage(),
    '/logo-builder': (_) => const LogoBuilderPage(),
    '/settings': (_) => const SettingsPage(),
  };
}

typedef PageBuilder = Widget Function(RouteSettings settings);
