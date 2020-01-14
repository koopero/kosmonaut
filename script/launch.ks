parameter launch_gt0 is 100.
parameter launch_gt1 is 60000.
parameter hdglaunch is 190.
parameter launchRoll is 0.

function launchThrottle {
  return (0.9).
}

function launchSteering {
//	How far through our gravity turn are we? (0..1)
	local gtPct is min(1,max(0, (ship:altitude - launch_gt0) / (launch_gt1 - launch_gt0))).
//	Ideal gravity-turn azimuth (inclination) and facing at present altitude.
	local pitch is arccos(gtPct).

	return heading(hdglaunch, pitch) * r(0,0,launchRoll).
}

function telemetry {
  parameter index is 0.
  parameter key is "anon".
  parameter val is 0.
  parameter col is 10.
  parameter row is 4.
  print "/= "+key+"." AT ( col, row + index * 2 ).
  print val AT ( col, row + index * 2 + 1 ).
}

set vcut to 1200.

// WHEN MAXTHRUST = 0 THEN {
//     PRINT "Staging".
//     STAGE.
//     PRESERVE.
// }.

LOCK THROTTLE TO launchThrottle().
lock steering to launchSteering().

stage.


until SHIP:VELOCITY:SURFACE:MAG >= vcut {
  clearscreen.
  telemetry( 0, "MISSIONTIME", MISSIONTIME ).
  telemetry( 1, "ALTITUDE", ALTITUDE ).

	wait 0.
}






