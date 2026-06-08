import useFirebase from './useFirebase'

export interface SamplyPlayer {
  // TODO: expose metadata, tracks, and playback controls
  destroy(): void
}

export const samply = {
  async load(playerId: string): Promise<SamplyPlayer> {
    const { getPlayerBoxContent } = await useFirebase()
    const playerBoxContent = await getPlayerBoxContent(playerId)
    console.log('Player box content', playerBoxContent)

    return {
      destroy() {},
    }
  },
}
