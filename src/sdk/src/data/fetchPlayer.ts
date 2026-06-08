import useFirebase from '../useFirebase'
import {
  buildQueueItems,
  addTransitionsToQueue,
  resolveGaplessSrc,
  type RawBox,
  type PlayerMeta,
  type ProjectMeta,
} from './buildQueue'
import { Queue } from '../engine/queue'
import { gaplessVersion } from '../engine/platform'

export interface PlayerData {
  playerMeta: PlayerMeta
  projectMeta: ProjectMeta
  queue: Queue
}

export async function fetchPlayer(playerId: string): Promise<PlayerData> {
  const fb = useFirebase()

  const [boxResult, playerDoc] = await Promise.all([
    fb.getPlayerBoxContent(playerId) as Promise<{ boxes: RawBox[] }>,
    fb.getPlayerDoc(playerId),
  ])

  const playerMeta: PlayerMeta = {
    id: playerId,
    name: playerDoc?.name ?? '',
    projectid: playerDoc?.projectid ?? '',
    artist: playerDoc?.artist,
    artwork: playerDoc?.artwork,
    config: playerDoc?.config,
  }

  const projectDoc = await fb.getProjectSnippetDoc(playerMeta.projectid)
  const projectMeta: ProjectMeta = {
    name: projectDoc?.name,
    artwork: projectDoc?.artwork,
  }

  let items = buildQueueItems(boxResult.boxes ?? [], playerMeta, projectMeta)

  // Attempt to fetch gapless manifests for multi-track players
  const queue = new Queue()
  if (items.length > 1 && playerMeta.projectid) {
    try {
      const version = gaplessVersion()
      const manifests = await fb.findGaplessManifests(
        items.map((i) => i.audioboxid),
        playerMeta.projectid,
        version,
      )
      if (manifests) {
        items = addTransitionsToQueue(items, manifests)
        const gaplessSrc = resolveGaplessSrc(manifests)
        queue.init(items, gaplessSrc)
      } else {
        queue.init(items)
      }
    } catch (e) {
      console.warn('Gapless manifests unavailable, using per-track playback:', e)
      queue.init(items)
    }
  } else {
    queue.init(items)
  }

  return { playerMeta, projectMeta, queue }
}
