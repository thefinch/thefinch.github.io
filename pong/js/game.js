"use strict";

$(document).ready(function(){  
  // save the start button for later
  var oStartButton = $('#start-btn');
  var oRestartButton = $('#restart');
  
  // make our paddles
  var oPaddle = {
    height: 70,
    width: 10,
    speed: 30
  };
  
  // make our ball
  var oBall = {
    element: $('#ball'),
    speed: oPaddle.speed / 10,
    diameter: 10,
    verticalDirection: 'up',
    horizontalDirection: 'right',
    update: function() {
      // setup variables
      var oOffset  = this.element.offset();
      var iNewTop  = oOffset.top;
      var iNewLeft = oOffset.left;

      // check which direction it's currently heading
      if( this.verticalDirection == 'up' ) {
        // assume we're going to go to the next spot
        iNewTop -= this.speed;
        
        // change direction if needed
        if( iNewTop <= 0 ) {
          iNewTop = 0;
          this.verticalDirection = 'down';
        }
      }
      else {
        // assume we're going to go to the next spot
        iNewTop += this.speed;
        
        // change direction if needed
        if( iNewTop >= $(window).height() - this.diameter ) {
          iNewTop = $(window).height() - this.diameter;
          this.verticalDirection = 'up';
        }
      }

      // check which direction it's currently heading
      if( this.horizontalDirection == 'left' ) {
        // assume we're going to the next spot
        iNewLeft -= oBall.speed;

        // check if the ball hit the player paddle,
        // if so change direction
        if( HitPlayerPaddle() ) {
          iNewLeft = oGame.player.paddle.width;
          this.horizontalDirection = 'right';
        }

        // check if the AI scored
        if( iNewLeft <= 0 ) {
          // increment ai score
          oGame.ai.incrementScore();
          
          // end game if needed
          if( oGame.ai.score >= 10 ) {
            oGame.end();
          }
          
          // resposition ball
          iNewTop  = oGame.player.element.offset().top + ( oGame.player.paddle.height / 2 );
          iNewLeft = oGame.player.paddle.width;
          this.horizontalDirection = 'right';
        }
      }
      else {
        // asuume we're going to the next spot
        iNewLeft += this.speed;

        // check if the ball hit the AI paddle
        if( HitAIPaddle() ) {
          iNewLeft = $(window).width() - oGame.ai.paddle.width - this.diameter;
          this.horizontalDirection = 'left';
        }

        // check if the player scored
        if( iNewLeft + oGame.ball.diameter >= $(window).width() ) {
          // increment player score and update it on the page
          oGame.player.incrementScore();
          
          // end game if needed
          if( oGame.player.score >= 10 ) {
            oGame.end();
          }
          
          // resposition ball
          iNewTop  = oGame.ai.element.offset().top + ( oGame.ai.paddle.height / 2 );
          iNewLeft = $(window).width() - oGame.ai.paddle.width;
          this.horizontalDirection = 'right';
        }
      }

      // update the positions
      oNewOffset = { top: iNewTop, left: iNewLeft };
      this.element.offset( oNewOffset );
    }
  };
  
  // make our paddles
  var oPlayer = {
    element: $('#player-paddle'),
    paddle: oPaddle,
    score: 0,
    scoreCounter: $('#player-score'),
    incrementScore: function() {
      this.score++;
      $( this.scoreCounter ).html( this.score );      
    }
  };
  var oAI = {
    element: $('#ai-paddle'),
    paddle: oPaddle,
    score: 0,
    scoreCounter: $('#ai-score'),
    incrementScore: function() {
      this.score++;
      $( this.scoreCounter ).html( this.score );      
    }
  };

  // create master game object
  var oGame = {
    fps: 60,
    ball: oBall,
    player: oPlayer,
    ai: oAI,
    init: function() {
      this.player.score = 0;
      this.ai.score = 0;
      this.player.scoreCounter.html( 0 ); 
      this.ai.scoreCounter.html( 0 ); 
    },
    end: function() {
      bGameOver = true;
      
      $( '#game-over' ).removeClass( 'hidden' );
    }
  };
  
  // set our constants
  var DOWN_ARROW = 83;
  var UP_ARROW = 87;
  
  // make general use vars
  var oOffset, oNewOffset;
  var iNewTop = 0, iNewLeft = 0
  var bWaiting = false;
  var iWaitTime;
  var bGameOver = false

  // listen for input from player
  var ListenForInput = function(){
    $('body').keydown(function(e){
      // move player paddle up
      if( e.which == UP_ARROW ) {
        oOffset = oGame.player.element.offset();
        iNewTop = oOffset.top - oPaddle.speed;
        if( iNewTop <= 0 ) {
          iNewTop = 0;
        }
        oNewOffset = { top: iNewTop, left: 0 };
        oGame.player.element.offset( oNewOffset );
      }
      
      // move player paddle down
      if( e.which == DOWN_ARROW ) {
        oOffset = oGame.player.element.offset();
        iNewTop = oOffset.top + oPaddle.speed;
        if( iNewTop >= $(window).height() - oPaddle.height ) {
          iNewTop = $(window).height() - oPaddle.height;
        }
        oNewOffset = { top: iNewTop, left: 0 };
        oGame.player.element.offset( oNewOffset );
      }
    });
  };
  
  var HitPlayerPaddle = function(){
    var oBallOffset = oGame.ball.element.offset();
    var oPaddleOffset = oGame.player.element.offset();
    return oBallOffset.left <= oGame.player.paddle.width && oBallOffset.top >= oPaddleOffset.top && oBallOffset.top <= oPaddleOffset.top + oPaddle.height;
  };
  
  var HitAIPaddle = function(){
    var oBallOffset = oGame.ball.element.offset();
    var oPaddleOffset = oGame.ai.element.offset();
    return oBallOffset.left + oGame.ai.paddle.width >= $(window).width() - oGame.ai.paddle.width && oBallOffset.top >= oPaddleOffset.top && oBallOffset.top <= oPaddleOffset.top + oPaddle.height;
  };
  
  var CalculateAIPaddlePosition = function(){
    var oOffset = oGame.ai.element.offset();
    var oBallOffset = oGame.ball.element.offset();
    
    // figure out the next position
    iNewTop = oOffset.top;
    if( oGame.ball.horizontalDirection == 'right' ) {
      if( oBallOffset.top < iNewTop ) {
        iNewTop = iNewTop - oGame.ai.paddle.speed;
      }
      if( oBallOffset.top + oGame.ball.diameter > iNewTop + oGame.ai.paddle.height ) {
        iNewTop = iNewTop + oGame.ai.paddle.speed;
      }
    }
    
    // make sure it can't go farther up than the baseline
    if( iNewTop < 0 ) {
      iNewTop = 0;
    }
    
    // make sure it can't go farther down than its height
    if( iNewTop >= $(window).height() - oPaddle.height ) {
      iNewTop = $(window).height() - oPaddle.height;
    }
    
    // update the position
    oNewOffset = { top: iNewTop, left: oOffset.left };
    oGame.ai.element.offset( oNewOffset );
    
    // we're no longer waiting
    bWaiting = false;
  };
  
  // start a new game
  var StartGame = function(){
    // hide the menu
    oStartButton.parent().hide();

    // show game
    $( '#game' ).removeClass( 'hidden' );
    
    // start the game
    ListenForInput();
    setInterval(
      function(){
        if( !bGameOver ) {
          oGame.ball.update();
          if( !bWaiting ) {
            iWaitTime = Math.round( Math.random() * 20 ) + 1 + 150;
            setTimeout( CalculateAIPaddlePosition, iWaitTime );
            bWaiting = true;
          }
        }
      },
      1000 / oGame.fps
    );
  };
  
  // set how to start the game
  oStartButton.on('click', StartGame );
  
  // set how to start the game
  oRestartButton.on(
    'click',
    function() {
      oGame.init();
      bGameOver = false;
      $( '#game-over' ).addClass( 'hidden' );
    });
});