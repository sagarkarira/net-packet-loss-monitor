
/*	
	Date : 7-4-2017
	Author : sagar.karira@mail.jugnoo.in	
*/


'use strict';

const util = require('util');
const exec = require('child_process').exec;
const os = require('os');
const rp = require('request-promise');
const fs = require('fs');
const path = require('path');

const backup = require(path.join(__dirname,'../backup.json'));
const packageInfo = require(path.join(__dirname,'../package.json'));


const GET_CURRENT_WIFI = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport --getinfo';
const NUMBER_OF_REQUESTS = 1;
const BACKUP_PATH = path.join(__dirname, '../backup.json');
const LOGGING_API = process.argv[2];
const TIMEOUT_INTERVAL = 2; //in minutes

exports.main = main;
exports.TIMEOUT_INTERVAL = TIMEOUT_INTERVAL;


function main() {
	console.log('Logging packet loss');
	if (!LOGGING_API) {
		return console.log(`Please enter logging API \n  Example - \n nplm myapi.com:8081/upload`);	
		exit(1);
	}

	exec(`ping -c ${NUMBER_OF_REQUESTS} google.com`, function(err, stdout, stderr) {
		if (err) {
			console.log('not connected to network')
			return console.log(err);
		}
		
		let logDate = new Date();
		let hostName = os.hostname();
		let platform = os.platform();
		let ipAddress = getIPAddress();
		
		let packetLossIndex = stdout.indexOf('packet loss' );
		let packetTransmittedIndex = stdout.indexOf('packets transmitted');
		let packetReceivedIndex = stdout.indexOf('packets received');


		let packetLoss = stdout.slice(packetLossIndex-6, packetLossIndex-2);
		let packetTransmitted = stdout.slice(packetTransmittedIndex-3, packetTransmittedIndex);
		let packetReceived = stdout.slice(packetReceivedIndex-3, packetReceivedIndex);

		let requestBody = {
			logDate : logDate, 
			hostName : hostName, 
			ipAddress : ipAddress, 
			packetLoss : packetLoss.trim(), 
			packetTransmitted : packetTransmitted.trim(), 
			packetReceived : packetReceived.trim(), 
			requests : NUMBER_OF_REQUESTS, 
			version : packageInfo.version
		};


		let options = {
	    	method: 'POST',
	    	uri: LOGGING_API,
	    	body: requestBody ,
	    	json: true 
		};

		findCurrentWifiStats((err, result)=>{
			if (err) {
				console.log(err);
			}
			requestBody.ssid = result.ssid || undefined;
			requestBody.bssid = result.mac|| undefined;
			requestBody.signal_level = result.signal_level || undefined;
			requestBody.channel = result.frequency || undefined;
			let options = {
		    	method: 'POST',
		    	uri: LOGGING_API,
		    	body: requestBody ,
		    	json: true 
			};
			console.log(requestBody);

			rp(options).then( (parsedBody) => {
	        	if (backup.backup.length !== 0) {
					uploadLocalBackup((err, result)=>{
						if (err) console.log(err);
						console.log('Sync to server and cleared locally');
					});
	        	}
	        	console.log('Uploaded to server');
	    	}).catch( (err) => {
	    		console.log(`Can't upload to server. Saving locally.`);
	    		saveBackupLocally(requestBody, (err, result) => {
	    			if (err) console.log(err); 
	    			console.log('Saved backup locally')
	    		});
	    	});
		});
	});
}


function findCurrentWifiStats(callback) {

	exec(GET_CURRENT_WIFI, (err, stdout, stderr)=>{
		if (err) {
			console.log('Not connected to any wifi or connected to lan');
			return callback(null, {} );
		}
		let lines = stdout.split('\n');
	    let connection = {};
	    lines.forEach(function (line) {
	        if (line.match(/[ ]*agrCtlRSSI: (.*)/)) {
	            connection.signal_level = parseInt(line.match(/[ ]*agrCtlRSSI: (.*)/)[1]);
	        } else if (line.match(/[ ]*BSSID: ([a-zA-Z0-1:]*)/)) {
	            connection.mac = line.match(/[ ]*BSSID: ([0-9A-Fa-f:]*)/)[1];
	        } else if (line.match(/[ ]*SSID: (.*)/)) {
	            connection.ssid = line.match(/[ ]*SSID: (.*)/)[1];
	        } else if (line.match(/[ ]*link auth: (.*)/)) {
	            connection.security = line.match(/[ ]*link auth: (.*)/)[1];
	        } else if (line.match(/[ ]*channel: ([a-zA-Z0-1:]*)/)) {
	        	connection.frequency = line.match(/[ ]*channel: ([0-9A-Fa-f:]*)/)[1];
	        }
	    });
	   	return callback(null, connection);
	});
}

function uploadLocalBackup(callback) {
	let backupData = backup.backup;
	for (let i in backupData ) {
		let options = {
    		method: 'POST',
    		uri: LOGGING_API,
    		body: backupData[i] ,
    		json: true 
		};
		rp(options);			// TODO : error handle when uploading backup too. 
	}

	let newBackupData = {
		backup : []
	};

	fs.writeFile(BACKUP_PATH, JSON.stringify(newBackupData, null, 4), (err)=> {
		if (err) {
			return callback(err);
		}
		callback();
	});
}


function saveBackupLocally(requestBody, callback) {
	
	let backupData = backup.backup;
	let arr = [];
	for (let i in backupData ) {
		arr.push(backupData[i]);
	}
	arr.push(requestBody);
	let newBackupData = {
		backup : arr
	};
	fs.writeFile(BACKUP_PATH, JSON.stringify(newBackupData, null, 4), function(err) {
		if (err) {
			return callback(err);
		}
		callback();
	}); 
}


function getIPAddress() {
	let ifaces = os.networkInterfaces();
	let final = '';
	Object.keys(ifaces).forEach(function (ifname) {
  	let alias = 0;
	ifaces[ifname].forEach(function (iface) {
	    if ('IPv4' !== iface.family || iface.internal !== false) {
	      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
	      return;
	    }

	    if (alias >= 1) {
	      // this single interface has multiple ipv4 addresses
	      final =  iface.address;
	    } else {
	      // this interface has only one ipv4 adress
	      final =  iface.address;
	    }
	    ++alias;
	  });

	});
	return final;
}
