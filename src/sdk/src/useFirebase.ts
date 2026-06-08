import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'

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
}

const fbApp = initializeApp(samplyProductionFirestoreConfig, SDK_APP_NAME)
const fbAuth = getAuth(fbApp)
const fbFunctions = getFunctions(fbApp)

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

export default function useFirebase() {
  return {
    init,
    getPlayerBoxContent,
  }
}
