const dgram = require('dgram');
const rest = require('restler');
const Firebase = require('firebase');

const config = require('./config');
const ref = new Firebase(config.firebase.url);

var activeUsers, sessions;

const udpserver = dgram.createSocket({ type: "udp4", reuseAddr: true });

var COUNTER = 0;

var parseMapper = {
    '/activity/': activityParser,
    '/security/': securityParser
};

ref.authWithCustomToken(config.firebase.secret).then(function(auth) {

    activeUsers = ref.child('active_users');
    sessions = ref.child('sessions');

    udpserver.on('message', function(message, remote) {
        var msg = message.toString().split(';')
        
        if (parseMapper.hasOwnProperty(msg[0])) {
            parseMapper[msg[0]](msg);
        };
        
    });

});

function activityParser(message) {
    switch (message[1]) {
        case 'Start session':
            ++COUNTER;
            activeUsers.set(COUNTER);
            break;
        case 'Stop session':
            if (COUNTER >= 0) {
                --COUNTER;
                activeUsers.set(COUNTER);
            };
            COUNTER <= 0 ? null : --COUNTER;
            break;
        default:
            break;
    };
};

function securityParser(message) {
    switch (message[1]) {
        case 'Login':
            ipLookup(message[4])
            break;
        default:
            break;
    };
};

function ipLookup(ip) {
    rest.get('http://ip-api.com/json/' + ip).on('complete', function(data) {
        if (data.status === 'success') {
            data.timestamp = Firebase.ServerValue.TIMESTAMP;
            sessions.push(data);
        };
    });
};

udpserver.bind(config.udpserver.port, config.udpserver.host);