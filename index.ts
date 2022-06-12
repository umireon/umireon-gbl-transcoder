import { DEFAULT_CONTEXT, firebaseConfig } from './common/constants.js'
import { type Storage, getStorage } from 'firebase-admin/storage'

import { TranscoderServiceClient } from '@google-cloud/video-transcoder'
import { handleCors } from './service/cors.js'
import { http } from '@google-cloud/functions-framework'
import { initializeApp } from 'firebase-admin/app'

const CONTEXT = DEFAULT_CONTEXT
const transcoderServiceClient = new TranscoderServiceClient()
const app = initializeApp(firebaseConfig)
const storage = getStorage(app)

http('transcode-video', async (req, res) => {
  if (!handleCors(req, res)) return

  // Validate environment
  const { PROJECT_ID } = process.env
  if (typeof PROJECT_ID === 'undefined') {
    throw new Error('PROJECT_ID not provided')
  }

  // Validate query
  if (typeof req.query.inputUri !== 'string') {
    res.status(400).send('Invalid inputUri')
    return
  }
  if (typeof req.query.basename !== 'string') {
    res.status(400).send('Invalid basename')
    return
  }
  if (typeof req.query.outputUri !== 'string') {
    res.status(400).send('Invalid outputUri')
    return
  }
  const { basename, inputUri, outputUri } = req.query

  const [response] = await transcoderServiceClient.createJob({
    job: {
      config: {
        elementaryStreams: [
          {
            key: 'video-stream0',
            videoStream: {
              h264: {
                bitrateBps: 2000000,
                frameRate: 60,
                profile: 'main',
              },
            },
          },
          {
            audioStream: {
              bitrateBps: 64000,
              codec: 'aac',
            },
            key: 'audio-stream0',
          },
        ],
        muxStreams: [
          {
            container: 'mp4',
            elementaryStreams: ['video-stream0', 'audio-stream0'],
            key: basename,
          },
        ],
      },
      inputUri,
      outputUri,
    },
    parent: transcoderServiceClient.locationPath(PROJECT_ID, CONTEXT.location),
  })
  console.log(response)

  // Compose response
  const { name } = response
  res.send({ name })
})

export async function setContentDisposition(storage: Storage, name: string): Promise<boolean> {
  const bucket = storage.bucket()
  const file = bucket.file(`transcoded/${name}`)
  const [fileExists] = await file.exists()
  if (fileExists) {
    await file.setMetadata({
      contentDisposition: 'attachment',
    })
    return true
  } else {
    return false
  }
}

http('check-downloadable', async (req, res) => {
  if (!handleCors(req, res)) return

  // Validate query
  if (typeof req.query.jobName !== 'undefined' && typeof req.query.jobName !== 'string') {
    res.status(400).send('Invalid jobName')
    return
  }
  if (typeof req.query.name !== 'string') {
    res.status(400).send('Invalid name')
    return
  }
  const { jobName, name } = req.query

  if (typeof jobName === 'undefined') {
    const exists = await setContentDisposition(storage, name)
    if (exists) {
      res.status(204).send('')
    } else {
      res.status(404).send('Video not ready')
    }
  } else {
    const [{ error, state }] = await transcoderServiceClient.getJob({
      name: jobName
    })
    if (state === 'PENDING' || state === 'RUNNING') {
      res.status(404).send('Video not ready')
    } else if (state === 'SUCCEEDED') {
      const exists = await setContentDisposition(storage, name)
      if (exists) {
        res.status(204).send('')
      } else {
        res.status(500).send('Video not found')
      }
    } else if (state === 'FAILED') {
      res.status(500).send(error)
    }
  }
})
