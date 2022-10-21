// Default state
let isVisible = true

// UI Elements
const visibilityBtn = document.getElementById('visibility')
const controls = document.getElementById('controls')
const info = document.getElementById('info')

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

const handleVisibility = () => {
  action[isVisible]()
  visibilityBtn.innerText = label[isVisible]
  isVisible = !isVisible
}

visibilityBtn.addEventListener('click', handleVisibility)
