<script lang="ts">
  import { type AppContext, DEFAULT_CONTEXT } from '../common/constants'
  import { type Auth, type User } from 'firebase/auth'

  import { type Analytics } from 'firebase/analytics'
  import { type Firestore } from 'firebase/firestore'
  import Logout from './lib/Logout.svelte'
  import { type FirebaseStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'

  import 'three-dots/dist/three-dots.min.css'

  export let analytics: Analytics
  export let auth: Auth
  export let db: Firestore
  export let storage: FirebaseStorage

  export let user: User
  export let initialUserData: {}

  let files: FileList
  let src: string = ''
  let uploadProgressText: string | undefined

  const context = DEFAULT_CONTEXT

  export async function startTranscode({ transcodeVideoEndpoint }: AppContext, user: User, file: File, _fetch = fetch) {
    const storageRef = ref(storage, `source/${file.name}`)
    const uploadTask = uploadBytesResumable(storageRef, file)
    uploadTask.on('state_changed',
      snapshot => {
        uploadProgressText = `${snapshot.bytesTransferred}B / ${snapshot.totalBytes}B`
      },
      error => {},
      async () => {
        uploadProgressText = 'Completed!'
        const { bucket, fullPath, name} = uploadTask.snapshot.metadata
        const query = new URLSearchParams({
          inputUri: `gs://${bucket}/${fullPath}`,
          name: name,
          outputUri: `gs://${bucket}/transcoded/`,
        })
        const idToken = await user.getIdToken()
        const response = await _fetch(`${transcodeVideoEndpoint}?${query}`, {
          headers: {
            authorization: `Bearer ${idToken}`,
          }
        })
        console.log(await response.json())
      }
      )
  }

  export async function handleClickSubmit() {
    const [file] = files
    if (typeof file === 'undefined') {
      throw new Error('Video not specified!')
    }
    await startTranscode(context, user, file)
  }

  export async function handleClickShow() {
    src = await getDownloadURL(ref(storage, 'transcoded/sd.mp4'))
  }

  let error: Error | undefined
</script>

<main>
  {#if typeof error !== 'undefined'}
    <h2>{error.message}</h2>
  {/if}
  <p>
    <input type="file" bind:files />
    <button on:click={handleClickSubmit}>送信</button>
  </p>
  <p>{uploadProgressText ?? ''}</p>
  <p>
    <button on:click={handleClickShow}>表示</button>
    <a href={src} download="a.mp4"><button>ダウンロード</button></a>
  </p>
  <p><video {src} width="200" height="200" controls></video></p>
  <Logout {auth} />
</main>
