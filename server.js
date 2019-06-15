var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


app.use(express.static('public'));

app.get('/test', function(req, res){
  res.send("sdfsdf");
});


http.listen(3000, function(){
  console.log('listening on http://localhost:3000/');
});
    



playerCount = 0
gameCount = 0
players = {};
games = {};



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
            console.log(data['id'] + '已登陆');
            var aPlayer = new Player(socket, data['name'], data['id']);
            players[data['id']] = aPlayer;
            console.log('当前玩家数: ' + countAllPlayer());
        }
        else{
            console.log(data['id'] + '重新登陆');
            console.log('当前玩家数: ' + countAllPlayer());
            players[data['id']].play = false;
        }
    });

    socket.on('match', data =>{
        console.log(data['id'] + '正在请求匹配, 当前空闲玩家数: ' + countFreePlayer());
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
                console.log(data['id'] + '匹配: ' + other_id);
                console.log(other_id + '匹配: ' + data['id']);
            }
        }
    });

    // 监听玩家是否退出游戏
    socket.on('mydisconnect', data => {
        if(players[data['id']] != undefined){
            quit(data['id'], 2);
            delete players[data['id']];
            console.log(data['id'] + "退出.");
            console.log('当前玩家数: ' + countAllPlayer());
        }
    });

    socket.on('data', data => {
        if(players[games[data['id']]] != undefined){
            //console.log('已收到' + data['id'] + '的数据, 发往' + games[data['id']]);
            players[games[data['id']]].socket.emit('data', data['layout']);
        }
    });

    socket.on('lose', data => {
        if(players[games[data['id']]] != undefined){
            console.log(data['id'] + '失败, ' + players[games[data['id']]].id + '取得胜利.')
            quit(data['id'], 1);
            delete players[data['id']];
        }
    });

    socket.on('get_line', data => {
        console.log('get!');
        if(players[data['id']] != undefined){
            players[data['id']].line += data['line'];
            console.log(data['id'] + '消去了' + data['line'] + '行, 当前余额: ' + players[data['id']].line + '行.');
            if(players[data['id']].line >= 2){
                if(players[games[data['id']]] != undefined){
                    players[games[data['id']]].socket.emit('add_line');
                }
                players[data['id']].line %= 2;
                console.log(data['id'] + '当前余额: ' + players[data['id']].line + '行.');
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
        console.log('This is test socket event: ');
        console.log(data);
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




