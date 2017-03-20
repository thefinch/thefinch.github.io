states.main = {
    // keep track of variables
    player : null,
    playerHealthBar :null,
    blocks : null,
    bullets : null,
    enemies :null,
    left : null,
    right : null,
    up : null,
    facing : 'right',
    fireRate : 200,
    nextFire : 0,
    
    // load our assets
    preload : function() {
        game.load.crossOrigin = true;
        game.load.image( 'block', 'assets/floor.png' );
        game.load.image( 'player', 'assets/character.png' );
        game.load.image( 'bullet', 'assets/bullet.png' );
        game.load.image( 'knockdown', 'assets/knockdown.png' );
        game.load.image( 'health', 'assets/health.png' );
        game.load.image( 'bad-guy', 'assets/bad-guy.png' );
    },

    // run at the very beginning to add all entities
    create : function() {
        // set the world bounds
        game.world.setBounds( 0, 0, game.width, game.height );
        
        // keep track of the blocks
        this.blocks = game.add.group();
        
        // keep track of the bullets
        this.bullets = game.add.group();
        
        // keep track of enemies
        this.enemies = game.add.group();
        
        // build the level
        this.buildLevel();
        
        // enable physics in the world
        game.physics.startSystem( Phaser.Physics.ARCADE );
        game.physics.arcade.gravity.y = 1000;
        
        // create the player
        this.player = this.createPlayer( 64, game.world.height - 64 );
        this.player.maxHealth = 5;
        this.player.health = this.player.maxHealth;
        this.facing = 'right';
        
        // create the player's health bar
        this.playerHealthBar = this.createHealthBar( this.player.x, this.player.y );
        
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

    update : function() {
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
        
        // check for enemy collisions with the play
        game.physics.arcade.overlap( this.player, this.enemies, this.playerHitEnemy, function(){}, this ); 
                
        // handle user input
        this.handlePlayerMovement();
        
        // position player's health bar
        this.playerHealthBar.x = this.player.x;
        this.playerHealthBar.y = this.player.y - 17;
        
        // handle enemy movement
        this.handleEnemyMovement();
    },
    
    handleEnemyMovement() {
        this.enemies.forEach(function(enemy){
            enemy.healthBar.x = enemy.x;
            enemy.healthBar.y = enemy.y - 17;
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
        
        // knockdown a block if needed
        enemy.health--;
        
        // shrink the enemy's health bar
        enemy.healthBar.scale.setTo( ( 2 / enemy.maxHealth ) * enemy.health, 0.5 );
        
        if( enemy.health === 0 ) {
            enemy.kill();
        }
    },
    
    blockHitBlock( block1, block2 ) {
        // stop the blocks from falling
        block1.body.allowGravity = false;
        block2.body.allowGravity = false;
        
        // don't let the blocks move anymore
        block1.body.immovable = true;
        block2.body.immovable = true;
    },

    // fade the player in an out
    flashPlayer()
    {
        if( this.player.alpha === 1.0 )
        {
            this.player.alpha = 0.5;
        }
        else
        {
            this.player.alpha = 1.0;    
        }
    },
    
    playerHitEnemy( player, enemy )
    {
        // reduce the player's health
        if( player.health !== 0 ) {
            player.health--;
        }
        
        // shrink the player's health bar
        this.playerHealthBar.scale.setTo( ( 2 / this.player.maxHealth ) * player.health, 0.5 );
        
        // flash the player in and out of existence
        game.time.events.repeat( Phaser.Timer.SECOND / 6, 6, this.flashPlayer, this );
        
        // pull the player away from the enemy        
        if( player.body.bottom == enemy.body.top ) {
            player.body.velocity.y = -200;
        }
        if( player.body.right < enemy.body.right ) {
            player.body.velocity.x = -200;
        }
        else {
            player.body.velocity.x = 200;
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
        bullet.body.allowGravity = false;
        
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
        block.body.allowGravity = false;
        
        return block;
    },
    
    createPlayer : function( x, y ) {
        // create the player
        var player = game.add.sprite( x, y, 'player' );
        player.anchor.setTo( 0.5, 0.5 );
                
        // enable physics on the player
        game.physics.arcade.enable( player );
        player.body.collideWorldBounds = true;
        player.body.maxVelocity.x = 600;
        
        return player;
    },
    
    createEnemy : function( x, y ) {
        // create the enemy
        var enemy = this.enemies.create( x, y, 'bad-guy' );
        enemy.anchor.setTo( 0.5, 0.5 );
                
        // enable physics on the enemy
        game.physics.arcade.enable( enemy );
        enemy.body.collideWorldBounds = true;
        
        // set attributes 
        enemy.health = 5;
        enemy.maxHealth = 5;
        
        // give the enemy a health bar
        enemy.healthBar = this.createHealthBar( enemy.x, enemy.y )
        
        return enemy;
    },
    
    createHealthBar : function( x, y ) {
        // create the healthbar
        var healthbar = game.add.sprite( x, y, 'health' );
        healthbar.anchor.setTo( 0.5, 0.5 );
        
        healthbar.scale.setTo( 2, 0.5 );
        
        return healthbar;
    },
    
    render : function() {        
        game.debug.cameraInfo(game.camera, 32, 32);
    },
    
    jump : function() {
        this.player.body.velocity.y = -400;
    },
};

// add the state to the game
game.state.add( 'main', states.main );