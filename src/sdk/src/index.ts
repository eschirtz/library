import useFirebase from './useFirebase'

export interface SamplyPlayer {
  // TODO: expose metadata, tracks, and playback controls
  destroy(): void
}

export const samply = {
  async load(playerId: string): Promise<SamplyPlayer> {
    const fb = useFirebase()
    const [boxData, playerDoc] = await Promise.all([
      fb.getPlayerBoxContent(playerId),
      fb.getPlayerDoc(playerId),
    ])

    const projectDataDoc = await fb.getProjectSnippetDoc(playerDoc?.projectid)

    console.log('Box data', boxData)
    console.log('Player doc', playerDoc)
    console.log('Project snippet doc', projectDataDoc)

    return {
      destroy() {},
    }
  },
}
