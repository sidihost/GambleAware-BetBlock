package com.example.service

data class ParsedDnsPacket(
    val sourceIp: ByteArray,
    val destIp: ByteArray,
    val sourcePort: Int,
    val destPort: Int,
    val ipHeaderLength: Int,
    val dnsPayload: ByteArray,
    val domainName: String,
    val questionEndOffsetInDns: Int,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ParsedDnsPacket) return false
        return sourceIp.contentEquals(other.sourceIp) &&
            destIp.contentEquals(other.destIp) &&
            sourcePort == other.sourcePort &&
            destPort == other.destPort &&
            ipHeaderLength == other.ipHeaderLength &&
            dnsPayload.contentEquals(other.dnsPayload) &&
            domainName == other.domainName &&
            questionEndOffsetInDns == other.questionEndOffsetInDns
    }

    override fun hashCode(): Int {
        var result = sourceIp.contentHashCode()
        result = 31 * result + destIp.contentHashCode()
        result = 31 * result + sourcePort
        result = 31 * result + destPort
        result = 31 * result + ipHeaderLength
        result = 31 * result + dnsPayload.contentHashCode()
        result = 31 * result + domainName.hashCode()
        result = 31 * result + questionEndOffsetInDns
        return result
    }
}

object DnsPacketCodec {

    private const val MIN_IPV4_HEADER_LEN = 20
    private const val UDP_HEADER_LEN = 8
    private const val MIN_DNS_HEADER_LEN = 12
    private const val IP_PROTO_UDP = 17
    private const val DNS_PORT = 53

    fun parseIpv4UdpDns(packet: ByteArray, length: Int = packet.size): ParsedDnsPacket? {
        val len = minOf(length, packet.size)
        if (len < MIN_IPV4_HEADER_LEN + UDP_HEADER_LEN + MIN_DNS_HEADER_LEN) return null

        val version = (packet[0].toInt() ushr 4) and 0x0F
        if (version != 4) return null

        val ihl = (packet[0].toInt() and 0x0F) * 4
        if (ihl < MIN_IPV4_HEADER_LEN || len < ihl + UDP_HEADER_LEN + MIN_DNS_HEADER_LEN) {
            return null
        }

        val ipTotalLength = readUInt16(packet, 2)
        if (ipTotalLength < ihl + UDP_HEADER_LEN + MIN_DNS_HEADER_LEN || ipTotalLength > len) {
            return null
        }

        val fragmentOffset = readUInt16(packet, 6) and 0x1FFF
        if (fragmentOffset != 0) return null

        val protocol = packet[9].toInt() and 0xFF
        if (protocol != IP_PROTO_UDP) return null

        val sourceIp = packet.copyOfRange(12, 16)
        val destIp = packet.copyOfRange(16, 20)

        val udpOffset = ihl
        val sourcePort = readUInt16(packet, udpOffset)
        val destPort = readUInt16(packet, udpOffset + 2)
        if (destPort != DNS_PORT) return null

        val udpLength = readUInt16(packet, udpOffset + 4)
        if (udpLength < UDP_HEADER_LEN + MIN_DNS_HEADER_LEN || udpOffset + udpLength > ipTotalLength) {
            return null
        }

        val dnsOffset = udpOffset + UDP_HEADER_LEN
        val dnsLength = udpLength - UDP_HEADER_LEN
        val dnsPayload = packet.copyOfRange(dnsOffset, dnsOffset + dnsLength)

        // Ensure packet is a DNS query (QR == 0) with at least one question
        if ((dnsPayload[2].toInt() and 0x80) != 0) return null
        val qdCount = readUInt16(dnsPayload, 4)
        if (qdCount < 1) return null

        val (domainName, questionEndOffset) = parseQuestion(dnsPayload) ?: return null
        if (domainName.isEmpty()) return null

        return ParsedDnsPacket(
            sourceIp = sourceIp,
            destIp = destIp,
            sourcePort = sourcePort,
            destPort = destPort,
            ipHeaderLength = ihl,
            dnsPayload = dnsPayload,
            domainName = domainName,
            questionEndOffsetInDns = questionEndOffset,
        )
    }

    fun buildNxdomainResponse(parsed: ParsedDnsPacket): ByteArray {
        val copyLen = parsed.questionEndOffsetInDns.coerceIn(
            MIN_DNS_HEADER_LEN,
            parsed.dnsPayload.size,
        )
        val dnsReply = parsed.dnsPayload.copyOfRange(0, copyLen)
        val origHi = dnsReply[2].toInt() and 0xFF
        // QR = 1, keep Opcode & RD, clear AA and TC
        dnsReply[2] = (((origHi and 0x78) or 0x80 or (origHi and 0x01)) and 0xFF).toByte()
        // RA = 1, Z = 0, RCODE = 3 (NXDOMAIN)
        dnsReply[3] = 0x83.toByte()
        // QDCOUNT = 1, ANCOUNT = 0, NSCOUNT = 0, ARCOUNT = 0
        dnsReply[4] = 0x00
        dnsReply[5] = 0x01
        dnsReply[6] = 0x00
        dnsReply[7] = 0x00
        dnsReply[8] = 0x00
        dnsReply[9] = 0x00
        dnsReply[10] = 0x00
        dnsReply[11] = 0x00

        return buildIpv4UdpPacket(
            srcIp = parsed.destIp,
            dstIp = parsed.sourceIp,
            srcPort = parsed.destPort,
            dstPort = parsed.sourcePort,
            payload = dnsReply,
        )
    }

    fun buildForwardResponse(parsed: ParsedDnsPacket, upstreamReply: ByteArray): ByteArray {
        return buildIpv4UdpPacket(
            srcIp = parsed.destIp,
            dstIp = parsed.sourceIp,
            srcPort = parsed.destPort,
            dstPort = parsed.sourcePort,
            payload = upstreamReply,
        )
    }

    private fun parseQuestion(dnsPayload: ByteArray): Pair<String, Int>? {
        val labels = mutableListOf<String>()
        var offset = MIN_DNS_HEADER_LEN
        var endAfterQname = -1
        var jumped = false
        var hops = 0

        while (offset < dnsPayload.size) {
            val lenByte = dnsPayload[offset].toInt() and 0xFF
            if (lenByte == 0) {
                if (!jumped) {
                    endAfterQname = offset + 1
                }
                break
            }
            when (lenByte and 0xC0) {
                0xC0 -> {
                    if (offset + 1 >= dnsPayload.size) return null
                    if (!jumped) {
                        endAfterQname = offset + 2
                        jumped = true
                    }
                    val ptr = ((lenByte and 0x3F) shl 8) or (dnsPayload[offset + 1].toInt() and 0xFF)
                    if (ptr >= dnsPayload.size || ++hops > 8) return null
                    offset = ptr
                }
                0x00 -> {
                    offset += 1
                    if (offset + lenByte > dnsPayload.size) return null
                    val label = String(dnsPayload, offset, lenByte, Charsets.US_ASCII)
                    labels.add(label)
                    offset += lenByte
                }
                else -> return null
            }
        }

        if (endAfterQname < 0) return null
        val questionEndOffset = endAfterQname + 4 // QTYPE (2) + QCLASS (2)
        if (questionEndOffset > dnsPayload.size) return null

        val domain = labels.joinToString(".").lowercase()
        return domain to questionEndOffset
    }

    private fun buildIpv4UdpPacket(
        srcIp: ByteArray,
        dstIp: ByteArray,
        srcPort: Int,
        dstPort: Int,
        payload: ByteArray,
    ): ByteArray {
        val udpLen = UDP_HEADER_LEN + payload.size
        val totalLen = MIN_IPV4_HEADER_LEN + udpLen
        val out = ByteArray(totalLen)

        // IPv4 Header
        out[0] = 0x45.toByte() // Version 4, IHL 5 (20 bytes)
        out[1] = 0x00
        writeUInt16(out, 2, totalLen)
        writeUInt16(out, 4, 0x0001)
        writeUInt16(out, 6, 0x4000) // Don't fragment
        out[8] = 64.toByte() // TTL
        out[9] = IP_PROTO_UDP.toByte()
        out[10] = 0x00
        out[11] = 0x00
        System.arraycopy(srcIp, 0, out, 12, 4)
        System.arraycopy(dstIp, 0, out, 16, 4)

        val ipChecksum = computeIpv4HeaderChecksum(out, MIN_IPV4_HEADER_LEN)
        writeUInt16(out, 10, ipChecksum)

        // UDP Header
        val udpOffset = MIN_IPV4_HEADER_LEN
        writeUInt16(out, udpOffset, srcPort)
        writeUInt16(out, udpOffset + 2, dstPort)
        writeUInt16(out, udpOffset + 4, udpLen)
        out[udpOffset + 6] = 0x00
        out[udpOffset + 7] = 0x00

        System.arraycopy(payload, 0, out, udpOffset + UDP_HEADER_LEN, payload.size)

        val udpChecksum = computeUdpChecksum(srcIp, dstIp, out, udpOffset, udpLen)
        writeUInt16(out, udpOffset + 6, udpChecksum)

        return out
    }

    private fun computeIpv4HeaderChecksum(buf: ByteArray, headerLen: Int): Int {
        var sum = 0
        var i = 0
        while (i < headerLen) {
            sum += readUInt16(buf, i)
            i += 2
        }
        while ((sum ushr 16) != 0) {
            sum = (sum and 0xFFFF) + (sum ushr 16)
        }
        return sum.inv() and 0xFFFF
    }

    private fun computeUdpChecksum(
        srcIp: ByteArray,
        dstIp: ByteArray,
        packet: ByteArray,
        udpOffset: Int,
        udpLen: Int,
    ): Int {
        var sum = 0
        // Pseudo-header: srcIp, dstIp, zero+proto, udpLen
        sum += readUInt16(srcIp, 0)
        sum += readUInt16(srcIp, 2)
        sum += readUInt16(dstIp, 0)
        sum += readUInt16(dstIp, 2)
        sum += IP_PROTO_UDP
        sum += udpLen

        var i = udpOffset
        val end = udpOffset + udpLen
        while (i + 1 < end) {
            sum += readUInt16(packet, i)
            i += 2
        }
        if (i < end) {
            sum += (packet[i].toInt() and 0xFF) shl 8
        }

        while ((sum ushr 16) != 0) {
            sum = (sum and 0xFFFF) + (sum ushr 16)
        }
        val checksum = sum.inv() and 0xFFFF
        return if (checksum == 0) 0xFFFF else checksum
    }

    private fun readUInt16(buf: ByteArray, offset: Int): Int {
        return ((buf[offset].toInt() and 0xFF) shl 8) or (buf[offset + 1].toInt() and 0xFF)
    }

    private fun writeUInt16(buf: ByteArray, offset: Int, value: Int) {
        buf[offset] = ((value ushr 8) and 0xFF).toByte()
        buf[offset + 1] = (value and 0xFF).toByte()
    }
}
