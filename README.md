# One Tap Jump - Unity Android

This is a Unity 2D project for a "One Tap Jump" mobile game.

## Getting Started
1. Open this folder in **Unity Hub**.
2. Recommended Unity Version: **2022.3.10f1** (or later 2022 LTS).
3. Open `Assets/Scenes/MainScene.unity`.

## Gameplay
- **One Tap Mechanic**: Tap the screen or click to jump.
- **Horizontal Platforms**: Platforms move side-to-side. Landing on one increases your score.
- **Endless Progress**: New platforms spawn as you climb.
- **Camera**: Follows your upward movement.
- **Game Over**: Triggered if you fall below the screen.

## AdMob Integration
- Test IDs are configured in `GameManager.cs`.
- **Banner**: Shown on Main Menu and Game Over.
- **Interstitial**: Shown every 2nd Game Over.
- **Rewarded**: Used for a one-time "Revive" per game.

## Android Build
- **Package Name**: `com.androidholdar.onetapjump`
- **Orientation**: Locked to **Portrait**.
- **Min SDK**: 21 (Lollipop).
- To build: Go to `File > Build Settings`, select **Android**, and click **Build**.

## Development Notes
- Core logic is in `Assets/Scripts/`.
- The scene hierarchy includes a basic UI Canvas. You can further customize the UI elements in the Unity Inspector.
- Visuals use basic SpriteRenderers with solid colors for quick prototyping. You can assign your own sprites in the Inspector.
