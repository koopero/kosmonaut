#!/usr/bin/env node

const pkg = require('../package.json')
const program = require('commander')
const _ = require('lodash')
const YAML = require('js-yaml')
const Promise = require('bluebird')

var kosmonaut

program.version(pkg.version)
program.option('--format <format>', 'Output serialization')
program.option('--host', 'kOS host', '127.0.0.1')
program.option('--port', 'kOS port', '5140' )


program.command('query <variable>')
  .action( commandQuery )

program.command('exec <command>')
  .action( commandExec )


program.command('run <script>')
  .action( commandRun )

program.command('load <files...>')
  .action( commandLoad )

program.command('terminal')
  .action( commandTerminal )

program.command('*')
  .action( function () {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args[0]);
    process.exit(1);
  })

program.parse( process.argv )

async function openKosmonaut() {
  kosmonaut = new (require('../index.js'))()
}

async function closeKosmonaut() {
  await kosmonaut.close()
}

function dumpSerialized( result, cmd ) {
  switch( program.format ) {
    case 'yaml':
      console.log( YAML.dump( result ) )
    break

    case 'json':
      console.log( JSON.stringify( result ) )
    break

    default:
      console.dir( result )
    break
  }
  
}

async function commandQuery( variable, cmd ) {
  await openKosmonaut()
  let core = await kosmonaut.core()
  let result = await core.onlineFor( () => core.query( variable ) ).catch( onError )
  await closeKosmonaut()
  dumpSerialized( result, cmd )
  process.exit()
}

async function commandExec( command, cmd ) {
  await openKosmonaut()
  let core = await kosmonaut.core()
  let result = await core.onlineFor( () => core.command( command ) ).catch( onError )
  await closeKosmonaut()
  console.log( result )
  process.exit()
}

async function commandRun( script, cmd ) {
  await openKosmonaut()
  let core = await kosmonaut.core()
  let result = await core.onlineFor( () => core.run( script ) ).catch( onError )
  await closeKosmonaut()
  process.exit()
}

async function commandLoad( files, cmd ) {
  await openKosmonaut()
  let core = await kosmonaut.core()
  await core.onlineFor( () => core.load( files ) ).catch( onError )
}

async function commandTerminal( cmd ) {
  await openKosmonaut()
  let core = await kosmonaut.core()
  await core.online()

  core.on('data', data => process.stdout.write( data ) )
  process.stdin.on('data', data => kosmonaut.write( data ) )
}


function onError( err ) {
  console.error( err )
  process.exit(1)
}