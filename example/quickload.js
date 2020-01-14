const Kosmonaut = require('../index')

async function run() {
  let kos = new Kosmonaut()
  await kos.quickload()
  
}

if ( require.main == module ) 
  run()
