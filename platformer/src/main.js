states.main = {
    // keep track of variables
    player : null,
    blocks : null,
    bullets : null,
    enemies : null,
    collectibles : null,
    left : null,
    right : null,
    up : null,
    facing : 'right',
    fireRate : 200,
    nextFire : 0,
    
    // load our assets
    preload() {
        game.load.crossOrigin = true;
        game.load.image( 'block', 'assets/floor.png' );
        game.load.image( 'player', 'assets/character.png' );
        game.load.image( 'bullet', 'assets/bullet.png' );
        game.load.image( 'knockdown', 'assets/knockdown.png' );
        game.load.image( 'health', 'assets/health.png' );
        game.load.image( 'bad-guy', 'assets/bad-guy.png' );
    },

    // run at the very beginning to add all entities
    create() {
        // set the world bounds
        game.world.setBounds( 0, 0, game.width, game.height );
        
        // keep track of the blocks
        this.blocks = game.add.group();
        
        // keep track of the bullets
        this.bullets = game.add.group();
        
        // keep track of enemies
        this.enemies = game.add.group();
        
        // keep track of collectibles
        this.collectibles = game.add.group();
        
        // build the level
        this.buildLevel();
        
        // enable physics in the world
        game.physics.startSystem( Phaser.Physics.ARCADE );
        game.physics.arcade.gravity.y = 1000;
        
        // create the player
        this.player = this.createPlayer( 64, game.world.height - 64 );
        this.facing = 'right';
        
        // create enemy
        this.createEnemy( 500, game.world.height - 64 );
        
        // add controls for the player        
        this.left  = game.input.keyboard.addKey( Phaser.Keyboard.A );
        this.right = game.input.keyboard.addKey( Phaser.Keyboard.D );
        this.up    = game.input.keyboard.addKey( Phaser.Keyboard.W );
        this.shoot = game.input.activePointer.leftButton;
        
        // setup the camera
        game.camera.setBoundsToWorld();
        game.camera.follow( this.player, Phaser.Camera.FOLLOW_PLATFORMER, 0.1, 0.1 );
    },

    update() {
        // handle shooting
        if( this.shoot.isDown ) {
            this.pewpew();
        }
        
        // check for player collisions with the world
        game.physics.arcade.collide( this.player, this.blocks ); 
        
        // check for bullet collisions with blocks
        game.physics.arcade.overlap( this.bullets, this.blocks, this.bulletHitBlock );
        
        // check for bullet collisions with enemies
        game.physics.arcade.overlap( this.bullets, this.enemies, this.bulletHitEnemy );
        
        // check for the world colliding with itself
        game.physics.arcade.collide( this.blocks, this.blocks, this.blockHitBlock ); 
        
        // check for enemy collisions with the world
        game.physics.arcade.collide( this.enemies, this.blocks );
        
        // check for enemy collisions with the player
        game.physics.arcade.overlap( this.player, this.enemies, this.playerHitEnemy, function(){}, this ); 
        
        // check for player collisions with collectibles
        game.physics.arcade.overlap( this.player, this.collectibles, this.playerHitCollectible ); 
        
        // handle user input
        this.handlePlayerMovement();
        
        // position player's health bar
        this.player.healthbar.position.setTo( this.player.x, this.player.y - 17 );
        Health.checkHide( this.player.healthbar );
        
        // handle enemy movement
        this.updateEnemies();
        
        // make collectibles move
        this.collectibles.callAll( 'move' );
    },
    
    updateEnemies() {
        var check = Health.checkHide;
        var player = this.player;
        this.enemies.forEach(function(enemy){
            // position the health bar
            enemy.healthbar.position.setTo( enemy.x, enemy.y - 17 );
            
            // check if we need to hide the healthbar
            check( enemy.healthbar );
          
            // move the enemy
            enemy.move( player );
        });
    },
    
    bulletHitBlock( bullet, block ) {        
        // get rid of the bullet
        bullet.kill();
        
        // knockdown a block if needed
        if( block.key === 'knockdown' ) {
            block.health--;
            if( block.health === 0 ) {
                block.body.allowGravity = true;
                block.body.immovable = false;
            }
        }
    },
    
    bulletHitEnemy( bullet, enemy ) {        
        // get rid of the bullet
        bullet.kill();
        
        // show the health bar if it's not already there
        enemy.healthbar.alpha = 1;

        // set the next hide time
        enemy.healthbar.nextHide = game.time.time + enemy.healthbar.hideRate;
                
        // decrease the enemy's health
        if( enemy.health !== 0 ) {
            enemy.health--;
        }
        
        // shrink the enemy's health bar
        enemy.healthbar.scale.setTo( ( 2 / enemy.maxHealth ) * enemy.health, 0.5 );
        
        // get rid of the enemy if needed
        if( enemy.health === 0 ) {
            enemy.kill();
        }
    },
    
    // set what happens
    blockHitBlock( block1, block2 ) {
        // stop the blocks from falling
        block1.body.allowGravity = false;
        block2.body.allowGravity = false;
        
        // don't let the blocks move anymore
        block1.body.immovable = true;
        block2.body.immovable = true;
    },

    // fade the player in and out
    flashPlayer()
    {
        this.player.alpha = this.player.alpha == 1.0 ? 0.5 : 1.0;
    },
    
    // set what happens when the player hits an enemy
    playerHitEnemy( player, enemy )
    {        
        // pull the player away from the enemy  
        var keepAway = 5;
        if( player.body.velocity.y > 0 ) {
            player.body.y -= keepAway;
            player.body.velocity.y = -200;
        }
        if( player.body.right < enemy.body.right ) {
            player.body.x -= keepAway;
            player.body.velocity.x = -200;
        }
        else {
            player.body.x += keepAway;
            player.body.velocity.x = 200;
        }
      
        // show the player's health bar if it's not already there
        this.player.healthbar.alpha = 1;

        // set the next hide time
        this.player.healthbar.nextHide = game.time.time + this.player.healthbar.hideRate;

        // reduce the player's health
        if( player.health !== 0 ) {
            player.health--;
        }
        
        // shrink the player's health bar
        this.player.healthbar.scale.setTo( ( 2 / this.player.maxHealth ) * player.health, 0.5 );
        
        // flash the player in and out of existence
        game.time.events.repeat( Phaser.Timer.SECOND / 6, 6, this.flashPlayer, this );
    },
    
    playerHitCollectible( player, collectible ) {  
        // check if we hit a health collectible
        if( collectible.key == 'health' ) {
            // check if we need to collect the health
            if( player.health < player.maxHealth ) {
                // increase player's health and scale the health bar
                player.health++;
                player.healthbar.scale.setTo( ( 2 / player.maxHealth ) * player.health, 0.5 );
                
                // get rid of the collectible
//                 collectible.kill();
            }
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
        block = this.createBlock( 0, game.world.height, 'block' );
        block.scale.setTo( game.world.width / 16, 1 );     
        
        // add the ceiling
        block = this.createBlock( 0, 0, 'block' );
        block.scale.setTo( game.world.width / 16, 1 );
        
        // add the left wall
        block = this.createBlock( 0, 0, 'block' );
        block.scale.setTo( 1, 100 );
        
        // add the right wall
        block = this.createBlock( game.world.width, 0, 'block' );
        block.scale.setTo( 1, 100 );
        
        // add spots to jump to
        for( col = 0; col < 10; ++col ) {
            this.createBlock( col * 16, game.world.height - 80, 'block' );
            this.createBlock( col * 16 + 300, game.world.height - 120, 'block' );
            this.createBlock( col * 16 + 500, game.world.height - 180, 'block' );
        }
        
        // add all the collectibles
        this.createHealthBlock( ( col - 1 ) * 16 + 500, game.world.height - 180 - 24 );
      
        // add a knockdown section
        block = this.createBlock( ( col - 1 ) * 16 + 500, game.world.height - 180 + 32, 'knockdown' );
        block.scale.setTo( 1, 3 );
    },
    
    handlePlayerMovement() {
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
    
    // creates a bullet the given location and
    // sends it in the direction of the cursor
    createBullet( x, y ) {
        // create sprite
        var bullet = this.bullets.create( x, y, 'bullet' );
        bullet.scale.setTo( 5, 5 );
            
        // enable physics
        game.physics.arcade.enable( bullet );
        bullet.anchor.setTo( 0.5, 0.5 );
        bullet.body.collideWorldBounds = true;
        bullet.body.allowGravity = false;
        
        // shoot in direction of mouse from player
        this.physics.arcade.velocityFromRotation(
            game.physics.arcade.angleToPointer( this.player ),
            1000,
            bullet.body.velocity
        );
        
        return bullet;
    },
    
    // creates a block of the given type at the given location
    createBlock( x, y, type ) {
        // create the sprite
        var block = this.blocks.create( x, y, type );
            
        // enable physics
        game.physics.arcade.enable( block );
        block.anchor.setTo( 0.5, 0.5 );
        block.body.collideWorldBounds = true;
        block.body.immovable = true;
        block.body.allowGravity = false;
        
        return block;
    },
    
    // creates the player at the given location
    createPlayer( x, y ) {
        // create the player
        var player = game.add.sprite( x, y, 'player' );
        player.anchor.setTo( 0.5, 0.5 );
                
        // enable physics on the player
        game.physics.arcade.enable( player );
        player.body.collideWorldBounds = true;
        player.body.maxVelocity.x = 600;
        
        // give the enemy a health bar
        player.maxHealth = 5;
        player.health    = player.maxHealth;
        player.healthbar = Health.create( player.x, player.y );
        
        return player;
    },
    
    // creates an enemy at the given location
    createEnemy( x, y ) {
        // create the enemy
        var enemy = this.enemies.create( x, y, 'bad-guy' );
        enemy.anchor.setTo( 0.5, 0.5 );
                
        // enable physics on the enemy
        game.physics.arcade.enable( enemy );
        enemy.body.collideWorldBounds = true;
        
        // set attributes 
        enemy.health = 5;
        enemy.maxHealth = 5;
        enemy.body.maxVelocity.x = 200;
        
        // give the enemy a health bar
        enemy.healthbar = Health.create( enemy.x, enemy.y );
      
        // set how this moves
        enemy.move = function( player ) {
            if( this.body.x > player.body.x ) {
                this.body.x -= 1;
            }
            else if( this.body.x < player.body.x ) {
                this.body.x += 1;
            }
        };
        
        return enemy;
    },
        
    // creates a health block at the given location
    createHealthBlock( x, y ) {
        var healthBlock = this.collectibles.create( x, y, 'health' );
        healthBlock.anchor.setTo( 0.5, 0.5 );
        healthBlock.scale.setTo( 0.5, 0.5 );
        
        game.physics.arcade.enable( healthBlock );
        healthBlock.body.allowGravity = false;
        
        // set attributes
        healthBlock.originalY = y;
        healthBlock.variation = 5;
        healthBlock.direction = 'up';
        healthBlock.moveRate = 35;
        healthBlock.nextMove = 0;
      
        // add move function
        healthBlock.move = function(){
            this.rotation += Phaser.Math.degToRad( 1.0 ) ;
            
            // slow down rate of fire
            if( game.time.time < this.nextMove ) {
                return;
            }
            
            if( this.direction == 'up' ) {
                if( this.body.y > this.originalY - this.variation ) {
                    this.body.y--;
                }
                else {
                    this.direction = 'down';
                }
            }
            else {
                if( this.body.y < this.originalY + this.variation ) {
                    this.body.y++;
                }
                else {
                    this.direction = 'up';
                }
            }
            
            // set when the we can move again
            this.nextMove = game.time.time + this.moveRate;
        };
        
        return healthBlock;
    },
    
    render() {        
//        game.debug.bodyInfo(this.player, 32, 32); 
    },
    
    // makes the player jump
    jump() {
        this.player.body.velocity.y = -400;
    },
};

// add the state to the game
game.state.add( 'main', states.main );