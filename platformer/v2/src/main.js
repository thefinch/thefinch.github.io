states.main = {
    // keep track of variables
    player : null,
    blocks : null,
    bullets : null,
    left : null,
    right : null,
    up : null,
    facing : 'right',
    fireRate : 200,
    nextFire : 0,
    
    // load our assets
    preload : function() {
        game.load.crossOrigin = true;
        game.load.image( 'floor', 'assets/floor.png' );
        game.load.image( 'player', 'assets/character.png' );
        game.load.image( 'bullet', 'assets/bullet.png' );
        game.load.image( 'knockdown', 'assets/knockdown.png' );
    },

    // run at the very beginning to add all entities
    create : function() {
        // set the world bounds
        game.world.setBounds( 0, 0, 1600, 1600 );
        
        // keep track of the blocks
        this.blocks = game.add.group();
        
        // keep track of the bullets
        this.bullets = game.add.group();
        
        // build the level
        this.buildLevel();
        
        // enable physics in the world
        game.physics.startSystem( Phaser.Physics.ARCADE );
        
        // create the player
        this.player = this.createPlayer( 64, game.world.height - 64 );
        this.facing = 'right';
        
        // add controls for the player        
        this.left  = game.input.keyboard.addKey( Phaser.Keyboard.A );
        this.right = game.input.keyboard.addKey( Phaser.Keyboard.D );
        this.up    = game.input.keyboard.addKey( Phaser.Keyboard.W );
        this.shoot = game.input.activePointer.leftButton;
        
        // setup the camera
        game.camera.setBoundsToWorld();
        game.camera.follow( this.player, Phaser.Camera.FOLLOW_PLATFORMER, 0.1, 0.1 );
    },

    update : function() {
        // handle shooting
        if( this.shoot.isDown ) {
            this.pewpew();
        }
        
        // check for player collisions with the world
        game.physics.arcade.collide( this.player, this.blocks ); 
        
        // check for bullet collisions with blocks
        game.physics.arcade.collide( this.bullets, this.blocks, this.bulletHitBlock );
        
        // check for the world colliding with itself
        game.physics.arcade.collide( this.blocks, this.blocks, this.blockHitBlock ); 
                
        // handle user input
        this.handlePlayerMovement();
    },
    
    bulletHitBlock( bullet, block ) {        
        // get rid of the bullet
        bullet.kill();
        
        // knockdown a block if needed
        if( block.key === 'knockdown' ) {
            block.health--;
            if( block.health <= 0 ) {
                block.body.gravity.y = 1000;
                block.body.immovable = false;
            }
        }
    },
    
    blockHitBlock( block1, block2 ) {
        // stop the blocks from moving
        if( block1.body.gravity.y > 0 ) {
            block1.body.velocity.y = 0;
            block1.body.gravity.y = 0;
            block1.body.immovable = true;
        }
        if( block2.body.gravity.y > 0 ) {
            block2.body.gravity.y = 0;
            block2.body.velocity.y = 0;
            block2.body.immovable = true;
        }
    },
    
    pewpew() {
        // slow down rate of fire
        if( game.time.time < this.nextFire ) {
            return;
        }
        
        // create a bullet and shoot it from the player
        var bulletX = this.player.body.x + this.player.body.width / 2;
        var bulletY = this.player.body.y + this.player.body.height / 2;
        this.createBullet( bulletX, bulletY );
        
        // set when the gun can fire again
        this.nextFire = game.time.time + this.fireRate;
    },
    
    buildLevel() {     
        // add the floor and ceiling
        var block;
        var blockCounter = 0;
        
        // add the floor
        block = this.createBlock( 0, game.world.height, 'floor' );
        block.scale.setTo( 100, 1 );     
        
        // add the ceiling
        block = this.createBlock( 0, 0, 'floor' );
        block.scale.setTo( 100, 1 );
        
        // add the left wall
        block = this.createBlock( 0, 0, 'floor' );
        block.scale.setTo( 1, 100 );
        
        // add the right wall
        block = this.createBlock( game.world.width, 0, 'floor' );
        block.scale.setTo( 1, 100 );
        
        // add spots to jump to
        for( col = 0; col < 10; ++col ) {
            this.createBlock( col * 16, game.world.height - 80, 'floor' );
            this.createBlock( col * 16 + 300, game.world.height - 120, 'floor' );
            this.createBlock( col * 16 + 500, game.world.height - 180, 'floor' );
        }
      
        // add a knockdown section
        block = this.createBlock( ( col - 1 ) * 16 + 500, game.world.height - 180 + 32, 'knockdown' );
        block.scale.setTo( 1, 3 );
    },
    
    handlePlayerMovement : function() {
        // move left
        if( this.left.isDown ) {
            // stop moving if the player changes direction
            if( this.facing === 'right' ) {
                this.player.body.velocity.x = 0;
            }
            
            // increase speed if we haven't hit max velocity
            if( this.player.body.velocity.x > -this.player.body.maxVelocity.x )
            {
                this.player.body.velocity.x -= 10;
            }
            
            // set current facing
            this.facing = 'left';
        }
        // move right
        else if( this.right.isDown ) {
            // stop moving if the player changes direction
            if( this.facing === 'left' ) {
                this.player.body.velocity.x = 0;
            }
            
            // increase speed if we haven't hit max velocity
            if( this.player.body.velocity.x < this.player.body.maxVelocity.x )
            {
                this.player.body.velocity.x += 10;
            }
            
            // set current facing
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
        if( this.up.isDown && this.player.body.touching.down ) {
            this.jump();
        }
    },
    
    createBullet : function( x, y ) {
        // create sprite
        var bullet = this.bullets.create( x, y, 'bullet' );
        bullet.scale.setTo( 5, 5 );
            
        // enable physics
        game.physics.arcade.enable( bullet );
        bullet.anchor.setTo( 0.5, 0.5 );
        bullet.body.collideWorldBounds = true;
        
        // shoot in direction direction of mouse from player
        this.physics.arcade.velocityFromRotation(
            game.physics.arcade.angleToPointer( this.player ),
            1000,
            bullet.body.velocity
        );
        
        return bullet;
    },
    
    createBlock : function( x, y, type ) {
        // create the sprite
        var block = this.blocks.create( x, y, type );
            
        // enable physics
        game.physics.arcade.enable( block );
        block.anchor.setTo( 0.5, 0.5 );
        block.body.collideWorldBounds = true;
        block.body.immovable = true;
        
        return block;
    },
    
    createPlayer : function( x, y ) {
        // create the player
        var player = game.add.sprite( x, y, 'player' );
        player.anchor.setTo( 0.5, 0.5 );
                
        // enable physics on the player
        game.physics.arcade.enable( player );
        player.body.gravity.y = 1000; // @todo change this to world gravity
        player.body.collideWorldBounds = true;
        player.body.maxVelocity.x = 600;
        
        return player;
    },
    
    render : function() {        
//         game.debug.spriteInfo( this.player, 16, 16 );
        
//         var rect = new Phaser.Rectangle( this.player.body.x, this.player.body.y, this.player.body.width, this.player.body.height );
//         game.debug.geom( rect, 'rgba(255,0,0,0.5)' );
    },
    
    jump : function() {
        this.player.body.velocity.y = -400;
    },
};

// add the state to the game
game.state.add( 'main', states.main );