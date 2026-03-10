package com.example.safetyride

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.os.Build
import android.widget.RemoteViews

/**
 * Home Screen Widget Provider for Emergency SOS
 * Provides a quick access button on home screen
 */
class SOSWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        // Create the RemoteViews object
        val views = RemoteViews(
            context.packageName,
            R.layout.widget_sos_emergency
        )

        // Create an intent that will be broadcast when widget is clicked
        val intent = Intent(context, MainActivity::class.java).apply {
            action = "com.example.safetyride.WIDGET_SOS_ACTION"
            putExtra("trigger_sos", true)
            putExtra("from_widget", true)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }

        val pendingIntent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            PendingIntent.getActivity(
                context,
                appWidgetId + 10000, // Unique request code to avoid collisions
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        } else {
            PendingIntent.getActivity(
                context,
                appWidgetId + 10000, // Unique request code to avoid collisions
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT
            )
        }

        // When widget is clicked, save to SharedPreferences (reliable approach)
        // This ensures that even if app isn't running, we capture the intent
        views.setOnClickPendingIntent(R.id.widget_sos_button, pendingIntent)

        // Tell the widget manager to update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views)
        
        android.util.Log.d("SOSWidget", "Widget updated with SOS button click listener - appWidgetId: $appWidgetId")
    }

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        // Widget enabled
        android.util.Log.d("SOSWidget", "Widget enabled")
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        // Last widget instance disabled
        android.util.Log.d("SOSWidget", "Widget disabled")
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        super.onDeleted(context, appWidgetIds)
        // Widget deleted from home screen
        android.util.Log.d("SOSWidget", "Widget deleted")
    }
}
