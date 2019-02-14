const KEYS = exports 

KEYS.VesselBasic = {
  'NAME':true,
  'BODY': {
    'NAME': true,
  },
  'ISDEAD':true,
  'STATUS':true,
  'TYPE':true,
}

KEYS.Archive = {
  NAME: 1,
  CAPACITY: 1,
  FREESPACE: 1,
}

KEYS.Atmosphere = {
  // 'BODY':1,
  'EXISTS':1,
  'OXYGEN':1,
  'SEALEVELPRESSURE':1,
  'HEIGHT':1,
}

KEYS.Body = {
  'NAME': 1,
  // 'DESCRIPTION': 1,
  'MASS': 1,
  'ALTITUDE':1,
  'HASOCEAN':1,
  'HASSOLIDSURFACE':1,
  'ROTATIONPERIOD':1,
  'RADIUS':1,
  'MU':1,
  'ATM':1,
  'ANGULARVEL':1,
  'SOIRADIUS':1,
  'ROTATIONANGLE':1,
}

KEYS.Core = {
  VESSEL: {
    NAME:1,
  },  
  VOLUME: 1,
  ELEMENT: 1,
  VERSION: 1,
}

KEYS.CraftTemplate = {
  NAME: 1,
  // FILEPATH: 1,
  SUFFIXNAMES: 1,
  DESCRIPTION: 1,
  EDITOR: 1,
  LAUNCHSITE: 1,
  MASS: 1,
  COST: 1,
  PARTCOUNT: 1,
}

KEYS.Engine = {
  UID: 1,
  THRUSTLIMIT: 1,
  MAXTHRUST: 1,
  THRUST: 1,
  AVAILABLETHRUST: 1,
  POSSIBLETHRUST: 1,
  FUELFLOW: 1,
  ISP: 1,
  VACUUMISP: 1,
  SEALEVELISP: 1,
  FLAMEOUT: 1,
  IGNITION: 1,
  ALLOWRESTART: 1,
  ALLOWSHUTDOWN: 1,
  MULTIMODE: 1,
  HASGIMBAL: 1,
  // MODES: 1,
  // MODE: 1,
}

KEYS.LocalVolume = {
  CAPACITY: 1,
  FREESPACE: 1,
  NAME: 1,
}

KEYS.Orbit = {
  BODY: { NAME: 1 },
  PERIOD: 1,
  INCLINATION: 1,
  ECCENTRICITY: 1,
  SEMIMAJORAXIS: 1,
  SEMIMINORAXIS: 1,
  LAN: 1,
  LONGITUDEOFASCENDINGNODE: 1,
  ARGUMENTOFPERIAPSIS: 1,
  TRUEANOMALY: 1,
  MEANANOMALYATEPOCH: 1,
  EPOCH: 1,
  TRANSITION: 1,
  POSITION: 1,
  VELOCITY: 1,
  // NEXTPATCH: 1,
  // NEXTPATCHETA: 1,
}

KEYS.OrbitableVelocity = {
  ORBIT: 1,
  SURFACE: 1,
}

KEYS.Stage = {
  READY: 1,
  NUMBER: 1,
  RESOURCES: 1,
  NEXTDECOUPLER: 1,
}

KEYS.Vector = {
  'X':true,
  'Y':true,
  'Z':true,
}
KEYS.VesselSensors = {
  'ACC':true,
  'PRES':true,
  'TEMP':true,
  'GRAV':true,
  'LIGHT':true,
}


KEYS.Vessel = {
  'HEADING':true,
  'MAXTHRUST':true,
  'AVAILABLETHRUST':true,
  'FACING':true,
  'BEARING':true,
  'MASS':true,
  'WETMASS':true,
  'DRYMASS':true,
  'DYNAMICPRESSURE':true,
  'VERTICALSPEED':true,
  'GROUNDSPEED':true,
  'AIRSPEED':true,
  'ANGULARMOMENTUM':true,
  'ANGULARVEL':true,
  'SENSORS':true,
  'LOADED':true,
  'UNPACKED':true,
  'LOADDISTANCE':true,
  'PATCHES':true,
  'ROOTPART':true,
  'CONTROLPART':true,
  'DOCKINGPORTS':true,
  'CREWCAPACITY':true,
}

KEYS.Version= {
  MAJOR: 1,
  MINOR: 1,
  PATCH: 1
}