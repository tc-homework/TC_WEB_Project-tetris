var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require("fs");
var sd = require('silly-datetime');

app.use(express.static('public'));

app.get('/test', function(req, res){
  res.send("This is test infomation!\n");
});

app.get('/log/:day', function(req, res){
    var day = req.params.day;
    fs.readFile('log/' + day, (err, data) => {
        if(err){
            res.send("Failed to read log file!");
        }
        else{
            res.send('<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>log: ' + day + '</title></head><body>' + data.toString() + '</body></html>');                                       
        }
    });
});

app.get('/log', function(req, res){
    fs.readdir("log/", function(err, files){
        if(err){
            res.send("Failed to read log file!");
        }
        else{
            links = "";
            files.reverse();
            files.forEach(function(filename){
                links += '<a href=\"log/' + filename + '\">' + filename + '</a><br>';
            });
            res.send('<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>logs</title></head><body>' + links + '</body></html>');                                       
        }
    });
});

app.get('/log/today', function(req, res){
    var todayLog = 'log/' + sd.format(new Date(), 'YYYY-MM-DD') + '.log';
    fs.readFile(todayLog, (err, data) => {
        if(err){
            res.send("Failed to read log file!");
        }
        else{
            res.send('<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>log: today</title></head><body>' + data.toString() + '</body></html>');                                       
        }
    });
});



http.listen(80, function(){
  console.log('listening on http://localhost:80/');
});
    



playerCount = 0
gameCount = 0
players = {};
games = {};

logsCache = [];


function log(str, type="UNTYPE"){
    today = sd.format(new Date(), 'YYYY-MM-DD');
    nowtime = sd.format(new Date(), 'HH:mm:ss');
    thelog = today + ' ' + nowtime + '  ['  + type + ']  ' + str;
    logsCache.push(thelog);
    if(logsCache.length > 20){
        var strToWrite = ""
        logsCache.forEach(log =>{
            strToWrite += (log + '\n');
        });
        console.log(logsCache);
        fs.appendFile('log/' + today + '.log', strToWrite, 'utf8', err => {
            if(err){
                console.log("ERROR: Write log failed!");
            }
            else{
                logsCache = [];
            }
        });
    }
};



function Player(socket, name, id){
    this.socket = socket;
    this.name = name;
    this.id = id;
    this.play = false;
    this.line = 0;
}

//var socket = io.connect();
io.on('connection', socket => {
    socket.removeAllListeners();
    socket.on('login', data => {
        if(players[data['id']] == undefined){
            log(data['id'] + '已登陆', 'LOGIN');
            var aPlayer = new Player(socket, data['name'], data['id']);
            players[data['id']] = aPlayer;
            log('当前玩家数: ' + countAllPlayer(), 'PLAYER');
        }
        else{
            log(data['id'] + '重新登陆', 'LOGIN');
            log('当前玩家数: ' + countAllPlayer(), 'PLAYER');
            players[data['id']].play = false;
        }
    });

    socket.on('match', data =>{
        log(data['id'] + '正在请求匹配, 当前空闲玩家数: ' + countFreePlayer(), 'MATCH');
        if(players[data['id']].play == true){quit(data['id']);}
        if(countAllPlayer() >= 2){
            if(countFreePlayer() > 1){
                let other_id = getAFreePlayer(data['id']);
                players[data['id']].play = true;
                players[other_id].play = true;
                players[data['id']].line = 0;
                players[other_id].line = 0;
                games[data['id']] = other_id;
                games[other_id] = data['id'];
                players[data['id']].socket.emit('match_success', players[other_id].name);
                players[other_id].socket.emit('match_success', players[data['id']].name);
                log(data['id'] + ' 匹配 ' + other_id, 'MATCH');
                log(other_id + ' 匹配 ' + data['id'], 'MATCH');
            }
        }
    });

    // 监听玩家是否退出游戏
    socket.on('mydisconnect', data => {
        if(players[data['id']] != undefined){
            quit(data['id'], 2);
            delete players[data['id']];
            log(data['id'] + "退出.", 'QUIT');
            log('当前玩家数: ' + countAllPlayer(), 'PLAYERS');
        }
    });

    socket.on('data', data => {
        if(players[games[data['id']]] != undefined){
            //log('已收到' + data['id'] + '的数据, 发往' + games[data['id']], 'DATA');
            players[games[data['id']]].socket.emit('data', data['layout']);
        }
    });

    socket.on('lose', data => {
        if(players[games[data['id']]] != undefined){
            log(data['id'] + '失败, ' + players[games[data['id']]].id + '取得胜利.', 'WIN')
            quit(data['id'], 1);
            delete players[data['id']];
        }
    });

    socket.on('get_line', data => {
        if(players[data['id']] != undefined){
            players[data['id']].line += data['line'];
            log(data['id'] + '消去了' + data['line'] + '行, 当前余额: ' + players[data['id']].line + '行.', 'LINE');
            if(players[data['id']].line >= 2){
                if(players[games[data['id']]] != undefined){
                    while(players[data['id']].line >= 2){
                        players[games[data['id']]].socket.emit('add_line');
                        players[data['id']].line -= 2;
                    }
                }
                log(data['id'] + '当前余额: ' + players[data['id']].line + '行.', 'LINE');
            }
        }
    });

    socket.on('score', data =>{
        if(players[data['id']] != undefined){
            if(players[games[data['id']]] != undefined){
                players[games[data['id']]].socket.emit('score', data['score']);
            }
        }
    });

    socket.on('test', data => {
        log('This is test socket event: ', 'TEST');
        log(data.toString(), 'TEST');
    });
});




function quit(id, why){
    if(games[id] != undefined){
        other_id = games[id];
        if(games[other_id] != undefined){
            delete games[other_id];
        }
        if(players[other_id] != undefined){
            if(why == 1){
                players[other_id].socket.emit('win');
            }
            else{
                players[other_id].socket.emit('tk');
            }
            players[other_id].play = false;
            players[other_id].line = 0;
        }
        delete games[id];
    }
    if(players[id] != undefined){
        players[id].play = false;
        players[id].line = false;
    }
}


function countAllPlayer(){
    var playerCount = 0;
    for(var key in players){
         playerCount++;
    }
    return playerCount;
}

function countFreePlayer(){
    var playerCount = 0;
    for(var key in players){
        if(players[key].play == false){ playerCount++; }
    }
    return playerCount;
}

function getAFreePlayer(out){
    freeIdList = [];
    for(var key in players){
        if(key != out && players[key].play == false){freeIdList.push(key);}
    }
    var index = ~~(Math.random() * freeIdList.length);
    return freeIdList[index];
}




