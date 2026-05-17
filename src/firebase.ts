import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDfkeHuoBayfQhK2DV8AOMn6HCrXXTmA7g',
  authDomain: 'eschirtz-library.firebaseapp.com',
  projectId: 'eschirtz-library',
  storageBucket: 'eschirtz-library.firebasestorage.app',
  messagingSenderId: '663645763605',
  appId: '1:663645763605:web:82b6c7f04b2a56d242761c',
  measurementId: 'G-M16Q8YZYT5',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
