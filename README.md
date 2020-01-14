`kosmonaut` is an interface between [node.js](https://nodejs.org/en/) and the [kOS: Kerbal Operating System](https://ksp-kos.github.io/KOS/) mod for [Kerbal Space Program](https://www.kerbalspaceprogram.com/).

- Run kerboscript programs from the command line or javascript.
- Copying to and from the kOS file system.
- Inspect and query a running kOS core.
- Log telemetry to files and js events.


# Installation

# Getting Started


# Examples 

## Command line one-liners

``` sh
# Stage current vessel.
kosmonaut exec stage.

# Print information about Jool as JSON.
kosmonaut query jool

# Run a script from the current directory.
kosmonaut run launch.ks

# Set timewarp.
kosmonaut exec 'set kuniverse:timewarp:rate to 100'

```

## Telemetry

``` kos
function send_telemetry {
  parameter index is 0.
  parameter key is "anon".
  parameter val is 0.
  parameter col is 10.
  parameter row is 4.
  print "/= "+key+"." AT ( col, row + index * 2 ).
  print val AT ( col, row + index * 2 + 1 ).
}

until 0 > 1 {
  clearscreen.

  send_telemetry( 0, "met", MISSIONTIME ).
  send_telemetry( 1, "alt", ALTITUDE ).

	wait 0.
}
```