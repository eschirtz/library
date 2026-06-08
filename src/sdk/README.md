# @samply/sdk

## Goal

A standalone JavaScript SDK that lets 3rd-party websites embed Samply audio players with fully custom UIs. Consumers install one package, provide a player ID, and get back everything they need: player metadata, track list, artwork, and playback controls powered by HLS streaming.

## Strategy

### What it does

The SDK extracts the audio engine from the colab app (Shaka Player, queue management, loudness normalization, gapless playback) and wraps it behind a simple, framework-agnostic API. Firebase is bundled internally so the SDK can fetch player data directly from Samply's backend — consumers never interact with Firebase themselves.

### How it works

1. Consumer calls `samply.load(playerId)`
2. SDK initializes Firebase (anonymous auth) and fetches the player document + box content from Firestore/Cloud Functions
3. Box data is converted into a playback queue with resolved HLS streaming URLs
4. Shaka Player handles adaptive bitrate audio streaming
5. State changes are emitted via an event system (`player.on('stateChange', fn)`)

### Key decisions

- **Firebase is internal** — initialized as a named app to avoid conflicts with consumer apps
- **Vue + Pinia run headlessly** — provides the reactive engine internally, but consumers get a plain event-based API
- **No sync/collab** — single-user playback only
- **All deps bundled** — Vue, Pinia, Shaka Player, Firebase are included in the package. Consumers install one thing.
- **Distribution** — local path install (`npm install ../samply-sdk`) or GitHub for now; npm publishing later

### Consumer API

```ts
import { samply } from '@samply/sdk'

const player = await samply.load('playerId')

player.name      // "Album Name"
player.artist    // "Artist Name"
player.artwork   // { small, medium, large }
player.tracks    // [{ id, name, duration, ... }]

player.play()
player.pause()
player.seek(0.5) // fraction 0-1
player.skipNext()
player.skipPrevious()
player.setVolume(80)
player.playTrack('track-id')

player.on('stateChange', (state) => { ... })
player.on('trackChange', (track) => { ... })
player.on('timeUpdate', (time) => { ... })

player.destroy()
```

### Architecture (source in `samply-sdk/`)

```
src/
  index.ts          — public entry point (samply factory + player instance)
  types.ts          — public TypeScript types
  firebase.ts       — Firebase init with Samply config (named app)
  data/             — fetching player docs + building the queue
  engine/           — Shaka player, queue, loudness, audio context stores
  hls/              — HLS manifest utilities
  internal/         — event emitter, platform detection, localStorage shim
```
