package com.anonymous.playcast;

import android.app.PictureInPictureParams;
import android.os.Build;
import android.util.Rational;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class PictureInPictureModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public PictureInPictureModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return "PictureInPictureModule";
    }

    @ReactMethod
    public void enterPictureInPicture(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder();

                // Set aspect ratio for video (16:9)
                builder.setAspectRatio(new Rational(16, 9));

                // Enter PiP mode
                boolean success = getCurrentActivity().enterPictureInPictureMode(builder.build());

                if (success) {
                    promise.resolve(true);
                } else {
                    promise.reject("PIP_FAILED", "Failed to enter Picture-in-Picture mode");
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                // For Android N (API 24), use the simpler method (returns void)
                getCurrentActivity().enterPictureInPictureMode();
                promise.resolve(true);
            } else {
                promise.reject("PIP_NOT_SUPPORTED", "Picture-in-Picture is not supported on this Android version");
            }
        } catch (Exception e) {
            promise.reject("PIP_ERROR", "Error entering Picture-in-Picture: " + e.getMessage());
        }
    }

    @ReactMethod
    public void isPictureInPictureSupported(Promise promise) {
        promise.resolve(Build.VERSION.SDK_INT >= Build.VERSION_CODES.N);
    }
}
