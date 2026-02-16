package com.example.safetyride;

import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.content.SharedPreferences;
import android.content.Context;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private int volumeButtonPressCount = 0;
    private long lastVolumePressTime = 0;
    private static final long VOLUME_PRESS_TIMEOUT = 2000; // 2 seconds
    private static final int REQUIRED_PRESSES = 4;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Check if SOS was triggered while app was closed
        checkForPendingSOS();

        // Set fullscreen flags
        getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN
        );


        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            // Use WindowInsetsController for better control
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            // Fallback for older versions
            View decorView = getWindow().getDecorView();
            decorView.setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            );
        }

        // Ensure UI stays hidden when window focus changes
        getWindow().getDecorView().setOnSystemUiVisibilityChangeListener(visibility -> {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                WindowInsetsController controller = getWindow().getInsetsController();
                if (controller != null) {
                    controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                }
            } else {
                View decorView = getWindow().getDecorView();
                decorView.setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                                | View.SYSTEM_UI_FLAG_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                );
            }
        });
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // Only reapply if we're in fullscreen mode
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                WindowInsetsController controller = getWindow().getInsetsController();
                if (controller != null) {
                    controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                }
            } else {
                View decorView = getWindow().getDecorView();
                decorView.setSystemUiVisibility(
                        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                                | View.SYSTEM_UI_FLAG_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                );
            }
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        // Handle volume button presses (KEYCODE_VOLUME_UP = 24, KEYCODE_VOLUME_DOWN = 25)
        if (keyCode == KeyEvent.KEYCODE_VOLUME_UP || keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
            long currentTime = System.currentTimeMillis();
            
            // Reset counter if too much time has passed
            if (currentTime - lastVolumePressTime > VOLUME_PRESS_TIMEOUT) {
                volumeButtonPressCount = 1;
            } else {
                volumeButtonPressCount++;
            }
            
            lastVolumePressTime = currentTime;
            
            android.util.Log.d("VolumeButtonSOS", "Volume button pressed. Count: " + volumeButtonPressCount);
            
            // Trigger SOS if we've reached the required number of presses
            if (volumeButtonPressCount >= REQUIRED_PRESSES) {
                volumeButtonPressCount = 0;
                triggerSOSFromNative();
                return true; // Consume the event
            }
            
            return true; // Consume the event
        }
        return super.onKeyDown(keyCode, event);
    }

    private void triggerSOSFromNative() {
        // Send message to web layer if app is active
        android.util.Log.d("VolumeButtonSOS", "Triggering SOS from native");
        
        // Execute JavaScript function if available (when app is open)
        this.evaluateCapacitor(
            "window.volumeButtonSOSTriggered && window.volumeButtonSOSTriggered()"
        );
        
        // Also try to send SOS via background service (when app is closed)
        sendSOSViaBackground();
    }

    private void sendSOSViaBackground() {
        // Mark that SOS was triggered (even if app is closed)
        SharedPreferences prefs = getSharedPreferences("capacitor.native", Context.MODE_PRIVATE);
        prefs.edit().putBoolean("pending_sos", true).putLong("sos_trigger_time", System.currentTimeMillis()).apply();
        
        android.util.Log.d("VolumeButtonSOS", "SOS marked as pending - will send when app opens");
    }

    private void checkForPendingSOS() {
        // Check if there's a pending SOS from when app was closed
        SharedPreferences prefs = getSharedPreferences("capacitor.native", Context.MODE_PRIVATE);
        if (prefs.getBoolean("pending_sos", false)) {
            long triggerTime = prefs.getLong("sos_trigger_time", 0);
            long elapsedTime = System.currentTimeMillis() - triggerTime;
            
            // Only send if triggered within last 30 seconds
            if (elapsedTime < 30000) {
                android.util.Log.d("VolumeButtonSOS", "Found pending SOS from " + elapsedTime + "ms ago, sending now");
                
                // Notify the web app that SOS was triggered
                this.evaluateCapacitor(
                    "window.volumeButtonSOSTriggered && window.volumeButtonSOSTriggered()"
                );
            }
            

            prefs.edit().putBoolean("pending_sos", false).apply();
        }
    }

    private void evaluateCapacitor(String js) {
        // Use the bridge's eval method to execute JavaScript
        if (this.getBridge() != null) {
            this.getBridge().getWebView().post(() -> {
                try {
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
                        this.getBridge().getWebView().evaluateJavascript(js, null);
                    }
                } catch (Exception e) {
                    android.util.Log.e("VolumeButtonSOS", "Error executing JavaScript", e);
                }
            });
        }
    }
}