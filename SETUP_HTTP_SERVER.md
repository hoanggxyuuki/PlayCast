# Setup HTTP Server cho PlayCast IPTV

## Tổng quan
Để chạy HTTP Server trực tiếp trong app Android, cần thêm native module.

## Cách 1: Eject từ Expo (Recommended)

### Bước 1: Eject
```bash
npx expo prebuild
```

### Bước 2: Thêm NanoHTTPD dependency

**android/app/build.gradle**
```gradle
dependencies {
    // ... existing dependencies
    implementation 'org.nanohttpd:nanohttpd:2.3.1'
}
```

### Bước 3: Tạo HTTP Server Module

**android/app/src/main/java/com/playcast/HTTPServerModule.java**
```java
package com.playcast;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import fi.iki.elonen.NanoHTTPD;
import java.io.IOException;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Collections;
import java.util.List;

public class HTTPServerModule extends ReactContextBaseJavaModule {
    private SimpleHTTPServer server;
    private static final String MODULE_NAME = "HTTPServer";

    public HTTPServerModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void startServer(int port, Promise promise) {
        try {
            if (server != null && server.isAlive()) {
                promise.reject("SERVER_RUNNING", "Server is already running");
                return;
            }

            server = new SimpleHTTPServer(port, getReactApplicationContext());
            server.start();

            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            result.putString("url", "http://" + getIPAddress() + ":" + port);
            result.putString("message", "Server started successfully");

            promise.resolve(result);
        } catch (IOException e) {
            promise.reject("START_ERROR", "Failed to start server: " + e.getMessage());
        }
    }

    @ReactMethod
    public void stopServer(Promise promise) {
        try {
            if (server == null || !server.isAlive()) {
                promise.reject("NOT_RUNNING", "Server is not running");
                return;
            }

            server.stop();
            server = null;

            WritableMap result = Arguments.createMap();
            result.putBoolean("success", true);
            result.putString("message", "Server stopped successfully");

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("STOP_ERROR", "Failed to stop server: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getStatus(Promise promise) {
        WritableMap result = Arguments.createMap();
        result.putBoolean("isRunning", server != null && server.isAlive());
        result.putInt("port", server != null ? server.getListeningPort() : 0);
        promise.resolve(result);
    }

    private String getIPAddress() {
        try {
            List<NetworkInterface> interfaces = Collections.list(NetworkInterface.getNetworkInterfaces());
            for (NetworkInterface intf : interfaces) {
                List<InetAddress> addrs = Collections.list(intf.getInetAddresses());
                for (InetAddress addr : addrs) {
                    if (!addr.isLoopbackAddress()) {
                        String sAddr = addr.getHostAddress();
                        boolean isIPv4 = sAddr.indexOf(':') < 0;
                        if (isIPv4) {
                            return sAddr;
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "localhost";
    }
}
```

**android/app/src/main/java/com/playcast/SimpleHTTPServer.java**
```java
package com.playcast;

import com.facebook.react.bridge.ReactApplicationContext;
import fi.iki.elonen.NanoHTTPD;
import org.json.JSONObject;
import java.io.IOException;
import java.util.Map;

public class SimpleHTTPServer extends NanoHTTPD {
    private ReactApplicationContext reactContext;

    public SimpleHTTPServer(int port, ReactApplicationContext context) {
        super(port);
        this.reactContext = context;
    }

    @Override
    public Response serve(IHTTPSession session) {
        String uri = session.getUri();
        Method method = session.getMethod();

        // Serve HTML upload form
        if (uri.equals("/") || uri.equals("/index.html")) {
            return newFixedLengthResponse(Response.Status.OK, "text/html", getUploadHTML());
        }

        // Handle file upload
        if (uri.equals("/upload") && method == Method.POST) {
            return handleFileUpload(session);
        }

        // 404 Not Found
        return newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "404 Not Found");
    }

    private Response handleFileUpload(IHTTPSession session) {
        try {
            Map<String, String> files = new java.util.HashMap<>();
            session.parseBody(files);

            String fileContent = files.get("playlist");

            if (fileContent == null || fileContent.isEmpty()) {
                JSONObject error = new JSONObject();
                error.put("success", false);
                error.put("message", "No file uploaded");
                return newFixedLengthResponse(Response.Status.BAD_REQUEST, "application/json", error.toString());
            }

            // Validate M3U
            if (!fileContent.trim().startsWith("#EXTM3U")) {
                JSONObject error = new JSONObject();
                error.put("success", false);
                error.put("message", "Invalid M3U file format");
                return newFixedLengthResponse(Response.Status.BAD_REQUEST, "application/json", error.toString());
            }

            // Send to React Native
            // TODO: Emit event to React Native with fileContent

            JSONObject success = new JSONObject();
            success.put("success", true);
            success.put("message", "File uploaded successfully");
            return newFixedLengthResponse(Response.Status.OK, "application/json", success.toString());
        } catch (Exception e) {
            try {
                JSONObject error = new JSONObject();
                error.put("success", false);
                error.put("message", "Upload failed: " + e.getMessage());
                return newFixedLengthResponse(Response.Status.INTERNAL_ERROR, "application/json", error.toString());
            } catch (Exception ex) {
                return newFixedLengthResponse(Response.Status.INTERNAL_ERROR, "text/plain", "Internal server error");
            }
        }
    }

    private String getUploadHTML() {
        return "<!DOCTYPE html><html><head><title>PlayCast Upload</title></head><body><h1>Upload M3U File</h1><form method='POST' action='/upload' enctype='multipart/form-data'><input type='file' name='playlist' accept='.m3u,.m3u8'><button type='submit'>Upload</button></form></body></html>";
    }
}
```

**android/app/src/main/java/com/playcast/HTTPServerPackage.java**
```java
package com.playcast;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class HTTPServerPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new HTTPServerModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
```

### Bước 4: Register Module

**android/app/src/main/java/com/playcast/MainApplication.java**
```java
// Add import
import com.playcast.HTTPServerPackage;

// In getPackages() method, add:
packages.add(new HTTPServerPackage());
```

### Bước 5: Build Android
```bash
npx expo run:android
```

## Cách 2: Sử dụng Expo Dev Client

```bash
# Install expo-dev-client
npx expo install expo-dev-client

# Create development build
eas build --profile development --platform android
```

## Sử dụng trong React Native

```typescript
import { NativeModules } from 'react-native';

const { HTTPServer } = NativeModules;

// Start server
const result = await HTTPServer.startServer(8080);
console.log(result); // { success: true, url: 'http://192.168.1.40:8080' }

// Stop server
await HTTPServer.stopServer();

// Get status
const status = await HTTPServer.getStatus();
console.log(status); // { isRunning: true, port: 8080 }
```

## Test HTTP Server

1. Start server trong app
2. Mở browser trên máy tính cùng mạng WiFi
3. Truy cập: http://PHONE_IP:8080
4. Upload file M3U

## Troubleshooting

**Lỗi: Server không start**
- Check quyền INTERNET trong AndroidManifest.xml
- Đảm bảo port 8080 không bị chiếm

**Lỗi: Không kết nối được**
- Cả 2 thiết bị phải cùng WiFi
- Tắt firewall trên điện thoại
- Check IP address đúng

## Alternative: Sử dụng QR Code

Nếu HTTP Server quá phức tạp, có thể dùng QR code để transfer file content.
