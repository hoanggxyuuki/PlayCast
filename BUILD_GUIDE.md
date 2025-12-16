# 🚀 Hướng dẫn Build PlayCast với HTTP Server

## 📋 Tổng quan

PlayCast là ứng dụng IPTV player với tính năng **HTTP Server** tích hợp, cho phép upload file từ máy tính lên điện thoại qua mạng LAN.

Script tự động này sẽ giúp bạn:
- ✅ Eject Expo project
- ✅ Cài đặt HTTP Server Native Module
- ✅ Copy và register các file Java cần thiết
- ✅ Thêm dependencies vào Gradle
- ✅ Build app cho Android/iOS

---

## 🛠️ Yêu cầu

### Chung
- ✅ Node.js (>= 18.x)
- ✅ npm hoặc yarn
- ✅ Expo CLI (`npm install -g expo-cli`)

### Cho Android
- ✅ Android Studio
- ✅ Android SDK (API 34+)
- ✅ Java JDK 17+
- ✅ Gradle

### Cho iOS (macOS only)
- ✅ Xcode 15+
- ✅ CocoaPods (`sudo gem install cocoapods`)
- ✅ iOS Simulator hoặc thiết bị thật

---

## 🎯 Cách sử dụng Build Script

### 🪟 Windows

```cmd
# Chạy script
build-native.bat
```

### 🐧 Linux / 🍎 macOS

```bash
# Cho phép thực thi
chmod +x build-native.sh

# Chạy script
./build-native.sh
```

---

## 📱 Build cho Android

### Cách 1: Sử dụng Script (Khuyến nghị)

1. **Chạy script:**
   ```bash
   # Linux/macOS
   ./build-native.sh

   # Windows
   build-native.bat
   ```

2. **Chọn option 1** - Android

3. **Script sẽ tự động:**
   - Eject Expo (nếu chưa eject)
   - Copy 3 file Java vào `android/app/src/main/java/com/anonymous/playcast/`
   - Thêm NanoHTTPD dependency vào `build.gradle`
   - Register HTTPServerPackage trong `MainApplication`
   - Hỏi có muốn build ngay không

4. **Kết quả:**
   - App được cài đặt trên thiết bị/emulator
   - HTTP Server sẵn sàng sử dụng

### Cách 2: Manual (Thủ công)

1. **Eject Expo:**
   ```bash
   npx expo prebuild
   ```

2. **Copy file Java:**
   ```bash
   cp android-native-modules/*.java android/app/src/main/java/com/anonymous/playcast/
   ```

3. **Thêm dependency vào `android/app/build.gradle`:**
   ```gradle
   dependencies {
       implementation("com.facebook.react:react-android")

       // HTTP Server for LAN file sharing
       implementation 'org.nanohttpd:nanohttpd:2.3.1'
   }
   ```

4. **Register package trong `android/app/src/main/java/com/anonymous/playcast/MainApplication.kt`:**
   ```kotlin
   import com.bidev.playcast.HTTPServerPackage

   override fun getPackages(): List<ReactPackage> =
       PackageList(this).packages.apply {
           add(HTTPServerPackage())
       }
   ```

5. **Build:**
   ```bash
   npx expo run:android
   ```

---

## 🍎 Build cho iOS

### Sử dụng Script

1. **Chạy script và chọn option 2** - iOS

2. **Làm theo hướng dẫn:**
   ```bash
   cd ios
   pod install
   cd ..
   npx expo run:ios
   ```

**Lưu ý:** HTTP Server Native Module hiện chỉ hỗ trợ Android. iOS sẽ được bổ sung sau.

---

## 🔧 Các Options trong Script

### Option 1: Build Android
- Tự động eject (nếu cần)
- Cài đặt HTTP Server Module
- Build và chạy app

### Option 2: Build iOS
- Hiển thị hướng dẫn build iOS
- (Module chưa hỗ trợ iOS)

### Option 3: Cài đặt lại HTTP Server Module
- Chỉ cài đặt lại module
- Không build app
- Hữu ích khi có cập nhật module

### Option 4: Eject Expo
- Chỉ eject project
- Không cài đặt module
- Tạo thư mục `android/` và `ios/`

### Option 5: Thoát
- Thoát khỏi script

---

## 📦 Cấu trúc File sau khi Build

```
PlayCast/
├── android/                                    # Android native project
│   └── app/
│       └── src/main/java/com/anonymous/playcast/
│           ├── MainActivity.kt
│           ├── MainApplication.kt
│           ├── HTTPServerModule.java           # ✅ Đã copy
│           ├── SimpleHTTPServer.java           # ✅ Đã copy
│           └── HTTPServerPackage.java          # ✅ Đã copy
├── android-native-modules/                     # Source files
│   ├── HTTPServerModule.java
│   ├── SimpleHTTPServer.java
│   ├── HTTPServerPackage.java
│   ├── README.md
│   └── SETUP_INSTRUCTIONS.md
├── build-native.sh                             # Build script (Linux/macOS)
├── build-native.bat                            # Build script (Windows)
└── BUILD_GUIDE.md                              # File này
```

---

## 🎯 Testing HTTP Server

Sau khi build thành công:

1. **Mở app trên điện thoại**

2. **Vào tab "Mạng" (Network/Local Network)**

3. **Nhấn "Start Server"**
   - Sẽ hiển thị URL: `http://192.168.x.x:8080`

4. **Trên máy tính (cùng WiFi):**
   - Mở browser
   - Truy cập URL đó
   - Upload file:
     - 📋 M3U/M3U8 playlist
     - 🎥 Video: MP4, MKV, AVI, MOV, FLV, WMV, WebM, TS
     - 🎵 Audio: MP3, AAC, WAV, FLAC, OGG, M4A, WMA

5. **File sẽ tự động import vào app!**

---

## ❓ Troubleshooting

### Lỗi: "Android directory not found"
**Giải pháp:** Chạy option 4 để eject Expo trước

### Lỗi: "Cannot find symbol: class HTTPServerPackage"
**Giải pháp:**
- Kiểm tra 3 file Java đã copy đúng vị trí chưa
- Chạy lại option 3 để cài đặt lại module

### Lỗi: "Could not resolve org.nanohttpd:nanohttpd:2.3.1"
**Giải pháp:**
```bash
cd android
./gradlew --refresh-dependencies
cd ..
```

### Lỗi: Build failed với Gradle
**Giải pháp:**
```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

### Server không start
**Kiểm tra:**
- ✅ Permissions: INTERNET, ACCESS_NETWORK_STATE trong AndroidManifest.xml
- ✅ Port 8080 không bị chiếm
- ✅ Firewall không block

### Không kết nối được từ máy tính
**Kiểm tra:**
- ✅ Điện thoại và máy tính cùng WiFi
- ✅ IP address đúng
- ✅ Firewall trên điện thoại/máy tính

---

## 🔄 Update HTTP Server Module

Khi có cập nhật module:

1. **Cập nhật file trong `android-native-modules/`**

2. **Chạy script và chọn option 3:**
   ```bash
   ./build-native.sh  # chọn 3
   ```

3. **Rebuild app:**
   ```bash
   npx expo run:android
   ```

---

## 📚 Tài liệu thêm

- [android-native-modules/README.md](android-native-modules/README.md) - Chi tiết về HTTP Server Module
- [android-native-modules/SETUP_INSTRUCTIONS.md](android-native-modules/SETUP_INSTRUCTIONS.md) - Hướng dẫn setup thủ công
- [Expo Documentation](https://docs.expo.dev/) - Expo framework
- [NanoHTTPD](https://github.com/NanoHttpd/nanohttpd) - HTTP Server library

---

## 🤝 Hỗ trợ

Nếu gặp vấn đề:

1. Xem phần Troubleshooting ở trên
2. Kiểm tra file logs trong `android/app/build/`
3. Chạy với verbose mode: `npx expo run:android --verbose`

---

## 📝 Changelog

### v1.0.0 - 2025-01-18
- ✅ Script tự động build cho Android
- ✅ Hỗ trợ Windows (batch) và Linux/macOS (bash)
- ✅ HTTP Server Module với multi-format support:
  - M3U/M3U8 playlists
  - Video files (MP4, MKV, AVI, MOV, FLV, WMV, WebM, TS)
  - Audio files (MP3, AAC, WAV, FLAC, OGG, M4A, WMA)

---

## 📄 License

MIT License - PlayCast Project

---

**Chúc bạn build thành công! 🎉**
