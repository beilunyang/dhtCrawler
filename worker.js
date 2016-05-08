'use strict';
const Dht = require('./dht');
const config = require('./config');

const dht = new Dht(config.port, config.address);