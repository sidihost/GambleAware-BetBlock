package com.example.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface BetBlockerDao {

    @Query("SELECT * FROM blocked_domains ORDER BY addedAt DESC")
    fun observeAllDomains(): Flow<List<BlockedDomainEntity>>

    @Query("SELECT * FROM blocked_domains")
    suspend fun getAllDomainsOnce(): List<BlockedDomainEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertDomain(entity: BlockedDomainEntity)

    @Query("DELETE FROM blocked_domains WHERE domain = :domain")
    suspend fun deleteDomain(domain: String)

    @Query("SELECT * FROM blocked_apps ORDER BY addedAt DESC")
    fun observeBlockedApps(): Flow<List<BlockedAppEntity>>

    @Query("SELECT * FROM blocked_apps")
    suspend fun getBlockedAppsOnce(): List<BlockedAppEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertBlockedApp(entity: BlockedAppEntity)

    @Query("DELETE FROM blocked_apps WHERE packageName = :packageName")
    suspend fun deleteBlockedApp(packageName: String)

    @Query("SELECT * FROM blocked_events ORDER BY timestamp DESC LIMIT 200")
    fun observeRecentEvents(): Flow<List<BlockedEventEntity>>

    @Query("SELECT COUNT(*) FROM blocked_events")
    fun observeTotalBlockedCount(): Flow<Int>

    @Query("SELECT COUNT(*) FROM blocked_events WHERE timestamp >= :sinceMs")
    fun observeBlockedCountSince(sinceMs: Long): Flow<Int>

    @Query("SELECT * FROM blocked_events WHERE timestamp >= :sinceMs ORDER BY timestamp DESC")
    fun observeEventsSince(sinceMs: Long): Flow<List<BlockedEventEntity>>

    @Insert
    suspend fun insertEvent(event: BlockedEventEntity)

    @Query("DELETE FROM blocked_events")
    suspend fun clearAllEvents()
}
