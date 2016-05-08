module.exports = {
    address: '0.0.0.0',
    port: 2555,
    superNodes: [{
    	address: 'router.utorrent.com',
    	port: 6881
    }, {
    	address: 'router.bittorrent.com',	
    	port: 6881
    }, {
    	address: 'dht.transmissionbt.com',
    	port: 6881
    }],
    db: 'mongodb://localhost/dht',
    // request周期，越小越快，单位ms
    cycleTimes: 0

}