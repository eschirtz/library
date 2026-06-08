import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { doc, getDoc, getFirestore } from 'firebase/firestore'
import type { GaplessManifests } from './data/buildQueue'

const samplyProductionFirestoreConfig = {
  apiKey: 'AIzaSyD5n1sk97CCHzdN3nLhzrrANGTnxEXfChY',
  authDomain: 'samply.app',
  databaseURL: 'https://samply-a03ff.firebaseio.com',
  projectId: 'samply-a03ff',
  storageBucket: 'samply-a03ff.appspot.com',
  messagingSenderId: '489564606259',
  appId: '1:489564606259:web:afe33649ec5066fca43846',
  measurementId: 'G-T3YJ93S39N',
}

const SDK_APP_NAME = 'samply-sdk'

const Callables = {
  GET_SECURE_PLAYER_BOX_CONTENT: 'colab-getSecurePlayerBoxContent',
  FIND_GAPLESS_MANIFESTS: 'colab-findGaplessManifests',
}

const fbApp = initializeApp(samplyProductionFirestoreConfig, SDK_APP_NAME)
const fbAuth = getAuth(fbApp)
const fbFunctions = getFunctions(fbApp)
const fbFirestore = getFirestore(fbApp)

async function init() {
  if (!fbAuth.currentUser) {
    await signInAnonymously(fbAuth)
  }
}

async function getPlayerBoxContent(playerId: string) {
  const getPlayerBoxes = httpsCallable(fbFunctions, Callables.GET_SECURE_PLAYER_BOX_CONTENT)
  const resp = await getPlayerBoxes({ playerid: playerId })
  return resp.data
}

async function getPlayerDoc(playerId: string) {
  const playerDoc = doc(fbFirestore, `players/${playerId}`)
  const docSnap = await getDoc(playerDoc)
  return docSnap.data()
}

async function getProjectSnippetDoc(projectId: string) {
  const projectSnippetDoc = doc(fbFirestore, `projects/${projectId}/public/snippet`)
  const docSnap = await getDoc(projectSnippetDoc)
  return docSnap.data()
}

async function findGaplessManifests(
  boxids: string[],
  projectid: string,
  version: 'v1' | 'v2' = 'v1',
): Promise<GaplessManifests | undefined> {
  const fn = httpsCallable(fbFunctions, Callables.FIND_GAPLESS_MANIFESTS)
  const resp = await fn({ boxids, projectid, gaplessVersion: version })
  const data = resp.data as { manifests?: GaplessManifests }
  return data.manifests
}

export default function useFirebase() {
  return {
    init,
    getPlayerBoxContent,
    getPlayerDoc,
    getProjectSnippetDoc,
    findGaplessManifests,
  }
}
