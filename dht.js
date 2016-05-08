'use strict';
const bencode = require('bencode');
const crypto = require('crypto');
const dgram = require('dgram');
//配置文件
const config = require('./config');
//工具函数
const utils = require('./utils');
//mongodb相关
const model = require('./model');

class Dht {
    constructor (port, address) {
        this.address = address;
        this.port = port;
        this.id = utils.randomId();
        //路由表
        this.nodesList = [];

        this.socket = dgram.createSocket('udp4');   
        this.socket.on('error', (err) => {
            console.error(`socket error:\n${err.stack}`);
            this.socket.close();
        });
        this.socket.on('message', (packet, rinfo) => this.onMessage(packet, rinfo));
        this.socket.once('listening', () => this.start());

        if (this.address) {
            this.socket.bind(this.port, this.address);
        } else {
            this.socket.bind(this.port);
        }

    }

    start() {
        process.on('exit', (code) => console.log(`dht process is exited...exit code: ${code}`));

        if (this.nodesList.length !== 0) {
            this.findNodesList();
        } else {
            this.joinDht();
            setInterval(() => {
                if (this.nodesList.length === 0) {
                    
                    return this.joinDht();
                }
                this.findNodesList();
            }, config.cycleTimes);
        }
    }
    
    //加入dht网络
    joinDht() {
        const superNodes = config.superNodes;
        superNodes.forEach((v) => this.findNode(v));
    }

    //像路由表中的节点发送请求
    findNodesList() {
        this.nodesList.forEach((node) => this.findNode(node, node.nid));
        this.nodesList = [];
    }
    
    //请求
    request(msg, target) {
        const address = target.address;
        const port = target.port;
        const packet = bencode.encode(msg);
        const len = packet.length;
        this.socket.send(packet, 0, len, port, address);
    }
    
    //响应
    response(r, t, rinfo) {
        const packet = bencode.encode({
            t,
            r,
            y: 'r'
        });
        const len = packet.length;
        const address = rinfo.address;
        const port = rinfo.port;
        if (port < 1 || port > 65535) {
            console.log('port is invalid');
            return ;
        }

        this.socket.send(packet, 0, len, port, address);
    }
    
    //处理消息(request消息和response消息)
    onMessage(packet, rinfo) {
        // decode后的msg内容为Buffer
        try{
            var msg = bencode.decode(packet);
        }catch (e) {
            console.error('decode error');
            return ;
        }

        if (msg.y) {
            var y = msg.y.toString();
        }
        
        //过滤不符合协议的查询
        if (!msg.t) {
            return console.log('t is required!');
        }
        
        if (!y || y.length !== 1) {
            return console.log('y is required!');
        }
        
        if (y === 'e') {
            return console.log('can not process e!');
        }
        
        if (y === 'q') {
            if (!msg.a) {
                return console.log('a is required!');
            }

            if (!msg.a.id || msg.a.id.length !== 20) {
                return console.log('id is required!');
            }

            if (msg.q) {
                var q = msg.q.toString();
            } else {
                return ;
            }
            
            //处理不同类型的查询
            switch (q) {
                case 'ping':
                    this.toPing(msg, rinfo);
                    break;
                case 'find_node':
                    this.toFindNode(msg, rinfo);
                    break;
                case 'get_peers':
                    this.toGetPeers(msg, rinfo);
                    break;
                case 'annouce_peer':
                    this.toAnnouncePeer(msg, rinfo);
                    break;
                default:
                    console.log('q is unknown');
            }
            
        }
        
        //处理我方findNode后对方的回复
        if (y === 'r') {
            if (msg.r.nodes) {
                var nodes = utils.decodeNodes(msg.r.nodes);
            } else {
                return ;
            }
            
            const len = nodes.length;
            if (len !== 0) {
                for (let i = 0; i < len; i++) {
                    //将node加入路由表
                    let node = nodes[i];
                    if (node.port < 1 || node.port > 65535) {
                        console.log('port is invalid');
                        continue;
                    }
                    this.nodesList.push({
                        nid: node.nid,
                        address: node.address,
                        port: node.port
                    });
                }
            }

        }
        
        
    }
    
    //响应ping查询
    toPing(msg, rinfo) {
        const r = {
            id: this.id
        };    
        this.response(r, msg.t, rinfo);
    }
    
    //响应findNode查询
    toFindNode(msg, rinfo) {
        const r = {
            id: this.id,
            nodes: ''
        };
        this.response(r, msg.t, rinfo);
    }
    
    //响应getPeer查询
    toGetPeers(msg, rinfo) {
        if (msg.a && msg.a.info_hash && msg.a.info_hash.length === 20) {
            var infohash = msg.a.info_hash;
            model.saveInfoHash(infohash.toString('hex'));
        } else {
          return ;  
        } 

        const r = {
            id: utils.genNeighborId(infohash, this.id),
            token: crypto.randomBytes(4),
            nodes: ''
        };
        this.response(r, msg.t, rinfo);
    }
    
    //响应annoucePeer查询
    toAnnouncePeer(msg, rinfo) {
        if (msg.a && msg.a.info_hash && msg.a.info_hash.length === 20) {
            model.saveInfoHash(msg.a.info_hash.toString('hex'));
        } else {
            return ;
        }

        const r = {
            id: this.id
        };

        this.response(r, msg.t, rinfo);
    }
    
    //发送findNode查询
    findNode(target, nid) {
        //生成离目标节点较近的id
        const id = nid != undefined ? utils.genNeighborId(nid, this.id) : this.id;
        const msg = {
            t: crypto.randomBytes(2),
            y: 'q',
            q: 'find_node',
            a: {
                id,
                target: utils.randomId()
            }
        };
        
        this.request(msg, target); 
    }
      
}

module.exports = Dht;
