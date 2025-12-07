package com.bidev.playcast;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
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
            // Parse body FIRST to populate files map
            Map<String, String> files = new java.util.HashMap<>();
            session.parseBody(files);

            // Get uploaded file path (NanoHTTPD stores temp file path in 'files' map)
            String filePath = files.get("mediafile");

            if (filePath == null || filePath.isEmpty()) {
                JSONObject error = new JSONObject();
                error.put("success", false);
                error.put("message", "No file uploaded");
                return newFixedLengthResponse(Response.Status.BAD_REQUEST, "application/json", error.toString());
            }

            // Get parameters AFTER parseBody (parseBody populates the params)
            Map<String, String> parms = session.getParms();

            // Extract filename from hidden field sent by JavaScript
            String fileName = parms.get("filename");

            // Debug: Log all parameters to see what's available
            android.util.Log.d("HTTPServer", "All params: " + parms.toString());
            android.util.Log.d("HTTPServer", "Filename from params: " + fileName);

            if (fileName == null || fileName.isEmpty()) {
                // Fallback
                fileName = "uploaded_file";
            }

            // Read file content for M3U files, or copy media files to permanent storage
            java.io.File uploadedFile = new java.io.File(filePath);
            String fileContent = "";
            String permanentPath = filePath;
            boolean isTextFile = fileName.toLowerCase().endsWith(".m3u") || fileName.toLowerCase().endsWith(".m3u8");

            if (isTextFile) {
                // Read M3U content
                java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.FileReader(uploadedFile));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append("\n");
                }
                reader.close();
                fileContent = sb.toString();
            } else {
                // For media files, copy to permanent storage
                java.io.File moviesDir = new java.io.File(reactContext.getExternalFilesDir(android.os.Environment.DIRECTORY_MOVIES), "PlayCast");
                if (!moviesDir.exists()) {
                    moviesDir.mkdirs();
                }

                // Create permanent file with unique name
                String timestamp = String.valueOf(System.currentTimeMillis());
                java.io.File permanentFile = new java.io.File(moviesDir, timestamp + "_" + fileName);

                // Copy file from temp to permanent location
                java.io.FileInputStream fis = new java.io.FileInputStream(uploadedFile);
                java.io.FileOutputStream fos = new java.io.FileOutputStream(permanentFile);
                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = fis.read(buffer)) != -1) {
                    fos.write(buffer, 0, bytesRead);
                }
                fis.close();
                fos.close();

                permanentPath = permanentFile.getAbsolutePath();
                fileContent = permanentPath;

                android.util.Log.d("HTTPServer", "Copied file to permanent storage: " + permanentPath);
            }

            // Detect file type
            String fileType = detectFileType(fileContent, fileName);

            // Send to React Native via Event Emitter
            if (reactContext.hasActiveCatalystInstance()) {
                JSONObject payload = new JSONObject();
                payload.put("content", fileContent);
                payload.put("type", fileType);
                payload.put("filename", fileName);
                payload.put("filepath", permanentPath);

                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onFileUploaded", payload.toString());
            }

            JSONObject success = new JSONObject();
            success.put("success", true);
            success.put("message", "File uploaded successfully");
            success.put("type", fileType);
            success.put("filename", fileName);
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

    private String detectFileType(String content, String filename) {
        // Check M3U/M3U8 by content
        if (content.trim().startsWith("#EXTM3U") || content.trim().startsWith("#EXT-X-")) {
            return "m3u";
        }

        // Check by filename extension
        if (filename != null) {
            String lower = filename.toLowerCase();
            if (lower.endsWith(".m3u") || lower.endsWith(".m3u8")) {
                return "m3u";
            }
            // Video formats
            if (lower.endsWith(".mp4") || lower.endsWith(".mkv") || lower.endsWith(".avi") ||
                lower.endsWith(".mov") || lower.endsWith(".flv") || lower.endsWith(".wmv") ||
                lower.endsWith(".webm") || lower.endsWith(".ts")) {
                return "video";
            }
            // Audio formats
            if (lower.endsWith(".mp3") || lower.endsWith(".aac") || lower.endsWith(".wav") ||
                lower.endsWith(".flac") || lower.endsWith(".ogg") || lower.endsWith(".m4a") ||
                lower.endsWith(".wma")) {
                return "audio";
            }
        }

        return "unknown";
    }

    private String getUploadHTML() {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset='UTF-8'>" +
                "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "<title>PlayCast - Upload Media</title>" +
                "<style>" +
                "body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #1e293b; color: #e2e8f0; }" +
                "h1 { color: #6366f1; text-align: center; }" +
                ".upload-box { background: #334155; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }" +
                "input[type='file'] { width: 100%; padding: 10px; margin: 20px 0; border: 2px dashed #6366f1; background: #1e293b; color: #e2e8f0; border-radius: 5px; cursor: pointer; }" +
                "button { width: 100%; padding: 15px; background: #6366f1; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; transition: background 0.3s; }" +
                "button:hover { background: #4f46e5; }" +
                ".info { margin-top: 20px; padding: 15px; background: #1e293b; border-left: 4px solid #6366f1; border-radius: 5px; font-size: 14px; }" +
                ".info p { margin: 5px 0; }" +
                ".format-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }" +
                ".format-item { background: #475569; padding: 8px; border-radius: 4px; text-align: center; font-size: 12px; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<h1>📺 PlayCast Media Uploader</h1>" +
                "<div class='upload-box'>" +
                "<h2 style='margin-top: 0;'>Upload Media Files</h2>" +
                "<form method='POST' action='/upload' enctype='multipart/form-data' id='uploadForm'>" +
                "<input type='file' name='mediafile' id='fileInput' accept='.m3u,.m3u8,.mp4,.mkv,.avi,.mov,.flv,.wmv,.webm,.ts,.mp3,.aac,.wav,.flac,.ogg,.m4a,.wma' required>" +
                "<input type='hidden' name='filename' id='filename'>" +
                "<button type='submit'>📤 Upload to PlayCast</button>" +
                "</form>" +
                "<script>" +
                "document.getElementById('fileInput').addEventListener('change', function(e) {" +
                "  if (e.target.files.length > 0) {" +
                "    document.getElementById('filename').value = e.target.files[0].name;" +
                "  }" +
                "});" +
                "</script>" +
                "<div class='info'>" +
                "<p><strong>Supported formats:</strong></p>" +
                "<div class='format-list'>" +
                "<div class='format-item'>📋 Playlists: M3U, M3U8</div>" +
                "<div class='format-item'>🎥 Video: MP4, MKV, AVI, MOV</div>" +
                "<div class='format-item'>📺 Streaming: FLV, WMV, WebM, TS</div>" +
                "<div class='format-item'>🎵 Audio: MP3, AAC, WAV, FLAC, OGG, M4A, WMA</div>" +
                "</div>" +
                "<p style='margin-top: 15px;'><strong>Note:</strong> Files will be imported into PlayCast app on this device</p>" +
                "</div>" +
                "</div>" +
                "</body>" +
                "</html>";
    }
}
