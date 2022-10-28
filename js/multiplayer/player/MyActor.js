import { getCookies } from '../../utils/cookies'
import { store } from './data'

class MyActorInstance {
  resetMyActorPosition() {
    let myActorNr = this.appLoadBalancing.myActor().actorNr

    store.models.forEach(function (model, index) {
      //console.log(index + ': ' + model.name);
      if (model.name == 'model' + String(myActorNr)) {
        let { posSmoothing, placement } = store
        let { position, rotation, scale } = placement
        direction = 'front'

        const cameraRig = document.getElementById('camRig')

        posSmoothing.velocity.x = 0.0
        posSmoothing.velocity.z = 0.0
        position.x = 0.0
        position.z = 0.0

        posSmoothing.velocity.y = 0.0
        rotation.y = 0.0

        // Reset model info
        model.position.set(position.x, position.y, position.z)
        model.rotation.set(rotation.x, rotation.y, rotation.z)
        model.scale.set(scale.x, scale.y, scale.z)

        // Reset camera info
        let rad = rotation.y + Math.PI
        cameraRig.object3D.position.set(
          position.x + Math.sin(rad),
          position.y + 1.6,
          position.z + Math.cos(rad)
        )
        cameraRig.object3D.rotation.set(
          rotation.x,
          rotation.y + Math.PI,
          rotation.z
        )
      }
    })
  }

  saveMyActorInfoByCookie() {
    const { position, rotation } = store.placement

    document.cookie = 'posX=' + String(position.x)
    document.cookie = 'posY=' + String(position.y)
    document.cookie = 'posZ=' + String(position.z)
    document.cookie = 'rotX=' + String(rotation.x)
    if (direction == 'front') {
      document.cookie = 'rotY=' + String(0.0)
    } else if (direction == 'right') {
      document.cookie = 'rotY=' + String(Math.PI / 2.0)
    } else if (direction == 'back') {
      document.cookie = 'rotY=' + String(Math.PI)
    } else if (direction == 'left') {
      document.cookie = 'rotY=' + String(-Math.PI / 2.0)
    }
    document.cookie = 'rotZ=' + String(rotation.z)
    document.cookie = 'direction=' + direction
  }

  loadMyActorInfoByCookie() {
    let actorInfo = getCookies()
    if (actorInfo['posX']) {
      let { posSmoothing, placement } = store
      let { position, rotation, scale } = placement

      posSmoothing.velocity.x = 0.0
      posSmoothing.velocity.z = 0.0
      posSmoothing.velocity.y = 0.0

      position.x = parseFloat(actorInfo['posX'], 10)
      position.y = parseFloat(actorInfo['posY'], 10)
      position.z = parseFloat(actorInfo['posZ'], 10)

      rotation.x = parseFloat(actorInfo['rotX'], 10)
      rotation.y = parseFloat(actorInfo['rotY'], 10)
      rotation.z = parseFloat(actorInfo['rotZ'], 10)

      direction = actorInfo['direction']
    } else {
      console.log("-> Can't loadMyActorInfoByCookie...")
    }
  }

  updateMyActorCustomProperty() {
    if (this.appLoadBalancing) {
      const { position, rotation, scale } = store.placement

      // Set custom property for Photon
      this.appLoadBalancing.myActor().setCustomProperty('pos', position)
      this.appLoadBalancing.myActor().setCustomProperty('rot', rotation)
      this.appLoadBalancing.myActor().setCustomProperty('scale', scale)
      this.appLoadBalancing
        .myActor()
        .setCustomProperty('actionWeights', store.actionWeights)
    }
  }

  updateMyActorModelInfo() {
    let actor = this.appLoadBalancing.myActor()
    let myActorNr = actor.actorNr

    let { posSmoothing, placement } = store
    let { position, rotation, scale } = placement

    // console.log({ store })
    // if (store.observer) {
    //   const camera = document.querySelector('#cameraWrapper').object3D
    //   // console.log({ camera })
    //   // console.log('||||||||||||||||||||||||||||||||||||||||||')
    //   // console.log('updateMyActorModelInfo:')
    //   // console.log({ camera, actor, position, rotation })
    //   // console.log('|||||||||||||||||||||||||||||||||||||||||||')

    //   // Move the model smoothly
    //   posSmoothing.acceleration.z -=
    //     posSmoothing.velocity.z * posSmoothing.friction.z
    //   posSmoothing.velocity.z += posSmoothing.acceleration.z
    //   position.z += posSmoothing.velocity.z
    //   posSmoothing.acceleration.z = 0

    //   // Move the model smoothly
    //   posSmoothing.acceleration.x -=
    //     posSmoothing.velocity.x * posSmoothing.friction.x
    //   posSmoothing.velocity.x += posSmoothing.acceleration.x
    //   position.x += posSmoothing.velocity.x
    //   posSmoothing.acceleration.x = 0

    //   // Restrict movement so that actor model do not go out of the room model
    //   if (position.x < -2.75) {
    //     position.x = -2.75
    //   } else if (2.75 < position.x) {
    //     position.x = 2.75
    //   }
    //   if (position.z < -1.75) {
    //     position.z = -1.75
    //   } else if (1.75 < position.z) {
    //     position.z = 1.75
    //   }

    //   // Rotate the model smoothly
    //   posSmoothing.acceleration.y -=
    //     posSmoothing.velocity.y * posSmoothing.friction.y
    //   posSmoothing.velocity.y += posSmoothing.acceleration.y
    //   rotation.y += posSmoothing.velocity.y
    //   posSmoothing.acceleration.y = 0

    //   // Switch model animations smoothly
    //   let tmpX = posSmoothing.velocity.x
    //   let tmpZ = posSmoothing.velocity.z
    //   store.actionWeights[1] = 100 * (Math.abs(tmpX) + Math.abs(tmpZ))
    //   if (store.actionWeights[1] > 1.0) {
    //     store.actionWeights[1] = 1.0
    //   } else if (store.actionWeights[1] < 0.0) {
    //     store.actionWeights[1] = 0.0
    //   }

    //   // Update model info
    //   console.log({ x: position.x, y: position.y, z: position.z })
    //   camera.position.set(position.x, position.y, position.z)
    //   camera.rotation.set(rotation.x, rotation.y, rotation.z)
    //   // camera.scale.set(scale.x, scale.y, scale.z)
    // }

    store.models.forEach(function (model, index) {
      //console.log(index + ': ' + model.name);
      if (model.name == 'model' + String(myActorNr)) {
        const cameraRig = document.getElementById('camRig')

        // Move the model smoothly
        posSmoothing.acceleration.z -=
          posSmoothing.velocity.z * posSmoothing.friction.z
        posSmoothing.velocity.z += posSmoothing.acceleration.z
        position.z += posSmoothing.velocity.z
        posSmoothing.acceleration.z = 0

        // Move the model smoothly
        posSmoothing.acceleration.x -=
          posSmoothing.velocity.x * posSmoothing.friction.x
        posSmoothing.velocity.x += posSmoothing.acceleration.x
        position.x += posSmoothing.velocity.x
        posSmoothing.acceleration.x = 0

        // Restrict movement so that actor model do not go out of the room model
        if (position.x < -2.75) {
          position.x = -2.75
        } else if (2.75 < position.x) {
          position.x = 2.75
        }
        if (position.z < -1.75) {
          position.z = -1.75
        } else if (1.75 < position.z) {
          position.z = 1.75
        }

        // Rotate the model smoothly
        posSmoothing.acceleration.y -=
          posSmoothing.velocity.y * posSmoothing.friction.y
        posSmoothing.velocity.y += posSmoothing.acceleration.y
        rotation.y += posSmoothing.velocity.y
        posSmoothing.acceleration.y = 0

        // Switch model animations smoothly
        let tmpX = posSmoothing.velocity.x
        let tmpZ = posSmoothing.velocity.z
        store.actionWeights[1] = 100 * (Math.abs(tmpX) + Math.abs(tmpZ))
        if (store.actionWeights[1] > 1.0) {
          store.actionWeights[1] = 1.0
        } else if (store.actionWeights[1] < 0.0) {
          store.actionWeights[1] = 0.0
        }

        // Update model info
        model.position.set(position.x, position.y, position.z)
        model.rotation.set(rotation.x, rotation.y, rotation.z)
        model.scale.set(scale.x, scale.y, scale.z)

        // Update camera info
        let rad = rotation.y + Math.PI
        cameraRig.object3D.position.set(
          position.x + Math.sin(rad),
          position.y + 1.6,
          position.z + Math.cos(rad)
        )
        cameraRig.object3D.rotation.set(
          rotation.x,
          rotation.y + Math.PI,
          rotation.z
        )
      }
    })
  }

  init({ appLoadBalancing }) {
    this.appLoadBalancing = appLoadBalancing
  }
}

const MyActor = new MyActorInstance()
export default MyActor
