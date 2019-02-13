const _ = require('lodash')
const Telnet = require('telnet-client')
const Promise = require('bluebird')
const { TelnetSocket } = require('telnet-stream')
const net = require('net')
const pathlib = require('path')
const fs = require('fs-extra')

const SEARCH = {
  connected: 'Connected to the kOS Terminal Server.',
  cores: /\[(\d+)\]\s+(yes|no)\s+(\d+)\s+(.*?)\((.*?)\((.*?)\)\)/g,
  isVolume: /^\d+\:/,
  ignoreKeys: [
    'ADD',
    'ALTITUDEOF',
    'CLEAR',
    'CONTAINS',
    'COPY',
    'DUMP',
    'EMPTY',
    'FIND',
    'FINDLAST',
    'HASSUFFIX',
    'INDEXOF',
    'INHERITANCE',
    'INSERT',
    'ISSERIALIZABLE',
    'ISTYPE',
    'ITERATOR',
    'JOIN',
    'LASTINDEXOF',
    'LENGTH',
    'NORMALIZED',
    'REMOVE',
    'REVERSEITERATOR',
    'SUBLIST',
    'SUFFIXNAMES',
    'TOSTRING',
    'TYPENAME',
    'VEC',
  ],
  allowKeys: [
    'AIRSPEED',
    'ALTITUDE',
    'ANGULARVEL',
    'NAME',
  ],
  objectKeys: require('./src/keys')
}

const EventEmitter = require('events')

function randomString( length = 8 ) {
  let mask = 'jebediahkerman'
  var result = ''
  for (var i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)]
  return result
}


const resolveKSP = pathlib.resolve.bind( null, 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Kerbal Space Program')
const resolveVolume = resolveKSP.bind( null, 'Ships/Script')

class Core extends EventEmitter {
  constructor( props ) {
    super()
    _.merge( this, props )
  }

  async online() {
    if ( !this._online ) {
      this.kosmonaut = await this.kosmonaut.connectionAtMenu()
      this.kosmonaut.selectCore( this )
      await Promise.delay( 200 )
      this._online = true
    }

    return this
  }

  write( data ) {
    this.kosmonaut.write( data )
  }

  async command( command ) {
    await this.online()
    let stop1 = randomString()
    let stop2 = randomString()
    return Promise.fromCallback( cb => {
      let result = ''
      let self = this
      this.on('data', listener )
      this.write( `${command}\n`)
      this.write( `PRINT "${stop1}"+"${stop2}".\n` )

      function listener( data ) {
        let index = data.indexOf( stop1 + stop2 )

        if ( index != -1 )
          data = data.substr( 0, index )

        result += data 

        if ( index != -1 ) {
          self.removeListener('data',listener )
          cb( null, result )
        }
      }
    })
  }


  async pathTmp( path ) {
    if ( SEARCH.isVolume.exec( path ) )
      return path

    let ext = pathlib.extname( path )
    let name = pathlib.basename( path, ext )
    let hash = randomString()
    let tmp = resolveVolume(`${name}-${hash}${ext}`)
    this._tmp = this._tmp || []
    this._tmp[tmp] = true
    return tmp
  }

  toVolume( path ) {
    if ( SEARCH.isVolume.exec( path ) )
      return path

    path = resolveVolume( path )
    let root = resolveVolume()
    let index = root.length 
    if ( path.substr( 0, index ) != root )
      throw new Error(`Path "${path}" not in root "${root}" `)

    path = path.substr( index )
    path = path.replace(/\\/g,'/')
    return '0:'+path
  }

  async cleanTmp( name ) {
    if ( this._tmp[name] ) {
      await fs.unlink( name )
      delete this._tmp[name]
    }    
  }


  async copypath( from, to ) {
    let fromTmp = await this.pathTmp( from )
    let toTmp = await this.pathTmp( to )
    if ( fromTmp != from )
      await fs.copy( from, fromTmp )

    let result = await this.command( `COPYPATH("${this.toVolume( fromTmp )}","${this.toVolume( toTmp )}").` )

    if ( toTmp != to )
      await fs.copy( toTmp, to )

    await this.cleanTmp( fromTmp )
    await this.cleanTmp( toTmp )
  }


  async query( variable, keys ) {
    await this.online()
    let type = await this.queryPrint( variable+':TYPENAME' )

    if ( !type )
      return null
    
    switch ( type ) {
      case 'Boolean':
        return await this.queryBool( variable )

      case 'Direction':
      case 'String':
        return await this.queryPrint( variable )

      case 'Scalar':
        return parseFloat( await this.queryPrint( variable ) )
    }
    
    if ( _.isArrayLikeObject( keys ) ) {
      let ob = {}
      keys.forEach( key => ob[key] = true )
      keys = ob
    }
    
    if ( !_.isObject( keys ) ) {
      keys = {}
      _.map( SEARCH.objectKeys, ( moreKeys, key ) => {
        if ( key == '*' || key == type )
          keys = _.merge( keys, moreKeys )
      })
    }

    let result = { TYPENAME: type }
    for( let key in keys ) {
      let query = keys[key]
      let checkKey = false

      if ( checkKey )
        if ( !await this.queryBool( `${variable}:HASSUFFIX("${key}")` ) )
          continue

      result[key] = await this.query( variable+':'+key, query )
    }


    // let result = await this.queryJSON( variable )
    // let $type = result.$type
    // if ( result['$type'] ) {
    //   let json = await this.queryJSON( variable+':SUFFIXNAMES' )
    //   let keys = json.items
    //   // console.log("JSON", json)
    //   result = { type }

    // }

    return result
  }

  async queryPrint( variable ) {
    let start1 = randomString()
    let start2 = randomString()
    let start = start1+start2
    let end = randomString()
    let commandResult = await this.command(`PRINT "${start1}"+"${start2}"+(${variable})+"${end}".`)
    let result = commandResult
    let startIndex = result.lastIndexOf( start )
    if ( startIndex == -1 )
      return


    startIndex += start.length
    result = result.substr( startIndex )

    let endIndex = result.indexOf( end )
    result = result.substr( 0, endIndex )
    return result
  }

  async queryBool( variable ) {
    let result = await this.queryPrint( variable )
    return result == 'True'
  }

  async queryJSON( variable ) {
    await this.online()
    let tmp = await this.pathTmp('queryJSON.json')
    await this.command(`WRITEJSON( ${variable}, "${this.toVolume( tmp )}").`)
    let result = fs.readJSON( tmp )
    this.cleanTmp( tmp )
    return result
  }

}

class Kosmonaut extends EventEmitter {
  setMode( mode ) {
    this.mode = mode 
    this.emit('mode', mode )
  }

  async core( search ) {
    let cores = await this.cores()
    let core  
    if ( _.isUndefined( search ) ) 
      core = cores[0]
    else 
      core = _.find( cores, search )

    if ( !core )
      throw new Error('no core available')

    return core
  }

  async cores() {
    if ( !this._cores ) {
      await this.telnet()
      await Promise.fromCallback( cb => this.once('cores', ()=>cb() ) )
    }
    return _.map( this._cores )
  }

  async telnet() {
    const params = {
      host: '127.0.0.1',
      port: 5410,
    }

    if ( !this._telnet ) 
      await Promise.fromCallback( cb => {
        this.setMode('connecting')
        const self = this
        this._socket = net.createConnection(params.port, params.host )
        this._telnet = new TelnetSocket( this._socket)
        this._telnet.on("data", self.onSocketData.bind( self ) )

        process.stdin.on("data", function(buffer) {
          return self._telnet.write(buffer.toString("utf8"))
        })

        this.once('error', cb )
        this.once('mode', () => cb() )
      })
    
    return this._telnet
  }

  async close() {
    if ( this._socket ) {
      this._socket.destroy()
      this._socket.removeAllListeners()
      this._socket = null

      this._telnet.destroy()
    }
    await Promise.delay( 100 )
  }

  onSocketData( data ) {
    data = data.toString('utf8')

    if ( this._core ) 
      this._core.emit('data', data )

    switch( this.mode ) {
      case 'connecting':
        if ( !data.startsWith( SEARCH.connected ) )
          this.emit('error', new Error( 'Bad initial connection' ) )
        this.setMode('menu')
      break

      case 'menu':
        this.coresLoadMenu( data )
      break

      case 'core':

      break

      default:
        console.log( data )
    }
  }

  write( data ) {
    this._socket.write( data )
  }

  coresLoadMenu( data ) {
    this._cores = this._cores || {}

    data.replace( SEARCH.cores, ( match, menuPick, gui, otherTelnets, vessel, cpu, tagname ) => { 
      vessel = _.trim( vessel )
      let name = `${vessel}_${cpu}_${tagname}`
      let core = this._cores[name] || new Core( { menuPick, gui, otherTelnets, vessel, cpu, tagname } )
      Object.defineProperty( core, 'kosmonaut', { enumerable: false, writable: true, value: this } )
      this._cores[name] = core
    } )

    this.emit('cores')
  }

  selectCore( core ) {
    if ( this._core == core )
      return true

    if ( this.mode == 'menu' )  {
      this.write( core.menuPick + '\n' )
      this._core = core
      this.setMode( 'core' )
      return true
    }

    throw new Error('cannot switch core')
  }

  async connectionAtMenu() {
    if ( this.mode == 'menu' ) 
      return this 

    throw new Error('Multiple connections not supported yet.')
  }
}

Kosmonaut.KEYS = require('./src/keys')

module.exports = Kosmonaut