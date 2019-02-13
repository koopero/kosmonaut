const Kosmonaut = require('../index')
const resolveMod = require('path').resolve.bind( null, __dirname, '..' )

describe('connection', () => {

  it('will create telnet connection', async () => {

    let kos = new Kosmonaut()

    await kos.telnet()
    await kos.close()
  })  

  it('will list cores', async () => {
    const kos = new Kosmonaut()
    console.log( await kos.cores() )
    kos.close()
  })

  it('will connect to core', async () => {
    const kos = new Kosmonaut()
    let core = await kos.core()
    await core.online()
    await kos.close()
  })

  xit('will move path', async () => {
    const kos = new Kosmonaut()
    const core = await kos.core()
    await core.online()
    await core.copypath( resolveMod('script/status.ks'), '0:/GOTIME')
    await core.command('SWITCH TO 0.')
    await core.command('RUN GOTIME.')
    await core.offline()   
  })

  it('will query', async () => {
    const kos = new Kosmonaut()
    const core = await kos.core()
    await core.online()    
    // let result = await core.query('SHIP', Kosmonaut.KEYS.VesselBasic )
    let result = await core.query('BODY' )
    console.log( result )
  })
})