const EventEmitter = require('eventemitter2')
const _ = require('lodash')

class Base extends EventEmitter {
  constructor() {
    super( { 
      wildcard: true
    } )
  }

  hideProps( props ) {
    _.map( props, ( value, key ) => Object.defineProperty( this, key, { value, enumerable: false }))
  }
}

module.exports = Base