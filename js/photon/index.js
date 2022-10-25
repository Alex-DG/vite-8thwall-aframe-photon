import { AppInfo, __extends } from './config'

import Actors, {
  data,
  updateIsMyObjectCreated,
  updateRoomModelNumber,
  createModel,
  removeRoomModel,
  removeModel,
  resetCameraRigInfo,
} from './actors'

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

    const { position, rotation, scale } = data.placement

    // Set custom property for model
    _this.myActor().setCustomProperty('pos', position)
    _this.myActor().setCustomProperty('rot', rotation)
    _this.myActor().setCustomProperty('scale', scale)
    _this.myActor().setCustomProperty('actionWeights', [1.0, 0.0])

    console.log('1 ', 'setCustomProperty')
    _this.myActor().setCustomProperty('roomModel', 1.0)

    return _this
  }

  AppLoadBalancing.prototype.start = function () {
    console.log('LoadBalancing > start')

    this.setupUI()

    // connect if no fb auth required
    if (data.connectOnStart) {
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

      createModel(actor.actorNr, false, data.roomModelNumber)

      updateIsMyObjectCreated(true)
      let tmpRoomModelNr = actor.getCustomProperty('roomModel')
      if (data.roomModelNumber != tmpRoomModelNr) {
        removeRoomModel()
        console.log('2', 'setCustomProperty')
        this.myActor().setCustomProperty('roomModel', data.roomModelNumber)
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
        if (tmpRoomModelNr && data.roomModelNumber != tmpRoomModelNr) {
          console.log('Change room model...')
          removeRoomModel()
          updateRoomModelNumber(tmpRoomModelNr)
          console.log('3', 'setCustomProperty')
          this.myActor().setCustomProperty('roomModel', data.roomModelNumber)
          console.log('onActorJoin-roomModelNumber:', data.roomModelNumber)

          document.getElementById('roomModelNumber').selectedIndex =
            data.roomModelNumber - 1
        }

        // Create actor models
        for (let nr in this.myRoomActors()) {
          const actr = this.myRoomActors()[nr]
          if (nr == this.myActor().actorNr) {
            createModel(nr, false, data.roomModelNumber)
            updateIsMyObjectCreated(true)
          } else {
            // Also perform initial settings for models of actors other than yourself
            createModel(nr, actr, data.roomModelNumber)
          }
        }
      } else {
        // [3] when joined actor is not me
        console.log('joined actor is not me...')
        createModel(actor.actorNr, false, data.roomModelNumber)
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
      updateIsMyObjectCreated(false)
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
    if (this.isJoinedToRoom() && data.isMyObjectCreated) {
      let actorNr = actor.actorNr
      let modelName = 'model' + String(actorNr)
      let pos, rot, scl

      if (data.models.length > 0) {
        // let scene = document.querySelector('a-scene').object3D;
        data.models.forEach(
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

Actors.init(AppLoadBalancing)
