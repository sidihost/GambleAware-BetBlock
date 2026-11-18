# GambleAware Release ProGuard / R8 Keep Rules

-keepclassmembers class * {
    @androidx.room.Entity <fields>;
}

-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.**

-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
