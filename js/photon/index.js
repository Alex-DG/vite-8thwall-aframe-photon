import { AppInfo, __extends } from './config'

// Settings
const DemoWss = AppInfo.Wss //this['AppInfo'] && this['AppInfo']['Wss']
const DemoAppId = AppInfo.AppId || '<no-app-id>'
const DemoAppVersion = AppInfo.AppVersion || '1.0'
const DemoMasterServer = AppInfo?.MasterServer // this['AppInfo'] && this['AppInfo']['MasterServer']
const DemoNameServer = AppInfo?.NameServer // this['AppInfo'] && this['AppInfo']['NameServer']
const DemoFbAppId = AppInfo?.FbAppid //this['AppInfo'] && this['AppInfo']['FbAppId']

let ConnectOnStart = false

const AppLoadBalancing = /** @class */ (function (_super) {
  __extends(AppLoadBalancing, _super)
  function AppLoadBalancing() {
    console.log('LoadBalancing > init ⚙️')

    const _this =
      _super.call(
        this,
        AppInfo.Wss
          ? Photon.ConnectionProtocol.Wss
          : Photon.ConnectionProtocol.Ws,
        AppInfo.AppId,
        AppInfo.AppVersion
      ) || this

    _this.logger = new Exitgames.Common.Logger('Demo:')

    _this.USERCOLORS = [
      '#FF0000',
      '#00AA00',
      '#0000FF',
      '#FFFF00',
      '#00FFFF',
      '#FF00FF',
    ]

    // uncomment to use Custom Authentication
    // this.setCustomAuthentication("username=" + "yes" + "&token=" + "yes");

    _this.output(
      _this.logger.format(
        'Init',
        _this.getNameServerAddress(),
        AppInfo.AppId,
        AppInfo.AppVersion
      )
    )

    _this.logger.info(
      'Init',
      _this.getNameServerAddress(),
      AppInfo.AppId,
      AppInfo.AppVersion
    )

    _this.setLogLevel(Exitgames.Common.Logger.Level.INFO)
    _this.myActor().setCustomProperty('color', _this.USERCOLORS[0])

    // Set custom property for model
    _this.myActor().setCustomProperty('pos', position)
    _this.myActor().setCustomProperty('rot', rotation)
    _this.myActor().setCustomProperty('scale', scale)
    _this.myActor().setCustomProperty('actionWeights', [1.0, 0.0])
    _this.myActor().setCustomProperty('roomModel', 1.0)

    return _this
  }

  AppLoadBalancing.prototype.start = function () {
    console.log('LoadBalancing > start')

    this.setupUI()

    // connect if no fb auth required
    if (ConnectOnStart) {
      if (AppInfo?.MasterServer) {
        this.setMasterServerAddress(AppInfo.MasterServer)
        this.connect()
      }

      if (AppInfo?.NameServer) this.setNameServerAddress(AppInfo.NameServer)

      this.connectToRegionMaster(AppInfo.Region)
    }

    console.log('LoadBalancing > started ✅')
  }

  AppLoadBalancing.prototype.onError = function (errorCode, errorMsg) {
    console.log('LoadBalancing > error ❌')
    this.output('Error ' + errorCode + ': ' + errorMsg)
  }

  AppLoadBalancing.prototype.onEvent = function (code, content, actorNr) {
    switch (code) {
      case 1:
        const mess = content.message
        const sender = content.senderName

        if (actorNr) {
          this.output(
            sender + ': ' + mess,
            this.myRoomActors()[actorNr].getCustomProperty('color')
          )
        } else {
          this.output(sender + ': ' + mess)
        }
        break
      default:
    }
    this.logger.debug('onEvent', code, 'content:', content, 'actor:', actorNr)
  }

  AppLoadBalancing.prototype.onStateChange = function (state) {
    const LBC = Photon.LoadBalancing.LoadBalancingClient
    const stateText = document.getElementById('statetxt')
    stateText.textContent = 'State: '
    stateText.textContent += LBC.StateToName(state)

    this.updateRoomButtons()
    this.updateRoomInfo()
  }

  AppLoadBalancing.prototype.objToStr = function (x) {
    var res = ''
    for (var i in x) {
      res += (res == '' ? '' : ' ,') + i + '=' + x[i]
    }
    return res
  }

  AppLoadBalancing.prototype.updateRoomInfo = function () {
    const stateText = document.getElementById('roominfo')
    stateText.innerHTML =
      'room: ' +
      this.myRoom().name +
      ' [' +
      this.objToStr(this.myRoom().getCustomProperties()) +
      '] [' +
      this.myRoom().expectedUsers +
      ']'
    stateText.innerHTML = stateText.innerHTML + '<br>'

    const memory = document.querySelector('a-scene').renderer.info.memory

    stateText.innerHTML +=
      ' renderer.info.memory -> geometries:' +
      memory.geometries +
      ', textures:' +
      memory.textures
    stateText.innerHTML = stateText.innerHTML + '<br>'
    stateText.innerHTML += ' actors: '
    stateText.innerHTML = stateText.innerHTML + '<br>'

    for (let nr in this.myRoomActors()) {
      const a = this.myRoomActors()[nr]
      //stateText.innerHTML += " " + nr + " " + a.name + " [" + this.objToStr(a.getCustomProperties()) + "]";

      let text =
        'pos(' +
        String(a.getCustomProperty('pos').x) +
        ', ' +
        String(a.getCustomProperty('pos').y) +
        ', ' +
        String(a.getCustomProperty('pos').z) +
        '), '
      text += 'room(' + String(a.getCustomProperty('roomModel')) + ')'
      //text += "rot("+String(a.getCustomProperty("rot").x)+", "+String(a.getCustomProperty("rot").y)+", "+String(a.getCustomProperty("rot").z)+"), "
      //text += "weight("+String(a.getCustomProperty("actionWeights")[0])+"), "

      stateText.innerHTML += ' ' + nr + ' ' + a.name + ' [' + text + ']'
      stateText.innerHTML = stateText.innerHTML + '<br>'
    }

    this.updateRoomButtons()
  }

  AppLoadBalancing.prototype.onActorPropertiesChange = function (actor) {
    this.updateModelInfo(actor)
    this.updateRoomInfo()

    // let synchCheck = true;
    // roomModelSynchInfo.forEach(function(info, index) {
    //     if(info.same == false){
    //         synchCheck = false;
    //     }
    // });

    // // Check other actor's room model number
    // let tmpRoomModelNr = actor.getCustomProperty("roomModel");
    // if(roomModelNumber != tmpRoomModelNr && synchCheck){
    //     console.log("Change room model...");
    //     removeRoomModel();
    //     roomModelNumber = tmpRoomModelNr;
    //     this.myActor().setCustomProperty("roomModel", roomModelNumber);
    //     console.log("onActorPropertiesChange-roomModelNumber:",roomModelNumber)
    //     createRoomModel(roomModelNumber);

    //     document.getElementById("roomModelNumber").selectedIndex = roomModelNumber-1;

    //     changeAllACtorModel(roomModelNumber)
    // }else if(roomModelNumber == tmpRoomModelNr){
    //     // Update the flag when it is confirmed that other users' rooms are synchronized
    //     roomModelSynchInfo.forEach(function(info, index) {
    //         if(info.actorNr == actor.actorNr){
    //             info.same = true;
    //         }
    //     });
    // }
  }

  AppLoadBalancing.prototype.onMyRoomPropertiesChange = function () {
    this.updateRoomInfo()
  }

  AppLoadBalancing.prototype.onRoomListUpdate = function (
    rooms,
    roomsUpdated,
    roomsAdded,
    roomsRemoved
  ) {
    this.logger.info(
      'Demo: onRoomListUpdate',
      rooms,
      roomsUpdated,
      roomsAdded,
      roomsRemoved
    )

    this.output(
      'Demo: Rooms update: ' +
        roomsUpdated.length +
        ' updated, ' +
        roomsAdded.length +
        ' added, ' +
        roomsRemoved.length +
        ' removed'
    )

    this.onRoomList(rooms)
    this.updateRoomButtons() // join btn state can be changed
  }

  AppLoadBalancing.prototype.onRoomList = function (rooms) {
    const menu = document.getElementById('gamelist')

    while (menu.firstChild) {
      menu.removeChild(menu.firstChild)
    }

    let selectedIndex = 0
    for (var i = 0; i < rooms.length; ++i) {
      var r = rooms[i]
      var item = document.createElement('option')
      item.attributes['value'] = r.name
      item.textContent = r.name
      menu.appendChild(item)
      if (this.myRoom().name == r.name) {
        selectedIndex = i
      }
    }

    menu.selectedIndex = selectedIndex

    this.output('Demo: Rooms total: ' + rooms.length)
    this.updateRoomButtons()
  }

  AppLoadBalancing.prototype.onJoinRoom = function () {
    this.output('Game ' + this.myRoom().name + ' joined')
    this.updateRoomInfo()
  }

  AppLoadBalancing.prototype.onActorJoin = function (actor) {
    this.output('actor ' + actor.actorNr + ' joined')

    // // Create objects according to the number of actors
    // if(actor.actorNr == this.myActor().actorNr){ // when joined actor is me
    //     console.log("joined actor is me...");
    //     let tmpRoomModelNr;
    //     for (var nr in this.myRoomActors()) {
    //         var actr = this.myRoomActors()[nr];
    //         //createObject(nr);
    //         //createModel(nr);

    //         if(nr == this.myActor().actorNr){
    //             createModel(nr, false, roomModelNumber);
    //         }else{
    //             // Also perform initial settings for models of actors other than yourself
    //             createModel(nr, actr, roomModelNumber);
    //             tmpRoomModelNr = actr.getCustomProperty("roomModel");
    //         }
    //     }
    //     isMyObjectCreated = true;

    //     // Check other actor's room model number
    //     if(tmpRoomModelNr && roomModelNumber != tmpRoomModelNr){
    //         console.log("Change room model...");
    //         removeRoomModel();
    //         roomModelNumber = tmpRoomModelNr;
    //         this.myActor().setCustomProperty("roomModel", roomModelNumber);
    //         console.log("onActorJoin-roomModelNumber:",roomModelNumber)
    //         createRoomModel(roomModelNumber);

    //         document.getElementById("roomModelNumber").selectedIndex = roomModelNumber-1;

    //         changeAllACtorModel(roomModelNumber)
    //     }
    // }else{ // when joined actor is not me
    //     console.log("joined actor is not me...");
    //     createModel(actor.actorNr, false, roomModelNumber);
    // }

    const myRoomActorCount = this.myRoomActorCount()
    // Create objects according to the number of actors
    console.log('len:', myRoomActorCount)

    if (myRoomActorCount <= 1 && actor.actorNr == this.myActor().actorNr) {
      // [1] when joined actor is only me
      console.log('🧍🏼 Joined actor is only me...')

      createModel(actor.actorNr, false, roomModelNumber)

      isMyObjectCreated = true
      let tmpRoomModelNr = actor.getCustomProperty('roomModel')
      if (roomModelNumber != tmpRoomModelNr) {
        removeRoomModel()
        this.myActor().setCustomProperty('roomModel', roomModelNumber)
        //createRoomModel(roomModelNumber);
      }
    } else {
      if (actor.actorNr == this.myActor().actorNr) {
        // [2] when joined actor is me
        console.log('joined actor is me...')

        let tmpRoomModelNr
        for (var nr in this.myRoomActors()) {
          var actr = this.myRoomActors()[nr]
          if (nr != this.myActor().actorNr) {
            tmpRoomModelNr = actr.getCustomProperty('roomModel')
          }
        }

        // Check other actor's room model number
        if (tmpRoomModelNr && roomModelNumber != tmpRoomModelNr) {
          console.log('Change room model...')
          removeRoomModel()
          roomModelNumber = tmpRoomModelNr
          this.myActor().setCustomProperty('roomModel', roomModelNumber)
          console.log('onActorJoin-roomModelNumber:', roomModelNumber)
          //createRoomModel(roomModelNumber);
          document.getElementById('roomModelNumber').selectedIndex =
            roomModelNumber - 1
        }

        // Create actor models
        for (let nr in this.myRoomActors()) {
          const actr = this.myRoomActors()[nr]
          if (nr == this.myActor().actorNr) {
            createModel(nr, false, roomModelNumber)
            isMyObjectCreated = true
          } else {
            // Also perform initial settings for models of actors other than yourself
            createModel(nr, actr, roomModelNumber)
          }
        }
      } else {
        // [3] when joined actor is not me
        console.log('joined actor is not me...')
        createModel(actor.actorNr, false, roomModelNumber)
      }
    }

    document.getElementById('roomModelNumber').disabled = true

    this.updateRoomInfo()
  }

  AppLoadBalancing.prototype.onActorLeave = function (actor) {
    // Note: It seems that the onActorLeave event may be called twice for an actor leaving.
    // onActorLeaveTimes += 1;
    // console.log("onActorLeave: actor " + actor.actorNr + " left");
    // console.log("onActorLeaveTimes:",onActorLeaveTimes);

    this.output('actor ' + actor.actorNr + ' left')

    if (actor.actorNr == this.myActor().actorNr) {
      // when left actor is me
      console.log('left actor is me...')

      //removeObject(actor.actorNr);
      removeModel(actor.actorNr)

      for (let nr in this.myRoomActors()) {
        //var actr = this.myRoomActors()[nr];
        //removeObject(nr);
        removeModel(nr)
      }
      isMyObjectCreated = false
      resetCameraRigInfo()

      // Reload web page
      location.reload()
    } else {
      // when left actor is not me
      console.log('left actor is not me...')
      //removeObject(actor.actorNr);
      removeModel(actor.actorNr)
    }

    document.getElementById('roomModelNumber').disabled = false

    this.updateRoomInfo()
  }

  AppLoadBalancing.prototype.sendMessage = function (message) {
    try {
      this.raiseEvent(1, {
        message: message,
        senderName: 'user' + this.myActor().actorNr,
      })

      this.output(
        'me[' + this.myActor().actorNr + ']: ' + message,
        this.myActor().getCustomProperty('color')
      )
    } catch (err) {
      console.log('Send message > error ❌: ' + err.message)
      this.output('Send message > error: ' + err.message)
    }
  }

  AppLoadBalancing.prototype.setupUI = function () {
    const _this = this

    this.logger.info('Setting up UI.')

    const input = document.getElementById('input')
    input.value = 'hello'
    input.focus()

    const btnJoin = document.getElementById('joingamebtn')
    btnJoin.onclick = function (ev) {
      if (_this.isInLobby()) {
        const menu = document.getElementById('gamelist')
        const gameId = menu.children[menu.selectedIndex].textContent
        const expectedUsers = document.getElementById('expectedusers')
        _this.output(gameId)
        _this.joinRoom(gameId, {
          expectedUsers:
            expectedUsers.value.length > 0
              ? expectedUsers.value.split(',')
              : undefined,
        })
      } else {
        _this.output('Reload page to connect to Master')
      }
      return false
    }

    const btnJoinOrCreate = document.getElementById('joinorcreategamebtn')
    btnJoinOrCreate.onclick = function (ev) {
      if (_this.isInLobby()) {
        const gameId = document.getElementById('newgamename')
        const expectedUsers = document.getElementById('expectedusers')
        _this.output(gameId.value)
        _this.joinRoom(gameId.value.length > 0 ? gameId.value : undefined, {
          createIfNotExists: true,
          expectedUsers:
            expectedUsers.value.length > 0
              ? expectedUsers.value.split(',')
              : undefined,
        })
      } else {
        _this.output('Reload page to connect to Master')
      }
      return false
    }

    const btnJoinRandom = document.getElementById('joinrandomgamebtn')
    btnJoinRandom.onclick = function (ev) {
      if (_this.isInLobby()) {
        _this.output('Random Game...')
        const expectedUsers = document.getElementById('expectedusers')
        _this.joinRandomRoom({ expectedUsers: expectedUsers.value.split(',') })
      } else {
        _this.output('Reload page to connect to Master')
      }
      return false
    }

    const btnNew = document.getElementById('newgamebtn')
    btnNew.onclick = function (ev) {
      if (_this.isInLobby()) {
        const name = document.getElementById('newgamename')
        _this.output('New Game')

        const expectedUsers = document.getElementById('expectedusers')
        _this.createRoom(name.value.length > 0 ? name.value : undefined, {
          expectedUsers:
            expectedUsers.value.length > 0
              ? expectedUsers.value.split(',')
              : undefined,
          maxPlayers: 10,
        })
      } else {
        _this.output('Reload page to connect to Master')
      }

      return false
    }

    const btnSetExpectedUsers = document.getElementById('setexpectedusers')
    btnSetExpectedUsers.onclick = function (ev) {
      _this
        .myRoom()
        .setExpectedUsers(
          document.getElementById('expectedusers').value.split(',')
        )
    }

    const btnClearExpectedUsers = document.getElementById('clearexpectedusers')
    btnClearExpectedUsers.onclick = function (ev) {
      _this.myRoom().clearExpectedUsers()
    }

    const form = document.getElementById('mainfrm')
    form.onsubmit = function () {
      if (_this.isJoinedToRoom()) {
        const input = document.getElementById('input')
        _this.sendMessage(input.value)
        input.value = ''
        input.focus()
      } else {
        if (_this.isInLobby()) {
          _this.output('Press Join or New Game to connect to Game')
        } else {
          _this.output('Reload page to connect to Master')
        }
      }
      return false
    }

    let btn = document.getElementById('leavebtn')
    btn.onclick = function (ev) {
      _this.leaveRoom()
      return false
    }
    btn = document.getElementById('colorbtn')
    btn.onclick = function (ev) {
      const ind = Math.floor(Math.random() * _this.USERCOLORS.length)
      const color = _this.USERCOLORS[ind]
      _this.myActor().setCustomProperty('color', color)
      _this.sendMessage('... changed his / her color!')
    }

    this.updateRoomButtons()
  }

  AppLoadBalancing.prototype.output = function (str, color) {
    const log = document.getElementById('theDialogue')

    const escaped = str
      .replace(/&/, '&amp;')
      .replace(/</, '&lt;')
      .replace(/>/, '&gt;')
      .replace(/"/, '&quot;')

    if (color) {
      escaped = "<FONT COLOR='" + color + "'>" + escaped + '</FONT>'
    }

    log.innerHTML = log.innerHTML + escaped + '<br>'
    log.scrollTop = log.scrollHeight
  }

  AppLoadBalancing.prototype.updateRoomButtons = function () {
    const btn = document.getElementById('newgamebtn')
    btn.disabled = !(this.isInLobby() && !this.isJoinedToRoom())

    const canJoin =
      this.isInLobby() &&
      !this.isJoinedToRoom() &&
      this.availableRooms().length > 0

    document.getElementById('joingamebtn').disabled = !canJoin
    document.getElementById('joinrandomgamebtn').disabled = !canJoin
    document.getElementById('leavebtn').disabled = !this.isJoinedToRoom()
  }

  AppLoadBalancing.prototype.updateModelInfo = function (actor) {
    // Update actor model info
    if (this.isJoinedToRoom() && isMyObjectCreated) {
      let actorNr = actor.actorNr
      let modelName = 'model' + String(actorNr)
      let pos, rot, scl

      if (models.length > 0) {
        // let scene = document.querySelector('a-scene').object3D;
        models.forEach(
          function (model, index) {
            if (model.name == modelName) {
              pos = actor.getCustomProperty('pos')
              rot = actor.getCustomProperty('rot')
              scl = actor.getCustomProperty('scale')

              model.position.set(pos.x, pos.y, pos.z)
              model.rotation.set(rot.x, rot.y, rot.z)
              model.scale.set(scl.x, scl.y, scl.z)
            }
          }.bind(this)
        )

        let weights = actor.getCustomProperty('actionWeights')
        updateActionWeights(actorNr, weights)
      }
    }
  }

  return AppLoadBalancing
})(Photon.LoadBalancing.LoadBalancingClient)

let roomModelNames = [
  '3_Room_high_1K_RL_300mW.gltf',
  '2_Room_high_512_RL_300mW.gltf',
  '1_Room_high_206_RL_300mW.gltf',
]
let avatorModelNames = [
  '3_Human_Gen_middle_1K_RL_walk1st.gltf',
  '2_Human_Gen_middle_512_RL_walk1st.gltf',
  '1_Human_Gen_middle_256_RL_walk1st.gltf',
]

// for A-Frame
let cameraRig = document.getElementById('camRig')
// AFRAME.registerComponent('handler', {
//   init: function () {
//     console.log('A-Frame handler init...')
//     //let marker = this.el;
//     //let marker = this.el.sceneEl;

//     //document.querySelector("a-scene").renderer.gammaOutput=true;
//     document.querySelector('a-scene').renderer.outputEncoding =
//       THREE.sRGBEncoding

//     cameraRig = document.getElementById('camRig')
//   },
// })

let demo
let displayedMenu = true
let pushedBtnMoveForward = false
let onActorLeaveTimes = 0
let clock
let stats
let frameCount = 0
let customPropertyUpdateFrequency = 3
let avatarInfo
let roomInfo

window.onload = function () {
  console.log('window loaded...')

  // Init stats.js
  //   stats = new Stats()
  //   stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
  //   Object.assign(stats.dom.style, {
  //     position: 'fixed',
  //     height: 'max-content',
  //     left: 'auto',
  //     right: 0,
  //   })
  //   document.body.appendChild(stats.dom)

  let btnMenu = document.getElementById('menu')
  btnMenu.onclick = function (ev) {
    console.log('btn:', displayedMenu)
    let menu = document.getElementById('info')
    menu.classList.toggle('change')
  }

  let btnActorPosReset = document.getElementById('actorPosReset')
  btnActorPosReset.onclick = function (ev) {
    resetMyActorPosition()
  }
  let btnActorPosSave = document.getElementById('actorPosSave')
  btnActorPosSave.onclick = function (ev) {
    saveMyActorInfoByCookie()
  }
  let btnActorPosLoad = document.getElementById('actorPosLoad')
  btnActorPosLoad.onclick = function (ev) {
    loadMyActorInfoByCookie()
  }

  let selectBtnRoom = document.getElementById('roomModelNumber')
  // Init select box info
  roomModelNames.forEach(function (name, index) {
    console.log('index:' + index + ' name:' + name)
    let option = document.createElement('option')
    option.setAttribute('value', index)
    option.innerHTML = name
    selectBtnRoom.appendChild(option)
  })
  // Init select box event
  selectBtnRoom.onchange = function (ev) {
    // let tmpRoomModelNr = parseInt(document.getElementById("roomModelNumber").value, 10) + 1;
    // //console.log("selectBtnRoom.onchange:","selectedIndex=",document.getElementById("roomModelNumber").selectedIndex,",value=",document.getElementById("roomModelNumber").value,",tmpRoomModelNr=",tmpRoomModelNr)
    // if(roomModelNumber != tmpRoomModelNr){
    //     removeRoomModel();
    //     roomModelNumber = tmpRoomModelNr;
    //     demo.myActor().setCustomProperty("roomModel", roomModelNumber);
    //     console.log("selectBtnRoom.onchange-roomModelNumber:",roomModelNumber)
    //     createRoomModel(roomModelNumber);

    //     changeAllACtorModel(roomModelNumber)

    //     demo.updateRoomInfo();
    // }

    roomModelNumber =
      parseInt(document.getElementById('roomModelNumber').value, 10) + 1
    //demo.myActor().setCustomProperty("roomModel", roomModelNumber);
    demo.updateRoomInfo()
  }
  // Prevents unexpected room changes due to the focus remaining in the select box
  selectBtnRoom.onkeydown = function (e) {
    if (
      e.key == 'ArrowUp' ||
      e.key == 'ArrowDown' ||
      e.key == 'ArrowLeft' ||
      e.key == 'ArrowRight'
    ) {
      e.preventDefault()
    }
  }

  // Init actor gui button
  let btnMoveForward = document.getElementById('moveForward')
  btnMoveForward.onmousedown = function (ev) {
    pushedBtnMoveForward = true
  }
  btnMoveForward.onmouseup = function (ev) {
    pushedBtnMoveForward = false
  }
  btnMoveForward.ontouchstart = function (ev) {
    pushedBtnMoveForward = true
  }
  btnMoveForward.ontouchend = function (ev) {
    pushedBtnMoveForward = false
  }
  let btnMoveLeft = document.getElementById('moveLeft')
  btnMoveLeft.onmousedown = function (ev) {
    updateMyActorDirection('L')
  }
  let btnMoveRight = document.getElementById('moveRight')
  btnMoveRight.onmousedown = function (ev) {
    updateMyActorDirection('R')
  }

  avatarInfo = document.getElementById('avatar-info')
  roomInfo = document.getElementById('room-info')

  console.log('AppInfo.Wss:', AppInfo.Wss)
  console.log('AppInfo.AppId:', AppInfo.AppId)
  console.log('AppInfo.AppVersion:', AppInfo.AppVersion)

  console.log('DemoInit: ConnectOnStart set')
  ConnectOnStart = true

  console.log('Demo Start...')
  demo = new AppLoadBalancing()
  demo.start()
  console.log('Demo Started...')

  clock = new THREE.Clock()

  // Set room model
  roomModelNumber = 1
  setTimeout(() => {
    // createRoomModel(roomModelNumber)
  }, 3.0 * 1000)

  function render() {
    //demo.updatePosition();
    requestAnimationFrame(render)

    // stats.begin()

    // Update model animation
    const mixerUpdateDelta = clock.getDelta()
    animationInfoPerModel.forEach(function (modelInfo, index) {
      //console.log(index + ': ' + modelInfo.name);
      let m = modelInfo.mixer
      m.update(mixerUpdateDelta)

      // Update model info
      if (demo.isJoinedToRoom() && isMyObjectCreated) {
        if (pushedBtnMoveForward) {
          movingForward()
        }
        updateMyActorModelInfo()
        updateActionWeights(demo.myActor().actorNr, actionWeights)

        frameCount += 1
        // Limit the frequency of custom property updates
        if (frameCount == customPropertyUpdateFrequency) {
          updateMyActorCustomProperty()
          frameCount = 0
        }
      }
    })

    // stats.end()
  }
  render()
}

// Model Info
let direction = 'front'
let position = {
  x: 0.0,
  y: 0.0,
  z: 0.0,
}
let rotation = {
  x: 0.0,
  y: 0.0,
  z: 0.0,
}
let scale = {
  x: 1.0,
  y: 1.0,
  z: 1.0,
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
let actionWeights = [1.0, 0.0]
// let actionSmoothing = {
//     friction: 0.1,
//     velocity: 0.0,
//     acceleration: 0.0
// }

window.addEventListener('keydown', keydown)
function keydown(event) {
  if (event.keyCode == 38) {
    // ArrowUp
    //actionWeights[1] = 1.0;
    movingForward()
  }
  if (event.keyCode == 40) {
    // ArrowDown
    // hoge
  }
  if (event.keyCode == 37) {
    // ArrowLeft
    updateMyActorDirection('L')
  }
  if (event.keyCode == 39) {
    // ArrowRight
    updateMyActorDirection('R')
  }
}

window.addEventListener('keyup', keyup)
function keyup(event) {
  if (
    event.keyCode == 38 ||
    event.keyCode == 40 ||
    event.keyCode == 37 ||
    event.keyCode == 39
  ) {
    console.log('keyup...')
    // actionWeights[1] = 0.0;
    // demo.myActor().setCustomProperty("actionWeights", actionWeights);
    // updateActionWeights(demo.myActor().actorNr, actionWeights)

    if (demo.isJoinedToRoom() && isMyObjectCreated) {
      demo.updateRoomInfo()
    }
  }
}

function movingForward() {
  let addV = 0.005
  if (direction == 'front') {
    posSmoothing.velocity.z += addV
  } else if (direction == 'right') {
    posSmoothing.velocity.x += addV
  } else if (direction == 'back') {
    posSmoothing.velocity.z -= addV
  } else if (direction == 'left') {
    posSmoothing.velocity.x -= addV
  }
}

let isMyObjectCreated = false
let models = []
let animationInfoPerModel = []
function createModel(actorNr, actor = false, avatorNr) {
  console.log('------------------------')
  console.log('----- CREATE MODEL -----')
  console.log('------------------------')
  console.log('createModel...')
  console.log('-> actorNr:', actorNr, ',avatorNr:', avatorNr)

  let scene = document.querySelector('a-scene').object3D

  // Set a flag to determine if the room model is synchronized between each user
  let synchInfo = {
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

  //let model = null;
  const loader = new THREE.GLTFLoader()
  const dracoLoader = new THREE.DRACOLoader()
  console.log('./assets/avators/raw/' + avatorModelNames[avatorNr - 1])
  dracoLoader.setDecoderPath(
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/'
  )
  console.log({
    modelSrc: '../../assets/avators/raw/' + avatorModelNames[avatorNr - 1],
  })
  loader.setDRACOLoader(dracoLoader)
  loader.load(
    // resource URL
    // "./assets/Human_Gen_3396Verts_512.glb", // "./Xbot.glb"
    // "./assets/avators/baked/" + avatorModelNames[avatorNr-1],
    '../../assets/avators/raw/' + avatorModelNames[avatorNr - 1],
    // called when the resource is loaded
    function (gltf) {
      let model = gltf.scene
      console.log({ model, actorNr })
      model.name = 'model' + String(actorNr)
      model.position.set(0, 0, 0)
      model.rotation.set(0, 0, 0)
      model.scale.set(1.0, 1.0, 1.0)

      model.traverse(function (child) {
        if (child.isMesh) {
          // child.name

          // Change T-Shirt color
          // if (child.name === 'HG_TSHIRT_Male001') {
          //   child.material.color.setHex(Math.random() * 0xffffff)
          // }
          // console.log({ name: child.name, child })
          // console.log('HG_TSHIRT_Male.001')

          //console.log("isMesh...");
          //let model2 = child.clone();

          child.castShadow = true
          //child.material.map = texture;
          //console.log("mat-color:",child.material.color);
          //child.material.color = new THREE.Color("rgb(255, 255, 255)");
          //child.material.color = new THREE.Color( 1.0, 1.0, 1.0 )
          //child.material.envMap = envMap;

          //scene.add( model2 );
        }
      })

      // Set animation for Actor Model
      // Xbot  -> 0:agree, 1:headShake, 2:idle, 3:run, 4:sad_pose, 5:sneak_pose, 6:walk
      // Human -> 0:Idle, 1:Walking
      const animations = gltf.animations
      let numAnimations = animations.length
      //console.log("gltf.animations:",gltf.animations)

      if (animations && numAnimations) {
        let mixer = new THREE.AnimationMixer(model)

        let modelInfo = {
          name: model.name,
          mixer: mixer,
          actions: [],
          actionWeights: [],
        }

        for (let i = 0; i < numAnimations; i++) {
          let animation = animations[i]
          const name = animation.name

          if (name == 'Idle' || name == 'Walk') {
            let action = mixer.clipAction(animation)
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

      scene.add(model)
      models.push(model)

      // Set initial model info
      if (actor) {
        demo.updateModelInfo(actor)
      }
    },
    // called while loading is progressing
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    // called when loading has error
    function (error) {
      console.log('An error happened')
      console.log(error)
    }
  )
}

function removeModel(actorNr) {
  console.log('removeModel:', actorNr)
  console.log('-> models-length:', models.length)
  console.log('-> roomModelSynchInfo.length:', roomModelSynchInfo.length)

  // Remove room model synch Info
  console.log('Remove room model synch Info...')
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
      console.log('There is no specified synch info...')
    }
  } else {
    console.log('There is no synch info...')
  }

  // Remove actor model
  console.log('Remove actor model...')
  if (models.length > 0) {
    let scene = document.querySelector('a-scene').object3D
    let removeIndex = -1
    models.forEach(function (model, index) {
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
      models.splice(removeIndex, 1)
    } else {
      console.log('There is no specified model...')
    }
  } else {
    console.log('There is no model...')
  }
}

// function startAnimation(actorNr, actionIndex){
//     //console.log("startAnimation:", actorNr);

//     animationInfoPerModel.forEach(function(modelInfo, index) {
//         //console.log(index + ': ' + modelInfo.name);
//         if(modelInfo.name == "model"+String(actorNr)){
//             // let m = modelInfo.mixer;
//             modelInfo.mixer.stopAllAction();
//             modelInfo.actions[actionIndex].setLoop(THREE.LoopOnce, 1); //LoopOnce, LoopRepeat, LoopPingPong
//             modelInfo.actions[actionIndex].clampWhenFinished = true;
//             modelInfo.actions[actionIndex].play();
//         }
//     });
// }

function updateMyActorModelInfo() {
  // console.log("updateMyActorModelInfo...")
  let myActorNr = demo.myActor().actorNr
  models.forEach(function (model, index) {
    //console.log(index + ': ' + model.name);
    if (model.name == 'model' + String(myActorNr)) {
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

      // // Set custom property for Photon
      // demo.myActor().setCustomProperty("pos", position);
      // demo.myActor().setCustomProperty("rot", rotation);
      // demo.myActor().setCustomProperty("scale", scale);
    }
  })
}

function updateMyActorDirection(turnDir) {
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

function updateActionWeights(actorNr, weights) {
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

function updateMyActorCustomProperty() {
  // console.log("updateMyActorCustomProperty...")
  if (demo) {
    // Set custom property for Photon
    demo.myActor().setCustomProperty('pos', position)
    demo.myActor().setCustomProperty('rot', rotation)
    demo.myActor().setCustomProperty('scale', scale)
    demo.myActor().setCustomProperty('actionWeights', actionWeights)
  }
}

let roomModel
let roomModelNumber = -1
let roomModelSynchInfo = []
function createRoomModel(roomNr) {
  console.log('createRoomModel:', roomNr)

  // Set a flag to determine if the room model is synchronized between each user
  roomModelSynchInfo.forEach(function (info, index) {
    if (info.actorNr == demo.myActor().actorNr) {
      info.same = true
    } else {
      info.same = false
    }
  })

  let scene = document.querySelector('a-scene').object3D
  let roomModelName = 'room' + String(roomNr)
  // console.log("./assets/rooms/raw/" + roomModelNames[roomNr-1]);
  //let model = null;
  const loader = new THREE.GLTFLoader()
  const dracoLoader = new THREE.DRACOLoader()
  dracoLoader.setDecoderPath(
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/'
  )
  loader.setDRACOLoader(dracoLoader)
  loader.load(
    // resource URL
    '../../assets/rooms/raw/' + roomModelNames[roomNr - 1],
    function (gltf) {
      roomInfo.textContent = 'idling...'

      setTimeout(() => {
        let model = gltf.scene
        model.name = 'room' + String(roomNr)
        model.position.set(0, 0, 0)
        model.rotation.set(0, 0, 0)
        model.scale.set(1.0, 1.0, 1.0)

        model.traverse(function (child) {
          if (child.isMesh) {
            //console.log("isMesh...");
            child.castShadow = true
          }
        })

        roomModel = model
        scene.add(roomModel)

        roomInfo.textContent = 'room model added to scene'
      }, 2.0 * 1000)
    },
    // called while loading is progressing
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
      roomInfo.textContent = (xhr.loaded / xhr.total) * 100 + '% loaded'
    },
    // called when loading has error
    function (error) {
      console.log('An error happened')
      console.log(error)
      roomInfo.textContent = error
    }
  )
}

function removeRoomModel() {
  console.log('removeRoomModel...')

  let scene = document.querySelector('a-scene').object3D
  scene.remove(roomModel)
  disposeObjects(roomModel)
}

function disposeObjects(model) {
  console.log('disposeObjects...')

  model.traverse((obj) => {
    if (obj.material) {
      if (obj.material.map) {
        obj.material.map.dispose()
      }
      if (obj.material.lightMap) {
        obj.material.lightMap.dispose()
      }
      if (obj.material.aoMap) {
        obj.material.aoMap.dispose()
      }
      if (obj.material.emissiveMap) {
        obj.material.emissiveMap.dispose()
      }
      if (obj.material.bumpMap) {
        obj.material.bumpMap.dispose()
      }
      if (obj.material.normalMap) {
        obj.material.normalMap.dispose()
      }
      if (obj.material.displacementMap) {
        obj.material.displacementMap.dispose()
      }
      if (obj.material.roughnessMap) {
        obj.material.roughnessMap.dispose()
      }
      if (obj.material.metalnessMap) {
        obj.material.metalnessMap.dispose()
      }
      if (obj.material.alphaMap) {
        obj.material.alphaMap.dispose()
      }
      if (obj.material.envMap) {
        obj.material.envMap.dispose()
      }
      obj.material.dispose()
    }
    if (obj.geometry) {
      obj.geometry.dispose()
      //console.log("obj.geometry.dispose()...");
    }
    if (obj.texture) {
      obj.texture.dispose()
      //console.log("obj.texture.dispose()...");
    }
  })
}

function resetCameraRigInfo() {
  console.log('resetCameraRigInfo...')
  if (cameraRig) {
    cameraRig.object3D.position.set(0, 1.6, 0)
    cameraRig.object3D.rotation.set(0, 0, 0)
  }
}

function resetMyActorPosition() {
  console.log('resetMyActorPosition...')
  let myActorNr = demo.myActor().actorNr
  models.forEach(function (model, index) {
    //console.log(index + ': ' + model.name);
    if (model.name == 'model' + String(myActorNr)) {
      direction = 'front'

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

function changeAllACtorModel(avatorNr) {
  console.log('changeAllACtorModel:', avatorNr)
  let modelNames = []
  if (models.length > 0) {
    // Remove all actor models
    let scene = document.querySelector('a-scene').object3D
    models.forEach(function (model, index) {
      console.log(index + ': ' + model.name)
      modelNames.push(model.name)

      // Remove model
      scene.remove(model)
      disposeObjects(model)
    })

    // Recreate all actor models
    models = []
    modelNames.forEach(function (modelName, index) {
      console.log(index + ': ' + modelName)
      let nr = parseInt(modelName.substr(5), 10)
      let actr = demo.myRoomActors()[nr]
      createModel(nr, actr, avatorNr)
    })
  } else {
    console.log('There is no model...')
  }
}

function saveMyActorInfoByCookie() {
  console.log('saveMyActorInfoByCookie...')
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

function loadMyActorInfoByCookie() {
  console.log('loadMyActorInfoByCookie...')

  let actorInfo = GetCookies()
  if (actorInfo['posX']) {
    // console.log("actorInfo['posX']:",actorInfo['posX']);
    // console.log("actorInfo['rotY']:",actorInfo['rotY']);
    // console.log("direction:",actorInfo['direction'])

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

function GetCookies() {
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
