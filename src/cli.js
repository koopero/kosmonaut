#!/usr/bin/env node

const pkg = require('../package.json')
const program = require('commander')
const _ = require('lodash')

var kosmonaut

program.version(pkg.version)
program.option('--format', 'Output serialization', /^(json|yaml)$/, 'yaml')
program.option('--host', 'kOS host', '127.0.0.1')
program.option('--port', 'kOS port', '5140' )


program.command('query <variable>')
  .action( commandQuery )

program.command('run <command>')
  .action( commandRun )


program.parse( process.argv )

async function openKosmonaut() {
  kosmonaut = new (require('../index'))()
}

async function closeKosmonaut() {
  await kosmonaut.close()
}

function dumpSerialized( result ) {
  console.dir( result )
}

async function commandQuery( variable, cmd ) {
  await openKosmonaut()
  let core = await kosmonaut.core()
  await core.online()
  let result = await core.query( variable )
  await closeKosmonaut()
  dumpSerialized( result )
  process.exit()
}

async function commandRun( command, cmd ) {
  await openKosmonaut()
  let core = await kosmonaut.core()
  await core.online()
  let result = await core.command( command )
  await closeKosmonaut()
  console.log( result )
  process.exit()
}


