# DeRadar Mobile App Assets

This directory contains source assets for generating mobile app icons and splash screens.

## Required Assets

### Icon (icon.png)
- **Size**: 1024x1024 pixels (square)
- **Format**: PNG with transparency
- **Current**: Using derad-network-logo.png (1800x600) - needs to be made square
- **Usage**: App icons for iOS and Android

### Splash Screen (splash.png)
- **Size**: 2732x2732 pixels (square)
- **Format**: PNG
- **Background**: #0f172a (dark slate to match app theme)
- **Usage**: Launch screen for iOS and Android

## Generating Assets

Once you have proper square assets, run:

```bash
npm run generate:assets
```

Or manually:

```bash
npx capacitor-assets generate
```

This will automatically create all required sizes for:
- Android: Various densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- iOS: All required icon sizes and splash screens

## Current Status

⚠️ **Action Required**:
- The current icon.png is 1800x600 (rectangular)
- For best results, create a square version (1024x1024)
- Center the logo on a dark background (#0f172a)
- Or crop/redesign the logo to fit square format

## Manual Asset Locations

After generation, assets will be placed in:
- **Android**: `android/app/src/main/res/`
- **iOS**: `ios/App/App/Assets.xcassets/`

## Customization

Edit `capacitor.config.ts` to customize splash screen behavior:
- Duration
- Background color
- Spinner visibility
