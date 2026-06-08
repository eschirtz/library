import { checkFlacSupport, isApple, hasMSE } from '../engine/platform'
import type { QueueItem, GaplessSrc } from '../engine/queue'

// ── Firestore shape types (inlined — no @samply-app/types dep) ───────────────

interface HlsAsset {
  url?: string
  cdnUrl?: string
  playlist?: string
  media?: string
}

interface HlsSource {
  masterAac?: HlsAsset
  masterAac256k?: HlsAsset
  masterFlac?: HlsAsset
  masterFlacSafari?: HlsAsset
}

interface LoudnessMetadata {
  integratedLufs?: number
  truePeak?: number
}

interface AudioBoxData {
  name?: string
  audio?: {
    hls?: HlsSource
    metadata?: { original?: { title?: string; album?: string; artist?: string } }
    loudness?: LoudnessMetadata
  }
}

export interface RawBox {
  id: string
  name?: string
  data: AudioBoxData
}

export interface PlayerMeta {
  id: string
  name: string
  projectid: string
  artist?: string
  artwork?: ImageSet
  config?: { preferMetadata?: boolean }
}

export interface ProjectMeta {
  name?: string
  artwork?: ImageSet
}

interface ImageEntry {
  src: string
}

interface ImageSet {
  small?: ImageEntry
  medium?: ImageEntry
  large?: ImageEntry
}

export interface GaplessManifestEntry {
  url: string
  cdnUrl?: string
  transitions: number[]
}

export interface GaplessManifests {
  masterAac?: GaplessManifestEntry
  masterFlac?: GaplessManifestEntry
  masterFlacSafari?: { url: string; cdnUrl?: string }
}

// ── Source resolution ────────────────────────────────────────────────────────

function resolveSrc(hls?: HlsSource): { aac?: string; flac?: string } {
  if (!hls) return {}

  const aac =
    hls.masterAac?.cdnUrl ||
    hls.masterAac?.url ||
    hls.masterAac256k?.cdnUrl ||
    hls.masterAac256k?.url

  let flac: string | undefined
  if (checkFlacSupport() && hls.masterFlac) {
    const useSafariFlac = isApple() && !hasMSE()
    flac = useSafariFlac
      ? hls.masterFlacSafari?.cdnUrl || hls.masterFlacSafari?.url
      : hls.masterFlac?.cdnUrl || hls.masterFlac?.url
  }

  return { aac, flac }
}

// ── Queue building ───────────────────────────────────────────────────────────

export function buildQueueItems(
  boxes: RawBox[],
  player: PlayerMeta,
  _project: ProjectMeta,
): QueueItem[] {
  const items: QueueItem[] = []

  for (const box of boxes) {
    const { aac, flac } = resolveSrc(box.data.audio?.hls)
    if (!aac) continue // not playable, skip

    const meta = box.data.audio?.metadata?.original
    const preferMeta = player.config?.preferMetadata
    const name =
      (preferMeta && meta?.title) ? meta.title : box.name || box.data.name || ''

    const item: QueueItem = {
      id: box.id,
      audioboxid: box.id,
      src: { aac, ...(flac ? { flac } : {}) },
      name,
      loudness: box.data.audio?.loudness,
    }
    items.push(item)
  }

  return items
}

export function addTransitionsToQueue(
  items: QueueItem[],
  manifests: GaplessManifests,
): QueueItem[] {
  const aacTransitions = manifests.masterAac?.transitions
  if (!aacTransitions) return items

  return items.map((item, i) => ({
    ...item,
    transition: {
      aac: aacTransitions[i] ?? 0,
      ...(manifests.masterFlac?.transitions?.[i] !== undefined
        ? { flac: manifests.masterFlac.transitions[i] }
        : {}),
    },
  }))
}

export function resolveGaplessSrc(manifests: GaplessManifests): GaplessSrc | undefined {
  if (!manifests.masterAac) return undefined

  const useSafariFlac = isApple() && !hasMSE()
  const flacEntry = useSafariFlac ? manifests.masterFlacSafari : manifests.masterFlac
  const flacUrl = flacEntry?.cdnUrl || flacEntry?.url

  return {
    aac: manifests.masterAac.cdnUrl || manifests.masterAac.url,
    ...(flacUrl ? { flac: flacUrl } : {}),
  }
}
