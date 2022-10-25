export const rendererComponent = {
  init() {
    const renderer = document.querySelector('a-scene')
    renderer.outputEncoding = THREE.sRGBEncoding
  },
}
