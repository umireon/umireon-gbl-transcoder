import { DEFAULT_CONTEXT } from './common/constants.js'
import { TranscoderServiceClient } from '@google-cloud/video-transcoder'
import { handleCors } from './service/cors.js'
import { http } from '@google-cloud/functions-framework'

const CONTEXT = DEFAULT_CONTEXT
const transcoderServiceClient = new TranscoderServiceClient()

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
  if (typeof req.query.name !== 'string') {
    res.status(400).send('Invalid name')
    return
  }
  if (typeof req.query.outputUri !== 'string') {
    res.status(400).send('Invalid outputUri')
    return
  }
  const { inputUri, name, outputUri } = req.query

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
            key: name,
          },
        ],
      },
      inputUri,
      outputUri,
    },
    parent: transcoderServiceClient.locationPath(PROJECT_ID, CONTEXT.location),
  })

  // Compose response
  res.send(response)
})
