# PlayCast IPTV - Premium Features Documentation

## 📋 Feature Overview

This document outlines all 12 premium features implemented in PlayCast IPTV.

---

## 🎬 Phase 1: Core Enhancements

### 1. Mini Player 🎪
**Location**: `src/contexts/MiniPlayerContext.tsx`, `src/components/player/MiniPlayer.tsx`

**Features**:
- Floating draggable video player
- Continue watching while browsing
- Tap to expand to full player
- Drag to reposition anywhere on screen
- Auto-snap to screen edges
- Basic playback controls (play/pause/close)

**Usage**:
```typescript
const { showMiniPlayer, hideMiniPlayer } = useMiniPlayer();

// Show mini player
showMiniPlayer(channel, currentPosition);

// Hide mini player
hideMiniPlayer();
```

---

### 2. Advanced Search & Filters 🔍
**Location**: `src/screens/SearchScreen.tsx`

**Features**:
- Global search across all playlists
- Filter by favorites
- Filter by category/group
- Real-time search results
- Sort by name, recent, or popularity
- Multi-filter support
- Results counter

**How to use**:
- Access from new Search tab
- Type query or select filter chips
- Tap "Clear" to reset filters

---

### 3. Statistics Dashboard 📊
**Location**: `src/screens/StatisticsScreen.tsx`

**Features**:
- Total watch time tracking
- Videos watched counter
- Average watch time calculation
- Watch time by day of week (bar chart)
- Top 5 favorite categories
- Top 5 most watched channels
- Visual progress indicators

**Metrics tracked**:
- Daily/weekly viewing patterns
- Category preferences
- Channel popularity
- Binge-watching habits

---

## 📺 Phase 2: IPTV Professional Features

### 4. EPG Support (Electronic Program Guide) 📅
**Location**: `src/services/EPGService.ts`, `src/components/epg/EPGViewer.tsx`

**Features**:
- XMLTV format support
- Current program display with live indicator
- Progress bar for live programs
- Upcoming programs list (next 10)
- Program details (title, description, category)
- Time and duration display
- 1-hour cache for performance

**Supported formats**:
- XMLTV (.xml)
- Custom EPG JSON

**Usage**:
```typescript
// Fetch EPG data
await epgService.fetchEPG('https://example.com/epg.xml');

// Get current program
const current = epgService.getCurrentProgram(channelId);

// Get upcoming programs
const next = epgService.getNextPrograms(channelId, 10);
```

---

### 5. Categories Management 🗂️
**Location**: `src/contexts/CategoriesContext.tsx`

**Features**:
- Hide/show categories
- Reorder categories (drag & drop ready)
- Custom category colors
- Custom category icons
- Persistent category settings
- Quick toggle visibility

**Usage**:
```typescript
const { toggleCategoryVisibility, isHidden } = useCategories();

// Hide a category
toggleCategoryVisibility('Sports');

// Check if hidden
const hidden = isHidden('Sports');
```

---

### 6. Playlist Auto-Update 🔄
**Location**: `src/services/PlaylistSyncService.ts`

**Features**:
- Background playlist synchronization
- Configurable sync intervals (hourly, daily, weekly)
- Last sync timestamp tracking
- Manual sync trigger
- Automatic updates for M3U playlists
- Sync status indicators

**Usage**:
```typescript
// Enable auto-sync (every 24 hours)
await playlistSyncService.enableSync(playlistId, url, 24);

// Manual sync
await playlistSyncService.syncPlaylist(playlistId);

// Get sync status
const status = playlistSyncService.getSyncStatus(playlistId);
```

---

## 🎥 Phase 3: Advanced Player Features

### 7. Advanced Player Enhancements ⚙️

#### 7a. Subtitle Support
**Location**: `src/components/player/SubtitleManager.tsx`

**Features**:
- SRT subtitle format
- VTT (WebVTT) subtitle format
- External subtitle files
- Adjustable font size
- Top or bottom positioning
- Text styling and shadows
- Multi-language support

**Usage**:
```typescript
<SubtitleManager
  currentTime={currentTime}
  subtitle={{
    id: '1',
    language: 'en',
    label: 'English',
    url: 'https://example.com/subs.srt',
    type: 'srt'
  }}
  fontSize={FontSizes.md}
  position="bottom"
/>
```

#### 7b. Aspect Ratio Control
**Location**: `src/components/player/AspectRatioControl.tsx`

**Features**:
- 6 aspect ratio modes:
  - Default (original)
  - 16:9 (widescreen)
  - 4:3 (standard)
  - 21:9 (ultra-wide)
  - Fill (fill screen)
  - Fit (fit to screen)
- Visual mode selector
- Description for each mode

---

### 8. Screenshots 📸
**Location**: `src/services/ScreenshotService.ts`

**Features**:
- Capture video frames
- Save to device gallery
- Custom quality settings (0-1)
- JPG or PNG format
- Share screenshots
- Organized in "PlayCast" album
- Permission handling

**Usage**:
```typescript
// Capture screenshot
const uri = await screenshotService.captureVideoFrame(videoRef, {
  quality: 0.9,
  format: 'jpg',
  saveToGallery: true
});

// Share screenshot
await screenshotService.shareScreenshot(uri);
```

---

### 9. Themes & Customization 🎨
**Location**: `src/contexts/ThemeContext.tsx`

**Features**:
- 6 preset themes:
  - Default Dark
  - Ocean Blue
  - Purple Dream
  - Forest Green
  - Sunset Orange
  - Light Mode
- Custom theme creation
- Full color customization
- Per-component theming
- Persistent theme selection

**Color properties**:
- Primary color
- Background colors (3 levels)
- Text colors (3 levels)
- Border color
- Error, success, warning colors

**Usage**:
```typescript
const { currentTheme, setTheme, addCustomTheme } = useCustomTheme();

// Switch theme
setTheme('ocean');

// Create custom theme
addCustomTheme({
  id: 'custom1',
  name: 'My Theme',
  colors: { /* ... */ }
});
```

---

## 🔒 Phase 4: Premium Features

### 10. Chromecast & AirPlay Support 📱➡️📺
**Location**: `src/services/CastService.ts`

**Features** (Placeholder - Ready for implementation):
- Device discovery
- Chromecast support
- AirPlay support
- Remote playback control
- Volume control
- Cast queue management

**Note**: This is a placeholder implementation. Real functionality requires:
- `react-native-google-cast` for Chromecast
- Native iOS AirPlay APIs
- Platform-specific configurations

---

### 11. Parental Controls 🔐
**Location**: `src/contexts/ParentalControlContext.tsx`

**Features**:
- PIN protection (4+ digits)
- Restricted categories
- Restricted channels
- Age rating system (0, 12, 16, 18)
- Auto-lock after 5 minutes
- Adult content detection
- Settings protection
- PIN change with verification

**Protected actions**:
- Settings access
- Adult content viewing
- Specific channel access

**Usage**:
```typescript
const { unlock, isChannelRestricted, addRestrictedCategory } = useParentalControl();

// Unlock with PIN
const success = unlock('1234');

// Check if channel is restricted
const restricted = isChannelRestricted(channelId, category);

// Restrict a category
addRestrictedCategory('Adult');
```

**Adult content keywords detected**:
- adult, 18+, xxx, mature, porn

---

### 12. Social Features & Cloud Backup ☁️
**Location**: `src/services/SocialSharingService.ts`

**Features**:
- Share playlists with friends
- Export all playlists (JSON)
- Import playlists from file
- Export app settings
- Import app settings
- Share individual channels
- Generate shareable deep links
- Cloud backup ready

**Export formats**:
- `.playcast` for individual playlists
- `.json` for full exports

**Usage**:
```typescript
// Share playlist
await socialSharingService.sharePlaylist(playlist);

// Export all data
await socialSharingService.exportPlaylists(playlists);

// Import playlists
const imported = await socialSharingService.importPlaylists(fileUri);

// Share channel
await socialSharingService.shareChannel(channelName, streamUrl);
```

---

## 🚀 Implementation Status

| Feature | Status | Files Created | Integration Required |
|---------|--------|---------------|---------------------|
| Mini Player | ✅ Complete | 2 | Add to root layout |
| Search & Filters | ✅ Complete | 1 | Add navigation tab |
| Statistics | ✅ Complete | 1 | Add navigation tab |
| EPG | ✅ Complete | 2 | Integrate in player |
| Categories | ✅ Complete | 1 | Add to root layout |
| Auto-Update | ✅ Complete | 1 | Initialize in app |
| Subtitles | ✅ Complete | 1 | Add to player |
| Aspect Ratio | ✅ Complete | 1 | Add to player |
| Screenshots | ✅ Complete | 1 | Add button in player |
| Themes | ✅ Complete | 1 | Add to root layout |
| Parental Controls | ✅ Complete | 1 | Add to root layout |
| Social Sharing | ✅ Complete | 1 | Add to settings |
| Cast Support | ⏳ Placeholder | 1 | Requires native modules |

---

## 📦 Required Dependencies

Add these to `package.json`:

```json
{
  "dependencies": {
    "expo-sharing": "^12.0.1",
    "expo-media-library": "^16.0.4",
    "expo-file-system": "^17.0.1"
  }
}
```

For Chromecast (future):
```json
{
  "dependencies": {
    "react-native-google-cast": "^4.8.0"
  }
}
```

---

## 🔧 Integration Checklist

### App-level Integration

1. **Add Contexts to `app/_layout.tsx`**:
```typescript
<MiniPlayerProvider>
  <CategoriesProvider>
    <CustomThemeProvider>
      <ParentalControlProvider>
        {/* existing providers */}
      </ParentalControlProvider>
    </CustomThemeProvider>
  </CategoriesProvider>
</MiniPlayerProvider>
```

2. **Add MiniPlayer component**:
```typescript
<MiniPlayer />
```

3. **Initialize PlaylistSyncService** in app startup

4. **Add new navigation tabs**:
- Search
- Statistics

### Player Integration

5. **Add to AdvancedVideoPlayer**:
- SubtitleManager component
- Aspect Ratio selector
- Screenshot button
- EPG viewer button

### Settings Integration

6. **Add to SettingsScreen**:
- Theme selector
- Parental Control settings
- Auto-sync settings
- Export/Import buttons

---

## 🎯 Next Steps

1. Install required dependencies
2. Integrate contexts in root layout
3. Add navigation tabs for Search & Statistics
4. Update AdvancedVideoPlayer with new features
5. Add Settings UI for new features
6. Test each feature thoroughly
7. Add translations for new features

---

## 📝 Notes

- All services use AsyncStorage for persistence
- EPG cache expires after 1 hour
- Parental Control auto-locks after 5 minutes
- Screenshot feature requires native implementation for video frames
- Cast feature is placeholder - requires platform-specific implementation
- All contexts are fully typed with TypeScript

---

## 💡 Future Enhancements

- [ ] Cloud backup to Firebase/AWS
- [ ] Social playlist sharing platform
- [ ] EPG from multiple sources
- [ ] AI-powered recommendations
- [ ] Multi-device sync
- [ ] Offline playlist caching
- [ ] Picture-in-Picture mode
- [ ] Sleep timer
- [ ] Bookmark system
- [ ] Watch together feature

---

**Built with ❤️ for PlayCast IPTV**
Version 1.0 - Premium Features Pack
