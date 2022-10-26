import { store } from './data'

class ModelInstance {
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

      if (store.roomModelSynchInfo.length > 0) {
        let isSynchInfo = false
        store.roomModelSynchInfo.forEach(function (info, index) {
          //console.log(index,"info.actorNr:",info.actorNr,",actorNr:",actorNr)
          if (info.actorNr == actorNr) {
            isSynchInfo = true
          }
        })
        if (isSynchInfo) {
          console.log('There is already SynchInfo...')
        } else {
          store.roomModelSynchInfo.push(synchInfo)
        }
      } else {
        store.roomModelSynchInfo.push(synchInfo)
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
        store.animationInfoPerModel.push(modelInfo)
      }

      this.scene.add(model)
      store.models.push(model)

      // Set initial model info
      if (actor) {
        this.appLoadBalancing.updateModelInfo(actor)
      }

      console.log('✅', 'Model created!')
    } catch (error) {
      console.error('❌', 'Load model - ERROR: ', { error })
    }
  }

  init({ appLoadBalancing }) {
    this.appLoadBalancing = appLoadBalancing
    this.scene = document.querySelector('a-scene').object3D
    this.loader = new THREE.GLTFLoader()

    const dracoLoader = new THREE.DRACOLoader()
    dracoLoader.setDecoderPath(
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/'
    )
    this.loader.setDRACOLoader(dracoLoader)
  }
}

const Model = new ModelInstance()
export default Model
