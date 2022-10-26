import { store } from './data'

let direction = 'front'

class ControlsInstance {
  updateMyActorDirection(turnDir) {
    const { velocity } = store.posSmoothing

    if (turnDir == 'L') {
      velocity.y += Math.PI / 18.0
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
      velocity.y -= Math.PI / 18.0
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
    const { velocity } = store.posSmoothing

    switch (direction) {
      case 'front':
        velocity.z += addV
        break
      case 'right':
        velocity.x += addV
        break
      case 'back':
        velocity.z -= addV
        break
      case 'left':
        velocity.x -= addV
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
      if (this.appLoadBalancing.isJoinedToRoom() && store.isMyObjectCreated) {
        this.appLoadBalancing.updateRoomInfo()
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

  init({ appLoadBalancing }) {
    this.appLoadBalancing = appLoadBalancing
    this.pushedBtnMoveForward = false

    this.bind()
    this.setKeys()
    this.setButtons()
  }
}

const Controls = new ControlsInstance()
export default Controls
