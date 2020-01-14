const Kosmonaut = require('../index')

async function run() {
  let kos = new Kosmonaut( { log: true } )
  let core = await kos.core( {} )
  let loop = core.loop( {
    start: true,
    program: 'PRINT ALTITUDE AT ( 32, 3 ).',
    telemetry: [
      'altitude'
    ]
  } )
}

if ( require.main == module ) 
  run()

