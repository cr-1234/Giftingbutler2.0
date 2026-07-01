# Gifting Butler Mobile App

This repo now includes Capacitor projects for Android and iOS.

## What was added

- `capacitor.config.json` defines the mobile app ID, name, and web asset folder.
- `scripts/prepare-mobile.ps1` copies the static web app into `mobile-web`.
- `assets/logo.svg` is the source image for native app icons and splash screens.
- `android/` contains the Android project.
- `ios/` contains the iOS project.

## Common commands

Prepare and sync the current web app into both native projects:

```powershell
npm run mobile:sync
```

Regenerate native app icons and splash screens after changing `assets/logo.svg`:

```powershell
npm run mobile:assets
```

Open Android Studio:

```powershell
npm run mobile:android
```

Open Xcode on a Mac:

```powershell
npm run mobile:ios
```

## Build requirements

Android builds require Android Studio or a JDK plus Android SDK.

iOS builds require macOS, Xcode, and CocoaPods. The iOS project files are generated here, but final iPhone simulator/device builds and App Store archives must be made on a Mac.

The native shells are locked to portrait orientation to match `manifest.json`.

## Before app store submission

- Replace the default native app icons and splash assets with final Gifting Butler artwork.
- Confirm the app looks good on small phones and tall phones.
- Add privacy policy and store listing text.
- Test sign-in, Firebase, external links, and checkout/affiliate flows inside the mobile app.
