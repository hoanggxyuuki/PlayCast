# Hướng dẫn cài đặt HTTP Server Native Module

## Bước 1: Eject từ Expo

```bash
cd /home/user/PlayCast
npx expo prebuild
```

Lệnh này sẽ tạo thư mục `android/` và `ios/` cho project.

## Bước 2: Copy các file Java vào project Android

Sau khi eject, copy 3 file Java từ thư mục `android-native-modules/` vào thư mục Android:

```bash
# Copy HTTPServerModule.java
cp android-native-modules/HTTPServerModule.java android/app/src/main/java/com/playcast/

# Copy SimpleHTTPServer.java
cp android-native-modules/SimpleHTTPServer.java android/app/src/main/java/com/playcast/

# Copy HTTPServerPackage.java
cp android-native-modules/HTTPServerPackage.java android/app/src/main/java/com/playcast/
```

## Bước 3: Thêm NanoHTTPD dependency

Mở file `android/app/build.gradle` và thêm dependency:

```gradle
dependencies {
    // ... existing dependencies
    implementation 'org.nanohttpd:nanohttpd:2.3.1'
}
```

## Bước 4: Register HTTPServerPackage

Mở file `android/app/src/main/java/com/playcast/MainApplication.java` (hoặc `MainApplication.kt` nếu dùng Kotlin):

### Nếu dùng Java:

```java
// Thêm import ở đầu file
import com.playcast.HTTPServerPackage;

// Trong method getPackages(), thêm:
@Override
protected List<ReactPackage> getPackages() {
    @SuppressWarnings("UnnecessaryLocalVariable")
    List<ReactPackage> packages = new PackageList(this).getPackages();
    // Thêm dòng này:
    packages.add(new HTTPServerPackage());
    return packages;
}
```

### Nếu dùng Kotlin:

```kotlin
// Thêm import ở đầu file
import com.playcast.HTTPServerPackage

// Trong method getPackages(), thêm:
override fun getPackages(): List<ReactPackage> {
    val packages = PackageList(this).packages
    // Thêm dòng này:
    packages.add(HTTPServerPackage())
    return packages
}
```

## Bước 5: Build Android app

```bash
# Clean build
cd android
./gradlew clean

# Return to project root
cd ..

# Build and run
npx expo run:android
```

## Kiểm tra cài đặt thành công

1. Mở app PlayCast trên Android
2. Vào tab "Mạng" (Network)
3. Nhấn nút "Start Server"
4. Nếu hiện URL (ví dụ: http://192.168.1.40:8080) → Thành công!
5. Mở browser trên máy tính (cùng mạng WiFi), truy cập URL đó
6. Upload file M3U để test

## Troubleshooting

### Lỗi: "Cannot find symbol: class HTTPServerPackage"
→ Kiểm tra lại đã copy đúng 3 file Java vào thư mục `android/app/src/main/java/com/playcast/`

### Lỗi: "Could not resolve org.nanohttpd:nanohttpd:2.3.1"
→ Kiểm tra kết nối Internet, sync Gradle lại:
```bash
cd android
./gradlew --refresh-dependencies
```

### Lỗi: "Server không start"
→ Kiểm tra permissions trong `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### Lỗi: "Không kết nối được từ máy tính"
→ Đảm bảo:
- Điện thoại và máy tính cùng mạng WiFi
- Tắt firewall trên điện thoại (nếu có)
- Port 8080 không bị chiếm bởi app khác

## Xóa bỏ HTTP Server (nếu cần)

```bash
# Xóa 3 file Java
rm android/app/src/main/java/com/playcast/HTTPServerModule.java
rm android/app/src/main/java/com/playcast/SimpleHTTPServer.java
rm android/app/src/main/java/com/playcast/HTTPServerPackage.java

# Xóa dòng "packages.add(new HTTPServerPackage());" trong MainApplication.java

# Xóa dependency trong build.gradle
# Xóa dòng: implementation 'org.nanohttpd:nanohttpd:2.3.1'

# Clean build
cd android && ./gradlew clean
```

## Lưu ý quan trọng

1. **Chỉ chạy trên Android**: Native module này chỉ hoạt động trên Android, không hỗ trợ iOS
2. **Sau khi eject**: Không thể quay lại managed Expo workflow
3. **Build size**: App size sẽ tăng ~200KB do NanoHTTPD library
4. **Security**: HTTP server không có authentication, chỉ dùng trong mạng LAN tin cậy

## Sử dụng trong React Native

HTTP Server đã được tích hợp sẵn trong `LocalNetworkScreen.tsx`. Code tham khảo:

```typescript
import { HTTPServerService } from '@/src/services/HTTPServerService';

// Start server
const result = await HTTPServerService.startServer(8080);
if (result.success) {
  console.log('Server URL:', result.url);
}

// Stop server
await HTTPServerService.stopServer();

// Get status
const status = await HTTPServerService.getStatus();
console.log('Is running:', status.isRunning);
```

## Hoàn tất!

Sau khi hoàn thành các bước trên, bạn có thể:
1. Start HTTP server từ app
2. Truy cập từ máy tính bằng browser
3. Upload file M3U trực tiếp vào app qua mạng LAN

Chúc bạn thành công! 🎉
