package com.smsgateway.app

import android.telephony.SmsManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import android.os.Build

class SmsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "SmsModule"
    }

    @ReactMethod
    fun sendSms(recipient: String, content: String, promise: Promise) {
        try {
            val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                reactApplicationContext.getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }
            
            // Send text message
            smsManager.sendTextMessage(recipient, null, content, null, null)
            promise.resolve("SMS sent successfully")
        } catch (e: Exception) {
            promise.reject("SMS_SEND_ERROR", e.message, e)
        }
    }
}
