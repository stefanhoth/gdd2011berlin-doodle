/**
 * Copyright 2011 Seth Ladd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

@url https://github.com/sethladd/Bad-GtugLogos

 */


window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              window.oRequestAnimationFrame      ||
              window.msRequestAnimationFrame     ||
              function(/* function */ callback, /* DOMElement */ element){
                window.setTimeout(callback, 1000 / 60);
              };
})();

function AssetManager() {
    this.successCount = 0;
    this.errorCount = 0;
    this.cache = {};
    this.downloadQueue = [];
    this.soundsQueue = [];
}

AssetManager.prototype.queueDownload = function(path) {
    this.downloadQueue.push(path);
}

AssetManager.prototype.queueSound = function(id, path) {
    this.soundsQueue.push({id: id, path: path});
}

AssetManager.prototype.downloadAll = function(downloadCallback) {
    if (this.downloadQueue.length === 0 && this.soundsQueue.length === 0) {
        downloadCallback();
    }
    
    for (var i = 0; i < this.downloadQueue.length; i++) {
        var path = this.downloadQueue[i];
        var img = new Image();
        var that = this;
        img.addEventListener("load", function() {
            console.log(this.src + ' is loaded');
            that.successCount += 1;
            if (that.isDone()) {
                downloadCallback();
            }
        }, false);
        img.addEventListener("error", function() {
            that.errorCount += 1;
            if (that.isDone()) {
                downloadCallback();
            }
        }, false);
        img.src = path;
        this.cache[path] = img;
    }
}

AssetManager.prototype.downloadSounds = function(soundsCallback) {
    var that = this;
    soundManager.onready(function() {
        console.log('soundManager ready');
        for (var i = 0; i < that.soundsQueue.length; i++) {
            that.downloadSound(that.soundsQueue[i].id, that.soundsQueue[i].path, soundsCallback);
        }
    });
    soundManager.ontimeout(function() {
        console.log('SM2 did not start');
    });
}

AssetManager.prototype.downloadSound = function(id, path, soundsCallback) {
    var that = this;
    this.cache[path] = soundManager.createSound({
        id: id,
        autoLoad: true,
        url: path,
        onload: function() {
            console.log(this.url + ' is loaded');
            that.successCount += 1;
            if (that.isDone()) {
                soundsCallback();
            }
        }
    });
}

AssetManager.prototype.getSound = function(path) {
    return this.cache[path];
}

AssetManager.prototype.getAsset = function(path) {
    return this.cache[path];
}

AssetManager.prototype.isDone = function() {
    return ((this.downloadQueue.length + this.soundsQueue.length) == this.successCount + this.errorCount);
}


function Animation(spriteSheet, frameWidth, frameDuration, loop) {
    this.spriteSheet = spriteSheet;
    this.frameWidth = frameWidth;
    this.frameDuration = frameDuration;
    this.frameHeight= this.spriteSheet.height;
    this.totalTime = (this.spriteSheet.width / this.frameWidth) * this.frameDuration;
    this.elapsedTime = 0;
    this.loop = loop;
}

Animation.prototype.drawFrame = function(tick, ctx, x, y, scaleBy) {
    var scaleBy = scaleBy || 1;
    this.elapsedTime += tick;
    if (this.loop) {
        if (this.isDone()) {
            this.elapsedTime = 0;
        }
    } else if (this.isDone()) {
        return;
    }
    var index = this.currentFrame();
    var locX = x - (this.frameWidth/2) * scaleBy;
    var locY = y - (this.frameHeight/2) * scaleBy;
    ctx.drawImage(this.spriteSheet,
                  index*this.frameWidth, 0,  // source from sheet
                  this.frameWidth, this.frameHeight,
                  locX, locY,
                  this.frameWidth*scaleBy,
                  this.frameHeight*scaleBy);
}

Animation.prototype.currentFrame = function() {
    return Math.floor(this.elapsedTime / this.frameDuration);
}

Animation.prototype.isDone = function() {
    return (this.elapsedTime >= this.totalTime);
}

function Timer() {
    this.gameTime = 0;
    this.maxStep = 0.05;
    this.wallLastTimestamp = 0;
}

Timer.prototype.tick = function() {
    var wallCurrent = Date.now();
    var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
    this.wallLastTimestamp = wallCurrent;
    
    var gameDelta = Math.min(wallDelta, this.maxStep);
    this.gameTime += gameDelta;
    return gameDelta;
}



function GameEngine() {
    this.entities = [];
    this.ctx = null;
    this.click = null;
    this.mouse = null;
    this.timer = new Timer();
    this.surfaceWidth = null;
    this.surfaceHeight = null;
    this.halfSurfaceWidth = null;
    this.halfSurfaceHeight = null;
}

GameEngine.prototype.init = function(ctx) {
    this.ctx = ctx;
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.halfSurfaceWidth = this.surfaceWidth/2;
    this.halfSurfaceHeight = this.surfaceHeight/2;
    this.startInput();
    
    console.log('game initialized');
}

GameEngine.prototype.start = function() {
    console.log("starting game");
    var that = this;
    (function gameLoop() {
        that.loop();
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
}

GameEngine.prototype.startInput = function() {
    console.log('Starting input');
    
    var getXandY = function(e) {
        var x =  e.clientX - that.ctx.canvas.getBoundingClientRect().left - (that.ctx.canvas.width/2);
        var y = e.clientY - that.ctx.canvas.getBoundingClientRect().top - (that.ctx.canvas.height/2);
        return {x: x, y: y};
    }
    
    var that = this;
    
    this.ctx.canvas.addEventListener("click", function(e) {
        that.click = getXandY(e);
    }, false);
    
    this.ctx.canvas.addEventListener("mousemove", function(e) {
        that.mouse = getXandY(e);
    }, false);
    
    console.log('Input started');
}

GameEngine.prototype.addEntity = function(entity) {
    this.entities.push(entity);
}

GameEngine.prototype.draw = function(drawCallback) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.ctx.canvas.width/2, this.ctx.canvas.height/2);
    for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(this.ctx);
    }
    if (drawCallback) {
        drawCallback(this);
    }
    this.ctx.restore();
}

GameEngine.prototype.update = function() {
    var entitiesCount = this.entities.length;
    
    for (var i = 0; i < entitiesCount; i++) {
        var entity = this.entities[i];
        
        if (!entity.removeFromWorld) {
            entity.update();
        }
    }
    
    for (var i = this.entities.length-1; i >= 0; --i) {
        if (this.entities[i].removeFromWorld) {
            this.entities.splice(i, 1);
        }
    }
}

GameEngine.prototype.loop = function() {
    this.clockTick = this.timer.tick();
    this.update();
    this.draw();
    this.click = null;
}


function Entity(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.removeFromWorld = false;
}

Entity.prototype.update = function() {
}

Entity.prototype.draw = function(ctx) {
    if (this.game.showOutlines && this.radius) {
        ctx.beginPath();
        ctx.strokeStyle = "green";
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        ctx.stroke();
        ctx.closePath();
    }
}

Entity.prototype.drawSpriteCentered = function(ctx) {
    var x = this.x - this.sprite.width/2;
    var y = this.y - this.sprite.height/2;
    ctx.drawImage(this.sprite, x, y);
}

Entity.prototype.outsideScreen = function() {
    return (this.x > this.game.halfSurfaceWidth || this.x < -(this.game.halfSurfaceWidth) ||
        this.y > this.game.halfSurfaceHeight || this.y < -(this.game.halfSurfaceHeight));
}

//HERE

Entity.prototype.rotateAndCache = function(image, angle) {
    var offscreenCanvas = document.createElement('canvas');
    var size = Math.max(image.width, image.height);
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    var offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCtx.save();
    offscreenCtx.translate(size/2, size/2);
    offscreenCtx.rotate(angle + Math.PI/2);
    offscreenCtx.translate(0,0);
    offscreenCtx.drawImage(image, -(image.width/2), -(image.height/2));
    offscreenCtx.restore();
    //offscreenCtx.strokeStyle = "red";
    //offscreenCtx.strokeRect(0,0,size,size);
    return offscreenCanvas;
}


function Arrow(game, radial_distance, angle) {
    Entity.call(this, game);
    this.radial_distance = radial_distance;
    this.angle = angle;
    this.speed = 1;
    this.sprite = this.rotateAndCache(ASSET_MANAGER.getAsset('images/arrow.png'), this.angle);
    this.radius = this.sprite.height/2;
    this.setCoords();
}
Arrow.prototype = new Entity();
Arrow.prototype.constructor = Arrow;

Arrow.prototype.setCoords = function() {
    this.x = this.radial_distance * Math.cos(this.angle);
    this.y = this.radial_distance * Math.sin(this.angle);
}

Arrow.prototype.update = function() {
    
    angle = Math.random(-1,1) * Math.random(50);
    if (angle < 0) {
        angle += Math.PI * 2;
    }

	this.rotate(angle);

    Entity.prototype.update.call(this);
}


Entity.prototype.rotate = function(angle) {
    
    var size = Math.max(this.sprite.height, this.sprite.width);
    var spriteCtx = this.sprite.getContext('2d');
    
    //clear canvas for redrawing
    spriteCtx.clearRect ( 0 , 0 , this.sprite.width, this.sprite.height);
    
    spriteCtx.save();
    spriteCtx.translate(size/2, size/2);
    spriteCtx.rotate(angle + Math.PI/2);
    spriteCtx.translate(0,0);
    spriteCtx.drawImage(ASSET_MANAGER.getAsset('images/arrow.png'), -(this.sprite.width/2), -(this.sprite.height/2));
    spriteCtx.restore();
    //offscreenCtx.strokeStyle = "red";
    //offscreenCtx.strokeRect(0,0,size,size);
}




Arrow.prototype.draw = function(ctx) {
    this.drawSpriteCentered(ctx);
    
    Entity.prototype.draw.call(this, ctx);
}


function GtugLogo(game) {
    Entity.call(this, game, 0, 0);
    this.sprite = ASSET_MANAGER.getAsset('images/doodle-transparent.png');
}
GtugLogo.prototype = new Entity();
GtugLogo.prototype.constructor = GtugLogo;

GtugLogo.prototype.draw = function(ctx) {
    ctx.drawImage(this.sprite, this.x - this.sprite.width/2, this.y - this.sprite.height/2);
}



function Gdd2011Berlin() {
    GameEngine.call(this);
    //this.showOutlines = true;
}
Gdd2011Berlin.prototype = new GameEngine();
Gdd2011Berlin.prototype.constructor = Gdd2011Berlin;

Gdd2011Berlin.prototype.start = function() {
    this.gtuglogo= new GtugLogo(this);
    this.addEntity(this.gtuglogo);

    this.addEntity(new Arrow(this, 0, 0 ));
    //this.addEntity(new Arrow(this, 100, 45 ));
    //this.addEntity(new Arrow(this, 150, 180 ));
    //this.addEntity(new Arrow(this, 200, 180 ));

    GameEngine.prototype.start.call(this);
}

Gdd2011Berlin.prototype.update = function() {
    
    GameEngine.prototype.update.call(this);
}

Gdd2011Berlin.prototype.draw = function() {
    GameEngine.prototype.draw.call(this, function(game) {
    	
    });
}

var canvas = document.getElementById('surface');
var ctx = canvas.getContext('2d');
var game = new Gdd2011Berlin();
var ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload('images/arrow.png');
ASSET_MANAGER.queueDownload('images/doodle-transparent.png');
ASSET_MANAGER.queueDownload('images/wolken-zoom.png');

ASSET_MANAGER.downloadAll(function() {
    game.init(ctx);
    game.start();
});
