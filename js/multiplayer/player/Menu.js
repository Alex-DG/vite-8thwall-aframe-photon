import MyActor from './MyActor'

// Button label
const label = {
  true: 'Show',
  false: 'Hide',
}

// Actions
const show = () => {
  console.log('💡✅', '[ Show -> UI ]')
  controls.style.opacity = 1
  info.style.opacity = 1
}
const hide = () => {
  console.log('💡❌', '[ Hide -> UI ]')
  controls.style.opacity = 0
  info.style.opacity = 0
}

const action = {
  true: hide,
  false: show,
}

class MenuInstance {
  onClickManageVisibility() {
    action[this.isVisible]()
    this.visibilityBtn.innerText = label[this.isVisible]
    this.isVisible = !this.isVisible
  }
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

    this.visibilityBtn = document.getElementById('visibility')
    this.visibilityBtn.onclick = this.onClickManageVisibility
  }

  bind() {
    this.onClickMenu = this.onClickMenu.bind(this)
    this.onClickManageVisibility = this.onClickManageVisibility.bind(this)
    this.onClickActorPosReset = this.onClickActorPosReset.bind(this)
    this.onClickActorPosSave = this.onClickActorPosSave.bind(this)
    this.onClickActorPosLoad = this.onClickActorPosLoad.bind(this)
  }

  init() {
    this.isVisible = true // visibility of the full UI

    this.bind()
    this.setButtons()
  }
}

const Menu = new MenuInstance()
export default Menu
