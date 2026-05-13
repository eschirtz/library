const API_BASE = 'https://samply.app/api/v0'

export interface Box {
  id: string
  object: 'file' | 'folder' | 'stack'
  name: string
  color?: string
  timeCreated: number
  children?: { id: string; name?: string }[]
  trashed?: boolean
  duration?: number
}

export interface Player {
  id: string
  projectid: string
  object: 'player'
  name: string
  public: boolean
  color: string
  boxids?: string[]
  folderid?: string
  options?: Record<string, unknown>
  timeCreated: number
  timeModified: number
}

let token: string

export default function useSamply(_token?: string) {
  if (!_token && !token) throw new Error('Samply requires a valid auth token')
  if (_token) token = _token

  function parseProjectId(link: string): string {
    const url = new URL(link)
    const match = url.pathname.match(/\/p\/([^/]+)/)
    if (!match) throw new Error(`Invalid project link: ${link}`)
    return match[1] as string
  }

  async function listPlayers(): Promise<Player[]> {
    const response = await fetch(`${API_BASE}/players`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch players: ${response.status}`)
    }
    return response.json()
  }

  async function getLinkContent(link: string): Promise<{ boxes: Box[]; player?: Player }> {
    const projectId = parseProjectId(link)

    const [allBoxes, players] = await Promise.all([
      fetch(`${API_BASE}/projects/${projectId}/all`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch boxes: ${r.status}`)
        return r.json() as Promise<Box[]>
      }),
      listPlayers(),
    ])

    const player = players.find((p) => p.projectid === projectId)

    const fileBoxes = allBoxes.filter((b) => b.object === 'file' && !b.trashed)

    if (player?.boxids) {
      const orderMap = new Map(player.boxids.map((id, i) => [id, i]))
      fileBoxes.sort((a, b) => (orderMap.get(a.id) ?? Infinity) - (orderMap.get(b.id) ?? Infinity))
    }

    return { boxes: fileBoxes, player }
  }

  async function getDownloadUrl(link: string, boxId: string): Promise<string> {
    const projectId = parseProjectId(link)
    const response = await fetch(`${API_BASE}/projects/${projectId}/files/${boxId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) {
      throw new Error(`Failed to get download URL: ${response.status}`)
    }
    const data = await response.json()
    return data.url
  }

  return {
    getLinkContent,
    getDownloadUrl,
  }
}
