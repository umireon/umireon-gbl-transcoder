export interface AppContext {
  readonly checkDownloadableEndpoint: string
  readonly location: string
  readonly transcodeVideoEndpoint: string
  readonly transcodedBucket: string
}

export const DEFAULT_CONTEXT: AppContext = {
  checkDownloadableEndpoint:
    'https://umireon-gbl-transcoder-cuxpzdah.an.gateway.dev/check-downloadable',
  location: 'asia-east1',
  transcodeVideoEndpoint:
    'https://umireon-gbl-transcoder-cuxpzdah.an.gateway.dev/transcode-video',
  transcodedBucket: 'umireon-gbl-transcoder-transcoded-videos',
} as const

export const firebaseConfig = {
  apiKey: 'AIzaSyBPw7N0RrYVVS62uqR1rpewDBHrgck1jW0',
  appId: '1:1007712463625:web:12c838b6d7ee50187801d8',
  authDomain: 'umireon-gbl-transcoder.firebaseapp.com',
  measurementId: 'G-RS8HWFY60C',
  messagingSenderId: '1007712463625',
  projectId: 'umireon-gbl-transcoder',
  storageBucket: 'umireon-gbl-transcoder.appspot.com',
} as const
