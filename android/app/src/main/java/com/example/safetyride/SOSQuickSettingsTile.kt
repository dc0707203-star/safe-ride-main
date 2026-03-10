package com.example.safetyride

import android.content.Intent
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import androidx.annotation.RequiresApi

/**
 * Quick Settings Tile for emergency SOS
 * Allows users to trigger SOS emergency from quick settings
 * Available on Android 7.0+ (API 24+)
 */
@RequiresApi(Build.VERSION_CODES.N)
class SOSQuickSettingsTile : TileService() {

    override fun onCreate() {
        super.onCreate()
    }

    /**
    * Called when tile is first added to quick settings
    * or when tile state needs to be updated
    */
    override fun onTileAdded() {
        super.onTileAdded()
        updateTile()
    }

    /**
     * Called when tile changes visibility
     */
    override fun onStartListening() {
        super.onStartListening()
        updateTile()
    }

    /**
     * Called when user clicks the tile
     */
    override fun onClick() {
        super.onClick()
        triggerSOS()
    }

    /**
     * Update tile appearance and state
     */
    private fun updateTile() {
        val tile = qsTile ?: return
        
        tile.apply {
            label = "Emergency SOS"
            subtitle = "Emergency Help"
            contentDescription = "Tap to send emergency SOS alert"
            
            // Set tile state to active
            state = Tile.STATE_ACTIVE
            
            // Update icon (use emergency icon from drawable)
            icon = android.graphics.drawable.Icon.createWithResource(
                this@SOSQuickSettingsTile,
                android.R.drawable.ic_dialog_info // Default icon, can be custom
            )
            
            updateTile()
        }
    }

    /**
     * Trigger SOS emergency - launch main activity with SOS flag
     */
    private fun triggerSOS() {
        try {
            // Save SOS flag to SharedPreferences
            val prefs = getSharedPreferences("saferide_prefs", MODE_PRIVATE)
            prefs.edit().apply {
                putBoolean("trigger_sos", true)
                putLong("sos_timestamp", System.currentTimeMillis())
                apply()
            }

            // Launch main activity
            val intent = Intent(this, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                putExtra("trigger_sos", true)
            }
            
            startActivityAndCollapse(intent)
            
            // Update tile state
            updateTile()
            
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onStopListening() {
        super.onStopListening()
    }
}
