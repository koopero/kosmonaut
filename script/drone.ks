// WAIT UNTIL SHIP:AIRSPEED > 100.
// LOCK STEERING TO HEADING( 90, 10 ).

// WAIT UNTIL VERTICALSPEED > 10.

// GEAR OFF.

// WAIT UNTIL SHIP:ALTITUDE > 10000.

// LOCK STEERING TO HEADING( 90, 2 ).
function roll_for {
  parameter ves.
  
  if vang(ship:facing:vector,ship:up:vector) < 0.2 { //this is the dead zone for roll when the ship is vertical
    return 0.
  } else {
    local raw is vang(vxcl(ship:facing:vector,ship:up:vector), ves:facing:starvector).
    if vang(ves:up:vector, ves:facing:topvector) > 90 {
      if raw > 90 {
        return 270 - raw.
      } else {
        return -90 - raw.
      }
    } else {
      return raw - 90.
    }
  } 
}.

function east_for {
  parameter ves.

  return vcrs(ves:up:vector, ves:north:vector).
}

function compass_for {
  parameter ves.

  local pointing is ves:facing:forevector.
  local east is east_for(ves).

  local trig_x is vdot(ves:north:vector, pointing).
  local trig_y is vdot(east, pointing).

  local result is arctan2(trig_y, trig_x).

  if result < 0 { 
    return 360 + result.
  } else {
    return result.
  }
}


STAGE.
// BRAKES ON.
// LOCK THROTTLE TO 1.

SET runway_alt TO 70.


SET ap_mode TO "taxi".
SET ap_autothrust TO 0.
SET ap_stop TO 0.
SET ap_altitude TO 14000.
SET ap_vspeed_max TO 100.
SET ap_pitch_max TO 30.
SET ap_roll_max TO 30.


SET ap_speed TO 500.
SET ap_throttle TO 0.
SET ap_vspeed TO 0.
SET ap_pitch TO 0.
SET ap_heading TO 85.
SET ap_roll TO 0.


SET pid_throttle TO PIDLOOP( 0.01, 0.001, 0.005, -1, 1 ).
SET pid_pitch TO PIDLOOP( 0.03, 0.001, 0.001, -4, 4 ).
SET pid_vspeed TO PIDLOOP( 0.001, 0.0, 0.005, -3, 3 ).
SET pid_alt TO PIDLOOP( 0.001, 0.0006, 0.0006, -2, 2 ).
SET pid_roll TO PIDLOOP( 0.01, 0.0, 0.0, -1, 1 ).
SET pid_heading TO PIDLOOP( 0.01, 0.0, 0.0, -1, 1 ).



LOCK real_pitch TO 90 - vectorangle(UP:FOREVECTOR, FACING:FOREVECTOR).
LOCK real_roll TO roll_for(ship).
LOCK real_heading TO compass_for(ship).

UNTIL ap_stop {

  IF ap_mode = "taxi" {
    IF ap_speed <= 0 {
      BRAKES ON.
      UNLOCK THROTTLE.
    } else {
      BRAKES OFF.
    } 

    IF ap_speed > 50 {
      SET ap_mode TO "takeoff".
    }
  }

  IF ap_mode = "takeoff" {
    IF GROUNDSPEED < 100 {
      SET ap_pitch TO real_pitch.
    } else {
      SET ap_pitch TO 10.
    }

    IF ALT:RADAR > 100 {
      GEAR OFF.
      SET ap_mode TO "cruise".
    }
  }

  SET heading_dif TO MOD(ap_heading - real_heading + 180 + 360, 360 ) - 180.

  IF ALT:RADAR > 100 {
    GEAR OFF.
    SET ap_roll TO MAX( -ap_roll_max, MIN( ap_roll_max, heading_dif * 0.1 ) ).

  } else {
    GEAR ON.
    SET ap_roll TO 0.
  }

    // SET ap_roll TO 0.



  IF ap_mode = "cruise" {
    SET ap_vspeed TO MAX( -ap_vspeed_max, MIN( ap_vspeed_max,( ap_altitude - ALTITUDE ) / 10 ) ).
    SET pid_vspeed:SETPOINT TO ap_vspeed.
    SET ap_pitch TO MAX( -ap_pitch_max, MIN( ap_pitch_max, ap_pitch + pid_vspeed:UPDATE( TIME:SECONDS, VERTICALSPEED ))).
  }

  SET pid_throttle:SETPOINT TO ap_speed.
  SET ap_throttle TO MAX( 0, MIN( 1, ap_throttle + pid_throttle:UPDATE( TIME:SECONDS, GROUNDSPEED ) ) ).
  SET ap_toheading TO 90.


  SET pid_pitch:SETPOINT TO ap_pitch.
  SET pid_alt:SETPOINT TO ap_altitude.
  SET pid_roll:SETPOINT TO ap_roll.
  


  SET SHIP:CONTROL:MAINTHROTTLE TO ap_throttle.
  SET SHIP:CONTROL:PITCH TO pid_pitch:UPDATE(TIME:SECONDS, real_pitch ) / SQRT(AIRSPEED) * 10.0.
  SET SHIP:CONTROL:ROLL TO pid_roll:UPDATE(TIME:SECONDS, real_roll ) / SQRT(AIRSPEED) * 30.0.
  SET SHIP:CONTROL:YAW TO 0.



  // Dump Status
  CLEARSCREEN.
  SET _r TO 1.
  PRINT "mode   " AT ( 1, _r ).
  PRINT ap_mode AT ( 10, _r ).
  SET _r TO _r+1.

  PRINT "heading " AT ( 1, _r ).
  PRINT ROUND( real_heading, 2 ) AT ( 10, _r ).
  PRINT ROUND( ap_heading, 2 ) AT ( 20, _r ).
  PRINT ROUND( heading_dif, 2 ) AT ( 30, _r ).

  SET _r TO _r+1.


  PRINT "gspeed " AT ( 1, _r ).
  PRINT ROUND( GROUNDSPEED, 2 ) AT ( 10, _r ).
  PRINT ROUND( ap_speed, 2 ) AT ( 20, _r ).
  SET _r TO _r+1.


  PRINT "alt    " AT ( 1, _r ).
  PRINT ROUND( ALTITUDE ) AT ( 10, _r ).
  PRINT ROUND( ap_altitude ) AT ( 20, _r ).
  SET _r TO _r+1.


  PRINT "pitch  " AT ( 1, _r ).
  PRINT ROUND( real_pitch, 2 ) AT ( 10, _r ).
  PRINT ROUND( ap_pitch, 2 ) AT ( 20, _r ).
  SET _r TO _r+1.

  PRINT "roll  " AT ( 1, _r ).
  PRINT ROUND( real_roll, 2 ) AT ( 10, _r ).
  PRINT ROUND( ap_roll, 2 ) AT ( 20, _r ).
  SET _r TO _r+1.



  PRINT "vspeed  " AT ( 1, _r ).
  PRINT ROUND( VERTICALSPEED, 2 ) AT ( 10, _r ).
  PRINT ROUND( ap_vspeed, 2 ) AT ( 20, _r ).
  SET _r TO _r+1.

  // PRINT ap_pitch AT ( 20, 5 ).

  // SET ap_stop TO 1.

  // SET ap_steer TO ANGLEAXIS( ap_roll, HEADING( ap_toheading, ap_pitch ) ).
  // LOCK STEERING TO ap_steer.
  WAIT 0.05.
}
