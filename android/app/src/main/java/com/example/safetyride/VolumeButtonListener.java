package com.example.safetyride;

import android.view.KeyEvent;
import java.util.ArrayList;
import java.util.List;

/**
 * Listens for rapid volume button presses to trigger SOS
 * Pressing volume up or down 4 times within 2 seconds triggers the emergency callback
 */
public class VolumeButtonListener {
    private List<Long> pressTimestamps = new ArrayList<>();
    private static final int REQUIRED_PRESSES = 4;
    private static final long TIME_WINDOW_MS = 2000;
    private OnVolumePressTrigger callback;
    
    public interface OnVolumePressTrigger {
        void onTriggered();
    }
    
    public VolumeButtonListener(OnVolumePressTrigger callback) {
        this.callback = callback;
    }
    
    /**
     * Call this method from MainActivity.onKeyDown() when volume keys are pressed
     */
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        // Check if it's a volume button
        if (keyCode != KeyEvent.KEYCODE_VOLUME_UP && keyCode != KeyEvent.KEYCODE_VOLUME_DOWN) {
            return false;
        }
        
        long now = System.currentTimeMillis();
        
        // Add current press time
        pressTimestamps.add(now);
        
        // Remove old presses outside the time window
        pressTimestamps.removeIf(timestamp -> now - timestamp >= TIME_WINDOW_MS);
        
        android.util.Log.d("VolumeButtonSOS", "Volume press detected. Count: " + pressTimestamps.size() + "/" + REQUIRED_PRESSES);
        
        // Check if we have enough rapid presses
        if (pressTimestamps.size() >= REQUIRED_PRESSES) {
            // Reset and trigger SOS
            pressTimestamps.clear();
            android.util.Log.d("VolumeButtonSOS", "SOS Triggered!");
            
            if (callback != null) {
                callback.onTriggered();
            }
            
            return true; // Consume the event so volume doesn't change
        }
        
        return true; // Consume all volume button presses while in the app
    }
}
