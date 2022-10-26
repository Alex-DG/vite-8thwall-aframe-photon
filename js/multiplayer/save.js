import { getCookies } from '../utils/cookies'

export const store = {
  connectOnStart: false,
  isMyObjectCreated: false,
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
}

export const updateIsMyObjectCreated = (v) => {
  store['isMyObjectCreated'] = v
}
export const updateRoomModelNumber = (v) => {
  store['roomModelNumber'] = v
}

let posSmoothing = {
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
}

let direction = 'front'

let AppLoadBalancingInstance
let appLoadBalancing
let clock

let roomModelSynchInfo = []
let animationInfoPerModel = []
let actionWeights = [1.0, 0.0]

let cameraRig = document.getElementById('camRig')

const frame = {
  count: 0,
  frequency: 10,
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
  if (roomModelSynchInfo.length > 0) {
    let removeIndex = -1
    roomModelSynchInfo.forEach(function (info, index) {
      //console.log(index,"info.actorNr:",info.actorNr,",actorNr:",actorNr)
      if (info.actorNr == actorNr) {
        removeIndex = index
      }
    })
    if (removeIndex >= 0) {
      roomModelSynchInfo.splice(removeIndex, 1)
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
  animationInfoPerModel.forEach(function (modelInfo, index) {
    //console.log(index + ': ' + modelInfo.name);
    if (modelInfo.name == 'model' + String(actorNr)) {
      //let m = modelInfo.mixer;
      modelInfo.actions[0].setEffectiveWeight(weights[0]) // Idle
      modelInfo.actions[1].setEffectiveWeight(weights[1]) // Walking
    }
  })
}

export function resetCameraRigInfo() {
  if (cameraRig) {
    cameraRig.object3D.position.set(0, 1.6, 0)
    cameraRig.object3D.rotation.set(0, 0, 0)
  }
}

/////////////////////////////////////////////////////////////////

class MenuInstance {
  onClickMenu() {
    document.getElementById('info').classList.toggle('change')
  }
  onClickActorPosReset() {
    MyActor.resetMyActorPosition()
  }
  onClickActorPosSave() {
    MyActor.saveMyActorInfoByCookie()
  }
  onClickActorPosLoad() {
    MyActor.loadMyActorInfoByCookie()
  }

  ////

  setButtons() {
    const btnMenu = document.getElementById('menu')
    btnMenu.onclick = this.onClickMenu

    const btnActorPosReset = document.getElementById('actorPosReset')
    btnActorPosReset.onclick = this.onClickActorPosReset

    const btnActorPosSave = document.getElementById('actorPosSave')
    btnActorPosSave.onclick = this.onClickActorPosSave

    const btnActorPosLoad = document.getElementById('actorPosLoad')
    btnActorPosLoad.onclick = this.onClickActorPosLoad
  }

  bind() {
    this.onClickMenu = this.onClickMenu.bind(this)
    this.onClickActorPosReset = this.onClickActorPosReset.bind(this)
    this.onClickActorPosSave = this.onClickActorPosSave.bind(this)
    this.onClickActorPosLoad = this.onClickActorPosLoad.bind(this)
  }

  init() {
    this.bind()
    this.setButtons()
  }
}

class ControlsInstance {
  updateMyActorDirection(turnDir) {
    // console.log("updateMyActorDirection:", turnDir)
    if (turnDir == 'L') {
      posSmoothing.velocity.y += Math.PI / 18.0
      if (direction == 'front') {
        direction = 'right'
      } else if (direction == 'right') {
        direction = 'back'
      } else if (direction == 'back') {
        direction = 'left'
      } else if (direction == 'left') {
        direction = 'front'
      }
    } else if (turnDir == 'R') {
      posSmoothing.velocity.y -= Math.PI / 18.0
      if (direction == 'front') {
        direction = 'left'
      } else if (direction == 'left') {
        direction = 'back'
      } else if (direction == 'back') {
        direction = 'right'
      } else if (direction == 'right') {
        direction = 'front'
      }
    }
  }

  movingForward() {
    let addV = 0.005

    switch (direction) {
      case 'front':
        posSmoothing.velocity.z += addV
        break
      case 'right':
        posSmoothing.velocity.x += addV
        break
      case 'back':
        posSmoothing.velocity.z -= addV
        break
      case 'left':
        posSmoothing.velocity.x -= addV
        break
    }
  }

  ////

  onKeyDown(event) {
    switch (event.keyCode) {
      case 37:
        this.updateMyActorDirection('L')
        break
      case 38:
        this.movingForward()
        break
      case 39:
        this.updateMyActorDirection('R')
        break
      case 40:
        break
    }
  }

  onKeyUp(event) {
    const keyCode = event.keyCode
    const isUp =
      keyCode == 38 || keyCode == 40 || keyCode == 37 || keyCode == 39

    if (isUp) {
      if (appLoadBalancing.isJoinedToRoom() && store.isMyObjectCreated) {
        appLoadBalancing.updateRoomInfo()
      }
    }
  }

  onForwardMouseDown() {
    this.pushedBtnMoveForward = true
  }
  onForwardMouseUp() {
    this.pushedBtnMoveForward = false
  }
  onForwardTouchstart() {
    this.pushedBtnMoveForward = true
  }
  onForwardTouchEnd() {
    this.pushedBtnMoveForward = false
  }

  onLeftMouseDown() {
    this.updateMyActorDirection('L')
  }

  onRightMouseDown() {
    this.updateMyActorDirection('R')
  }

  ////

  setKeys() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  setButtons() {
    const btnMoveForward = document.getElementById('moveForward')
    btnMoveForward.onmousedown = this.onForwardMouseDown
    btnMoveForward.onmouseup = this.onForwardMouseUp
    btnMoveForward.ontouchstart = this.onForwardTouchstart
    btnMoveForward.ontouchend = this.onForwardTouchEnd

    const btnMoveLeft = document.getElementById('moveLeft')
    btnMoveLeft.onmousedown = this.onLeftMouseDown

    let btnMoveRight = document.getElementById('moveRight')
    btnMoveRight.onmousedown = this.onRightMouseDown
  }

  bind() {
    this.onForwardMouseDown = this.onForwardMouseDown.bind(this)
    this.onForwardMouseUp = this.onForwardMouseUp.bind(this)
    this.onForwardTouchstart = this.onForwardTouchstart.bind(this)
    this.onForwardTouchEnd = this.onForwardTouchEnd.bind(this)

    this.onLeftMouseDown = this.onLeftMouseDown.bind(this)
    this.onRightMouseDown = this.onRightMouseDown.bind(this)

    this.onKeyUp = this.onKeyUp.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
  }

  init() {
    this.pushedBtnMoveForward = false

    this.bind()
    this.setKeys()
    this.setButtons()
  }
}

class ModelInstance {
  init() {
    this.scene = document.querySelector('a-scene').object3D
    this.loader = new THREE.GLTFLoader()

    const dracoLoader = new THREE.DRACOLoader()
    dracoLoader.setDecoderPath(
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/'
    )
    this.loader.setDRACOLoader(dracoLoader)
  }

  async createModel(actorNr, actor = undefined) {
    console.log('------------------------')
    console.log('----- CREATE MODEL -----')
    console.log('------------------------')

    try {
      // Set a flag to determine if the room model is synchronized between each user
      const synchInfo = {
        actorNr: actorNr,
        same: true,
      }

      if (roomModelSynchInfo.length > 0) {
        let isSynchInfo = false
        roomModelSynchInfo.forEach(function (info, index) {
          //console.log(index,"info.actorNr:",info.actorNr,",actorNr:",actorNr)
          if (info.actorNr == actorNr) {
            isSynchInfo = true
          }
        })
        if (isSynchInfo) {
          console.log('There is already SynchInfo...')
        } else {
          roomModelSynchInfo.push(synchInfo)
        }
      } else {
        roomModelSynchInfo.push(synchInfo)
      }

      const gltf = await this.loader.loadAsync(
        '../../assets/avatars/raw/3_Human_Gen_middle_1K_RL_walk1st.gltf'
      )
      gltf.scene.position.set(0, 0, 0)
      gltf.scene.rotation.set(0, 0, 0)
      gltf.scene.scale.set(1.0, 1.0, 1.0)
      gltf.scene.traverse(function (child) {
        if (child.isMesh) {
          child.castShadow = true
          // Change T-Shirt color
          // if (child.name === 'HG_TSHIRT_Male001') {
          //   child.material.color.setHex(Math.random() * 0xffffff)
          // }
        }
      })

      const model = gltf.scene
      const animations = gltf.animations
      const numAnimations = animations.length

      model.name = `model${String(actorNr)}`

      if (animations && numAnimations) {
        const mixer = new THREE.AnimationMixer(model)

        const modelInfo = {
          name: model.name,
          mixer: mixer,
          actions: [],
          actionWeights: [],
        }

        for (let i = 0; i < numAnimations; i++) {
          const animation = animations[i]
          const name = animation.name

          if (name == 'Idle' || name == 'Walk') {
            const action = mixer.clipAction(animation)
            modelInfo.actions.push(action)

            // Set loop once
            if (name == 'Walk') {
              action.setLoop(THREE.LoopRepeat)
            } else {
              action.setLoop(THREE.LoopOnce)
            }

            // Animation ends at the last frame of the animation
            action.clampWhenFinished = true

            // Set animation weight
            if (name == 'Idle') {
              modelInfo.actionWeights.push(1.0)
              action.setEffectiveWeight(1.0)
            } else {
              modelInfo.actionWeights.push(0.0)
              action.setEffectiveWeight(0.0)
            }

            // Play animation
            action.play()
          }
        }
        animationInfoPerModel.push(modelInfo)
      }

      this.scene.add(model)
      store.models.push(model)

      // Set initial model info
      if (actor) {
        appLoadBalancing.updateModelInfo(actor)
      }

      console.log('✅', 'Model created!')
    } catch (error) {
      console.error('❌', 'Load model - ERROR: ', { error })
    }
  }
}

class MyActorInstance {
  resetMyActorPosition() {
    console.log('resetMyActorPosition...')
    let myActorNr = appLoadBalancing.myActor().actorNr
    store.models.forEach(function (model, index) {
      //console.log(index + ': ' + model.name);
      if (model.name == 'model' + String(myActorNr)) {
        let { position, rotation, scale } = store.placement
        // direction = 'front'

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
      let { position, rotation } = store.placement

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
    if (appLoadBalancing) {
      const { position, rotation, scale } = store.placement

      // Set custom property for Photon
      appLoadBalancing.myActor().setCustomProperty('pos', position)
      appLoadBalancing.myActor().setCustomProperty('rot', rotation)
      appLoadBalancing.myActor().setCustomProperty('scale', scale)
      appLoadBalancing
        .myActor()
        .setCustomProperty('actionWeights', actionWeights)
    }
  }

  updateMyActorModelInfo() {
    let myActorNr = appLoadBalancing.myActor().actorNr
    store.models.forEach(function (model, index) {
      //console.log(index + ': ' + model.name);
      if (model.name == 'model' + String(myActorNr)) {
        let { position, rotation, scale } = store.placement

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
        actionWeights[1] = 100 * (Math.abs(tmpX) + Math.abs(tmpZ))
        if (actionWeights[1] > 1.0) {
          actionWeights[1] = 1.0
        } else if (actionWeights[1] < 0.0) {
          actionWeights[1] = 0.0
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
}

/////////////////////////////////////////////////////////////////

const Controls = new ControlsInstance()
const MyActor = new MyActorInstance()
const Menu = new MenuInstance()
export const Model = new ModelInstance()

/////////////////////////////////////////////////////////////////

const start = () => {
  Menu.init()
  Model.init()
  Controls.init()

  store.connectOnStart = true

  appLoadBalancing = new AppLoadBalancingInstance()
  appLoadBalancing.start()
  console.log('✅', 'LoadBalancing started!')

  clock = new THREE.Clock()

  // Set room model
  updateRoomModelNumber(1)

  function render() {
    requestAnimationFrame(render)

    // Update model animation
    const mixerUpdateDelta = clock.getDelta()
    animationInfoPerModel.forEach((modelInfo) => {
      //console.log(index + ': ' + modelInfo.name);
      let m = modelInfo.mixer
      m.update(mixerUpdateDelta)

      // Update model info
      if (appLoadBalancing.isJoinedToRoom() && store.isMyObjectCreated) {
        if (Controls.pushedBtnMoveForward) {
          Controls.movingForward()
        }
        MyActor.updateMyActorModelInfo()
        updateActionWeights(appLoadBalancing.myActor().actorNr, actionWeights)

        frame.count += 1
        // Limit the frequency of custom property updates
        if (frame.count == frame.frequency) {
          MyActor.updateMyActorCustomProperty()
          frame.count = 0
        }
      }
    })
  }
  render()
}

const Actors = {
  init: (instance) => {
    AppLoadBalancingInstance = instance
    if (AppLoadBalancingInstance) start()
  },
}

export default Actors
