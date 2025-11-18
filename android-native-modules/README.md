# HTTP Server Native Module for PlayCast

## Tổng quan

Thư mục này chứa các file Java cần thiết để tích hợp HTTP Server vào PlayCast IPTV app. HTTP Server cho phép:

- 📱 Mở server HTTP trực tiếp trên điện thoại Android
- 💻 Upload file M3U từ máy tính qua mạng LAN
- 🌐 Chia sẻ playlists giữa các thiết bị trong cùng mạng WiFi

## Các file trong thư mục này

### 1. HTTPServerModule.java
**Native Module** - Bridge giữa React Native và Java

**Chức năng:**
- `startServer(port)`: Khởi động HTTP server trên port chỉ định
- `stopServer()`: Dừng HTTP server
- `getStatus()`: Lấy trạng thái server (đang chạy hay không)
- `getIPAddress()`: Tự động phát hiện IP của thiết bị trong mạng LAN

**React Native API:**
```typescript
import { NativeModules } from 'react-native';
const { HTTPServer } = NativeModules;

// Start
await HTTPServer.startServer(8080);

// Stop
await HTTPServer.stopServer();

// Status
await HTTPServer.getStatus();
```

### 2. SimpleHTTPServer.java
**HTTP Server Implementation** - Sử dụng NanoHTTPD

**Endpoints:**
- `GET /`: Trang HTML upload form với UI đẹp
- `POST /upload`: Endpoint nhận file M3U upload

**Features:**
- Validate M3U format (#EXTM3U header)
- Return JSON response
- Custom HTML với dark theme matching PlayCast UI
- Error handling

### 3. HTTPServerPackage.java
**Package Registration** - Đăng ký native module với React Native

Kết nối HTTPServerModule với React Native bridge.

## Cài đặt

### Option 1: Sử dụng Script Tự động (Recommended)

```bash
# Bước 1: Eject Expo
npx expo prebuild

# Bước 2: Chạy setup script
./setup-http-server.sh
```

Script sẽ tự động:
- ✅ Copy 3 file Java vào đúng thư mục
- ✅ Thêm NanoHTTPD dependency vào build.gradle
- ✅ Hướng dẫn register HTTPServerPackage

### Option 2: Cài đặt Thủ công

Xem chi tiết trong `SETUP_INSTRUCTIONS.md`

## Kiến trúc

```
┌─────────────────────────────────────────┐
│  React Native (TypeScript)              │
│  - HTTPServerService.ts                 │
│  - LocalNetworkScreen.tsx               │
└─────────────┬───────────────────────────┘
              │
              │ NativeModules.HTTPServer
              │
┌─────────────▼───────────────────────────┐
│  Native Module (Java)                   │
│  - HTTPServerModule.java                │
│    ├─ startServer()                     │
│    ├─ stopServer()                      │
│    └─ getStatus()                       │
└─────────────┬───────────────────────────┘
              │
              │ Creates instance
              │
┌─────────────▼───────────────────────────┐
│  HTTP Server (NanoHTTPD)                │
│  - SimpleHTTPServer.java                │
│    ├─ GET /        → HTML form          │
│    └─ POST /upload → Handle M3U         │
└─────────────────────────────────────────┘
```

## Flow hoạt động

1. **User nhấn "Start Server" trong app**
   ```
   LocalNetworkScreen → HTTPServerService → HTTPServerModule (Java)
   ```

2. **HTTPServerModule tạo SimpleHTTPServer instance**
   ```java
   server = new SimpleHTTPServer(8080, reactContext);
   server.start();
   ```

3. **Lấy IP address tự động**
   ```java
   String ip = getIPAddress(); // "192.168.1.40"
   String url = "http://" + ip + ":8080";
   ```

4. **Return URL cho React Native**
   ```typescript
   { success: true, url: "http://192.168.1.40:8080" }
   ```

5. **User mở browser trên máy tính, truy cập URL**
   ```
   Browser → http://192.168.1.40:8080 → SimpleHTTPServer.serve()
   ```

6. **Server trả về HTML upload form**
   ```html
   <form method="POST" action="/upload" enctype="multipart/form-data">
     <input type="file" name="playlist" accept=".m3u,.m3u8">
     <button type="submit">Upload</button>
   </form>
   ```

7. **User chọn file M3U và upload**
   ```
   Browser → POST /upload → handleFileUpload()
   ```

8. **Validate và parse M3U**
   ```java
   if (!fileContent.trim().startsWith("#EXTM3U")) {
     return error("Invalid M3U format");
   }
   ```

9. **Send to React Native (TODO: Implement event emitter)**
   ```java
   // Future: Emit event with file content
   reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
       .emit("onM3UUploaded", fileContent);
   ```

## Dependencies

### NanoHTTPD
- **Version**: 2.3.1
- **License**: BSD-3-Clause
- **Size**: ~200KB
- **Purpose**: Lightweight HTTP server cho Android

```gradle
implementation 'org.nanohttpd:nanohttpd:2.3.1'
```

## Testing

### 1. Start Server
```typescript
const result = await HTTPServerService.startServer(8080);
console.log(result);
// { success: true, url: "http://192.168.1.40:8080", message: "Server started" }
```

### 2. Mở Browser
```
Truy cập: http://192.168.1.40:8080
Kết quả: Thấy trang upload form
```

### 3. Upload M3U File
```
1. Click "Choose file"
2. Chọn file .m3u hoặc .m3u8
3. Click "Upload to PlayCast"
4. Kết quả: { success: true, message: "File uploaded successfully" }
```

### 4. Check Logs
```bash
# Android Logcat
adb logcat | grep PlayCast
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **No Authentication**: Server không có authentication/authorization
2. **LAN Only**: Chỉ sử dụng trong mạng LAN tin cậy
3. **File Validation**: Chỉ accept file bắt đầu với #EXTM3U
4. **No Persistence**: File content chỉ tồn tại trong memory

**Recommendations:**
- Không mở port ra Internet
- Tắt server khi không sử dụng
- Chỉ dùng trong mạng WiFi nhà/văn phòng

## Troubleshooting

### Server không start
```
Error: "Failed to start server: Address already in use"
→ Port 8080 đã được sử dụng, thử port khác (8081, 8082...)
```

### Không kết nối được từ máy tính
```
Error: "Connection refused"
→ Check:
  1. Cả 2 thiết bị cùng mạng WiFi?
  2. IP address đúng chưa?
  3. Server đang chạy? (getStatus)
  4. Firewall tắt chưa?
```

### File upload fail
```
Error: "Invalid M3U file format"
→ File phải bắt đầu với #EXTM3U
```

## Future Improvements

- [ ] Event emitter để send file content về React Native real-time
- [ ] Support upload nhiều file cùng lúc
- [ ] Progress indicator cho upload
- [ ] WebSocket support cho real-time updates
- [ ] Basic authentication (username/password)
- [ ] HTTPS support với self-signed certificate

## API Reference

### HTTPServerService (TypeScript)

```typescript
class HTTPServerService {
  static isNativeModuleAvailable(): boolean
  static async startServer(port: number): Promise<Result>
  static async stopServer(): Promise<Result>
  static async getStatus(): Promise<Status>
  static getCurrentInfo(): Info
}

interface Result {
  success: boolean;
  url?: string;
  message: string;
}

interface Status {
  isRunning: boolean;
  port: number;
  url: string;
}
```

### HTTPServer Native Module (Java)

```java
public class HTTPServerModule extends ReactContextBaseJavaModule {
  @ReactMethod
  public void startServer(int port, Promise promise)

  @ReactMethod
  public void stopServer(Promise promise)

  @ReactMethod
  public void getStatus(Promise promise)

  private String getIPAddress()
}
```

## License

Part of PlayCast IPTV project - Vietnamese university project

## Support

Xem thêm:
- `SETUP_INSTRUCTIONS.md` - Hướng dẫn cài đặt chi tiết
- `../SETUP_HTTP_SERVER.md` - Documentation gốc
- `../src/services/HTTPServerService.ts` - React Native service
- `../src/screens/LocalNetworkScreen.tsx` - UI implementation
