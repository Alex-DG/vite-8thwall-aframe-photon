import './visibility.js'

// Prevent the browser from expanding by double tapping
document.addEventListener(
  'dblclick',
  function (e) {
    e.preventDefault()
  },
  { passive: false }
)
