# net-packet-loss-monitor

A NodeJS module providing methods for measuring local packet loss of your connection. 

`NOTE : Works on MAC OS X for now`

## Install : 

``npm install net-packet-loss-monitor -g ``

## Usage:


``nplm <remote-url>``

If the remote-url throws error the logs will be saved locally. 

## Logging Object : 

``
{ 
  logDate: 2017-04-07T10:03:28.805Z,
  hostName: 'Soc-macmini.local',
  ipAddress: '192.168.3.18',
  packetLoss: '0.0',
  packetTransmitted: '10',
  packetReceived: '10',
  requests: 10,
  version: '1.0.4',
  ssid: 'Boss',
  bssid: undefined,
  signal_level: -54,
  channel: 44 
  }

``