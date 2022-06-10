<script lang="ts">
  import { type Auth, type User } from 'firebase/auth'

  import { type Analytics } from 'firebase/analytics'
  import { DEFAULT_CONTEXT } from '../common/constants'
  import { type Firestore } from 'firebase/firestore'
  import Logout from './lib/Logout.svelte'
  import { type FirebaseStorage, ref, uploadBytes } from 'firebase/storage'

  import 'three-dots/dist/three-dots.min.css'

  export let analytics: Analytics
  export let auth: Auth
  export let db: Firestore
  export let storage: FirebaseStorage

  export let user: User
  export let initialUserData: {}

  let files: FileList

  const context = DEFAULT_CONTEXT

  export async function startTranscode (file: File, _fetch = fetch) {
    const storageRef = ref(storage, `source/${file.name}`)
    const { metadata } = await uploadBytes(storageRef, file)
    const query = new URLSearchParams({
      inputUri: `gs://${metadata.bucket}/${metadata.fullPath}`,
      outputUri: `gs://${metadata.bucket}/transcoded/${metadata.name}`
    })
    console.log(query.toString())
  }

  export async function handleClickSubmit () {
    const [file] = files
    if (typeof file === 'undefined') {
      throw new Error('Video not specified!')
    }
    await startTranscode(file)
  }

  let error: Error | undefined
</script>

<main>
  {#if typeof error !== 'undefined'}
    <h2>{error.message}</h2>
  {/if}
  <input type="file" bind:files />
  <button on:click={handleClickSubmit}>送信</button>
  <Logout {auth} />
</main>
