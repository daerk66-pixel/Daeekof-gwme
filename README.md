# Неоновый Уклонист (Neon Dodger)

Аркадная игра для Android: веди корабль пальцем, уклоняйся от красных астероидов
и собирай синие ядра энергии. 3 жизни, ускорение каждые 10 очков, рекорд сохраняется.

## Сборка APK
APK собирается автоматически в GitHub Actions (`.github/workflows/android.yml`).
Артефакт: **neon-dodger-apk** → `app/build/outputs/apk/debug/app-debug.apk`.

Локально: `gradle assembleDebug` (нужны JDK 17 и Android SDK 34).
