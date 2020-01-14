const KODE = exports

KODE.telemetry_channel = `
function telemetry_channel {
  parameter index is 0.
  parameter key is "anon".
  parameter val is 0.
  parameter col is 24.
  parameter row is 0.
  print "/= "+key+"." AT ( col, row + index * 2 ).
  print ROUND( val, 4 ) AT ( col, row + index * 2 + 1 ).
}
`