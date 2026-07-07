# lastfm-scrobbling

## Purpose

Let users connect their own Last.fm account to EchoVault so their listening activity is scrobbled to Last.fm, using their own registered API credentials (no app-wide embedded key), with credentials stored encrypted and never exposed to the renderer process.

## Requirements

### Requirement: Save Last.fm API Credentials
The system SHALL let a user save their own Last.fm API key and secret (from an application they registered at last.fm) before connecting an account, and SHALL NOT ship or require an app-wide embedded key.

#### Scenario: User saves credentials
- **WHEN** the user enters an API key and secret in Settings and clicks Save
- **THEN** the app stores both encrypted and shows the Connect option

#### Scenario: No credentials saved yet
- **WHEN** the user opens the Scrobbling section without having saved an API key/secret
- **THEN** Settings shows the key/secret input form (with a link to register an app on last.fm) instead of a Connect button

### Requirement: Connect Last.fm Account
The system SHALL allow a user to connect their Last.fm account from the Settings page via Last.fm's standard desktop auth flow (token request, browser authorization, session key exchange), using the user's saved API key/secret.

#### Scenario: User connects successfully
- **WHEN** the user has saved API credentials, clicks "Connect" in Settings, authorizes the app on last.fm.com, and clicks "I've authorized" in the app
- **THEN** the app exchanges the token for a session key, stores it encrypted, and Settings shows "Connected as `<username>`"

#### Scenario: User confirms before authorizing
- **WHEN** the user clicks "I've authorized" without having granted access on last.fm.com
- **THEN** the app shows an error toast and remains in the "not connected" state

### Requirement: Disconnect Last.fm Account
The system SHALL allow a connected user to disconnect their Last.fm account, deleting the stored session key while keeping the saved API key/secret so the user isn't forced to re-enter them to reconnect.

#### Scenario: User disconnects
- **WHEN** a connected user clicks "Disconnect" in Settings
- **THEN** the app deletes the stored encrypted session key and username, Settings shows "Not connected", and the saved API key/secret remain so Connect works immediately

### Requirement: Enable/Disable Scrobbling
The system SHALL let a connected user toggle scrobbling on or off independently of the account connection.

#### Scenario: Scrobbling disabled while connected
- **WHEN** a connected user turns the scrobbling toggle off and then plays a track
- **THEN** no now-playing update or scrobble is sent for that playback

### Requirement: Send Now-Playing Updates
The system SHALL send a "now playing" update to Last.fm when a track starts playing, if the user is connected and scrobbling is enabled.

#### Scenario: Track starts playing
- **WHEN** a connected, scrobbling-enabled user starts playback of a track with known artist and title
- **THEN** the app sends a `track.updateNowPlaying` request with the track's artist, title, album, and duration

#### Scenario: Missing required metadata
- **WHEN** a track has no artist or title metadata
- **THEN** the app does not send a now-playing update or scrobble for that track

### Requirement: Scrobble Played Tracks
The system SHALL scrobble a track to Last.fm once it has been played past the Last.fm threshold: at least 50% of its duration or 4 minutes, whichever is lower, and only for tracks longer than 30 seconds.

#### Scenario: Track played past threshold
- **WHEN** a connected, scrobbling-enabled user plays a 3-minute track to the 90-second mark
- **THEN** the app sends exactly one `track.scrobble` request for that track

#### Scenario: Track shorter than 30 seconds
- **WHEN** a track's duration is 20 seconds
- **THEN** the app never scrobbles that track regardless of how much of it plays

#### Scenario: User skips before threshold
- **WHEN** a user skips to the next track before reaching the scrobble threshold
- **THEN** no scrobble is sent for the skipped track

#### Scenario: Re-playing the same track
- **WHEN** a track is scrobbled and then played again from the start
- **THEN** the app scrobbles it again once the threshold is reached for the new play

### Requirement: Retry Failed Scrobbles
The system SHALL retry now-playing/scrobble requests that fail due to network or server errors, without blocking playback.

#### Scenario: Scrobble fails while offline
- **WHEN** a scrobble request fails because the device is offline
- **THEN** the app queues the scrobble locally and retries it on the next successful network request, without interrupting playback

### Requirement: Credential Storage
The system SHALL store the Last.fm API key, API secret, and session key encrypted at rest and SHALL NOT expose any of them to the renderer process.

#### Scenario: Renderer requests connection status
- **WHEN** the Settings UI asks for the current Last.fm connection state
- **THEN** the app returns only `{hasCredentials, connected, username, scrobblingEnabled}` — never the API secret or session key
