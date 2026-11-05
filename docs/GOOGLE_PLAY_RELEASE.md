# Google Play release setup

## App identity

| Setting | Value |
| --- | --- |
| App name | BarterDito |
| Android package / application ID | `com.barterdito.app` |
| User-facing version | `1.0.0` |
| Initial local Android version code | `1` |
| Expo slug | `barterdito-mobile` |
| EAS project ID | `663e4872-397d-4de7-89db-f6125ccbc461` |
| Deep link scheme | `barterdito` |
| Production artifact | Android App Bundle (`.aab`) |

This package ID is for a new Google Play app. Keep it unchanged after the first
upload. The Expo project and slug remain linked to the existing EAS project.

EAS manages version codes remotely (`cli.appVersionSource: remote`) and increments
them for production builds. The value in `app.json` seeds a new remote version;
after initialization, changing the local value does not change EAS's version code.

The installed React Native 0.81.5 Android configuration uses compile/target SDK 36
and minimum SDK 24. Verify the target SDK in the resulting bundle and Play Console
before release. Google Play currently requires API 36 for new phone app uploads.

## Configure expo.dev

1. Open the existing project in expo.dev. Confirm you are using the account or
   organization that owns project `663e4872-397d-4de7-89db-f6125ccbc461`.
2. Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SITE_URL` in the project's
   **production** environment using **Plain text** visibility. Use the real HTTPS
   backend and website URLs. These values are bundled into the app and are public.
   The backend must allow the website origin in `CORS_ORIGINS`. Environment values
   have intentionally not been added to the repository. Without them, the current
   app falls back to local development URLs and cannot reach your live backend.
3. Under Android credentials, configure a keystore for `com.barterdito.app`.
   Let EAS generate and manage a new Android keystore for this new app. If the
   dashboard directs you to the CLI, run `npm run credentials:android`, select
   **production**, and create the keystore there. Save a secure backup of the
   keystore and its passwords outside Git.
4. Start an Android build using the **production** profile. It uses the production
   environment, remote signing credentials, store distribution, and `.aab` output.

The repository selects remote credentials; it does not create a keystore or a
Google service account key. Those are configured in the owning Expo/Google accounts.

## Build commands

From `mobile/`, if you prefer the CLI:

```bash
npx eas-cli@latest login
npm run build:android
```

For an installable APK to test on a phone, configure the **preview** environment
in expo.dev and run:

```bash
npm run build:android:preview
```

Use the production `.aab` for Play Console uploads; the preview `.apk` is for
direct device installation.

## First Google Play upload

1. Create the app in Google Play Console and enroll in Play App Signing. Use the
   EAS keystore as the upload key when setting up signing.
2. Download the signed production `.aab` from expo.dev and upload it manually to
   an internal testing release. Google requires at least one manual upload before
   API submissions can be used.
3. Complete the store listing, app icon, screenshots, feature graphic, support
   contact details, public privacy policy URL, Data safety declarations, content
   rating, ads declaration, app access/reviewer instructions, and any testing or
   account verification requirements shown by your Play Console account.
4. Verify the app's account deletion flow and supply the public account deletion
   URL required for apps that allow account creation. The current in-app policy
   page describes itself as a summary requiring review before launch; finalize
   your policy and publish it on the website before submission.
5. Test the Play-installed build: registration, email verification, sign-in,
   session persistence, gallery uploads, foreground location, links, and trades.
   Promote the tested release through Play Console when ready.

Gallery selection does not use the camera or microphone, so both permissions are
disabled in the image picker plugin. Foreground location remains enabled for
the profile's location feature. Android app-data backup is disabled.

## Optional later uploads with EAS Submit

Create a Google service account with access to this app in Play Console. Assign
its JSON key to `com.barterdito.app` under the Expo project's Google Play submission
credentials. This key is separate from the Android signing keystore. No service
account key is needed for a manual Play Console upload.

```bash
npm run submit:android
```

The submission profile targets the **internal** testing track as a **draft**.
Complete and roll out the release in Play Console. If you keep a downloaded key
locally, store it under the ignored `mobile/secrets/` directory. Never commit
signing keys, `credentials.json`, passwords, or service account JSON files.

## References

- [Expo: managed signing credentials](https://docs.expo.dev/app-signing/managed-credentials/)
- [Expo: Google Play submission](https://docs.expo.dev/submit/android/)
- [Expo: version management](https://docs.expo.dev/build-reference/app-versions/)
- [Expo: production environment variables](https://docs.expo.dev/eas/environment-variables/usage/)
- [Google Play: target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878)
