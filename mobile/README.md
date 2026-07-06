# Marqai — Mobile App (Flutter)

Companion mobile app for **Marqai**, the AI Marketing SaaS suite. Built with
Flutter 3.19+ targeting Android (minSdk 21) and iOS 14+. The app talks to the
same backend that powers the web app at https://marqaitools.vercel.app.

> Status: **Demo-first build.** The login screen ships in offline-first demo
> mode so the app is immediately runnable without a backend, while all the API
> plumbing (Dio client, token persistence, `Authorization: Bearer ...` header)
> is in place for when the `/api/marqai/mobile-login` endpoint lands.

---

## Features

- **Login & Signup** — polished gradient login page with email/password
  validation, "Try demo" auto-fill, and an offline-first demo mode.
- **Dashboard** — KPI cards (Reach, Scheduled Posts, Open Rate, AI Tools
  Tested), quick actions, pull-to-refresh.
- **Modules grid** — all 15 Marqai modules with Material icons and deep links
  to the modules that have a mobile implementation.
- **Leads Generator** — form (product, category, market, count slider 3–25),
  calls `POST /api/marqai/generate-leads`, renders scored lead cards with
  color-coded fit chips, exports CSV to app documents directory.
- **Logo Builder** — brand/tagline/industry inputs, style dropdown
  (minimal/wordmark/emblem/mascot/abstract/monogram/gradient), 3-color
  palette picker, AI / Template mode toggle, calls
  `POST /api/marqai/generate-logo`, previews the returned image URL.
- **Settings** — logout, change API base URL, app version, build mode banner.
- **Navigation drawer** — every module reachable from anywhere.
- **Auth provider** — `ChangeNotifier` persisted to `SharedPreferences` with
  `isLoggedIn`, `user`, `token`, `login()`, `logout()`.
- **API client** — Dio with 30s timeouts, bearer-token interceptor, debug
  logging.
- **Material 3 theme** — Marqai teal `#0d9488` + amber `#f59e0b` on
  `#f8fafc` background.

---

## Tech stack

| Layer            | Choice                                           |
| ---------------- | ------------------------------------------------ |
| UI framework     | Flutter 3.19+ (Material 3)                       |
| Language         | Dart 3.2+ (sound null safety)                    |
| HTTP             | Dio 5.x                                          |
| State management | Provider 6.x                                     |
| Persistence      | shared_preferences 2.x                           |
| Typography       | google_fonts (Inter / Poppins)                   |
| Icons            | cupertino_icons + Material Icons                 |
| Images           | cached_network_image + flutter_svg               |
| CSV export       | csv + path_provider                              |
| Launcher         | url_launcher (open web app deep-links)           |
| File picker      | file_picker                                       |

---

## Screenshots

> Place screenshots under `mobile/assets/screenshots/` and re-export the
> `assets/` folder in `pubspec.yaml`. Slots reserved:

- `assets/screenshots/login.png`
- `assets/screenshots/dashboard.png`
- `assets/screenshots/modules.png`
- `assets/screenshots/leads.png`
- `assets/screenshots/logo-builder.png`
- `assets/screenshots/settings.png`

---

## Project structure

```
mobile/
├── pubspec.yaml
├── analysis_options.yaml
├── README.md             (this file)
├── README_BUILD.md       (build APK / iOS / App Bundle instructions)
├── .gitignore
├── android/              (Gradle + Kotlin MainActivity)
├── ios/Runner/           (Info.plist with ATS exceptions for dev)
├── lib/
│   ├── main.dart
│   ├── app.dart
│   ├── core/
│   │   ├── theme.dart
│   │   ├── config.dart
│   │   └── api_client.dart
│   ├── features/
│   │   ├── auth/         (login_page, signup_page, auth_provider)
│   │   ├── dashboard/
│   │   ├── modules/      (module_list_page, module_placeholder)
│   │   ├── leads/
│   │   ├── logo_builder/
│   │   └── settings/
│   └── shared/
│       ├── widgets/      (marqai_scaffold, marqai_drawer, empty_state, error_view, loading_indicator)
│       └── models/       (user, lead)
└── assets/               (logo + screenshots)
```

---

## Building

See **[README_BUILD.md](./README_BUILD.md)** for full step-by-step build
instructions (APK, iOS, App Bundle, distribution).

Quick start:

```bash
cd mobile
flutter pub get
flutter run                 # debug on attached device / emulator
flutter build apk --release # produces build/app/outputs/flutter-apk/app-release.apk
```

---

## Configuration

The API base URL defaults to `https://marqaitools.vercel.app`. Override it at
runtime from **Settings → API base URL** — the value is persisted to
`SharedPreferences` and immediately picked up by the Dio client.

Flip the `isDebug` flag in `lib/core/config.dart` to enable verbose request
logging.

---

## License

Proprietary — Marqai © 2024.
