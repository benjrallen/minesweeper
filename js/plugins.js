/*
 * Try/Catch the console
 */
try{
    console.log('Hello Ease.');
} catch(e) {
    window.console = {};
    var cMethods = "assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(",");
    for (var i=0; i<cMethods.length; i++) {
        console[ cMethods[i] ] = function(){};
    }
}


var Ease = Ease || {};

(function($){
	
	//I am going to do a VERY simple local storage implementation, allowing the ability to save ONE single game.
	//  Multiple instances running on the page?  they will have access to whatever localstorage keyed game they have defined.
	Ease.localstorage = Modernizr.localstorage;
	
	Ease.Keys = {
		RIGHT_CLICK: 3
	};
	
	Ease.Events = {
		FLAG_CHANGE: 	'mineFlagged',
		GAME_OVER: 		'gameOver'
	};
	
	Ease.Minesweeper = function( config ){		
		this.settings = {
			cont: 			'body',
			holderClass: 	'holder',
			boardClass: 	'board',
			controlsClass:  'controls',
			newGameClass: 	'newGame btn-primary', 
			validateClass: 	'validate btn-warning', 
			cheatClass: 	'cheat btn-danger', 
			saveGameClass: 	'saveGame btn-success', 
			loadGameClass: 	'loadGame btn-info', 
			mineClass: 		'mine',
			size: 			8, // n X n tiles
			numberOfMines: 	10,
			localKey: 		'minesweeperLocal'
		}
		
		//apply the arguments to the defaults
		$.extend( this.settings, config );
		
		this.data = null;
			
		this.rows = []; //used to reference the tiles
		//this.$rows = []; //reference to the DOM containers
		
		this.init();

	};

	/** Prototype **/
	Ease.Minesweeper.prototype = {
		
		init: function(){
						
			//set the dimensions so they can change without affecting save game
			this.size = this.settings.size;
			//same with the number of mines
			this.numberOfMines = this.settings.numberOfMines;
			
			this.trackInstance();
			this.makeHolder();
			this.makeBoard();
			this.makeControls();			
			this.makeMessageBox();
			this.startGame();
			
			//hide the loading message
			$('#loading').hide();
		},
		
		startGame: function(){			
			//reset the object counter
			this.counter = this.settings.numberOfMines;
			//reset the mines
			this.mines = [];
			//set the board size
			this.settings.size = this.size;
			//set the number of mines
			this.settings.numberOfMines = this.numberOfMines;
			//game is running
			this.inProgress = true;

			//check number of mines.  can't be more than the size of the board
			var maxMines = Math.pow( this.settings.size, 2) - 1;

			if( maxMines < this.settings.numberOfMines )
				this.settings.numberOfMines = maxMines;
			
			maxMines = null;  //don't need that variable anymore

			//display the right amount of mines
			this.$mines.find('input').val( this.settings.numberOfMines );
			
			//clear the board if it needs it
			this.clearBoard();
			
			this.fillBoard();
			
		},
		
		clearBoard: function(){
			this.rows = []; //used to reference the tiles
			this.$board.html('');
			this.setCounter();
			this.$messageBox.hide().prependTo( this.$controls );
		},
		
		setCounter: function(){
			var html = '';
			
			$.each( this.counter.toString(), function(){
				html += '<span>'+this+'</span>';
			});
			
			this.$counter.html( html );
		},
		
		makeHolder: function(){
			return this.$holder = $('<div />', {
				id: this.settings.holderClass + '-' + this.instance
			}).addClass( this.settings.holderClass + ' clearfix' )
			.appendTo( this.settings.cont );
		},
		
		makeBoard: function(){
			var that = this;
			
			return this.$board = $('<div />', {
				id: this.settings.boardClass + '-' + this.instance
			}).addClass( this.settings.boardClass+ ' clearfix' )
			.bind( Ease.Events.GAME_OVER, function(){
				that.validate();
			})
			.appendTo( this.$holder );
		},
		
		makeMessageBox: function(){
			//just make it.  we'll prepend it to the board on the start of the game
			this.$messageBox = $('<div />', {}).addClass('messageBox');
		},
		
		makeControls: function(){
			var that = this;
			
			this.$controls = $('<div />').addClass( this.settings.controlsClass ).appendTo( this.$holder );
			
			//mine counter, listens for flag change
			this.$counter = $('<div />', {}).addClass('counter')
				.bind( Ease.Events.FLAG_CHANGE, function(){
					//that.setCounter.call( that );
					that.setCounter();
				})
				.appendTo( this.$controls );
			
			//validate game
			this.$validate = $('<button />', {
					text: 'Validate'
				}).addClass( this.settings.validateClass + ' btn')
				.click(function(){
					that.validate();
				})
				.appendTo( this.$controls );

			//cheat, you dirty cheater
			this.$cheat = $('<button />', {
					text: 'Cheat'
				}).addClass( this.settings.cheatClass + ' btn')
				.click(function(){
					that.cheat();
				})
				.appendTo( this.$controls );

			//new game
			this.$newGame = $('<button />', {
					text: 'New Game'
				}).addClass( this.settings.newGameClass + ' btn')
				.click(function(){
					that.startGame();
				})
				.appendTo( this.$controls );

			//size
			this.$size = this.makeInputBlock( 'Dimensions ( x*x )', 'size', this.size, function(e){
				that.size = $(this).val();
			}).appendTo( this.$controls );

			//mines
			this.$mines = this.makeInputBlock( 'Number of mines', 'mines', this.numberOfMines, function(e){
				that.numberOfMines = $(this).val();
			}).appendTo( this.$controls );

			if( Ease.localstorage ){
				//savegame
				this.$save = $('<button />', {
						text: 'Save Game'
					}).addClass( this.settings.saveGameClass + ' btn')
					.click(function(){
						that.saveLocal();
					})
					.appendTo( this.$controls );

				//savegame
				this.$load = $('<button />', {
						text: 'Load Game'
					}).addClass( this.settings.loadGameClass + ' btn')
					.click(function(){
						that.loadLocal();
					})
					.hide()
					.appendTo( this.$controls );
					
				//see if there is a game to load
				this.testLocal();
			}
		},

		makeInputBlock: function( label, name, value, changeCallback ){
			var block = $('<div />').addClass('inputBlock '+name);
			
			$('<label />', {
				for: name,
				text: label
			}).appendTo( block );
			
			var inp = $('<input />', {
				name: name,
				type: 'text'
			}).appendTo( block );
			
			if( value )
				inp.val( value );
			
			if( typeof changeCallback === 'function' )
				inp.change(changeCallback);
				
			return block;
		},
		
		//this saves the settings for the objects and saves the state of the rows
		buildSettingsObject: function(){
			var obj = {
				settings: this.settings,
				mines: this.mines,
				rows: []
			};
			
			//fill in the rows with the settings of each of the tiles that are instantiated
			$.each( this.rows, function(i){
				obj.rows[i] = [];
				
				$.each( this, function(j){
					obj.rows[i][j] = this.settings
				});
			});
		
			return obj;
		},
		
		saveLocal: function(){
			//save the instance settings			
			localStorage.setItem( this.localKey, JSON.stringify( this.buildSettingsObject() ) );
			//show the load button if it was hidden			
			this.testLocal();
		},
		
		loadLocal: function(){
			
			var stored = localStorage.getItem( this.localKey );
			
			if( stored && stored.length ){
				this.data = JSON.parse( stored );

				//need a few number values
				this.size = this.data.settings.size = parseInt( this.data.settings.size, 10 );
				this.numberOfMines = this.data.settings.numberOfMines = parseInt( this.data.settings.numberOfMines, 10 );
				//set the game settings
				this.settings = this.data.settings;

				this.startGame();
				
				//update the inputs.
				this.$size.find('input').val( this.size );
				this.$mines.find('input').val( this.numberOfMines )
				
				//reset the saved data on the instance
				this.data = null;
			}
			
		},
		
		//function to test whether there is a game in local storage
		testLocal: function(){			
			if( localStorage.getItem( this.localKey ) )
				this.$load.show();
		},
		
		validate: function(){
			//console.log('VALIDATE THE GAME');
			this.showMines();
			
			//simple check to see if all the mines were flagged or unexposed tiles that aren't mines
			var valid = true;
			
			$.each( this.rows, function(i){
				var rowValid = true; //allows breaking of the loop on a losing tile
				
				$.each( this, function(i){
					console.log( 'valid?', this, this.settings.exposed, this.settings.isMine );
					if( this.settings.exposed && this.settings.isMine || !this.settings.exposed && !this.settings.isMine ){
						rowValid = false; //break out of upper loop
						return false; //break out of inner loop
					}
				});
				
				valid = rowValid;
				return rowValid;
			});

			//I've split up these two functions to provide full control over what is shown at the end of the game
			//  In this implementation, they spit out basically the same thing, but I want to retain that control
			var content = ( valid ? this.youWon() : this.youLost() );
			
			this.$messageBox.html('').append( content ).show();
			
			this.inProgress = false;
		},
		
		cheat: function(){
			if( this.inProgress )
				this.showMines();
		},
		
		youWon: function(){
			var block = $('<div />', {}).addClass('winner message');
			
			//line for inline blocking
			$('<div />').addClass('line').appendTo(block);
			
			//content
			var content = $('<div />', {
				html: '<h2>You Won!</h2><h3>Awesome.</h3>'
			}).addClass('content').appendTo( block );

			//this.$newGame.clone( true ).appendTo( content );
			//this.$load.clone( true ).appendTo( content );
			
			return block;
		},
		
		youLost: function(){
			var block = $('<div />', {}).addClass('loser message');
			
			//line for inline blocking
			$('<div />').addClass('line').appendTo(block);
			
			//content
			var content = $('<div />', {
				html: '<h2>You Lost!</h2><h3>Bye bye, legs.</h3>'
			}).addClass('content').appendTo( block );

			//this.$newGame.clone( true ).appendTo( content );
			//this.$load.clone( true ).appendTo( content );
			
			return block;
		},
		
		fillBoard: function(){
			//this.data is filled when a game is loaded from localstorage
			if( !this.data || !this.data.rows.length ){
				
				//make the rows
				for ( var i = 0; i < this.settings.size; i++ ){
					this.rows[i] = [];
					this.makeRow(i);
				}
				
				//make the mines
				this.setMines();
				
			} else {
				var that = this;
				
				//make the rows
				$.each( this.data.rows, function(i){
					that.rows[i] = [];
					that.makeRow( i, this );
				});
				
				this.mines = this.data.mines;
			}
		},
		
		makeRow: function( idx, rowData ){
			var row = this.rows[idx],
				$row = $('<div />', {
					
				}).addClass('row clearfix').appendTo( this.$board );
						
			if( !rowData ){
				//make new rows
				for( var i = 0; i < this.settings.size; i++ ){
					var tile = new Ease.Minesweeper.Tile( this, {} );
					//track the row index in the tile				
					tile.row = idx;
					tile.col = row.push( tile ) - 1;
				
					tile.$tile.appendTo( $row );				
				}
			} else {
				var that = this;
				
				$.each( rowData, function(i){
					//make a new tile with the saved settings for the tile
					var tile = new Ease.Minesweeper.Tile( that, this );
					
					tile.row = idx;
					tile.col = row.push( tile ) - 1;
					
					//need the value as a number
					if( tile.settings.value )
						tile.settings.value = parseInt( tile.settings.value, 10 );
								
					tile.$tile.appendTo( $row );
				});
				
			}
		},
				
		//lots of logic in this function so that none of the mine locations get exposed
		setMines: function(){
			//local variable so smart programmers can't cheat
			var that = this;
						
			//loop for how many mines there are
			for( var i=0; i<this.settings.numberOfMines; i++ ){
				var mine = false;
				
				//this could get slow on big ol' boards.  test it.
				while( !mine ){
					var coords = this.getRandomTileCoords();					
					//check if the coords are already assigned to become a mine
					if( $.inArray( coords, this.mines ) < 0 ) 
						mine = coords;
				}
				
				this.mines.push( mine );
			}
						
			//set the mines
			$.each( this.mines, function(){
				that.getTileByCoordsString( this ).settings.isMine = true;
			});
		},

		showMines: function(){
			var that = this;
			//show the mines with CSS
			$.each( this.mines, function(){
				that.getTileByCoordsString( this ).$tile.addClass('mine');
			});
		},
		
		getTileByCoordsString: function( coords ){
			coords = coords.split(',');
			return this.getTileByCoords( coords[0], coords[1] );
		},
		
		getTileByCoords: function( row, col ){
			return this.rows[row][col];
		},
		
		//return as string
		getRandomTileCoords: function(){
			return this.random( this.settings.size ) + ',' + this.random( this.settings.size );
			// return [ 
			// 	this.random( this.settings.size ),
			// 	this.random( this.settings.size )
			// ];
		},
		
		//test a tile for adjacent mines
		countAdjacentMines: function( tiles ){
			var mines = 0;
			
			//test the adjacent tiles for mines
			$.each( tiles, function(){
				if( this.settings.isMine )
					mines++;
			});
			
			return mines;
		},
		
		getAdjacentTiles: function( tile ){
			var tiles = [],
				row = tile.row,
				col = tile.col,
				//minimums & maximums could be out of bounds
				minRow = ( row - 1 < 0 ? row : row - 1 ),
				maxRow = ( row + 1 > this.settings.size - 1 ? row : row + 1 ),
				minCol = ( col - 1 < 0 ? col : col - 1 ),
				maxCol = ( col + 1 > this.settings.size - 1 ? col : col + 1 );
						
			//loop rows then cols
			for ( var r = minRow; r <= maxRow; r++ ){
				for ( var c = minCol; c <= maxCol; c++ ){
					//is this the center mine?
					if( r === row && c === col )
						continue;
						
					//make sure they aren't exposed
					if( !this.rows[r][c].settings.exposed )
						tiles.push( this.rows[r][c] );
				}
			}
			
			return tiles;
		},
		
		//make a random number from zero to whatever number
		random: function( limit ){
			//bitwise OR can be MUCH faster than Math.floor:  http://jsperf.com/or-vs-floor
			return ~~( Math.random() * limit );
		},
		
		trackInstance: function(){
			if( typeof this.constructor.instances === 'undefined' )
				this.constructor.instances = [];
		
			//keep track of how many instances there are and which one this is
			return this.instance = this.constructor.instances.push( this ) - 1;
		}
	};


	Ease.Minesweeper.Tile = function( superclass, config ){
				
		this.settings = {
			flagClass: 	'flag',
			isMine: 	false,
			exposed: 	false,
			flagged: 	false, 
			value: 		null
		};
		
		$.extend( this.settings, config );
		
		this.superclass = superclass;
		this.row = 0; //set after instantiation
		this.col = 0; //set after instantiation
		this.$tile = null; //created in init
		
		this.init();
	};
	
	Ease.Minesweeper.Tile.prototype = {
		
		init: function(){
			var that = this;

			this.$tile = $('<div />').addClass('tile')
				.click(function(e){
					//return that.onTileClick.apply( that, arguments );
					return that.exposeTile.apply( that, arguments );				
				})
				//turn off the right click menu
				.bind('contextmenu', function(e){
					that.flagTile.apply( that, arguments );
					return false;
				});
				
			//check the settings and expose them/don't
			if( this.settings.exposed )
				this.setTileAsExposed();
				
			if( this.settings.flagged )
				this.flagTile();
		},
				
		flagTile: function(e){

			//already tested?
			if( this.settings.exposed || !this.superclass.inProgress )
				return false;
			
			//increment the game counter and set the tile visually
			if( this.$tile.hasClass( this.settings.flagClass ) ){
				this.settings.flagged = false;
				this.$tile.removeClass( this.settings.flagClass );
				this.superclass.counter++;
			} else {
				this.settings.flagged = true;
				this.$tile.addClass( this.settings.flagClass );
				this.superclass.counter--;
			}
						
			//notify the counter
			this.superclass.$counter.triggerHandler( Ease.Events.FLAG_CHANGE );
		},
		
		exposeTile: function(e){
			//already tested?
			if( this.settings.exposed || this.settings.flagged || !this.superclass.inProgress )
				return false;
			
			//is it a mine?
			if( this.settings.isMine ){
				
				this.$tile.addClass('exposed');
				this.settings.exposed = true;
				this.superclass.$board.triggerHandler( Ease.Events.GAME_OVER );
				return;
				
			} else {				
				//get the adjacent tiles
				var tiles = this.superclass.getAdjacentTiles( this );
				
				//get the value for the number of adjacent mines
				this.settings.value = this.superclass.countAdjacentMines( tiles );
				
				//expose the tile with css and display the value
				this.setTileAsExposed();

				//expose the surrounding tile if this one has no adjacent mines
				if( this.settings.value === 0 ){
					$.each( tiles, function(){
						var that = this;
						setTimeout( function(){ that.$tile.triggerHandler('click'); }, 0 );
					});
				}
					
				tiles = null;
			}		
		},
		
		setTileAsExposed: function(){
			//it's exposed now
			this.settings.exposed = true;
			
			//expose the tile with css and display the value
			this.$tile
				.text( this.settings.value )
				.removeClass( this.settings.flagClass )
				.addClass('exposed adj'+this.settings.value);
		}
	};
	
})(jQuery);