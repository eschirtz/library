import { getApp, getApps, initializeApp } from 'firebase/app'
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

function getSdkApp() {
  return getApps().some((app) => app.name === SDK_APP_NAME)
    ? getApp(SDK_APP_NAME)
    : initializeApp(samplyProductionFirestoreConfig, SDK_APP_NAME)
}

function getSdkAuth() {
  return getAuth(getSdkApp())
}

function getSdkFunctions() {
  return getFunctions(getSdkApp())
}

let initialized: Promise<void> | null = null

function initialize() {
  if (!initialized) {
    initialized = (async () => {
      getSdkApp()
      const auth = getSdkAuth()
      if (!auth.currentUser) {
        await signInAnonymously(auth)
      }
    })()
  }
  return initialized
}

export default function useFirebase() {
  void initialize()

  async function getPlayerBoxContent(playerId: string) {
    await initialize()
    const getPlayerBoxes = httpsCallable(getSdkFunctions(), Callables.GET_SECURE_PLAYER_BOX_CONTENT)

    const resp = await getPlayerBoxes({ playerid: playerId })
    return resp.data
  }

  return {
    getPlayerBoxContent,
  }
}
