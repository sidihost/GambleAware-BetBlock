package com.example.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(
    entities = [
        BlockedDomainEntity::class,
        BlockedEventEntity::class,
        BlockedAppEntity::class,
        UrgeLogEntity::class,
    ],
    version = 2,
    exportSchema = false,
)
abstract class BetBlockerDatabase : RoomDatabase() {
    abstract fun dao(): BetBlockerDao

    companion object {
        @Volatile
        private var INSTANCE: BetBlockerDatabase? = null

        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS urge_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        triggerTag TEXT NOT NULL,
                        note TEXT NOT NULL,
                        timestamp INTEGER NOT NULL
                    )
                    """.trimIndent(),
                )
            }
        }

        fun getInstance(context: Context): BetBlockerDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    BetBlockerDatabase::class.java,
                    "anchor_blocker.db",
                )
                    .addMigrations(MIGRATION_1_2)
                    .build()
                    .also { INSTANCE = it }
            }
        }
    }
}
