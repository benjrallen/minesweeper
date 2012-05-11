<!DOCTYPE html>
<!--[if lt IE 7 ]><html lang="" class="no-js ie ie6 lte7 lte8 lte9"><![endif]-->
<!--[if IE 7 ]><html lang="" class="no-js ie ie7 lte7 lte8 lte9"><![endif]-->
<!--[if IE 8 ]><html lang="" class="no-js ie ie8 lte8 lte9"><![endif]-->
<!--[if IE 9 ]><html lang="" class="no-js ie ie9 lte9"><![endif]-->
<!--[if (gt IE 9)|!(IE)]><!--><html lang="" class="newbie no-js"><!--<![endif]-->
<head>
    <meta charset="utf-8">
  
    <script type="text/javascript" src="js/modernizr.js"></script>
    <script type="text/javascript">
      var _gaq = _gaq || [];
      _gaq.push(['_setAccount', 'UA-31603590-1']);
      _gaq.push(['_trackPageview']);

      Modernizr.load([
        { load: ['//ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js'],
      	  complete: function(){ if(!window.jQuery){ Modernizr.load('js/jquery.js'); } }
      	},
      	{ test: window.JSON, nope: 'js/json2.js' },
      	<?php /* plugins.js & common.js fordevelopment */ ?>
      	<?php /* ?>
      	{ load: 'js/plugins.js' },
      	{ load: 'js/common.js' },
      	<?php */ ?>
      	<?php /* concatenate and optimize seperate script files for deployment using google closure compiler (compiler.jar) in js folder */ ?>
      	{ load : 'js/theme.js' },
      	{ load: ('https:' == location.protocol ? '//ssl' : '//www') + '.google-analytics.com/ga.js' }
      ]);
    </script>
	  <link rel="stylesheet" href="css/style.css" />

		<title>Minesweeper</title>
		<meta name="description" content="" />
	  <meta name="keywords" content="" />
		<meta name="robots" content="" />
</head>

<body>
  <div id="main" class="container">
    <div class="line"></div>
  </div>
  <div id="loading">
    <div class="line"></div>
    <div class="text">Loading Game...</div>
  </div>
</body>
</html>