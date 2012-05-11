(function($){

	$(document).ready(function(){
		
		//Ease.Minesweeper found in plugins.js
		var game = 	new Ease.Minesweeper({
						//size: 32,
						//numberOfMines: 10,
						//numberOfMines: 99,
						cont: '#main'
					});

		// var other = new Ease.Minesweeper({
		// 				size: 32,
		// 				//numberOfMines: 10,
		// 				numberOfMines: 99,
		// 				cont: '#main'
		// 			});


		// var another = 	new Ease.Minesweeper({
		// 				size: 32
		// 			});

		console.log('instance', game);
	});

})(jQuery);