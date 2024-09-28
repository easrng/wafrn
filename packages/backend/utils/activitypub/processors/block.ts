import { Blocks } from '../../../db.js'
import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject.js'
import { redisCache } from '../../redis.js'
import { getPostThreadRecursive } from '../getPostThreadRecursive.js'
import { getRemoteActor } from '../getRemoteActor.js'
import { signAndAccept } from '../signAndAccept.js'

async function BlockActivity(body: activityPubObject, remoteUser: any, user: any) {
  const apObject: activityPubObject = body
  const userToBeBlocked = await getRemoteActor(apObject.object, user)
  await Blocks.create({
    remoteBlockId: body.id,
    blockedId: userToBeBlocked.id,
    blockerId: remoteUser.id
  })
  redisCache.del('blocks:mutes:onlyUser:' + userToBeBlocked.id)
  redisCache.del('blocks:mutes:' + userToBeBlocked.id)
  redisCache.del('blocks:mutes:' + userToBeBlocked.id)
  redisCache.del('blocks:' + userToBeBlocked.id)

  // await signAndAccept({ body: body }, remoteUser, user)
}

export { BlockActivity }
