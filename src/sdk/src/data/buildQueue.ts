import { checkFlacSupport, isApple, hasMSE } from '../engine/platform'
import type { QueueItem, GaplessSrc } from '../engine/queue'

// ── Firestore shape types (inlined — no @samply-app/types dep) ───────────────

interface HlsAsset {
  url?: string
  cdnUrl?: string
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

interface ChildRef {
  /** Firestore path string e.g. "projects/abc/boxes/def" */
  ref?: string
  name?: string
}

interface BoxData {
  type?: 'file' | 'stack' | 'group'
  name?: string
  mimeType?: string
  /** Stack and group boxes have children keyed by push-ID (sorted alphanumerically = chronological) */
  children?: { [pushKey: string]: ChildRef }
  audio?: {
    hls?: HlsSource
    metadata?: { original?: { title?: string; album?: string; artist?: string } }
    loudness?: LoudnessMetadata
  }
}

export interface RawBox {
  id: string
  /** Stack-level name override (set by the parent stack's child entry, not the file itself) */
  name?: string
  data: BoxData
}

export interface PlayerMeta {
  id: string
  name: string
  projectid: string
  artist?: string
  artwork?: ImageSet
  config?: { preferMetadata?: boolean }
  /** Ordered list of top-level box IDs for this player */
  boxids?: string[]
  /** If set, restrict display to children of this group */
  groupid?: string
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

export interface SortPreference {
  criterion: string
  ascending: boolean
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

// ── Children helpers ─────────────────────────────────────────────────────────

/** Children of a box, sorted alphanumerically by push-key (oldest → newest) */
function sortedChildIds(box: RawBox): string[] {
  const children = box.data.children
  if (!children) return []
  return Object.keys(children)
    .sort()
    .map((k) => {
      const ref = children[k]?.ref
      return ref ? ref.split('/').pop() : undefined
    })
    .filter((id): id is string => !!id)
}

/** The newest child of a stack (highest push-key = most recent version) */
function peekStack(box: RawBox): string | undefined {
  const ids = sortedChildIds(box)
  return ids[ids.length - 1]
}

// ── Box → QueueItem(s) ───────────────────────────────────────────────────────

function audioFileToItem(
  box: RawBox,
  player: PlayerMeta,
  stackId?: string,
  stackName?: string,
): QueueItem | undefined {
  if (!box.data.audio) return undefined // not an audio box
  const { aac, flac } = resolveSrc(box.data.audio.hls)
  if (!aac) return undefined

  const meta = box.data.audio.metadata?.original
  const preferMeta = player.config?.preferMetadata
  const name = preferMeta && meta?.title ? meta.title : stackName || box.name || box.data.name || ''

  return {
    // Use stack ID as the track identity so the caller can reference the top-level box
    id: stackId ?? box.id,
    // Use the actual audio file ID for gapless manifest requests
    audioboxid: box.id,
    src: { aac, ...(flac ? { flac } : {}) },
    name,
    loudness: box.data.audio.loudness,
  }
}

function processBox(
  box: RawBox,
  byId: Map<string, RawBox>,
  player: PlayerMeta,
): QueueItem[] {
  const type = box.data.type

  if (type === 'stack') {
    const topChildId = peekStack(box)
    const topChild = topChildId ? byId.get(topChildId) : undefined
    if (!topChild) return []
    const item = audioFileToItem(topChild, player, box.id, box.name || box.data.name)
    return item ? [item] : []
  }

  if (type === 'group') {
    // Flatten group children in push-key order
    const items: QueueItem[] = []
    for (const childId of sortedChildIds(box)) {
      const child = byId.get(childId)
      if (child) items.push(...processBox(child, byId, player))
    }
    return items
  }

  if (type === 'file') {
    const item = audioFileToItem(box, player)
    return item ? [item] : []
  }

  return []
}

// ── Public API ───────────────────────────────────────────────────────────────

export function buildQueueItems(
  boxes: RawBox[],
  player: PlayerMeta,
  _project: ProjectMeta,
  sortBy?: SortPreference,
  sortOrder?: { [boxid: string]: number },
): QueueItem[] {
  // Build id → box and child → parent lookup tables
  const byId = new Map<string, RawBox>()
  const isChildOf = new Map<string, string>() // childId → parentId

  for (const box of boxes) {
    byId.set(box.id, box)
    if (box.data.children) {
      for (const child of Object.values(box.data.children)) {
        const ref = child?.ref
        const childId = ref ? ref.split('/').pop() : undefined
        if (childId) isChildOf.set(childId, box.id)
      }
    }
  }

  // Determine the ordered list of top-level box IDs
  let topLevelIds: string[]

  if (player.groupid) {
    // Restrict to children of the specified group
    const group = byId.get(player.groupid)
    topLevelIds = sortedChildIds(group ?? { id: '', data: {} })
  } else {
    // All top-level boxes (not children of any other box)
    topLevelIds = boxes.filter((b) => !isChildOf.has(b.id)).map((b) => b.id)
  }

  // Apply sort order from callable
  if (sortBy?.criterion === 'custom' && sortOrder) {
    topLevelIds.sort((a, b) => (sortOrder[a] ?? 0) - (sortOrder[b] ?? 0))
  } else if (sortBy?.criterion === 'name') {
    topLevelIds.sort((a, b) => {
      const nameA = byId.get(a)?.data.name ?? ''
      const nameB = byId.get(b)?.data.name ?? ''
      const cmp = nameA.localeCompare(nameB)
      return (sortBy.ascending ?? true) ? cmp : -cmp
    })
  }
  // else: use natural order returned by callable

  const items: QueueItem[] = []
  for (const id of topLevelIds) {
    const box = byId.get(id)
    if (!box) continue
    items.push(...processBox(box, byId, player))
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
