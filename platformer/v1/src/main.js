states.main = {
    // keep track of variables
    player : null,
    blocks : {},
    left : null,
    right : null,
    up : null,
    jumping : false,
    facing : 'right',
    maxVelocityX : 500,
    
    // load our assets
    preload : function() {
        game.load.crossOrigin = true;
        game.load.image( 'floor', 'assets/floor.png' );
        game.load.image( 'player', 'assets/character.png' );
        
        game.load.spritesheet( 'player-sprites', 'assets/megaman.png', 36, 43 );
    },

    // run at the very beginning to add all entities
    create : function() {
        // set the world bounds
        game.world.setBounds( 0, 0, 1600, 1600 );
        
        // add the player player
        this.player = game.add.sprite( 32, game.world.height - 64, 'player-sprites' );
        this.player.anchor.setTo( 0.5, 0.5 );
        
        // setup animations from the sprites
        this.player.animations.add( 'standing', [ 0, 1, 2] );
        this.player.animations.play( 'standing', 1, true );
        
        // keep track of the map
        this.blocks = new Map();
        
        // add the floor and ceiling
        var block;
        var blockCounter = 0;
        for( col = 0; col < 100; ++col ) {
            this.blocks.set( "block" + blockCounter++, this.createBlock( col * 16, game.world.height - 16 ) );
            this.blocks.set( "block" + blockCounter++, this.createBlock( col * 16, 0 ) );
        }
        
        // add the sides
        for( row = 0; row < 100; ++row ) {
            this.blocks.set( "block" + blockCounter++, this.createBlock( 0, row * 16 ) );
            this.blocks.set( "block" + blockCounter++, this.createBlock( game.world.width - 16, row * 16 ) );
        }
        
        // add spots to jump to
        for( col = 0; col < 10; ++col ) {
//             this.blocks.set( "block" + blockCounter++, this.createBlock( col * 16, game.world.height - 80 ) );
            this.blocks.set( "block" + blockCounter++, this.createBlock( col * 16 + 300, game.world.height - 120 ) );
            this.blocks.set( "block" + blockCounter++, this.createBlock( col * 16 + 100, game.world.height - 180 ) );
        }
        
        // enable physics in the world
        game.physics.startSystem( Phaser.Physics.ARCADE );
        
        // enable physics on the player
        game.physics.arcade.enable( this.player );
        this.player.body.gravity.y = 1000;
        this.maxVelocityX = 600;

        // add controls for the player        
        this.left = game.input.keyboard.addKey( Phaser.Keyboard.A );
        this.right = game.input.keyboard.addKey( Phaser.Keyboard.D );
        this.up = game.input.keyboard.addKey( Phaser.Keyboard.W );
        this.jumping = false;
        this.facing = 'right';
        
        // setup the camera
        game.camera.setBoundsToWorld();
        game.camera.follow( this.player, Phaser.Camera.FOLLOW_PLATFORMER, 0.1, 0.1 );
    },

    // do nothing each framwe
    update : function() {
        // check for collisions with the world
        for( var [ key, block ] of this.blocks ) {
            // check for a collision
            if( game.physics.arcade.collide( this.player, block ) ) {
                // allow jumping if the player is on the ground
                console.log(
                    this.player.body.y,
                    this.player.body.y + this.player.body.height / 2,
                    block.body.y,
                    block.body.y - block.body.height / 2
                );
//                 if( this.player.body.y + this.player.body.height / 2 === block.body.y - block.body.height / 2 ) {
//                     this.jumping = false;
//                 }
                if( this.player.body.y <= block.body.y ) {
                    this.jumping = false;
                }
                var rect = new Phaser.Rectangle( block.body.x, block.body.y, block.body.width, block.body.height ) ;
                game.debug.geom( rect, 'rgba(255,0,0,1)' ) ;
            }
        }
        
        // move left
        if( this.left.isDown ) {
            if( this.facing === 'right' ) {
                this.player.body.velocity.x = 0;
            }
            if( this.player.body.velocity.x > -this.maxVelocityX ) {
                this.player.body.velocity.x -= 10;
            }
            this.facing = 'left';
        }
        // move right
        else if( this.right.isDown ) {
            if( this.facing === 'left' ) {
                this.player.body.velocity.x = 0;
            }
            if( this.player.body.velocity.x < this.maxVelocityX ) {
                this.player.body.velocity.x += 10;
            }
            this.facing = 'right';
        }
        // slow down
        else {
            if( this.player.body.velocity.x > 0 ) {
                this.player.body.velocity.x -= 15;
              
                if( this.player.body.velocity.x < 0 ) {
                    this.player.body.velocity.x = 0;
                }
            }
            else if( this.player.body.velocity.x < 0  ) {
                this.player.body.velocity.x += 15;
                
                if( this.player.body.velocity.x > 0 ) {
                    this.player.body.velocity.x = 0;
                }
            }
        }
        
        // handle jumping
        if( this.up.isDown && !this.jumping ) {
            this.jump();
        }
    },
    
    createBlock : function( x, y ) {
         var block = game.add.sprite( x, y, 'floor' );
            
         game.physics.arcade.enable( block );
         block.anchor.setTo( 0.5, 0.5 );
         block.body.collideWorldBounds = true;
         block.body.immovable = true;
        
        return block;
    },
    
    render : function() {
        game.debug.pixel( this.player.body.x, this.player.body.y, 'rgba(0,255,255,1)' ) ;
        
        game.debug.spriteInfo( this.player, 16, 16 );
        
        var rect = new Phaser.Rectangle( this.player.body.x, this.player.body.y, this.player.body.width, this.player.body.height ) ;
        game.debug.geom( rect, 'rgba(255,0,0,1)' ) ;
        
//         game.debug.bodyInfo( this.player, 16, 16 );
//         game.debug.cameraInfo( game.camera, 16, 16 );
    },
    
    jump : function() {
        this.player.body.velocity.y = -400;
        this.jumping = true;
    },
    
    moveLeft : function() {
        this.player.x += -100;
    },
    moveRight : function() {
        this.player.x += 100;
    }
};

// add the state to the game
game.state.add( 'main', states.main );