//////////////////////////////////////////////////////////////////////////////////
// A demonstration of a Canvas nebula effect
// (c) 2010 by R Cecco. <http://www.professorcloud.com>
// MIT License
//
// Please retain this copyright header in all versions of the software if
// using significant parts of it
//////////////////////////////////////////////////////////////////////////////////


$(document).ready(function(){	

	recenterLogo();

													   
	(function ($) {			
			// The canvas element we are drawing into.      
			var	$canvas = $('#parking_canvas_half')[0];
			var	$canvas2 = $('#main_draw')[0];
			var	$canvas3 = $('#parking_canvas_full')[0];			
			var	ctx2 = $canvas2.getContext('2d');
			var	ctx = $canvas.getContext('2d');
			var	w = $canvas.width; 
			var h = $canvas.height;		
			var	img = new Image();	
			
			var targetW = w;
			var targetH = h;
			var halfWidth = targetW/2;
			var halfHeight = targetH/2;
			
			// A puff.
			var	Puff = function(p) {				
				var	opacity,
					sy = (Math.random()*halfHeight)>>0,
					sx = (Math.random()*halfWidth)>>0;
				
				this.p = p;
						
				this.move = function(timeFac) {						
					p = this.p + 0.3 * timeFac;				
					opacity = (Math.sin(p*0.05)*0.5);						
					if(opacity <0) {
						p = opacity = 0;
						sy = (Math.random()*halfHeight)>>0;
						sx = (Math.random()*halfWidth)>>0;
					}												
					this.p = p;																			
					ctx.globalAlpha = opacity;						
					ctx.drawImage($canvas3, sy+p, sy+p, halfWidth-(p*2),halfHeight-(p*2), 0,0, w, h);								
				};
			};
			
			var	puffs = [];			
			var	sortPuff = function(p1,p2) { return p1.p-p2.p; };	
			puffs.push( new Puff(0) );
			puffs.push( new Puff(20) );
			puffs.push( new Puff(40) );
			
			var	newTime, oldTime = 0, timeFac;
					
			var	loop = function()
			{								
				newTime = new Date().getTime();				
				if(oldTime === 0 ) {
					oldTime=newTime;
				}
				timeFac = (newTime-oldTime) * 0.1 * 0.5;
				if(timeFac>3) {timeFac=3;}
				oldTime = newTime;						
				puffs.sort(sortPuff);							
				
				for(var i=0;i<puffs.length;i++)
				{
					puffs[i].move(timeFac);	
				}					
				ctx2.drawImage( $canvas ,0,0,targetW,targetH);				
				setTimeout(loop, 10 );				
			};
			// Turns out Chrome is much faster doing bitmap work if the bitmap is in an existing canvas rather
			// than an IMG, VIDEO etc. So draw the big nebula image into canvas3
			var	$canvas3 = $('#parking_canvas_full')[0];
			var	ctx3 = $canvas3.getContext('2d');
			$(img).bind('load',null, function() {  ctx3.drawImage(img, 0,0, targetW, targetH);	loop(); });
			img.src = './images/clouds_bg_smaller.jpg';
		
	})(jQuery);	 
});


$(window).resize(recenterLogo);

function recenterLogo(){
	
	posLeft =  ( $(document).width() /2) - ( 770 /2) ;
	
	$('#gtug-logo')
		.css('left', Math.floor(posLeft) )
		.css('top',100);

	console.log('Logo successfully centered.');
}
