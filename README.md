# PlayCast IPTV - Professional IPTV Player

**PlayCast** is a professional IPTV player application built with React Native and Expo for iOS and Android. This application provides a modern, feature-rich interface for watching IPTV streams with support for M3U and JSON playlists.

## Features

### Core Features
- **Playlist Management**: Add and manage multiple IPTV playlists (M3U and JSON formats)
- **M3U Parser**: Advanced parser for M3U playlists with support for extended attributes
- **Channel Browser**: Browse channels with search and category filtering
- **Video Player**: Professional video player with custom controls
- **Favorites System**: Mark and organize favorite channels
- **Persistent Storage**: Local storage using AsyncStorage for playlists and preferences

### Video Player Features
- **HLS Support**: Stream HLS (.m3u8) video content
- **Custom Controls**: Professional player controls (play/pause, volume, reload)
- **Auto-hide Controls**: Controls automatically hide during playback
- **Landscape Mode**: Automatic landscape orientation for video playback
- **Buffering Indicator**: Visual feedback during buffering
- **Error Handling**: Robust error handling with retry functionality
- **Fullscreen Support**: Immersive fullscreen video experience

### UI/UX Features
- **Professional Design**: Modern, dark-themed UI with custom color scheme
- **Responsive Layout**: Optimized for various screen sizes
- **Tab Navigation**: Easy navigation between playlists and favorites
- **Search Functionality**: Quick search across all channels
- **Category Filtering**: Filter channels by category/group
- **Pull to Refresh**: Refresh playlists with pull-down gesture

## Tech Stack

- **React Native**: 0.81.5
- **Expo**: ~54.0.23
- **Expo Router**: ~6.0.14 (File-based routing)
- **TypeScript**: ~5.9.2
- **Expo Video**: Video playback with HLS support
- **AsyncStorage**: Local data persistence
- **Expo Screen Orientation**: Screen rotation management

## Project Structure

```
PlayCast/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── index.tsx            # Home/Playlists tab
│   │   └── explore.tsx          # Favorites tab
│   ├── channels/[id].tsx        # Channel list screen
│   ├── add-playlist.tsx         # Add playlist screen
│   └── _layout.tsx              # Root layout
│
├── src/
│   ├── components/              # Reusable components
│   │   ├── channel/
│   │   │   └── ChannelItem.tsx # Channel list item
│   │   ├── common/
│   │   │   ├── EmptyState.tsx  # Empty state component
│   │   │   └── LoadingOverlay.tsx
│   │   └── player/
│   │       └── VideoPlayer.tsx  # Video player component
│   │
│   ├── contexts/                # React contexts
│   │   └── PlaylistContext.tsx # Playlist state management
│   │
│   ├── screens/                 # Screen components
│   │   ├── HomeScreen.tsx      # Playlists screen
│   │   ├── AddPlaylistScreen.tsx
│   │   └── ChannelsScreen.tsx  # Channel list screen
│   │
│   ├── services/                # Business logic
│   │   ├── m3uParser.ts        # M3U parsing service
│   │   └── storageService.ts   # AsyncStorage wrapper
│   │
│   ├── types/                   # TypeScript types
│   │   └── index.ts
│   │
│   ├── constants/               # App constants
│   │   └── theme.ts            # Theme configuration
│   │
│   └── utils/                   # Utility functions
│
├── assets/                      # Static assets
├── package.json
└── README.md
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PlayCast
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## Usage

### Adding a Playlist

1. Open the app and tap the **+** button in the top right
2. Enter a name for your playlist
3. Paste the M3U or JSON playlist URL
4. Select the playlist type (M3U or JSON)
5. Tap **Add Playlist**

**Example M3U URL:**
```
https://iptv-org.github.io/iptv/countries/vn.m3u
```

### Watching Channels

1. Tap on a playlist from the home screen
2. Browse or search for a channel
3. Tap on a channel to start playback
4. Use the player controls to pause, mute, or reload the stream

### Managing Favorites

1. While browsing channels, tap the heart icon to add to favorites
2. Access favorites from the **Favorites** tab
3. Quickly play your favorite channels

## M3U Format Support

The app supports extended M3U format with the following attributes:

- `tvg-id`: Channel ID
- `tvg-name`: Channel name
- `tvg-logo`: Channel logo URL
- `group-title`: Category/group name

**Example M3U:**
```m3u
#EXTM3U
#EXTINF:-1 tvg-id="channel1" tvg-name="Channel 1" tvg-logo="http://example.com/logo.png" group-title="News",Channel 1
http://example.com/stream1.m3u8
```

## JSON Format Support

**Example JSON:**
```json
{
  "channels": [
    {
      "name": "Channel 1",
      "url": "http://example.com/stream1.m3u8",
      "logo": "http://example.com/logo.png",
      "group": "News"
    }
  ]
}
```

## Key Architecture Decisions

### State Management
- **Context API**: Used for global state management (playlists, favorites)
- **Local State**: Component-level state for UI interactions
- **AsyncStorage**: Persistent storage for playlists and user preferences

### Navigation
- **Expo Router**: File-based routing for cleaner code organization
- **Stack Navigation**: For main app flow
- **Tab Navigation**: For primary screens (Playlists, Favorites)

### Video Playback
- **Expo Video**: Modern video playback API with better performance
- **Custom Controls**: Implemented for better UX and customization
- **HLS Streaming**: Full support for HTTP Live Streaming

### Styling
- **Professional Theme**: Dark theme optimized for video content
- **Consistent Spacing**: Using a spacing system for visual harmony
- **Custom Colors**: Branded color scheme with primary/secondary colors

## Performance Optimizations

- **FlatList**: Efficient rendering of large channel lists
- **useMemo**: Memoized filtered/grouped channels
- **Lazy Loading**: Components loaded only when needed
- **Image Caching**: Channel logos cached automatically

## Premium Features ✨

### Advanced Video Player
- ✅ **Custom Playback Controls**: Professional player UI with play/pause, seek bar, time display
- ✅ **Playback Speed Control**: 0.5x to 2x speed options
- ✅ **Previous/Next Navigation**: Queue-integrated navigation
- ✅ **Auto-hide Controls**: Smooth fade animations with auto-hide
- ✅ **Continue Watching**: Resume from last position automatically
- ✅ **Sleep Timer Integration**: Display countdown in player
- ✅ **Quality & Options Menus**: Settings accessible during playback

### Gesture Controls 🎮
- ✅ **Double-tap to Seek**: Left/right double-tap for backward/forward seek (configurable 5-30s)
- ✅ **Brightness Control**: Vertical swipe on left side adjusts brightness
- ✅ **Volume Control**: Vertical swipe on right side adjusts volume
- ✅ **Horizontal Seek**: Swipe left/right to seek through video
- ✅ **Visual Feedback**: Real-time indicators for all gestures

### Watch History & Analytics 📊
- ✅ **Full Watch History**: Track all watched channels with thumbnails
- ✅ **Progress Tracking**: Resume exactly where you left off
- ✅ **Statistics Dashboard**: Total watch time, videos watched, averages
- ✅ **Favorite Categories**: Auto-detected based on viewing habits
- ✅ **Continue Watching**: Filter videos at 5-95% progress
- ✅ **Smart Cleanup**: Automatic 100-item limit

### Queue Management 🎵
- ✅ **Create Playlists**: Build your own playback queue
- ✅ **Shuffle & Reorder**: Randomize or manually arrange
- ✅ **Move to Top/Bottom**: Quick reordering actions
- ✅ **Now Playing Indicator**: Visual highlight of current item
- ✅ **Queue Statistics**: Track total items and position
- ✅ **Persistent Queue**: Queue saved between sessions

### AI-Powered Recommendations 🤖
- ✅ **Smart Suggestions**: AI recommendations based on watch history
- ✅ **Similar Channels**: Levenshtein distance algorithm for matching
- ✅ **Trending Content**: Most watched in last 7 days
- ✅ **Category Matching**: Suggestions based on favorite categories
- ✅ **Multi-factor Scoring**: View count, ratings, completion rate

### Comprehensive Settings ⚙️
- ✅ **Theme Selection**: Dark, Light, Auto modes
- ✅ **Multi-language**: English, Tiếng Việt, 中文, 日本語, 한국어
- ✅ **Playback Preferences**: Auto-play next, default speed/quality
- ✅ **Player Features**: Picture-in-Picture, background playback
- ✅ **Gesture Configuration**: Enable/disable individual gestures
- ✅ **Download Quality**: High, Medium, Low presets
- ✅ **Reset to Defaults**: One-tap restore

### Social Features 🔗
- ✅ **Native Share**: System share dialog integration
- ✅ **Platform-specific URLs**: WhatsApp, Telegram, Facebook, Twitter, Email, SMS
- ✅ **Copy to Clipboard**: Quick URL copying
- ✅ **Export Favorites**: Share as M3U playlist
- ✅ **Share App**: Invite friends functionality

### Sleep Timer 💤
- ✅ **Predefined Durations**: 15, 30, 45, 60, 90, 120 minutes
- ✅ **Countdown Display**: MM:SS format in player
- ✅ **Extend Timer**: Add more time without restarting
- ✅ **Auto-stop Playback**: Graceful shutdown when timer ends

### User Experience Enhancements
- ✅ **Loading States**: Smooth loading indicators everywhere
- ✅ **Empty States**: Helpful placeholders when no content
- ✅ **Confirmation Dialogs**: Safety for destructive actions
- ✅ **Pull to Refresh**: Update content with pull gesture
- ✅ **Professional Animations**: Smooth transitions throughout

## Future Enhancements

- [ ] EPG (Electronic Program Guide) support
- [ ] Chromecast/AirPlay support
- [ ] Channel recording
- [ ] Parental controls
- [ ] Cloud sync
- [ ] Download Manager (offline viewing)
- [ ] Mini Player (floating window)
- [ ] Subtitle support

## Development

### Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web
- `npm run lint` - Run ESLint

### Building for Production

**Android:**
```bash
eas build --platform android
```

**iOS:**
```bash
eas build --platform ios
```

## Troubleshooting

### Video won't play
- Ensure the stream URL is valid and accessible
- Check if the stream format is supported (HLS recommended)
- Try reloading the stream using the reload button

### Playlist won't load
- Verify the playlist URL is correct
- Check your internet connection
- Ensure the M3U/JSON format is valid

## License

This project is for educational purposes (final project).

## Credits

Developed with React Native, Expo, and TypeScript.

---

**Note**: This is a student project created for educational purposes. Some features may require additional implementation for production use.
