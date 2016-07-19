'use strict';
const mongoose = require('mongoose');
const config = require('./config');

mongoose.connect(config.db);
const db = mongoose.connection;
db.on('error', () => console.log('mongodb connect fail'));
db.once('open', () => console.log('mongodb connect success'));

const InfoHashSchema = mongoose.Schema({
	info_hash: String
});

InfoHashSchema.index({info_hash: 1}, {unique: true});

const InfoHash = mongoose.model('InfoHash', InfoHashSchema);

exports.saveInfoHash = function (hash) {
	const infoHash = new InfoHash({info_hash: hash});
	infoHash.save((err, infoHash) => {
		if (err) {
			return console.error('save infohash failed');
		}
		console.log('successfully save infohash: %s', infoHash.info_hash);
	});
}


