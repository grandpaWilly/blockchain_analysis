var express = require('express');
var app = express();
var server = require ('http').createServer(app);
var io = require('socket.io').listen(server);
const pg = require('pg');

const client = new pg.Client('postgres://localhost/tron-explorer');


server.listen(process.env.PORT || 3001);

console.log('Server running on port 3001...');

app.get('/', function(req, res) {
        res.sendFile(__dirname + '/index.html');
});
app.get('/graphFile.json', function(req, res) {
        res.sendFile(__dirname + '/graphFile.json');
});

client.connect((err)=> {
	if(err){
		console.log(err);
	}	
});



io.sockets.on('connection', function(socket){

	function sendLatestBlockNum(){
		client.query('select count(*) from blocks;', (err, results)=> {
	//		console.log("\tSENDING: \t"+results.rows[0].count);
			socket.emit('latest block height', results.rows[0].count);
		});
	}
	sendLatestBlockNum();


	function updateJSON(block) {
		client.query('select * from transactions where (block = '+block+') and (contract_type = 1);', (err, results)=> {
	//	console.log(results);
				
		for (var i = 0; i < results.rows.length; i++){ 
	//		console.log("From: "+results.rows[i].contract_data.from+"\t To: "+results.rows[i].contract_data.to);
					
			var nodes = [
			{id: results.rows[i].contract_data.from, title: results.rows[i].contract_data.from, url: 'https://tronscan.org/#/address/'+results.rows[i].contract_data.from},
			{id: results.rows[i].contract_data.to, title: results.rows[i].contract_data.to,  url: 'https://tronscan.org/#/address/'+results.rows[i].contract_data.to}
			];
			var edges = {from: results.rows[i].contract_data.from, to: results.rows[i].contract_data.to};
		
		//	console.log("sending:\t"+nodes[0]);
			edges[0] = JSON.stringify(edges[0]);
	//		console.log("sending:"+edges);
			socket.emit('update JSON', nodes, edges);
		}
		});
	}

	socket.on('ask block range', function(blockrangeMax){
		console.log("ASKED FOR: \t"+blockrangeMax);
		for (var i = (blockrangeMax - 100); i <= blockrangeMax; i++) { 
		updateJSON(i);
	}
	});


});