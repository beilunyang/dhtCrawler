'use strict';
const crypto = require('crypto');

//生成离目标节点较近的id。
//nid的高位越接近，nid之间的距离越近
function genNeighborId(target, nid) {
    return Buffer.concat([target.slice(0, 15), nid.slice(15)]);
}

//生成随机nid
function randomId() {
   return crypto.createHash('sha1').update(crypto.randomBytes(20)).digest();
}

//nodes 0-19为id,20-23为ip,24-25为端口
function decodeNodes(nodes) {
    let arr = [];
    const len = nodes.length;
    if (len % 26 !== 0) {
        return arr;
    }
    
    for (let i = 0; i + 26 <= nodes.length; i += 26) {
           arr.push({
              nid: nodes.slice(i, i + 20),
              address: nodes[i + 20] + '.' + nodes[i + 21] + '.' +
                  nodes[i + 22] + '.' + nodes[i + 23],
              port: nodes.readUInt16BE(i + 24)
           });
    }
    
    return arr;
}

module.exports = {
    randomId,
    decodeNodes,
    genNeighborId
}