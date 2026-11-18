# GambleAware Release ProGuard / R8 Keep Rules

-keep public class com.example.MainActivity
-keep public class com.example.ui.BlockedInterventionActivity
-keep public class com.example.service.GambleAwareAccessibilityService
-keep public class com.example.service.GambleAwareDeviceAdminReceiver
-keep public class com.example.service.PackageInstallReceiver

-keepclassmembers class * {
    @androidx.room.Entity <fields>;
}

-keep class * extends androidx.room.RoomDatabase
-keep class * extends androidx.room.RoomOpenDelegate
-dontwarn androidx.room.**

-keep class androidx.datastore.** { *; }
-dontwarn androidx.datastore.**

-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
