const Kosmonaut = require('../index')

async function run() {
  let kos = new Kosmonaut()
  let core = await kos.core()
  await core.online({ force: true } )
  let telemetry = core.telemetry( {} )

  telemetry.setChannels( {
    alt: 'altitude',
    met: 'missiontime',
    prs: 'SHIP:DYNAMICPRESSURE',
    apo: 'APOAPSIS',
  })
  
  telemetry.on('frame', data => {
    console.log( 'telemetry', data )
  } )

  await telemetry.run( {
    until: '0 > 1',
  })

}

if ( require.main == module ) 
  run()

