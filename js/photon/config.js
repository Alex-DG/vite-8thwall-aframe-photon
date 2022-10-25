export const AppInfo = {
  Wss: true,
  AppId: 'dc8ae0f4-ecde-4a33-aa86-3fb4d3d0a117',
  AppVersion: '1.0',
  Region: 'ASIA',
  //	MasterServer: "localhost:9090"
  //  NameServer: "ws://localhost:9093"
  //  FbAppId: "you fb app id",
}

export const __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b
          }) ||
        function (d, b) {
          for (var p in b)
            if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]
        }
      return extendStatics(d, b)
    }
    return function (d, b) {
      extendStatics(d, b)
      function __() {
        this.constructor = d
      }
      d.prototype =
        b === null ? Object.create(b) : ((__.prototype = b.prototype), new __())
    }
  })()
