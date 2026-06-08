import useFirebase from './useFirebase'

export interface SamplyPlayer {
  // TODO: expose metadata, tracks, and playback controls
  destroy(): void
}

export const samply = {
  async load(playerId: string): Promise<SamplyPlayer> {
    const fb = useFirebase()
    const playerBoxContent = await fb.getPlayerBoxContent(playerId)
    console.log('Player box content', playerBoxContent)

    const playerDoc = await fb.getPlayerDoc(playerId)
    console.log('Player doc', playerDoc)

    const projectSnippetDoc = await fb.getProjectSnippetDoc(playerDoc?.projectid)
    console.log('Project snippet doc', projectSnippetDoc)

    return {
      destroy() {},
    }
  },
}
