export const getCookies = () => {
  let result = new Array()

  let allcookies = document.cookie
  if (allcookies != '') {
    let cookies = allcookies.split('; ')
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].split('=')

      // Add the cookie name as a key to the array
      result[cookie[0]] = decodeURIComponent(cookie[1])
    }
  }
  return result
}
