class Platformer extends Phaser.Scene{
    constructor(){
        super("platformerScene");
    }

    init(){
        this.gameOver = false;
        this.playerHit = false;
        this.lives = 3;
        this.score = 0;
        this.isBlinking = false;

        this.ACCELERATION = 500
        this.MAX_X_VEL = 200
        this.MAX_Y_VEL = 2000
        this.DRAG = 600    
        this.JUMP_VELOCITY = -750;

        this.BULLET_VELOCITY = 600;
        this.BULLET_ANGLE = 0;
        this.BULLET_OFFSET_X = 36;
        this.BULLET_OFFSET_Y = 0;
        this.BULLET_ROTATE = false;
        this.lastFired = 0;
        this.fireRate = 200;

        this.PARTICLE_VELOCITY = 50;

        this.seenHive = false;
        this.hiveAlive = true;
        this.beeSpawnDelay = 5000;
        // this.beeSpawn_X = this.player.x + this.cameras.main.width + 50;

        this.initialPlayerX = 100;
        this.initialPlayerY = 440;
    }

    create(){ 
        document.getElementById('description').innerHTML = '<h2>Controls: </h2>Left Cursor: move left <br> Right Cursor: move right <br> Up Cursor: jump <br> Down Cursor: crouch <br> D: Aim Up <br> Space: shoot <h2>How To Play: </h2>Shoot then enemies to defend yourself. <br> <br> Get to the end of the level and kill the boss and grab the trophy.<h2>GOOD LUCK!!</h2>';
        // map
        this.map = this.add.tilemap("level1", 16, 16, 270, 20);

        //tilesets
        this.tilesetBackground = this.map.addTilesetImage("background", "grayBackground");
        this.tilesetTerrain = this.map.addTilesetImage("Terrain", "terrain_tiles");
        this.tilesetSpikes = this.map.addTilesetImage("Spikes", "spikes");
        this.tilesetItems = this.map.addTilesetImage("coins", "coins")
        this.tilesetLedge = this.map.addTilesetImage("fallingForm", "fallingLedge")
        this.tilesetEnd = this.map.addTilesetImage("trophy", "trophy");
        // layers
        this.backgroundLayer = this.map.createLayer("Background", this.tilesetBackground, 0, 0);
        this.backgroundLayer.setScale(SCALE);
        // this.spikes = this.map.getObjectLayer("Spikes").objects;

        this.groundLayer = this.map.createLayer("Ground", [this.tilesetTerrain, this.tilesetSpikes, this.tilesetLedge], 0,0)
        this.groundLayer.setScale(SCALE);

        this.groundLayer.setCollisionByProperty({ 
            collides: true 
        })

        // Text
        this.livesText = this.add.text(96, 64, 'Lives: 3',
        { 
            fontFamily: 'Times, serif',
            color:'#C70039',
            fontSize: '32px'
        }).setOrigin(0.5);
        this.livesText.setScrollFactor(0);

        this.scoreText = this.add.text(this.game.config.width - 96, 64, 'Score: 0',
        { 
            fontFamily: 'Times, serif',
            color:'#C70039',
            fontSize: '32px'
        }).setOrigin(0.5);
        this.scoreText.setScrollFactor(0);
        
        // // define a render debug so we can see the tilemap's collision bounds
        //     const debugGraphics = this.add.graphics().setAlpha(0.75)
        //     this.groundLayer.renderDebug(debugGraphics, {
        //         tileColor: null,    // color of non-colliding tiles
        //         collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),    // color of colliding tiles
        //         faceColor: new Phaser.Display.Color(40, 39, 37, 255)                // color of colliding face edges
        //     });

        //spikes
        const spikeLayer = this.map.getObjectLayer('Spikes');
        this.spikesGroup = this.physics.add.staticGroup();
        spikeLayer.objects.forEach((spike) => {
            const spikeSprite = this.spikesGroup.create(spike.x * SCALE, (spike.y - spike.height) * SCALE, 'spikes');
            spikeSprite.setScale(SCALE);
            spikeSprite.setOrigin(0);
            spikeSprite.refreshBody();
            spikeSprite.body.setSize(spike.width * SCALE, (spike.height * SCALE)/2);
            spikeSprite.body.setOffset(0, spike.height);
        })

        //falling ledges
        const ledgeLayer = this.map.getObjectLayer('fallingForms');
        this.ledgesGroup = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });
        ledgeLayer.objects.forEach((ledge) =>{
            const ledgeSprite = this.ledgesGroup.create(ledge.x * SCALE, (ledge.y - ledge.height) * SCALE, "fallingLedge");
            ledgeSprite.setScale(SCALE);
            ledgeSprite.setOrigin(0);
            ledgeSprite.refreshBody();
        })
        //coins
        const coinsLayer = this.map.getObjectLayer('coins');
        this.coinsGroup = this.physics.add.staticGroup();
        coinsLayer.objects.forEach((coin) => {
            const coinSprite = this.coinsGroup.create(coin.x * SCALE, (coin.y - coin.height) * SCALE, 'coins', 5);
            coinSprite.setScale(SCALE);
            coinSprite.setOrigin(0);
            coinSprite.refreshBody();
            coinSprite.body.setSize(coin.width/2, coin.height/2)
            coinSprite.anims.play("coinSpin");
        })

        // trees
        const treesLayer = this.map.getObjectLayer('Trees');
        this.treesGroup = this.physics.add.group();
        treesLayer.objects.forEach((tree) => {
            const treeSprite = this.treesGroup.create(tree.x * SCALE, (tree.y - tree.height) * SCALE - 10, 'tree');
            treeSprite.setScale(2.5);
            treeSprite.setOrigin(0);
            treeSprite.refreshBody();
            treeSprite.body.setSize(tree.width/2 - 11, tree.height -7);
            treeSprite.body.setOffset(tree.width/2 - 10, 7);
            treeSprite.anims.play("treeWalk");
            treeSprite.setData('hits', 0);            
            //start the motion
            this.initTreeMotion(treeSprite, tree.x * SCALE)
        })

        // tree bullets
        this.treeBulletsGroup = this.physics.add.group({
            defaultKey: 'treeBullet',
            maxSize: Infinity
        })

        // turtles
        const turtleLayer = this.map.getObjectLayer('turtles');
        this.turtlesGroup = this.physics.add.group();
        turtleLayer.objects.forEach((turtle) =>{
            const turtleSprite = this.turtlesGroup.create(turtle.x * SCALE + 50, (turtle.y - turtle.height) * SCALE, "turtle").setScale(1);
            
            this.initTurtleMotion(turtleSprite, turtle.x * SCALE)
        })
        // gravity and physics
        this.physics.world.gravity.y = 2000
        this.physics.world.bounds.setTo(0, 0, this.map.widthInPixels *2, this.map.heightInPixels * 2);
        console.log(this.map.widthInPixels)

        // main player
        this.player = this.physics.add.sprite(this.initialPlayerX, this.initialPlayerY, 'haloGuy').setScale(SCALE);
        this.player.body.setSize(this.player.width/2 - 5, this.player.height - 15)
        this.player.body.setOffset(this.player.width / 4 + 3, 15);
        this.player.body.setMaxVelocity(this.MAX_X_VEL, this.MAX_Y_VEL)
        this.player.body.setCollideWorldBounds(true)
        this.player.setDepth(10);
        this.player.play('idle');

        // bullets
        this.bulletsGroup = this.physics.add.group({
            defaultKey: 'bullets',
            maxSize: Infinity,
        })

        //camera
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels *2, this.map.heightInPixels * 2)
        this.cameras.main.startFollow(this.player, true, 0.25, 0) // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, this.scale.height * 1.5);
        this.cameras.main.setZoom(1);

        //vfx
        my.vfx.walking = this.add.particles(0,0, 'dust',{
            //frame: ["dust"],
            lifespan: 350,
            scale: {start: 1, end: 2},
            maxAliveParticles: 8,
            gravityY: -400,
            alpha: {start: 1, end: 0.1}
        })

        // hive
        this.THEHIVE = this.physics.add.group();
        this.hive = this.THEHIVE.create(4370, 200, "hive").setScale(5);
        this.hive2 = this.THEHIVE.create(4370, 200, "hive").setScale(5);
        this.hive.body.allowGravity = false;
        this.hive.body.setSize(this.hive.width/64, this.hive.height - 30)
        this.hive.body.setOffset(this.hive.width - 25, 20);
        this.hive.setDepth(1);
        this.hive.setData('hits', 0); 

        this.hive2.body.allowGravity = false;
        this.hive2.body.setSize(this.hive.width/64, this.hive.height - 30)
        this.hive2.body.setOffset(this.hive.width - 42, 20);
        this.hive2.setDepth(1);
        this.hive2.setData('hits', 0);

        // Bees (might need nerfs or buffs later)
        this.beeGroup = this.physics.add.group();
        console.log(this.beeGroup);
        this.buzz =this.sound.add("beeBuzz", {
            loop: true,
            volume: .5
        });
        if(this.hiveAlive){ // only spawn bees if the behive is alive
            this.beeSpawn = this.time.addEvent({
                delay: this.beeSpawnDelay,
                callback: () => {
                    let beeSpawn_X = this.player.x + this.cameras.main.width + 50;
                    let beeSpawn_Y = 100;
                    let numBees = this.seenHive ? 3 : 1;
                    for( let i = 0; i < numBees; i++){
                        let hiveStop = Phaser.Math.Between(4000, 4722);
                        if(this.seenHive){
                            beeSpawn_X = 4375;
                            beeSpawn_Y = 280;
                            this.beeSpawnDelay = 500;
                        }
                        const bee = this.beeGroup.create(beeSpawn_X, beeSpawn_Y, 'bee').setScale(SCALE);
                        bee.setDepth(9);
                        bee.setData('hits', 0);            
                        bee.isAlive = true;
                        bee.body.allowGravity = false;
                        bee.setVelocityX(-10);
                        bee.setVelocityY(0);
                        bee.play('beeAttack_idle');
                        let stopX = this.seenHive ? hiveStop :this.player.x + 55 //Phaser.Math.Between(this.player.x + bee.width + 50 , this.player.x + bee.width + 150);
                        stopX += i * 30;
                        const stopY = beeSpawn_Y;
                        this.tweens.add({
                            targets: bee,
                            x: stopX,
                            y: stopY,
                            duration: this.seenHive ? 1000 : 2000,
                            ease: 'Power2',

                            onComplete: () => {
                                //this.time.delayedCall(1000, () => {
                                    if(bee && bee.isAlive && bee.active){
                                        bee.play('beeAttack_down');
                                        bee.body.setGravity(0)
                                        bee.setVelocityY(.001);
                                        bee.body.allowGravity = true;
                                    }
                                //});
                            }
                        });
                    }
                },
                loop: true
            });
        }

        // BOSS
        this.bossBounds = this.map.createLayer("BossBounds", this.tilesetTerrain, 0, 0);
        this.bossBounds.setScale(SCALE);
        this.bossBounds.visible = false;
        this.bossBounds.setCollisionByProperty({ 
            collides: true 
        })
        this.boss = new Boss(this, 7685, 368, 'boss');        

   //keys
        cursors = this.input.keyboard.createCursorKeys();
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.shootUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        // colliders
        this.physics.add.collider(this.player, this.groundLayer);
        this.physics.add.collider(this.treesGroup, this.groundLayer);
        this.physics.add.collider(this.turtlesGroup, this.groundLayer);
        this.physics.add.collider(this.turtlesGroup, this.spikesGroup);
        this.physics.add.collider(this.player, this.spikesGroup, this.playerHitSpike, null, this);
        this.physics.add.collider(this.player, this.ledgesGroup, this.ledgeFall, null, this);
        this.physics.add.collider(this.boss, this.groundLayer);
        this.physics.add.overlap(this.player, this.coinsGroup, this.hitCoin, null, this);
        this.physics.add.overlap(this.player, this.beeGroup, this.beeHitPlayer, null, this);        
        this.physics.add.overlap(this.bulletsGroup, this.beeGroup, this.killBee, null, this);
        this.physics.add.overlap(this.bulletsGroup, this.treesGroup, this.killTree, null, this);
        this.physics.add.overlap(this.player, this.treesGroup, this.treeHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.treeBulletsGroup, this.treeBulletHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.turtlesGroup, this.playerHitTurtle, null, this);
        this.physics.add.overlap(this.bulletsGroup, this.THEHIVE, this.killHive, null, this);
        this.physics.add.overlap(this.player, this.THEHIVE, this.playerHitHive, null, this);
        this.BossandBullet = this.physics.add.overlap(this.bulletsGroup, this.boss, this.boss.damageBoss, null, this);
        this.physics.add.overlap(this.player, this.boss.armsGroup, this.armHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.boss.laserGroup, this.laserHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.boss, this.bossHitPlayer, null, this);
      

        this.init();
    }   

    update(time,){

        //player movement
        if(cursors.left.isDown && !this.shootUp.isDown && !cursors.down.isDown) {
            this.player.body.setAccelerationX(-this.ACCELERATION)
            
            if(this.shootUp.isDown)
                this.player.play('shootUp_run');
            else{
                this.player.play('run', true)
            }
            this.player.setFlip(true, false)

            //particles
            my.vfx.walking.startFollow(this.player, this.player.displayWidth/2 - 20, this.player.displayHeight/2 -5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0)
            if(this.player.body.blocked.down){
                my.vfx.walking.start();
            }
        }else if(cursors.right.isDown && !this.shootUp.isDown && !cursors.down.isDown) {
            this.player.body.setAccelerationX(this.ACCELERATION)
            this.player.play('run', true)
            this.player.resetFlip()

            //particles
            my.vfx.walking.startFollow(this.player, this.player.displayWidth/2 - 65, this.player.displayHeight/2 -5, false);
            my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0)
            if(this.player.body.blocked.down){
                my.vfx.walking.start();
            }
        }else {
            //this.player.setVelocityX(0);
            this.player.body.setAccelerationX(0)
            this.player.body.setDragX(this.DRAG)
            this.player.play('idle', true);
            my.vfx.walking.stop();
        }

        if(!this.player.body.blocked.down) {
            this.player.anims.play('jump')
        }
        if(this.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            this.sound.play('jump');
            this.player.body.setVelocityY(this.JUMP_VELOCITY)
        }
        if(this.shootUp.isDown && !cursors.down.isDown){ // shoot up
            this.player.anims.play('shootUp');
            this.BULLET_ANGLE = 270
            this.BULLET_OFFSET_X = this.player.flipX ? -10 : 10;
            this.BULLET_OFFSET_Y = -17;
            this.BULLET_ROTATE = true; // set rotate flag
        }else{
            this.BULLET_ANGLE = this.player.flipX ? 180 : 0;
            this.BULLET_OFFSET_X = this.player.flipX ? -36 : 36
            this.BULLET_OFFSET_Y = 0;
        }
        if (cursors.down.isDown && !this.shootUp.isDown){// crouch
            this.player.anims.play('crouch');
            this.BULLET_OFFSET_Y = 15;
            //set hitbox (its shorter now)
            this.player.body.setSize(this.player.width/2 - 5, this.player.height - 20)
            this.player.body.setOffset(this.player.width / 4 + 3, 20);

        } else{
            //reset hitbox
            this.player.body.setSize(this.player.width/2 - 5, this.player.height - 15)
            this.player.body.setOffset(this.player.width / 4 + 3, 15);

        }
        //shooting
        if(this.space.isDown){
            if (time > this.lastFired){
                this.shootBullet();
                this.lastFired = time + this.fireRate;
            }
        }
        this.BULLET_ROTATE = false; //reset rotate flag
        this.bulletsGroup.children.iterate((bullet) =>{
            if(bullet){
                if(!this.cameras.main.worldView.contains(bullet.x, bullet.y)){
                    bullet.destroy();
                }
            }
        })

        // bee sounds
        this.beeGroup.children.iterate((bee) =>{
            if(bee.active && this.isSpriteInView(bee,this.cameras.main)){
                if(!bee.soundPlaying){
                    bee.soundPlaying = true;
                    this.buzz.play();
                }
            }else if(bee.soundPlaying){
                bee.soundPlaying = false;
                this.buzz.stop();
            }
        })
        
        //check if hive has been seen
        if(this.hiveAlive && this.isSpriteInView(this.hive, this.cameras.main)){
            this.seenHive = true;
            console.log("seenHive");
        }

        // if player kills hive, change spawn point
        if(!this.hiveAlive){
            this.initialPlayerX = 3927;
            this.initialPlayerY = 446;
        }

        // update the boss
        this.boss.update();
        if(this.boss.bossDead){
            this.time.delayedCall(3200, ()=> {
                let trophyLayer = this.map.getObjectLayer("End")['objects'];
                let trophy = trophyLayer.find(obj => obj.name === 'trophy');
                this.trophySprite = this.physics.add.sprite(7685, 368, "trophy");
                this.trophySprite.setScale(SCALE);
                this.trophySprite.body.allowGravity = false;
                this.trophySprite.body.setSize(this.trophySprite.width/2, this.trophySprite.height/2)
                //console.log(trophySprite)
                this.physics.add.overlap(this.player, this.trophySprite, this.gameWon, null, this);

            })
        }
        // * FILTER GROUPS
        // player bullets
        this.bulletsGroup.children.iterate((bullet) =>{
            if(bullet){
                if(!this.cameras.main.worldView.contains(bullet.x, bullet.y)){
                    bullet.destroy();
                }
            }
        })

        // tree bullets
        this.treeBulletsGroup.children.iterate((bullet) =>{
            if(bullet){
                if(!this.cameras.main.worldView.contains(bullet.x, bullet.y)){
                    bullet.destroy();
                }
            }
        })

        // boss arms
        this.boss.armsGroup.children.iterate((arm) =>{
            let padding = 150;
            let bounds = this.cameras.main.getBounds();
            let extendedBounds = new Phaser.Geom.Rectangle(
                bounds.x - padding,
                bounds.y - padding,
                bounds.width + padding * 2,
                bounds.height + padding * 2
            );
            if(arm){
                if(!extendedBounds.contains(arm.x, arm.y)){
                    arm.destroy();
                }
            }
        })

    }
    updateScore() {
        this.scoreText.setText("Score: " + this.score);
    }
    updateLives() {
        if(this.lives < 0){this.lives = 0;}
        this.livesText.setText("Lives: " + this.lives);
    }
    bossHitPlayer(player, boss){
        if (!this.playerHit) {  // Only proceed if player is not already hit
            this.playerHit = true;
            this.killPlayer();
        }
    }
    armHitPlayer(player, arm){
        if (!this.playerHit) {  // Only proceed if player is not already hit
            this.playerHit = true;
            arm.destroy();
            this.killPlayer();
        }
    }
    laserHitPlayer(player, laser){
        //this.player.body.moves = false;
        if (!this.playerHit) {  // Only proceed if player is not already hit
            this.playerHit = true;
            this.killPlayer();
        }
    }
    beeHitPlayer(player, bee){
        this.playerHit = true;
        this.buzz.stop();
        bee.destroy();
        bee.active = false;
        this.killPlayer();
    }
    playerHitSpike(){
        this.playerHit = true;
        this.lives = 0;
        this.killPlayer();
    }
    treeBulletHitPlayer(player, bullet){
        this.playerHit = true;
        bullet.destroy();
        this.killPlayer();
    }
    treeHitPlayer(){
        if (!this.playerHit) {  // Only proceed if player is not already hit
            this.playerHit = true;
            this.killPlayer();
        }
    }

    playerHitTurtle(){
        if (!this.playerHit) {  // Only proceed if player is not already hit
            this.playerHit = true;
            this.killPlayer();
        }

    }
    killPlayer(player, spike){
        
        if(this.playerHit){
            console.log("yo boy hit dat mutha fucken boolsheet");
            this.sound.stopAll();
            this.sound.play("ouch");
            this.lives--;
            this.updateLives();
            if(!this.isBlinking){
                for (let i = 0; i < 3; i++){
                    this.isBlinking = true;
                    this.player.setTexture('haloGuyHurt', 9);
                    this.time.delayedCall(1000, () => {
                        this.player.setTexture('haloGuy', 9); 
                    });
                }
            }
            this.isBlinking = false;

            this.time.delayedCall(3000, () => {
                this.playerHit = false;
            });
        }
        if(this.lives <= 0 ){
            this.player.body.moves = false;
            this.time.delayedCall(1000, () => {
                console.log("you died");
                this.gameOver = true;
                this.gameLost();
            });
        }
        
    }
    killBee(bullet, bee){
        this.score += 5;
        this.updateScore();
        bee.anims.play("beeHit");
        bullet.destroy();
        this.time.delayedCall(100, () => {
            bee.active = false;
            this.sound.play("pop", {volume: 5});
            this.buzz.stop();
            bee.destroy();
        });
    }
    killHive(bullet){
        this.score += 75;
        this.updateScore();        
        this.hive.data.values.hits += 1;
        this.hive2.data.values.hits += 1;
        bullet.destroy();
        const health = 50;
        if(this.hive.data.values.hits >= health){
            this.hive.destroy();
            this.hive2.destroy();
            this.hiveAlive = false;
            this.time.removeEvent(this.beeSpawn);
        }
    
        if(this.hiveAlive){
            this.hive.setTexture('hiveHit'); // Set to hit texture
            this.hive2.setTexture('hiveHit');
            this.time.delayedCall(100, () => { // Delay before reverting
                this.hive.setTexture('hive'); // Revert to original texture
                this.hive2.setTexture('hive');
            });
        }
    }
    killTree(bullet, tree){
        this.score += 15;
        this.updateScore();
        tree.anims.play("treeHit");
        tree.data.values.hits += 1;
        bullet.destroy();
        const health = 5;
        if(tree.data.values.hits >= health){
            tree.active = false;
            tree.destroy();
        }
    }
    hitCoin(player, coin){
        this.score += 25;
        this.updateScore();
        console.log("money money money");
        this.sound.play('coinSound', {volume: .1});
        coin.destroy();
    }

    ledgeFall(player, ledge){
        this.time.delayedCall(350, () => {
            console.log("ledge fall now");
            ledge.body.allowGravity = true;
            ledge.body.immovable = false;
        })
        //ledgeSprite.body.allowGravity = false;
    }
    shootBullet(){        
        //this.BULLET_OFFSET_X = this.player.flipX ? -36 : 36
        const bullet = this.bulletsGroup.get(this.player.x + this.BULLET_OFFSET_X, this.player.y + this.BULLET_OFFSET_Y, 'bullets');
        bullet.setDepth(10);
        this.sound.play('shoot',  {volume: 50});
        if (bullet){
            if(this.BULLET_ROTATE){
                bullet.setAngle(-90);
            }
            bullet.setActive(true);
            bullet.body.allowGravity = false;
            const angleInRadians = Phaser.Math.DegToRad(this.BULLET_ANGLE);
            const velocityX = this.BULLET_VELOCITY * Math.cos(angleInRadians);
            const velocityY = this.BULLET_VELOCITY * Math.sin(angleInRadians);

            bullet.setVelocity(velocityX, velocityY);
        }
    }

    isSpriteInView(sprite, camera){
        const bounds = camera.worldView;
        return Phaser.Geom.Intersects.RectangleToRectangle(sprite.getBounds(), bounds);
    }

    //tree movement function
    initTreeMotion(treeSprite, startX) {
        const moveDistance = 300; // distance the tree moves to the right
        const speed = 100; // pixels per second
        const jumpHeight = -150; // negative for jumping up

        let startMotion = () =>{
            if(treeSprite.active){
                treeSprite.anims.play("treeWalk");
            }
            treeSprite.flipX = true;
            this.treeShoot(treeSprite, true);
            this.tweens.add({ // start by moving right
                targets: treeSprite,
                x: startX + moveDistance,
                ease: 'Linear',
                duration: moveDistance / speed * 1000,
                onComplete: () => { // jump
                    this.treeShoot(treeSprite, true);
                    if(treeSprite.active){
                        treeSprite.anims.play("treeJump");
                    }
                    this.tweens.add({
                        targets: treeSprite,
                        y: treeSprite.y + jumpHeight,
                        yoyo: true,
                        ease: 'Sine.easeInOut',
                        duration: 600,
                        onComplete: () => { //walking back
                            treeSprite.flipX = false;
                            this.treeShoot(treeSprite);
                            if(treeSprite.active){
                                treeSprite.anims.play("treeWalk");
                            }
                            this.tweens.add({
                                targets: treeSprite,
                                x: startX,
                                ease: 'Linear',
                                duration: moveDistance / speed * 1000,
                                onComplete: () =>{ // jump
                                    this.treeShoot(treeSprite);
                                    if(treeSprite.active){
                                        treeSprite.anims.play("treeJump");
                                    }
                                    this.tweens.add({
                                        targets: treeSprite,
                                        y: treeSprite.y + jumpHeight,
                                        yoyo: true,
                                        ease: 'Sine.easeInOut',
                                        duration: 600,
                                        onComplete: startMotion
        
                                    });
                                }
                            })
                        }
                    })
                }
            });
        }
        startMotion();
    }

    treeShoot(treeSprite, flip){
        const BULLET_VELOCITY = 275;
        const offset = flip ? 120 : 40
        if(treeSprite.active && this.treeBulletsGroup != undefined && this.cameras.main.worldView.contains(treeSprite.x, treeSprite.y)){
            const bullet = this.treeBulletsGroup.get(treeSprite.x + offset, treeSprite.y + 45, 'treeBullet').setScale(SCALE)
            bullet.body.setSize(bullet.width/2, bullet.height/2)

            this.sound.play('cork',  {volume: .5});
            if (bullet){
                if (flip){
                    bullet.setAngle(180);
                }
                bullet.setActive(true);
                bullet.body.allowGravity = false;
                const velocityX = flip ? BULLET_VELOCITY: -BULLET_VELOCITY;
                bullet.setVelocity(velocityX, 0);
            }
        }
    }

    initTurtleMotion(turtle){
        const jumpHeight = -350; // negative for jumping up
        turtle.body.setVelocityX(0);
        let startMotion = () => {
            this.tweens.add({
                targets: turtle,
                y: turtle.y + jumpHeight,
                yoyo: true,
                ease: 'Sine.easeInOut',
                duration: 1000,
                onComplete: () => {
                    this.time.delayedCall(2000, () => {
                        startMotion();
                    });
                }
            });
        }
        startMotion();
    }

    gameWon(){
        this.sound.stopAll();
        this.scene.stop();
        this.scene.start("won");
    }

    gameLost(){
        this.sound.stopAll();
        this.scene.stop();
        this.scene.start("lost");
    }
}