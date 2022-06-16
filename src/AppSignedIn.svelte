<script lang="ts">
  import { type AppContext } from '../common/constants'
  import { type Auth, type User } from 'firebase/auth'

  import Logout from './lib/Logout.svelte'
  import {
    type FirebaseStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
    UploadTaskSnapshot,
  } from 'firebase/storage'

  import 'three-dots/dist/three-dots.min.css'

  export let auth: Auth
  export let defaultStorage: FirebaseStorage
  export let transcodedStorage: FirebaseStorage

  export let user: User

  let files: FileList
  let src: string = ''
  let uploadProgressText: string | undefined
  let transcoding: boolean = false
  let disabled: boolean = true
  let estimatedTimeOfArrivalInSeconds: number = -1

  export let context: AppContext

  type UploadVideoOnProgressFunction = (snapshot: UploadTaskSnapshot) => void

  export async function uploadVideo(
    file: File,
    onProgress: UploadVideoOnProgressFunction,
    _fetch = fetch
  ): Promise<UploadTaskSnapshot> {
    const storageRef = ref(defaultStorage, `${file.name}`)
    const uploadTask = uploadBytesResumable(storageRef, file)
    return new Promise<UploadTaskSnapshot>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        onProgress,
        (error) => {
          reject(error)
        },
        () => {
          resolve(uploadTask.snapshot)
        }
      )
    })
  }

  interface TranscodedVideo {
    readonly jobName?: string
    readonly name: string
  }

  export async function startTranscode(
    { transcodeVideoEndpoint, transcodedBucket }: AppContext,
    snapshot: UploadTaskSnapshot,
    user: User,
    _fetch = fetch
  ): Promise<TranscodedVideo> {
    const { bucket, fullPath, name } = snapshot.metadata
    const basename = name.replace(/\.[^.]+$/, '')
    const query = new URLSearchParams({
      basename,
      inputUri: `gs://${bucket}/${fullPath}`,
      outputUri: `gs://${transcodedBucket}`,
    })
    const idToken = await user.getIdToken()
    const response = await _fetch(`${transcodeVideoEndpoint}?${query}`, {
      headers: {
        authorization: `Bearer ${idToken}`,
      },
    })
    if (!response.ok) {
      const text = await response.text()
      console.error(text)
      throw new Error('Invalid response')
    }
    const { name: jobName } = await response.json()
    return { jobName, name: `${basename}.mp4` }
  }

  export async function checkDownloadable(
    { checkDownloadableEndpoint }: AppContext,
    { jobName, name }: TranscodedVideo,
    _fetch = fetch
  ): Promise<boolean> {
    const query = new URLSearchParams({
      name,
    })
    if (typeof jobName !== 'undefined') {
      query.append('jobName', jobName)
    }
    const idToken = await user.getIdToken()
    const response = await _fetch(`${checkDownloadableEndpoint}?${query}`, {
      headers: {
        authorization: `Bearer ${idToken}`,
      },
    })
    if (!response.ok && response.status !== 404) {
      const json = await response.json()
      console.error(json)
      throw new Error(JSON.stringify(json))
    }
    return response.ok
  }

  export async function handleClickSubmit() {
    const [file] = files
    if (typeof file === 'undefined') {
      throw new Error('Video not specified!')
    }
    transcoding = true
    const snapshot = await uploadVideo(file, (snapshot) => {
      const { bytesTransferred, totalBytes } = snapshot
      uploadProgressText = `${bytesTransferred}B / ${totalBytes}B`
    })
    uploadProgressText = 'Completed!'
    estimatedTimeOfArrivalInSeconds = 120
    const result = await startTranscode(context, snapshot, user)
    let ok = await checkDownloadable(context, result)
    try {
      while (!ok) {
        await new Promise((resolve) => {
          setTimeout(resolve, 1000)
        })
        ok = await checkDownloadable(context, result)
        if (estimatedTimeOfArrivalInSeconds >= 10) {
          estimatedTimeOfArrivalInSeconds -= 1
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        error = e
      }
    }
    estimatedTimeOfArrivalInSeconds = 0
    transcoding = false
  }

  export async function handleClickShow() {
    const [file] = files
    if (typeof file === 'undefined') {
      throw new Error('Video not specified!')
    }
    const { name } = file
    const basename = name.replace(/\.[^.]+$/, '')
    src = await getDownloadURL(ref(transcodedStorage, `${basename}.mp4`))
    disabled = false
  }

  export async function handleChangeFile() {
    const [file] = files
    if (typeof file !== 'undefined') {
      const name = file.name.replace(/\.[^.]+$/, '.mp4')
      const transcodedVideo: TranscodedVideo = { name }
      try {
        const ok = await checkDownloadable(context, transcodedVideo)
        if (ok) {
          src = await getDownloadURL(ref(transcodedStorage, name))
        }
        disabled = !ok
      } catch (e) {
        if (e instanceof Error) {
          error = e
        }
      }
    }
  }

  let error: Error | undefined
</script>

<main>
  {#if typeof error !== 'undefined'}
    <h2 style="color: red;">{error.message}</h2>
  {/if}
  <p>
    <input type="file" bind:files on:change={handleChangeFile} />
    <button on:click={handleClickSubmit}>送信</button>
  </p>
  <p>{uploadProgressText ?? ''}</p>
  {#if transcoding}
    <div id="uploading" class="dot-bricks" style="margin: 10px;" />
  {/if}
  {#if estimatedTimeOfArrivalInSeconds > 0}
    <p>
      Transcoding will finish in {estimatedTimeOfArrivalInSeconds} seconds...
    </p>
  {/if}
  {#if estimatedTimeOfArrivalInSeconds === 0}
    <p>Transcoding finished!</p>
  {/if}
  <p>
    <button on:click={handleClickShow}>表示</button>
    <a href={src} download="a.mp4"><button {disabled}>ダウンロード</button></a>
  </p>
  <p>
    表示ボタンを押して、動画が表示されたらダウンロードボタンでダウンロードできます
  </p>
  <p><video {src} width="200" height="200" controls /></p>
  <Logout {auth} />
</main>
