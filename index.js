const _ = require('lodash')
const Telnet = require('telnet-client')
const Promise = require('bluebird')
const { TelnetSocket } = require('telnet-stream')
const net = require('net')
const pathlib = require('path')
const fs = require('fs-extra')
const { PassThrough } = require('stream')
const glob = require('glob-promise')
const stripAnsi = require('strip-ansi')

const SEARCH = {
  connected: 'Connected to the kOS Terminal Server.',
  cores: /\[(\d+)\]\s+(yes|no)\s+(\d+)\s+(.*?)\((.*?)\((.*?)\)\)/g,
  isVolume: /^[^C][\d\w]*\:/,
  detaching: /\{Detaching from (.*?)\s+CPU:\s+(.*?)\s+\((.*?)\)\}/,
  objectKeys: require('./src/keys'),
  atMenu: /Terminal: type = .*?, size = \d+x\d+/,
  commandError: /__________________________________________.*?VERBOSE DESCRIPTION[^a-zA-Z]+(.*?)__________________________________________/
}

const EventEmitter = require('eventemitter2')

function randomString( length = 4 ) {
  let mask = 'jebediahkermanJEBEDIAHKERMANBILLBOBVALbillbobval'
  var result = ''
  for (var i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)]
  return result
}


const resolveKSP = pathlib.resolve.bind( null, 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Kerbal Space Program')
const resolveVolume = resolveKSP.bind( null, 'Ships/Script')

const queryTimeout = 1000

class Core extends EventEmitter {
  constructor( props ) {
    super( { 
      wildcard: true
    } )
    _.merge( this, props )
  }

  async online( temporary = false ) {
    if ( !temporary )
      this._shouldBeOnline = true

    if ( !this._online ) {
      this.kosmonaut = await this.kosmonaut.connectionAtMenu()
      this.kosmonaut.selectCore( this )
      await Promise.delay( 200 )
      this._online = true

      if ( !await this.check() ) {
        this._online = false
        throw new Error(`Core failed check trying to go online. Might be busy already.`)
      }

      this.emit('online')
    }

    return this
  }

  async check() {
    try {
      await this.command('PRINT "CHECKED"', { timeout: 1000 } )
      return true
    } catch( err ){
      return false
    }
  }

  async offline() {
    this._shouldBeOnline = false
    if ( this._online )
      this.write('\x04')
  }

  async onlineFor( func ) {
    const marker = {}
    const self = this
    if ( !this._onlineFor )
      this._onlineFor = []

    let onlineFor = this._onlineFor
    onlineFor.push( marker )

    await this.online( true )

    let result = await func( this ).catch( async function ( err ) {
      await cleanup()
      throw err
    })

    cleanup()

    return result

    async function cleanup() {
      let index = onlineFor.indexOf( marker )
      onlineFor.splice( index, 1 )

      if ( !onlineFor.length && !self._shouldBeOnline )
        await self.offline() 
    }
  }

  async volumeIndex() {
    let volume = await this.query('CORE:VOLUME')
    for ( let index = 0; index < 10; index ++ ) {
      let test = await this.query(`VOLUME(${index})`)
      if ( _.isEqual( test, volume ) )
        return index
    }
  }

  async run( script ) {
    let volume = await this.volumeIndex()
    let name = `${volume}:/RUN`+randomString()
    await this.copypath( script, name )
    await this.command( `RUNPATH("${name}").`)
  }

  write( data ) {
    this.kosmonaut.write( data )
  }

  async command( command, options ) {
    let args = arguments

    options = _.merge( {
      safe: false,
      log: false,
    }, options )

    let log = options.log
    if ( log && !_.isFunction( log ) )
      log = process.stdout.write.bind( process.stdout )

    return await this.onlineFor( () => Promise.fromCallback( cb => {
      let stream = this.commandStream.apply( this, args )
      let result = ''


      stream.on('error', err => {
        cleanup()
        if ( options.safe ) 
          cb( null, err ) 
        else 
          cb( err )
      } )
      stream.on('data', data => {
        result += data
        if ( log )
          log( data ) 
      } )
      stream.on('end', () => cleanup() || cb( null, result ) )

      function cleanup() {
        stream.removeAllListeners()
      }
    }))
  }

  commandStream( command, options ) {
    const self = this
    const start1 = randomString()
    const start2 = randomString()
    const start = start1+start2
    const stop1 = randomString()
    const stop2 = randomString()
    const stream = new PassThrough()
    stream.setEncoding('utf8')
    let reading = false
    let ended = false
    let accum = ''
    let timer 

    options = _.merge( {
      timeout: 0,
    }, options )

    if ( options.timeout ) 
      timer = setTimeout( listener.bind( {event:'timeout' } ), options.timeout )

    this.on('*', listener )
    this.write( `PRINT "${start1}"+"${start2}". ${command}. PRINT "${stop1}"+"${stop2}".\r\n` )

    return stream

    function listener( data ) {
      const { event } = this

      // console.log( "COMMANDSTREAM.LISTENER", { event, data })

      if ( Buffer.isBuffer( data ) )
        data = data.toString( 'utf8' )

      if ( data ) 
        accum += data

      let errorMatch = SEARCH.commandError.exec( accum )
      if ( errorMatch ) {
        let error = stripAnsi( _.trim( errorMatch[1] ) )
        cleanup()
        stream.emit('error', new Error(`kOS commaned error: ${error}`)  )
        return
      } 

      switch( event ) {
        case 'detach':
          cleanup()
          stream.emit('error', new Error(`Core detached before command completed`) )
        break

        case 'timeout':
          cleanup()
          stream.emit('error', new Error(`Command timed out`) )
        break

        case 'data':
          if ( !reading ) {
            let index = data.indexOf( start )
            if ( index >= 0 ) {
              reading = true
              data = data.substr( index + start.length + 1 )
            }
          } 
          
          if ( reading ) {
            let index = data.indexOf( stop1 + stop2 )
            if ( index >= 0 ) {
              data = data.substr( 0, index )
              cleanup()
              // console.log( "COMMANDSTREAM.END", { data })

              stream.push( data )
              stream.end()
            } else {
              // console.log( "COMMANDSTREAM.PUSH", { data })

              stream.push( data )
            }
          }
        break
      }
    }

    function cleanup() {
      if ( timer )
        clearTimeout( timer )

      self.off('*', listener )
    }
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
    return await this.onlineFor( async () => {
      let fromTmp = await this.pathTmp( from )
      let toTmp = await this.pathTmp( to )
      if ( fromTmp != from )
        await fs.copy( from, fromTmp )

      let result = await this.command( `COPYPATH("${this.toVolume( fromTmp )}","${this.toVolume( toTmp )}").` )

      if ( toTmp != to )
        await fs.copy( toTmp, to )

      await this.cleanTmp( fromTmp )
      await this.cleanTmp( toTmp )
    })
  }


  async query( variable, keys ) {
    return await this.onlineFor( async () => {
      let type = await this.queryPrint( variable+':TYPENAME' )

      if ( !type ) {
        return null
      }

      if ( type.substr(0,4) == 'List' )
        type = 'List'
      
      switch ( type ) {
        case 'Boolean':
          return await this.queryBool( variable )

        case 'Direction':
        case 'String':
        case 'VolumeFile':
          return await this.queryPrint( variable )

        case 'Scalar':
          return parseFloat( await this.queryPrint( variable ) )

        case 'List':
          let length = await this.query( variable+':LENGTH' )
          let result = []
          for ( let index = 0; index < length; index ++ ) {
            result[index] = await this.query( variable+`[${index}]`)
          }
          return result
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

      return result
    })
  }

  async queryPrint( variable ) {
    return await this.onlineFor( async () => {
      let start1 = randomString()
      let start2 = randomString()
      let start = start1+start2
      let end = randomString()
      let commandResult = await this.command(`PRINT "${start1}"+"${start2}"+(${variable})+"${end}".`, { timeout: queryTimeout })
      let result = commandResult

      let startIndex = result.lastIndexOf( start )
      if ( startIndex == -1 )
        return


      startIndex += start.length
      result = result.substr( startIndex )

      let endIndex = result.indexOf( end )
      result = result.substr( 0, endIndex )
      return result
    })
  }

  async queryBool( variable ) {
    let result = await this.queryPrint( variable )
    return result == 'True'
  }

  async queryJSON( variable ) {
    return await this.onlineFor( async () => {
      let tmp = await this.pathTmp('queryJSON.json')
      await this.command(`WRITEJSON( ${variable}, "${this.toVolume( tmp )}").`)
      let result = fs.readJSON( tmp )
      this.cleanTmp( tmp )
      return result
    })
  }


  async load( files, options ) {
    return await this.onlineFor( async () => {
      let volume = await this.volumeIndex()
      let globs = await Promise.map( files, glob )
      globs = _.flatten( globs )
      globs = _.uniq( globs )
      let copies = globs.map( file => {
        let ext = pathlib.extname( file )
        let base = pathlib.basename( file, ext )
        let tmp = this.tmp
        return [file,`${volume}:/${base}`]
      })

      await Promise.mapSeries( copies, copy => this.copypath( copy[0], copy[1]) )
    })
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
        this._telnet.writeWill( 24 )
        this._telnet.on('sub', (sub, buffer ) => this._telnet.writeSub( 24, Buffer.concat( [Buffer.from([0]),Buffer.from('xterm'),Buffer.from([255,240])] ) )  )
        this._telnet.on("data", self.onSocketData.bind( self ) )
        this._keepalive = setInterval( () => this._telnet.writeCommand( 241 ), 500 )

        // process.stdin.on("data", function(buffer) {
        //   return self._telnet.write(buffer.toString("utf8"))
        // })

        this.once('error', cb )
        this.once('mode', () => cb() )
      })
    
    return this._telnet
  }

  async close() {
    if ( this._socket ) {
      // console.log('CLOSING')
      this._socket.destroy()
      this._socket.removeAllListeners()
      this._socket = null

      this._telnet.destroy()
    }

    if ( this._keepalive ) {
      clearInterval( this._keepalive )
      this._keepalive = null
    }

    await Promise.delay( 100 )
    this.setMode('closed')
  }

  onSocketData( buffer ) {

    let data = buffer.toString('utf8')
    data = data.split('')
    // data = data.map( char => {
    //   let code = char.charCodeAt( 0 )
    //   if ( code == 0 )
    //     return '\n'
    //   if ( code < 15 || code > 127 )
    //     return ''

    //   return char
    // })
    data = data.join('')
    let first = data.charCodeAt( 0 )
    // console.log( { data, buffer, first } )

    

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
        if ( SEARCH.detaching.exec( data ) || SEARCH.atMenu.exec( data ) ) {
          this._core._online = false
          this._core.emit('detach')
          this.close()
        }
      break

      default:
        // console.log( data )
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

    if ( this.mode == 'closed' ) {
      await this.telnet()
      return this
    }

    throw new Error('Multiple connections not supported yet.')
  }
}

Kosmonaut.KEYS = require('./src/keys')

module.exports = Kosmonaut