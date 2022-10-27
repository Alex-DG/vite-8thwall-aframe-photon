import Stats from 'stats.js'

export const store = {
  connectOnStart: false,
  isMyObjectCreated: false,
  isDebug: true,
  isObserver: false,
  roomModelNumber: -1,
  models: [],
  placement: {
    position: {
      x: 0.0,
      y: 0.0,
      z: 0.0,
    },
    rotation: {
      x: 0.0,
      y: 0.0,
      z: 0.0,
    },
    scale: {
      x: 1.0,
      y: 1.0,
      z: 1.0,
    },
  },
  roomModelSynchInfo: [],
  animationInfoPerModel: [],
  posSmoothing: {
    friction: {
      x: 0.1,
      y: 0.1,
      z: 0.1,
    },
    velocity: {
      x: 0.0,
      y: 0.0,
      z: 0.0,
    },
    acceleration: {
      x: 0.0,
      y: 0.0,
      z: 0.0,
    },
  },
  actionWeights: [1.0, 0.0],
}

export const updateIsMyObjectCreated = (v) => {
  store['isMyObjectCreated'] = v
}
export const updateRoomModelNumber = (v) => {
  store['roomModelNumber'] = v
}

function disposeObjects(model) {
  model.traverse((obj) => {
    if (obj.material) obj.material.dispose()
    if (obj.geometry) obj.geometry.dispose()
    if (obj.texture) obj.texture.dispose()
  })
}

export function removeModel(actorNr) {
  console.log('> removeModel ', actorNr)

  // Remove room model synch Info
  console.log('|_ Remove room model synch Info...')
  if (store.roomModelSynchInfo.length > 0) {
    let removeIndex = -1
    store.roomModelSynchInfo.forEach(function (info, index) {
      //console.log(index,"info.actorNr:",info.actorNr,",actorNr:",actorNr)
      if (info.actorNr == actorNr) {
        removeIndex = index
      }
    })
    if (removeIndex >= 0) {
      store.roomModelSynchInfo.splice(removeIndex, 1)
    } else {
      console.log('|_ There is no specified synch info...')
    }
  } else {
    console.log('|_ There is no synch info...')
  }

  // Remove actor model
  console.log('|_ Remove actor model...')
  if (store.models.length > 0) {
    let scene = document.querySelector('a-scene').object3D
    let removeIndex = -1
    store.models.forEach(function (model, index) {
      console.log(index + ': ' + model.name)
      if (model.name == 'model' + String(actorNr)) {
        //console.log("remove...");
        scene.remove(model)
        disposeObjects(model)
        removeIndex = index
        //console.log("removed!");
      }
    })
    if (removeIndex >= 0) {
      store.models.splice(removeIndex, 1)
    } else {
      console.log('|_ There is no specified model...')
    }
  } else {
    console.log('|_ There is no model...')
  }
}

export function updateActionWeights(actorNr, weights) {
  // console.log("updateActionWeight:", actorNr, weight)
  store.animationInfoPerModel.forEach(function (modelInfo, index) {
    //console.log(index + ': ' + modelInfo.name);
    if (modelInfo.name == 'model' + String(actorNr)) {
      //let m = modelInfo.mixer;
      modelInfo.actions[0].setEffectiveWeight(weights[0]) // Idle
      modelInfo.actions[1].setEffectiveWeight(weights[1]) // Walking
    }
  })
}

export function resetCameraRigInfo() {
  const cameraRig = document.getElementById('camRig')
  if (cameraRig) {
    cameraRig.object3D.position.set(0, 1.6, 0)
    cameraRig.object3D.rotation.set(0, 0, 0)
  }
}

export const getStatsPanel = () => {
  if (store.isDebug) {
    const stats = new Stats()
    stats.showPanel(0)

    document.body.appendChild(stats.dom)

    return stats
  }

  return null
}
