package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "blocked_domains")
data class BlockedDomainEntity(
    @PrimaryKey val domain: String,
    val isAllowlisted: Boolean = false,
    val categoryName: String = "CUSTOM",
    val addedAt: Long = System.currentTimeMillis(),
)

@Entity(tableName = "blocked_events")
data class BlockedEventEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val target: String,
    val source: String,
    val categoryName: String,
    val timestamp: Long = System.currentTimeMillis(),
)

@Entity(tableName = "blocked_apps")
data class BlockedAppEntity(
    @PrimaryKey val packageName: String,
    val appLabel: String,
    val addedAt: Long = System.currentTimeMillis(),
)
