package com.anonymous.playcast;

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
