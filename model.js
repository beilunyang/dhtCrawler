'use strict';
const mongoose = require('mongoose');
const config = require('./config');

mongoose.connect(config.db);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongodb connect failed'));
db.once('open', console.log.bind(console, 'mongodb connect success'));

const InfoHashSchema = mongoose.Schema({
	info_hash: String
});

const InfoHash = mongoose.model('InfoHash', InfoHashSchema);

exports.saveInfoHash = function (hash) {
	const infoHash = new InfoHash({info_hash: hash});
	infoHash.save(function (err, infoHash) {
		if (err) {
			return console.error('save infohash failed');
		}
		console.log('successfully save infohash: %s', infoHash.info_hash);
	});
}


