;(function() {
	var a = [ [4, 14], [4, 6, 4], [0, 14, 4], [4, 12, 4] ];		// ┴,   ├, ┬, ┤
	var b = [ [4, 4, 6], [0, 14, 8], [12, 4, 4], [2, 14] ];		// ┘, ┌───, ┐, ──┘
	var c = [ [4, 4, 12], [8, 14], [6, 4, 4], [0, 14, 2] ];		// 与上一个左右镜像
	var d = [ [6, 6] ];											// 方块
	var e = [ [12, 6], [4, 12, 8] ];							// z, 竖起来的z
	var f = [ [6, 12], [4, 6, 2] ];								// 上一个左右镜像
	var g = [ [4, 4, 4, 4], [0, 15] ];							// |, ───

	var tiles = [a, b, c, d, e, f, g, a, b, c, d, e, f, g];

	var Tetris = function(w, h, t) {
		this.w = w || 10;
		this.h = h || 20;
		this.t = t || 500;
		this._init();
	};

	Tetris.prototype = {
        constructor: Tetris,
        
		_init: function() {
			var self = this;
			this._translateX = ~~(this.w / 2) - 1; // 每个方块放置的最左侧的坐标
			this.layout = fill(new Array(this.h), 0); //  map, 每项展开为二进制是该行方块情况
            // 变换, 得到每个方块在state上的真实初始位置
            this.tiles = tiles.map(some_tiles => some_tiles.map(a_tile => a_tile.map(n => n << self._translateX )));
			this.tiles;
			this.totalScore = 0;
			this._zero();
			this._bind();
        },
        
        // 获取下一个方块(包装了 _getRandTileObj)
		_zero: function() {
			clearInterval( this.timer );
			this.delta = 0;
			this.work = true;
			this.n = -1; // 用于碰撞检测, 具体作用见 add 函数

			this.running = false;
			
			if(!this.nextTileObj) this.nextTileObj = this._getRandTileObj();
			var next = this.nextTileObj
			this.tile = next.tile;
			this.row = next.row;
			this.col = next.col;

			this.nextTileObj = this._getRandTileObj();
		},

        // 拿到(已经获取到的下一个方块)
		getNextTile: function() {
			return this.nextTileObj.tile;
		},

        // 随机获取一个方块
		_getRandTileObj: function() {
			var row, col, tile;
			var tmp = this.tiles[row = rand(0, this.tiles.length - 1)]; // 获取方块种类
			var tile = tmp[col = rand(0, tmp.length - 1)].slice(0); // 获取具体的方块
			return { row: row, col: col, tile: tile }
		},

        // 计算, 接收一个 function 并在 this 的域内执行
		_mix: function(fn) {
			if( fn ) {
                this._minus(); 
                fn.call(this); // 这里根据调用来源, 执行来自来源的特定代码(eg. 向左, 向右, 变形等), 之后再进行碰撞检测
                this._add(); 
                this._render();
			}
		},

        // 方块当前位置与棋盘对应位置相加, 如果某位置 > 1 说明发生了碰撞
        // 此函数在 _minus 后执行
		_add: function() {
			var a = this.tile.length + this.n;
			if(a < 1 || a > this.layout.length) return false;
			for(var i = 0, m = this.tile.length; i < m; i++)
				if(i + this.n >= 0)
					this.layout[i + this.n] += this.tile[i];
		},

        //在 _add 函数之前执行, 去除上一帧 _add 函数留下的方块, 避免出现方块与自己的上一帧发生碰撞
		_minus: function() {
			var a = this.tile.length + this.n;
			if(a < 1 || a > this.layout.length) return false;
			for(var i = 0, m = this.tile.length; i < m; i++)
				if(i + this.n >= 0)
					this.layout[i + this.n] = Math.max(this.layout[i + this.n] - this.tile[i], 0);
		},

		start: function() {
			if(this.running) return;
			this.running = true;

			// 输出左侧 4X4 的矩阵
			var nextRow = this.nextTileObj.row, nextCol = this.nextTileObj.col;
			this.emit('start', tiles[nextRow][nextCol].map(e => pad(e.toString(2), 4)) );

            // 定时器(触发器), 每 this.t 时间刷新一帧
			var self = this;
			this.timer = setInterval(function() {
				if( self.work === true ) {
					self._mix(function() {
						self.n++;
						if( !this._isAllowed() ) {
							self.n--;
							self.work = false;
						}
					});
                } 
                else if( self.work === false ) {
					clearInterval( self.timer );
					this.running = false;

					if( self.n <= 0 ) {
						self._clear();
						self.emit('lose');
					} else {
						var fullNum = 0; // 统计共消去了几行
						var maxFullNumber = ( 1 << self.w ) - 1;
						for(var i = 0, m = self.layout.length; i < m; i++) {
							if( trim(self.layout[i]) >= maxFullNumber ) {
								fullNum++;
								self.layout.splice(i, 1);
								self.layout.unshift(0);
							}
						}

						// 触发得分事件
						if(fullNum) {                  
							self.totalScore += fullNum;
							self.emit('score', self.totalScore, fullNum)
						}

						self._zero();
						self.start();
					}
				}
			}, this.t);
			return this;
		},

        // 接收类外部传来的操作并执行
		on: function(type, fn) {
			if( !this.eventQueue ) this.eventQueue = {};
			if( !this.eventQueue[type] ) this.eventQueue[type] = [];

			if(fn) this.eventQueue[type].push(fn.bind(this));
			return this;
		},

        // 发出事件
		emit: function(type) {
			var arg = Array.prototype.slice.call(arguments, 1);

			if( this.eventQueue && this.eventQueue[type] )
				this.eventQueue[type].forEach(function(e) { e.apply(null, arg); });
			return this;
		},

		detach: function(type) {
			if( type && this.eventQueue[type]) this.eventQueue[type].length = 0;
		},

		pause: function() {
			clearInterval(this.timer);
			if(this.running === false) return;
			this.running = false;
			this.emit('pause');
			return this;
		},

		restart: function(t) {
			this.layout = fill(new Array(this.h), 0);
			this._zero();
			this.start(t);
			return this;
		},

		_clear: function() {
			this.layout = fill(new Array(this.h), 0);
			this._render();
		},

		_render: function() {
			var self = this;
			if( this.eventQueue && this.eventQueue.render && this.eventQueue.render.length ) {
				var res = this.layout.map(function(e) {
					return pad(e.toString(2), self.w + 2).substring(1, self.w + 1)
				});
				this.emit('render', res);
			}
		},

		_bind: function() {
			var self = this;
			bind(document, 'keydown', function(e) {
				var code = e.keyCode;
				if( code === 37 )
					self.left();
				else if( code === 38 )
					self.rotate();
				else if( code === 39 )
					self.right();
				else if( code === 40 )
					self.down();
				else if( code === 32 )
					self.fall();
			});
		},

		rotate: function() {
			if( !this.work || !this.running ) return;
			if( this.tile[this.row] === d ) return;
			var bak = this.tile;
			this._mix(function() {
				this._rotate();
				if( !this._isAllowed() )
					this.tile = bak;
			});
		},

		left: function() {
			this._shift(-1);
		},

		right: function() {
			this._shift(1);
		},

		_shift: function(n) {
			if( !this.work || !this.running ) return;
			var bak = this.tile;
			this._mix(function() {
				this.tile = this.tile.map(function(e) {
					return n > 0 ? e >> n : e << -n;
				});
				this._isAllowed() ? this.delta += n : this.tile = bak;
			});
		},

		down: function() {
			if( !this.work || !this.running ) return;
			this._mix(function() {
				this.n++;
				if( !this._isAllowed() ) {
					this.n--;
					this.work = false;
				}
			})
		},

		fall: function() {
			if( !this.work || !this.running ) return;
			if( this.n < 0 ) return;	// 防止模块还未出现按space就跑到最下面去了
			this._mix(function() {
				while( this.n <= this.layout.length - this.tile.length ) {
					this.n++;
					if( !this._isAllowed() ) {
						this.n--;
						this.work = false;
						break;
					}
				}
			});
		},

		_isAllowed: function() {
			var a = this.tile.length + this.n;

			// 超出上下边界时
			if( a < 1 || a > this.layout.length ) return false;

			var max = 1 << (this.w + 1);
			// 平移超出左右边界时
			if( this.tile.some(function(e) { return (e >= max) || (e & 1) }) )
				return false;

			// 方块发生碰撞时
			for(var i = 0, m = this.tile.length; i < m; i++)
				if( (this.tile[i] & (this.layout[i + this.n] || 0)) > 0 )
					return false;
			return true;
		},

		_rotate: function() {
			var rotatedTile = this.tiles[this.row][++this.col] || (this.col = 0, this.tiles[this.row][0]);
			var self = this;
			this.tile = rotatedTile.map(function(e) {
				return self.delta > 0 ? e >> self.delta : e << -self.delta;
			});
		}

	}

	window.Tetris = Tetris;

	function fill(arr, p) {
		for(var i = 0; i < arr.length; i++) arr[i] = p;
		return arr;
	}

	// 将二进制数两边去掉一位, 得到10bit的数
	function trim(num) {
		var max = (1 << (num.toString(2).length - 1) ) - 1;
		return (num >> 1) & max;
	}

	function pad(str, n) {
		var len = str.length;
		return len < n ? fill(new Array(n - len), '0').join('') + str : str.substring(len - n);
	}

	function rand(a, b) {
		if(a == null) a = 0;
		if(b == null) b = 8;	// 不能用 b = b || 8, 因为b可以为0
		return Math.round(a + Math.random()*(b - a));
	}

	function bind(obj, type, fn) {
		return obj.addEventListener(type, fn, false);
	}

})();