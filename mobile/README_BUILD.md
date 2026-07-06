# Building the Marqai Flutter App

End-to-end build & distribution instructions for the Marqai mobile companion.
You do **not** need a working backend to build or run the app — it ships in
offline-first demo mode.

---

## 1. Prerequisites

| Tool              | Version                  | Notes                                            |
| ----------------- | ------------------------ | ------------------------------------------------ |
| Flutter SDK       | 3.19.0 or newer          | `flutter --version` to verify                    |
| Dart SDK          | bundled with Flutter 3.19| sound null safety is required                    |
| Android Studio    | Hedgehog (2023.1) or new | for Android SDK + emulator                       |
| Xcode             | 15.x                     | macOS only, for iOS builds                       |
| CocoaPods          | 1.13+                    | macOS only, for iOS native plugins               |
| Java JDK          | 17                       | Android Gradle Plugin 8 requires JDK 17          |

Install Flutter: <https://docs.flutter.dev/get-started/install>

Verify your environment:

```bash
flutter doctor -v
```

All green ticks (or at least Flutter + the platform you target) before
proceeding.

---

## 2. Get dependencies

```bash
cd mobile
flutter pub get
```

---

## 3. Run in debug

Attach a device or boot an emulator:

```bash
flutter devices          # list available targets
flutter run              # auto-picks the first device
# or pin a device:
flutter run -d <device-id>
```

Hot reload with `r`, hot restart with `R`, quit with `q`.

---

## 4. Analyze (CI gate)

```bash
flutter analyze
```

Expected: `No issues found!` The CI workflow in
`.github/workflows/flutter-build.yml` enforces this.

---

## 5. Build a release APK (Android)

```bash
flutter build apk --release
```

Output:

```
mobile/build/app/outputs/flutter-apk/app-release.apk
```

### Build a fat APK vs. split APKs

Fat APK (single file, all ABIs):

```bash
flutter build apk --release --target-platform android-arm,android-arm64,android-x64
```

Split per-ABI (smaller per-file):

```bash
flutter build apk --release --split-per-abi
# outputs:
#   app-armeabi-v7a-release.apk
#   app-arm64-v8a-release.apk
#   app-x86_64-release.apk
```

---

## 6. Build an App Bundle (Google Play)

```bash
flutter build appbundle --release
```

Output:

```
mobile/build/app/outputs/bundle/release/app-release.aab
```

Upload to the Play Console under **Release → Production / Internal testing**.

---

## 7. Build for iOS (macOS only)

```bash
flutter build ios --release
```

Then open `mobile/ios/Runner.xcworkspace` in Xcode:

1. Set the **Team** under **Signing & Capabilities**.
2. Set the **Bundle Identifier** to `com.marqai.app` (or your team's reverse
   domain).
3. Archive: **Product → Archive**.
4. Distribute via **TestFlight** or **Ad Hoc** with a provisioning profile.

> The default `Info.plist` ships with `NSAppTransportSecurity` exceptions for
> `localhost` and `marqaitools.vercel.app` so dev HTTP works without extra
> setup.

---

## 8. Install the APK on a physical Android phone

1. Enable **Developer options** (tap **Build number** 7 times in
   **Settings → About phone**).
2. Enable **USB debugging** under **Settings → Developer options**.
3. (Optional) Enable **Install unknown apps** for your file manager under
   **Settings → Apps → Special access**.
4. Transfer `app-release.apk` to the phone (USB, Drive, email — whatever).
5. Open the file from the phone's file manager and tap **Install**.

Or, with `adb`:

```bash
adb install -r build/app/outputs/flutter-apk/app-release.apk
```

---

## 9. Install on iOS

Pick one:

### TestFlight
1. Archive in Xcode → **Distribute App → TestFlight**.
2. Add testers in App Store Connect.

### Ad Hoc
1. Register device UDID in your Apple Developer portal.
2. Add device to a provisioning profile.
3. Archive → **Distribute App → Ad Hoc** → export `.ipa`.
4. Install via Apple Configurator 2, Transporter, or Diawi.

---

## 10. Change the API base URL

Two ways:

**Runtime (no rebuild):**
1. Launch the app.
2. Sign in (demo mode is fine).
3. Open **Settings → API base URL**.
4. Enter your endpoint (e.g. `http://10.0.2.2:3000` for an Android emulator
   hitting a local Next.js dev server).
5. Tap **Save**. The Dio client picks up the new URL on the next request.

**Compile-time default:**
Edit `lib/core/config.dart`:

```dart
static const String defaultApiBaseUrl = 'https://marqaitools.vercel.app';
```

---

## 11. CI

`.github/workflows/flutter-build.yml` runs on every push to `main` that touches
`mobile/**`. It:

1. Checks out the repo.
2. Installs Flutter 3.19.
3. Runs `flutter pub get`.
4. Runs `flutter analyze`.
5. Runs `flutter build apk --release`.
6. Uploads the APK as a 30-day artifact.

Download the artifact from the **Actions** tab on GitHub.

---

## 12. Troubleshooting

| Symptom                                         | Fix                                                            |
| ----------------------------------------------- | -------------------------------------------------------------- |
| `flutter doctor` shows Android license issues  | `flutter doctor --android-licenses` and accept all             |
| iOS build fails on `pod install`               | `cd ios && pod install --repo-update`                          |
| APK installs but crashes on launch             | Check `adb logcat` for the stack trace; ensure minSdk 21+      |
| Login says "Demo mode"                          | Expected — backend `/api/marqai/mobile-login` is a TODO       |
| `flutter analyze` fails in CI                   | Run `flutter pub get` first; the lint rules need the SDK       |
