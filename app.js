const util = require('util');
const exec = require('child_process').exec;
const os = require('os');
const rp = require('request-promise');
const fs = require('fs');
const backup = require('./backup.json');

// const LOGGING_API = 'https://prod-analytics.jugnoo.in:8038/saveNetworkStats';
const NUMBER_OF_REQUESTS = 5	;
const BACKUP_PATH = './backup.json';
const LOGGING_API = process.argv[2];

if (!LOGGING_API) {
	return console.log(`Please enter logging API \n  Example - \n node app.js myapi.com:8081/upload`);
}

exec(`ping -c ${NUMBER_OF_REQUESTS} google.com`, function(err, stdout, stderr) {
	if (err) {
		console.log(err);
	}
	
	let logDate = new Date();
	let hostName = os.hostname();
	let ipAddress = os.networkInterfaces()['en0'][1].address;
	
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
		requests : NUMBER_OF_REQUESTS
	};

	console.log(requestBody);

	let options = {
    	method: 'POST',
    	uri: LOGGING_API,
    	body: requestBody ,
    	json: true 
	};

	rp(options).then( (parsedBody) => {
        if (backup.backup.length !== 0) {
			uploadLocalBackup((err, result)=>{
				if (err) console.log(err);
				console.log('Sync to server and cleared locally');

			});
        }
    }).catch( (err) =>  {
    	saveLocalBackup(requestBody, (err, result) => {
    		if (err) console.log(err); 
    		console.log('Saved backup locally')
    	});
    });


});

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