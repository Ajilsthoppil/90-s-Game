# Childhood Games — Security Architecture & Threat Model

## 1. Executive Summary
This document establishes the security architecture and threat model for the **Childhood Games** React Native Android application and its future server-authoritative FastAPI + WebSocket / WSS backend.

The primary architectural principle:
> **The mobile client is an untrusted entity.**
> The server is the sole security and state authority for all competitive multiplayer matches.

---

## 2. Threat Model & Mitigations Matrix

| Threat Category | Potential Attack Vector | Security Decision & Mitigation |
| :--- | :--- | :--- |
| **Client Game Action Tampering** | Client sends fake roll `{"dice": 6}`, fake win `{"winner": true}`, or fake bingo claim. | **Server-Authoritative Engine**: The server generates all random dice rolls, deck shuffles, and validates win conditions. Fake client claims are rejected with `403 / UNKNOWN_ACTION`. |
| **Unauthorized Room Access** | Attacker increments room ID to enter private friend room. | **Dual Room Identifiers**: Visible 6-char Room Code (`AB7K9`) maps internally to a cryptographically random UUID (`550e8400-e29b-41d4-a716-446655440000`). Session authorization gates every access. |
| **Private Data Leakage** | Client inspects network traffic to see opponents' hands in UNO or Phase 10. | **Data Minimization Gate**: The server filters outbound WebSocket messages per player. Player A never receives Player B's private cards or uncalled Bingo board numbers. |
| **Replay & Impersonation Attacks** | Attacker captures and replayed duplicate action packets or steals token. | **Idempotency & Token Auth**: All game actions require a unique `eventId` (`IdempotencyManager`) and JWT access token stored in Android `SecureStorageWrapper`. |
| **Denial of Service / Flooding** | Attacker floods WebSocket endpoint with high-frequency packets. | **Rate Limiting & Connection Gates**: `RateLimiter` enforces strict sliding-window request thresholds per user IP/Session. |
| **Device Compromise / Permission Escalation** | Rogue SDK or exploit attempts device contact/location access. | **Minimal Android Permissions**: No contacts, SMS, call logs, location, mic, or camera permissions requested in `AndroidManifest.xml`. Device sandbox preserved. |

---

## 3. Server-Authoritative Flow (HTTPS / WSS)

```text
MOBILE CLIENT (Untrusted UI)          BACKEND SERVER (Authoritative Engine)
      │                                       │
      │── 1. REQUEST_ACTION (e.g. ROLL_DICE) ─►│
      │                                       ├── Validate JWT Authentication
      │                                       ├── Validate Room Membership
      │                                       ├── Validate Turn Ownership
      │                                       ├── Generate Random Dice Result (1..6)
      │                                       └── Mutate Room State
      │◄── 2. STATE_UPDATE (Authoritative) ────┤
      │                                       │
```

---

## 4. Local Mode Isolation
Local/Offline gameplay (Bingo vs Bots, UNO vs Bots, Ludo vs Bots, Brain Games) runs completely isolated without network calls or authentication friction. Security checks activate seamlessly when connecting to online multiplayer rooms.
