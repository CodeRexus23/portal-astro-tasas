// Copyright © 2026, Manuel Alejandro Manzanares Gonzalez. Todos los derechos reservados.
package com.example.util

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.provider.Settings
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import kotlin.math.abs

/**
 * Verificador Oficial de Primera Instalación en Android (Opción 1 - Telemetría Real).
 *
 * Envía un único ping silencioso a Supabase cuando un usuario instala el APK
 * y abre Astro Tasas en un teléfono físico real.
 *
 * Garantía Anti-Duplicados:
 * - Calcula un ID entero determinista basado en el `Settings.Secure.ANDROID_ID` del dispositivo.
 * - La llave primaria (`id`) en PostgreSQL/Supabase rechaza cualquier intento duplicado
 *   (`Prefer: resolution=ignore-duplicates`), garantizando 1 teléfono real = 1 registro único.
 *
 * Cómo activarlo en `MainActivity.kt` (dentro de `onCreate`):
 *   com.example.util.InstallVerifier.verifyFirstInstall(this)
 */
object InstallVerifier {
    private const val PREF_NAME = "astrotasas_install_verifier_v1"
    private const val KEY_VERIFIED_CLOUD = "is_install_verified_in_supabase"

    private const val SUPABASE_URL = "https://kxilovoovnbecneyjnkk.supabase.co"
    private const val SUPABASE_KEY = "sb_publishable_6hQqAvYT4zaLutnbC5EFZA_EhER44HG"

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    @SuppressLint("HardwareIds")
    fun verifyFirstInstall(context: Context, appVersion: String = "2.1.2") {
        val appCtx = context.applicationContext
        val prefs = appCtx.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

        // Si ya fue confirmado previamente en este teléfono, no gasta datos móviles
        if (prefs.getBoolean(KEY_VERIFIED_CLOUD, false)) {
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val androidId = Settings.Secure.getString(
                    appCtx.contentResolver,
                    Settings.Secure.ANDROID_ID
                ) ?: "${Build.BOARD}_${Build.MODEL}_${Build.MANUFACTURER}"

                // Generar ID único positivo (> 10000) a partir del ANDROID_ID físico
                var hash = 5381L
                for (ch in androidId) {
                    hash = ((hash shl 5) + hash) xor ch.code.toLong()
                }
                val deviceIdInt = ((abs(hash) % 2000000000L) + 10000L).toInt()
                val deviceModel = "${Build.MANUFACTURER.replaceFirstChar { it.uppercase() }} ${Build.MODEL} (Android ${Build.VERSION.RELEASE})"

                val payload = JSONObject().apply {
                    put("id", deviceIdInt)
                    put("app_version", appVersion)
                    put("apk_provider", "ANDROID_VERIFIED_INSTALL")
                    put("apk_url", "android_${deviceIdInt.toString(16)}")
                    put("apk_size", deviceModel.take(48))
                    put("apk_updated_at", "Verificado en App")
                    put("apk_changelog", "Instalación verificada desde aplicación nativa Android")
                    put("telegram_url", "https://t.me/+A6xwBk-NT_Y1NGRh")
                }

                val body = payload.toString().toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
                val request = Request.Builder()
                    .url("$SUPABASE_URL/rest/v1/app_settings?on_conflict=id")
                    .header("apikey", SUPABASE_KEY)
                    .header("Authorization", "Bearer $SUPABASE_KEY")
                    .header("Content-Type", "application/json")
                    .header("Prefer", "resolution=ignore-duplicates,return=minimal")
                    .post(body)
                    .build()

                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful || response.code == 409) {
                        prefs.edit().putBoolean(KEY_VERIFIED_CLOUD, true).apply()
                        Log.i("InstallVerifier", "Instalación verificada en Supabase con ID único: $deviceIdInt")
                    } else {
                        Log.w("InstallVerifier", "Respuesta inesperada verificando instalación: ${response.code}")
                    }
                }
            } catch (e: Exception) {
                Log.w("InstallVerifier", "Se reintentará verificar instalación en la próxima conexión: ${e.message}")
            }
        }
    }
}
