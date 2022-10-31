import Menu from './Menu'
import Model from './Model'
import Controls from './Controls'
import MyActor from './MyActor'

import { getStatsPanel, store, updateActionWeights } from './data'

class PlayerInstance {
  constructor() {
    this.settings = {
      frameCount: 0,
      frequency: 2,
      isReady: false,
    }

    this.stats = getStatsPanel()
    this.clock = new THREE.Clock()
    this.update = this.update.bind(this)
  }

  start(AppLoadBalancingInstance) {
    this.appLoadBalancing = new AppLoadBalancingInstance()
    const appLoadBalancing = this.appLoadBalancing

    Menu.init()
    Model.init({ appLoadBalancing })
    Controls.init({ appLoadBalancing })
    MyActor.init({ appLoadBalancing })

    store.connectOnStart = true

    this.appLoadBalancing.start()

    this.settings.isReady = true

    this.update()

    console.log('✅', 'LoadBalancing started!')
  }

  update() {
    if (!this.settings.isReady) return

    this.stats?.begin()

    // Update model animation
    store.animationInfoPerModel.forEach((modelInfo) => {
      modelInfo.mixer.update(this.clock.getDelta())

      // Update model info
      if (this.appLoadBalancing.isJoinedToRoom() && store.isMyObjectCreated) {
        if (Controls.pushedBtnMoveForward) {
          Controls.movingForward()
        }
        MyActor.updateMyActorModelInfo()

        updateActionWeights(
          this.appLoadBalancing.myActor().actorNr,
          store.actionWeights
        )

        if (!store.observer) {
          this.settings.frameCount += 1
          // Limit the frequency of custom property updates
          if (this.settings.frameCount == this.settings.frequency) {
            MyActor.updateMyActorCustomProperty()
            this.settings.frameCount = 0
          }
        }
      }
    })

    requestAnimationFrame(this.update)

    this.stats?.end()
  }
}

const Player = new PlayerInstance()
export default Player
