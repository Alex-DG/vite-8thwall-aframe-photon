import { AppInfo, __extends, colors } from './photonConfig'

import Player from './player'
import Model from './player/Model'

import {
  store,
  removeModel,
  resetCameraRigInfo,
  updateActionWeights,
  updateIsMyObjectCreated,
  updateRoomModelNumber,
} from './player/data'

var AppLoadBalancing = /** @class */ (function (_super) {
  __extends(AppLoadBalancing, _super)
  function AppLoadBalancing() {
    console.log('AppLoadBalancing init...')
    var _this =
      _super.call(
        this,
        AppInfo.Wss
          ? Photon.ConnectionProtocol.Wss
          : Photon.ConnectionProtocol.Ws,
        AppInfo.AppId,
        AppInfo.AppVersion
      ) || this
    _this.logger = new Exitgames.Common.Logger('App:')
    _this.USERCOLORS = colors
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

    let { position, rotation, scale } = store.placement

    // Set custom property for model
    _this.myActor().setCustomProperty('pos', position)
    _this.myActor().setCustomProperty('rot', rotation)
    _this.myActor().setCustomProperty('scale', scale)
    _this.myActor().setCustomProperty('actionWeights', [1.0, 0.0])
    _this.myActor().setCustomProperty('roomModel', 1.0)

    return _this
  }

  AppLoadBalancing.prototype.start = function () {
    console.log('AppLoadBalancing start...')
    this.setupUI()
    // connect if no fb auth required
    if (store.connectOnStart) {
      if (AppInfo.MasterServer) {
        this.setMasterServerAddress(AppInfo.MasterServer)
        this.connect()
      }
      if (AppInfo.NameServer) {
        this.setNameServerAddress(AppInfo.NameServer)
        this.connectToRegionMaster(AppInfo.Region)
      } else {
        this.connectToRegionMaster(AppInfo.Region)
      }
    }
    console.log('AppLoadBalancing started...')
  }

  AppLoadBalancing.prototype.onError = function (errorCode, errorMsg) {
    // console.log("AppLoadBalancing error...");
    this.output('Error ' + errorCode + ': ' + errorMsg)
  }

  AppLoadBalancing.prototype.onEvent = function (code, content, actorNr) {
    // console.log("AppLoadBalancing event...");
    switch (code) {
      case 1:
        var mess = content.message
        var sender = content.senderName
        if (actorNr)
          this.output(
            sender + ': ' + mess,
            this.myRoomActors()[actorNr].getCustomProperty('color')
          )
        else this.output(sender + ': ' + mess)
        break
      default:
    }
    this.logger.debug('onEvent', code, 'content:', content, 'actor:', actorNr)
  }

  AppLoadBalancing.prototype.onStateChange = function (state) {
    // console.log("AppLoadBalancing state change...");

    // "namespace" import for static members shorter acceess
    var LBC = Photon.LoadBalancing.LoadBalancingClient
    var stateText = document.getElementById('statetxt')
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
    var stateText = document.getElementById('roominfo')
    stateText.innerHTML =
      'room: ' +
      this.myRoom().name +
      ' [' +
      this.objToStr(this.myRoom().getCustomProperties()) +
      '] [' +
      this.myRoom().expectedUsers +
      ']'
    stateText.innerHTML = stateText.innerHTML + '<br>'
    let memory = document.querySelector('a-scene').renderer.info.memory
    stateText.innerHTML +=
      ' renderer.info.memory -> geometries:' +
      memory.geometries +
      ', textures:' +
      memory.textures
    stateText.innerHTML = stateText.innerHTML + '<br>'
    stateText.innerHTML += ' actors: '
    stateText.innerHTML = stateText.innerHTML + '<br>'
    for (var nr in this.myRoomActors()) {
      var a = this.myRoomActors()[nr]
      //stateText.innerHTML += " " + nr + " " + a.name + " [" + this.objToStr(a.getCustomProperties()) + "]";
      let text =
        'pos(' +
        String(a.getCustomProperty('pos').x) +
        ', ' +
        String(a.getCustomProperty('pos').y) +
        ', ' +
        String(a.getCustomProperty('pos').z) +
        '), '
      //text += "rot("+String(a.getCustomProperty("rot").x)+", "+String(a.getCustomProperty("rot").y)+", "+String(a.getCustomProperty("rot").z)+"), "
      //text += "weight("+String(a.getCustomProperty("actionWeights")[0])+"), "
      text += 'room(' + String(a.getCustomProperty('roomModel')) + ')'
      stateText.innerHTML += ' ' + nr + ' ' + a.name + ' [' + text + ']'
      stateText.innerHTML = stateText.innerHTML + '<br>'
    }
    this.updateRoomButtons()
  }

  AppLoadBalancing.prototype.onActorPropertiesChange = function (actor) {
    //console.log("onActorPropertiesChange...");
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
      'App: onRoomListUpdate',
      rooms,
      roomsUpdated,
      roomsAdded,
      roomsRemoved
    )
    this.output(
      'App: Rooms update: ' +
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
    var menu = document.getElementById('gamelist')
    while (menu.firstChild) {
      menu.removeChild(menu.firstChild)
    }
    var selectedIndex = 0
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
    this.output('App: Rooms total: ' + rooms.length)
    this.updateRoomButtons()
  }

  AppLoadBalancing.prototype.onJoinRoom = function () {
    this.output('Game ' + this.myRoom().name + ' joined')
    this.updateRoomInfo()
  }

  AppLoadBalancing.prototype.onActorJoin = function (actor) {
    console.log('------------------------')
    console.log('----- ACTOR JOINED -----')
    console.log('------------------------')
    console.log({ actor, actorNr: actor.actorNr })

    this.output('actor ' + actor.actorNr + ' joined')

    // console.log({
    //   actor,
    //   observer: store.isObserver,
    //   customProps: actor.getCustomProperties(),
    //   roomProps: this.myRoom().getCustomProperties(),
    //   engine: this,
    // })

    const observer = store.isObserver || actor.getCustomProperty('observer')
    console.log('|__ Observer ', observer)
    // console.log({
    //   observer: actor.getCustomProperty('observer'),
    //   observer2: actor.customProperties.observer,
    //   customProperties: actor.getCustomProperties(),
    // })

    if (observer) {
      actor.setCustomProperty('observer', true) // attach observer role
    }
    store.isObserver = false // reset observer value

    // // Create objects according to the number of actors
    // if(actor.actorNr == this.myActor().actorNr){ // when joined actor is me
    //     console.log("joined actor is me...");
    //     let tmpRoomModelNr;
    //     for (var nr in this.myRoomActors()) {
    //         var actr = this.myRoomActors()[nr];
    //         //createObject(nr);
    //         //Model.createModel(nr);

    //         if(nr == this.myActor().actorNr){
    //             Model.createModel(nr, false, roomModelNumber);
    //         }else{
    //             // Also perform initial settings for models of actors other than yourself
    //             Model.createModel(nr, actr, roomModelNumber);
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
    //     Model.createModel(actor.actorNr, false, roomModelNumber);
    // }

    // Create objects according to the number of actors
    if (
      this.myRoomActorCount() <= 1 &&
      actor.actorNr == this.myActor().actorNr
    ) {
      // [1] when joined actor is only me
      console.log('🤖', '[ Joined actor is only me! ]')
      Model.createModel(actor.actorNr)
      updateIsMyObjectCreated(true)
      let tmpRoomModelNr = actor.getCustomProperty('roomModel')
      if (store.roomModelNumber != tmpRoomModelNr) {
        // removeRoomModel()
        this.myActor().setCustomProperty('roomModel', store.roomModelNumber)
        //createRoomModel(roomModelNumber);
      }
    } else {
      if (actor.actorNr == this.myActor().actorNr) {
        // [2] when joined actor is me
        console.log('🤖', '[ Joined actor is me ]')

        let tmpRoomModelNr
        for (var nr in this.myRoomActors()) {
          var actr = this.myRoomActors()[nr]
          if (nr != this.myActor().actorNr) {
            tmpRoomModelNr = actr.getCustomProperty('roomModel')
          }
        }

        // Check other actor's room model number
        if (tmpRoomModelNr && store.roomModelNumber != tmpRoomModelNr) {
          console.log('Change room model...')
          // removeRoomModel()
          updateRoomModelNumber(tmpRoomModelNr)
          this.myActor().setCustomProperty('roomModel', store.roomModelNumber)
          console.log('onActorJoin-roomModelNumber:', store.roomModelNumber)
          //createRoomModel(roomModelNumber);
          // document.getElementById('roomModelNumber').selectedIndex =
          //   store.roomModelNumber - 1
        }

        console.log({ myRoomActors: this.myRoomActors() })

        // Create actor models
        for (var nr in this.myRoomActors()) {
          var actr = this.myRoomActors()[nr]
          if (nr == this.myActor().actorNr) {
            Model.createModel(nr)
            updateIsMyObjectCreated(true)
          } else {
            // Also perform initial settings for models of actors other than yourself
            Model.createModel(nr, { actor: actr })
          }
        }
      } else {
        // [3] when joined actor is not me
        console.log('joined actor is not me...')
        Model.createModel(actor.actorNr)
      }
    }

    // store.isObserver = false
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
      for (var nr in this.myRoomActors()) {
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

    // document.getElementById('roomModelNumber').disabled = false
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
      console.log('error: ' + err.message)
      this.output('error: ' + err.message)
    }
  }

  AppLoadBalancing.prototype.setupUI = function () {
    var _this = this
    this.logger.info('Setting up UI.')
    var input = document.getElementById('input')
    input.value = 'hello'
    input.focus()
    var btnJoin = document.getElementById('joingamebtn')
    btnJoin.onclick = function (ev) {
      if (_this.isInLobby()) {
        var menu = document.getElementById('gamelist')
        var gameId = menu.children[menu.selectedIndex].textContent
        var expectedUsers = document.getElementById('expectedusers')
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

    var btnObserver = document.getElementById('observegamebtn')
    btnObserver.onclick = function (ev) {
      if (_this.isInLobby()) {
        var menu = document.getElementById('gamelist')
        var gameId = menu.children[menu.selectedIndex].textContent
        var expectedUsers = document.getElementById('expectedusers')

        console.log('===== OBSERVE ROOM =====')

        store.isObserver = true

        _this.output(gameId)

        if (store.isObserver) {
          _this.output('Joining as observer')
        }

        _this.joinRoom(
          gameId,
          {
            expectedUsers:
              expectedUsers.value.length > 0
                ? expectedUsers.value.split(',')
                : undefined,
          },
          {
            customGameProperties: {
              observer: true,
            },
          }
        )
      } else {
        _this.output('Reload page to connect to Master')
      }
      return false
    }

    var btnJoinOrCreate = document.getElementById('joinorcreategamebtn')
    btnJoinOrCreate.onclick = function (ev) {
      if (_this.isInLobby()) {
        var gameId = document.getElementById('newgamename')
        var expectedUsers = document.getElementById('expectedusers')
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
    var btnJoinRandom = document.getElementById('joinrandomgamebtn')
    btnJoinRandom.onclick = function (ev) {
      if (_this.isInLobby()) {
        _this.output('Random Game...')
        var expectedUsers = document.getElementById('expectedusers')
        _this.joinRandomRoom({ expectedUsers: expectedUsers.value.split(',') })
      } else {
        _this.output('Reload page to connect to Master')
      }
      return false
    }
    var btnNew = document.getElementById('newgamebtn')
    btnNew.onclick = function (ev) {
      if (_this.isInLobby()) {
        var name = document.getElementById('newgamename')
        _this.output('New Game')
        var expectedUsers = document.getElementById('expectedusers')
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
    var btnSetExpectedUsers = document.getElementById('setexpectedusers')
    btnSetExpectedUsers.onclick = function (ev) {
      _this
        .myRoom()
        .setExpectedUsers(
          document.getElementById('expectedusers').value.split(',')
        )
    }
    var btnClearExpectedUsers = document.getElementById('clearexpectedusers')
    btnClearExpectedUsers.onclick = function (ev) {
      _this.myRoom().clearExpectedUsers()
    }
    var form = document.getElementById('mainfrm')
    form.onsubmit = function () {
      if (_this.isJoinedToRoom()) {
        var input = document.getElementById('input')
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
    var btn = document.getElementById('leavebtn')
    btn.onclick = function (ev) {
      _this.leaveRoom()
      return false
    }
    btn = document.getElementById('colorbtn')
    btn.onclick = function (ev) {
      var ind = Math.floor(Math.random() * _this.USERCOLORS.length)
      var color = _this.USERCOLORS[ind]
      _this.myActor().setCustomProperty('color', color)
      _this.sendMessage('... changed his / her color!')
    }
    this.updateRoomButtons()
  }

  AppLoadBalancing.prototype.output = function (str, color) {
    var log = document.getElementById('theDialogue')
    var escaped = str
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
    var btn
    btn = document.getElementById('newgamebtn')
    btn.disabled = !(this.isInLobby() && !this.isJoinedToRoom())
    var canJoin =
      this.isInLobby() &&
      !this.isJoinedToRoom() &&
      this.availableRooms().length > 0
    btn = document.getElementById('joingamebtn')
    btn.disabled = !canJoin
    btn = document.getElementById('observegamebtn')
    btn.disabled = !canJoin
    btn = document.getElementById('joinrandomgamebtn')
    btn.disabled = !canJoin
    btn = document.getElementById('leavebtn')
    btn.disabled = !this.isJoinedToRoom()
  }

  AppLoadBalancing.prototype.updateModelInfo = function (actor) {
    // Update actor model info
    if (this.isJoinedToRoom() && store.isMyObjectCreated) {
      let actorNr = actor.actorNr
      let modelName = 'model' + String(actorNr)
      let pos, rot, scl
      if (store.models.length > 0) {
        // let scene = document.querySelector('a-scene').object3D;
        store.models.forEach(
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

// Actors.init(AppLoadBalancing)
Player.start(AppLoadBalancing)
