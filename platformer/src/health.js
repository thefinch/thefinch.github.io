var Health =  {
    // creates a health bar
    create( x, y ) {
        // create the healthbar
        var healthbar = game.add.sprite( x, y, 'health' );
        healthbar.anchor.setTo( 0.5, 0.5 );        
        healthbar.scale.setTo( 2, 0.5 );
      
        healthbar.hideRate = 1000 * 10;
        healthbar.nextHide = game.time.time + healthbar.hideRate;
        
        return healthbar;
    },
  
    // checks if the given health bar needs to fade
    checkHide( healthbar ) {
        if( healthbar.alpha == 1
            && game.time.time > healthbar.nextHide )
        {
            // fade out the health bar
            game.add.tween( healthbar ).to( { alpha: 0 }, 300, Phaser.Easing.Linear.None, true, 0, 0, false);
        }
    }
};