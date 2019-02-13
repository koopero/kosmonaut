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