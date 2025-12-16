# Hướng dẫn sửa lỗi build Android cho PlayCast

## Vấn đề hiện tại
Lỗi build Android với các dependencies không được resolve:
```
Could not resolve project :react-native-async-storage_async-storage
Could not resolve project :react-native-community_slider
Could not resolve project :react-native-gesture-handler
Could not resolve project :react-native-reanimated
Could not resolve project :react-native-safe-area-context
Could not resolve project :react-native-screens
Could not resolve project :react-native-vector-icons
Could not resolve project :react-native-worklets
```

## Nguyên nhân
1. **Phiên bản không tương thích**: Các dependencies có thể không tương thích với phiên bản React Native hiện tại
2. **Gradle configuration**: Cấu hình Gradle có thể không đúng
3. **Eject issue**: Có thể project cần được eject từ Expo

## Các cách khắc phục

### 1. Kiểm tra phiên bản React Native
```bash
npx react-native --version
```

### 2. Cập nhật dependencies
```bash
# Xóa node_modules và package-lock.json
rm -rf node_modules
rm package-lock.json

# Cài đặt lại
npm install
```

### 3. Kiểm tra file package.json
Đảm bảo các dependencies có phiên bản tương thích:
```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.72.6",
    "react-native-async-storage": "^1.19.3",
    "react-native-community_slider": "^4.4.2",
    "react-native-gesture-handler": "^2.12.1",
    "react-native-reanimated": "^3.3.0",
    "react-native-safe-area-context": "^4.7.1",
    "react-native-screens": "^3.27.0",
    "react-native-vector-icons": "^10.0.0",
    "react-native-worklets": "^0.2.1"
  }
}
```

### 4. Eject từ Expo (nếu cần)
```bash
npx expo prebuild
```

### 5. Clean build
```bash
# Xóa build cache
npx expo run:android --clear

# Hoặc clean hoàn toàn
npx expo run:android --clear-cache
```

### 6. Kiểm tra Android SDK
Đảm bảo Android SDK và build tools được cài đặt đúng:
- Android Studio SDK
- Android Build Tools
- Android Platform Tools

### 7. Kiểm tra file android/build.gradle
```gradle
android {
    compileSdkVersion 34
    buildToolsVersion "34.0.0"
    
    defaultConfig {
        applicationId "com.bidev.playcast"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

## Cách khắc phục nhanh nhất

### Option 1: Sử dụng Expo Go (không cần eject)
```bash
# Cài đặt Expo Go CLI
npm install -g @expo/cli@next

# Chạy với Expo Go
npx expo start --go
```

### Option 2: Reset project
```bash
# Backup code của bạn
cp -r src src_backup

# Reset project về trạng thái ban đầu
npx create-expo-app --template blank PlayCast-New

# Copy code của bạn vào lại
cp -r src_backup/* PlayCast-New/src/
```

### Option 3: Sử dụng development build
```bash
# Chạy development build thay vì production
npx expo run:android --variant developmentDebug
```

## Kiểm tra sau khi sửa

1. Chạy `npx expo start` để đảm bảo project chạy trên development server
2. Kiểm tra log output để xem còn lỗi nào
3. Thử build với `--verbose` flag để xem chi tiết lỗi

## Lỗi thường gặp khác

### 1. "Daemon stopped" error
- Giảm số lượng CPU cores được sử dụng
- Tăng RAM cho Android emulator
- Sử dụng physical device thay vì emulator

### 2. "Metro bundler" error
```bash
# Reset Metro cache
npx expo start --reset-cache

# Hoặc xóa thủ công
rm -rf .expo
```

### 3. "Unable to load script" error
- Kiểm tra file package.json scripts section
- Đảm bảo tất cả dependencies được cài đặt

## Contact support

Nếu vẫn không giải quyết được, hãy:
1. Kiểm tra GitHub Issues cho các dependencies liên quan
2. Tạo issue mới với thông tin chi tiết:
   - Phiên bản React Native
   - Phiên bản Expo CLI
   - Hệ điều hành (Windows/Mac/Linux)
   - Log output đầy đủ
3. Tham gia Discord/React Native community để được hỗ trợ