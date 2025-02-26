import { Job, MetricsTime, Worker } from 'bullmq'
import { environment } from '../environment'
import { inboxWorker } from './queueProcessors/inbox'
import { prepareSendRemotePostWorker } from './queueProcessors/prepareSendRemotePost'
import { sendPostToInboxes } from './queueProcessors/sendPostToInboxes'
import { getRemoteActorIdProcessor } from './queueProcessors/getRemoteActorIdProcessor'
import { logger } from './logger'
import { processRemotePostView } from './queueProcessors/processRemotePostView'

logger.info('starting workers')
const workerInbox = new Worker('inbox', (job: Job) => inboxWorker(job), {
  connection: environment.bullmqConnection,
  metrics: {
    maxDataPoints: MetricsTime.ONE_WEEK * 2
  },
  concurrency: environment.workers.low
})

const workerPrepareSendPost = new Worker('prepareSendPost', (job: Job) => prepareSendRemotePostWorker(job), {
  connection: environment.bullmqConnection,
  metrics: {
    maxDataPoints: MetricsTime.ONE_WEEK * 2
  },
  concurrency: environment.workers.high,
  lockDuration: 60000
})

const workerSendPostChunk = new Worker('sendPostToInboxes', (job: Job) => sendPostToInboxes(job), {
  connection: environment.bullmqConnection,
  metrics: {
    maxDataPoints: MetricsTime.ONE_WEEK * 2
  },
  concurrency: environment.workers.high,
  lockDuration: 120000
})

const workerDeletePost = new Worker('deletePostQueue', (job: Job) => sendPostToInboxes(job), {
  connection: environment.bullmqConnection,
  metrics: {
    maxDataPoints: MetricsTime.ONE_WEEK * 2
  },
  concurrency: environment.workers.high,
  lockDuration: 120000
})

const workerGetUser = new Worker('getRemoteActorId', async (job: Job) => await getRemoteActorIdProcessor(job), {
  connection: environment.bullmqConnection,
  metrics: {
    maxDataPoints: MetricsTime.ONE_WEEK * 2
  },
  concurrency: environment.workers.high,
  lockDuration: 120000
})

const workerProcessRemotePostView = new Worker(
  'processRemoteView',
  async (job: Job) => await processRemotePostView(job),
  {
    connection: environment.bullmqConnection,
    metrics: {
      maxDataPoints: MetricsTime.ONE_WEEK * 2
    },
    concurrency: environment.workers.low,
    lockDuration: 120000
  }
)

const workers = [
  workerInbox,
  workerDeletePost,
  workerGetUser,
  workerPrepareSendPost,
  workerProcessRemotePostView,
  workerSendPostChunk,
  workerProcessRemotePostView
]

workers.forEach((worker) => {
  worker.on('error', (err) => {
    logger.warn({
      message: `worker ${worker.name} failed`,
      error: err
    })
  })
})

export { workerInbox, workerSendPostChunk, workerPrepareSendPost, workerGetUser, workerDeletePost }
