package com.example.safetyride;

import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.content.SharedPreferences;
import android.content.Context;
import android.content.Intent;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private int volumeButtonPressCount = 0;
    private long lastVolumePressTime = 0;
    private static final long VOLUME_PRESS_TIMEOUT = 2000; // 2 seconds
    private static final int REQUIRED_PRESSES = 4;
    private boolean hasPendingSOS = false; // Track if there's pending SOS to send

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Check if SOS was triggered while app was closed or app is starting
        checkForPendingSOS();

        // Handle app shortcuts - if from widget, this sets hasPendingSOS
        handleAppShortcuts(getIntent());
        
        // If widget/shortcut triggered SOS via intent extras, mark as pending for onStart
        if (getIntent() != null && getIntent().getBooleanExtra("trigger_sos", false)) {
            android.util.Log.d("MainActivityCreate", "[DEBUG] ✅ Widget/Shortcut SOS detected in onCreate, marking as pending");
            hasPendingSOS = true;
        }

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
        // Check if SOS was triggered from Quick Settings Tile or Widget
        SharedPreferences tilesPrefs = getSharedPreferences("saferide_prefs", Context.MODE_PRIVATE);
        if (tilesPrefs.getBoolean("trigger_sos", false)) {
            long sosTimestamp = tilesPrefs.getLong("sos_timestamp", 0);
            long elapsedTime = System.currentTimeMillis() - sosTimestamp;
            
            // Only process if triggered within last 60 seconds
            if (elapsedTime < 60000) {
                android.util.Log.d("QuickTileSOS", "Found pending SOS from Tile/Widget " + elapsedTime + "ms ago");
                hasPendingSOS = true;
            }
            
            tilesPrefs.edit().putBoolean("trigger_sos", false).apply();
        }
        
        // Check if there's a pending SOS from volume buttons
        SharedPreferences prefs = getSharedPreferences("capacitor.native", Context.MODE_PRIVATE);
        if (prefs.getBoolean("pending_sos", false)) {
            long triggerTime = prefs.getLong("sos_trigger_time", 0);
            long elapsedTime = System.currentTimeMillis() - triggerTime;
            
            // Only process if triggered within last 30 seconds
            if (elapsedTime < 30000) {
                android.util.Log.d("VolumeButtonSOS", "Found pending SOS from " + elapsedTime + "ms ago");
                hasPendingSOS = true;
            }
            
            prefs.edit().putBoolean("pending_sos", false).apply();
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        
        // Once Bridge is ready, process any pending SOS
        if (hasPendingSOS && this.getBridge() != null) {
            processPendingSOS();
            hasPendingSOS = false;
        }
    }
    
    private void processPendingSOS() {
        // Wait for WebView to be ready, then trigger SOS
        // Increased delay to ensure Student component is mounted and studentData is loaded
        this.getBridge().getWebView().postDelayed(() -> {
            if (this.getBridge() != null && this.getBridge().getWebView() != null) {
                android.util.Log.d("PendingSOS", "Processing pending SOS now - setting pendingWidgetSOS flag and calling handler");
                this.evaluateCapacitor(
                    "window.pendingWidgetSOS = true; console.log('[PendingSOS] Flag set, calling handler'); window.volumeButtonSOSTriggered && window.volumeButtonSOSTriggered()"
                );
            }
        }, 2000); // Increased from 1500ms to 2000ms to be more reliable
    }

    private void evaluateCapacitor(String js) {
        // Use the bridge's eval method to execute JavaScript
        if (this.getBridge() != null && this.getBridge().getWebView() != null) {
            this.getBridge().getWebView().post(() -> {
                try {
                    android.util.Log.d("EvaluateCapacitor", "Executing JavaScript: " + js.substring(0, Math.min(100, js.length())));
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
                        this.getBridge().getWebView().evaluateJavascript(js, result -> {
                            android.util.Log.d("EvaluateCapacitor", "JavaScript result: " + result);
                        });
                    }
                } catch (Exception e) {
                    android.util.Log.e("EvaluateCapacitor", "Error executing JavaScript", e);
                }
            });
        } else {
            android.util.Log.w("EvaluateCapacitor", "Bridge or WebView is null, cannot execute JavaScript");
        }
    }

    /**
     * Handle app shortcuts triggered from home screen
     */
    private void handleAppShortcuts(Intent intent) {
        if (intent == null) {
            android.util.Log.d("AppShortcuts", "handleAppShortcuts called but intent is null");
            return;
        }

        boolean triggerSOS = intent.getBooleanExtra("trigger_sos", false);
        boolean triggerIncident = intent.getBooleanExtra("trigger_incident", false);
        boolean triggerRide = intent.getBooleanExtra("trigger_ride", false);
        boolean fromWidget = intent.getBooleanExtra("from_widget", false);

        if (triggerSOS) {
            String source = fromWidget ? "widget" : "shortcut";
            android.util.Log.d("AppShortcuts", "[DEBUG] ✅ Triggered SOS from " + source);
            android.util.Log.d("AppShortcuts", "[DEBUG] Intent action: " + intent.getAction());
            
            // Save to SharedPreferences (will be processed in onStart when Bridge is ready)
            SharedPreferences prefs = getSharedPreferences("saferide_prefs", Context.MODE_PRIVATE);
            prefs.edit()
                .putBoolean("trigger_sos", true)
                .putLong("sos_timestamp", System.currentTimeMillis())
                .apply();
            android.util.Log.d("AppShortcuts", "[DEBUG] SOS flag saved to SharedPreferences - will trigger when student data loads");
            
            // Try immediate execution if Bridge is available (works for both widgets and shortcuts)
            if (this.getBridge() != null && this.getBridge().getWebView() != null) {
                android.util.Log.d("AppShortcuts", "[DEBUG] Attempting immediate SOS trigger");
                this.getBridge().getWebView().post(() -> {
                    this.evaluateCapacitor(
                        "window.pendingWidgetSOS = true; window.volumeButtonSOSTriggered && window.volumeButtonSOSTriggered()"
                    );
                });
            }
        } else if (triggerIncident) {
            android.util.Log.d("AppShortcuts", "[DEBUG] Triggered Incident Report from shortcut");
            // For app shortcuts, try immediate execution
            if (this.getBridge() != null && this.getBridge().getWebView() != null) {
                this.getBridge().getWebView().post(() -> {
                    this.evaluateCapacitor(
                        "window.triggerIncidentReport && window.triggerIncidentReport()"
                    );
                });
            }
        } else if (triggerRide) {
            android.util.Log.d("AppShortcuts", "[DEBUG] Triggered Ride Request from shortcut");
            // For app shortcuts, try immediate execution
            if (this.getBridge() != null && this.getBridge().getWebView() != null) {
                this.getBridge().getWebView().post(() -> {
                    this.evaluateCapacitor(
                        "window.triggerRideRequest && window.triggerRideRequest()"
                    );
                });
            }
        } else {
            android.util.Log.d("AppShortcuts", "[DEBUG] No widget/shortcut action detected in intent");
        }
    }

    /**
     * Handle new intents when app is already running
     */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        android.util.Log.d("MainActivityIntent", "[DEBUG] ✅ onNewIntent called - app is already running");
        android.util.Log.d("MainActivityIntent", "[DEBUG] Intent action: " + (intent != null ? intent.getAction() : "null"));
        handleAppShortcuts(intent);
        
        // If there's a pending SOS from the widget, process it immediately
        if (intent != null && intent.getBooleanExtra("from_widget", false) && intent.getBooleanExtra("trigger_sos", false)) {
            android.util.Log.d("WidgetSOS", "[DEBUG] detected widget SOS while app running");
            if (this.getBridge() != null && this.getBridge().getWebView() != null) {
                this.getBridge().getWebView().postDelayed(() -> {
                    android.util.Log.d("WidgetSOS", "[DEBUG] Processing widget SOS immediately (app already running)");
                    this.evaluateCapacitor(
                        "window.pendingWidgetSOS = true; window.volumeButtonSOSTriggered && window.volumeButtonSOSTriggered()"
                    );
                }, 100);
            }
        }
    }
}