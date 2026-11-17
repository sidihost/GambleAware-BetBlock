package com.example.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        BlockedDomainEntity::class,
        BlockedEventEntity::class,
        BlockedAppEntity::class,
    ],
    version = 1,
    exportSchema = false,
)
abstract class BetBlockerDatabase : RoomDatabase() {
    abstract fun dao(): BetBlockerDao

    companion object {
        @Volatile
        private var INSTANCE: BetBlockerDatabase? = null

        fun getInstance(context: Context): BetBlockerDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    BetBlockerDatabase::class.java,
                    "anchor_blocker.db",
                ).build().also { INSTANCE = it }
            }
        }
    }
}
