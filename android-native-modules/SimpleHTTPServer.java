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
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset='UTF-8'>" +
                "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "<title>PlayCast - Upload M3U</title>" +
                "<style>" +
                "body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #1e293b; color: #e2e8f0; }" +
                "h1 { color: #6366f1; text-align: center; }" +
                ".upload-box { background: #334155; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }" +
                "input[type='file'] { width: 100%; padding: 10px; margin: 20px 0; border: 2px dashed #6366f1; background: #1e293b; color: #e2e8f0; border-radius: 5px; cursor: pointer; }" +
                "button { width: 100%; padding: 15px; background: #6366f1; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; transition: background 0.3s; }" +
                "button:hover { background: #4f46e5; }" +
                ".info { margin-top: 20px; padding: 15px; background: #1e293b; border-left: 4px solid #6366f1; border-radius: 5px; font-size: 14px; }" +
                ".info p { margin: 5px 0; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<h1>📺 PlayCast IPTV</h1>" +
                "<div class='upload-box'>" +
                "<h2 style='margin-top: 0;'>Upload M3U Playlist</h2>" +
                "<form method='POST' action='/upload' enctype='multipart/form-data'>" +
                "<input type='file' name='playlist' accept='.m3u,.m3u8' required>" +
                "<button type='submit'>📤 Upload to PlayCast</button>" +
                "</form>" +
                "<div class='info'>" +
                "<p><strong>Supported formats:</strong> .m3u, .m3u8</p>" +
                "<p><strong>Note:</strong> File will be imported into PlayCast app on this device</p>" +
                "</div>" +
                "</div>" +
                "</body>" +
                "</html>";
    }
}
