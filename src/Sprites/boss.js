class Boss extends Phaser.GameObjects.Sprite{
    constructor(scene, x, y, texture, frame){
        super(scene,x,y,texture,frame);
        scene.add.existing(this);

        scene.physics.add.existing(this);
        this.body.setSize(this.width/4 - 5, this.height/2 - 5 );
        this.body.setOffset(this.width/2 - 10, this.height/4 - 1);
        this.body.allowGravity = true;
        this.setScale(SCALE);
        this.scene = scene;
        this.init = false;
        this.bossDead = false;
        this.moveSpeed = 100;
        this.goLeft = true;
        this.goRight = false;
        this.stop = false;
        this.jumpL = true; 
        this.jumpR = true;
        this.atSpawn = false;
        this.walkToSpawn = false;
        this.thrustCreated = false;
        this.hits = 0;
        this.damageBoss = this.damageBoss.bind(this); 
        this.isFiringLaser = false;
        this.anims.play("bossWalk");
        
        
        scene.physics.add.collider(this, this.scene.bossBounds, () => {
            if (this.body.blocked.left) {
                this.goRight = true;
                this.goLeft = false;
                this.jumpL = false;
                this.jumpR = true;
            }
            if (this.body.blocked.right) {
                this.goRight = false;
                this.goLeft = true;
                this.jumpL = true;
                this.jumpR = false;
            }
        });

        scene.physics.add.collider(this, this.scene.groundLayer, () => {
            if ((this.body.blocked.right && this.jumpR) || (this.body.blocked.left && this.jumpL)) {
                this.body.setVelocityY(-300);                
            }

        });

        // test sprite
        //test.anims.play("bossLaser_fire");
        


        // boss states
        this.states = {
            name: 'idle',
            idle: { 
                execute: () => {
                    console.log('Boss is idle');
                }
            },
            patrol: { // move on path over brick structure
                name: 'patrol',
                execute: () => {
                    //console.log('Boss is patrolling');

                    // base case
                    if(this.hits >= 50){
                        if(this.atSpawn){
                            this.hits = 0; // reset hit
                            this.anims.play("bossStronger");
                            this.scene.sound.play("bossLow")
                            this.changeState("Big");

                        }
                        else{
                            this.walkToSpawn = true;
                            this.armTimer.paused = false;
                            this.laserTimer.paused = false;
                            this.anims.play('bossWalk');

                        }
                    }

                    //movement
                    if(this.stop){
                        this.body.setVelocityX(0);                        
                    }else{
                        if(!this.body.blocked.left && this.goLeft == true && !this.stop){
                            this.body.setVelocityX(0);
                            this.body.setVelocityX(-this.moveSpeed);
                        }
                    
                        else if(!this.body.blocked.right && this.goRight == true && !this.stop){
                            this.body.setVelocityX(0);
                            this.body.setVelocityX(this.moveSpeed);
                        }
                    }

                    // shoot arm every 3 secs
                    this.armTimer.paused = false;

                    // shoot laser every 7 secs
                    this.laserTimer.paused = false;
                    

                }   
            },
            Big: { // Get big and stop moving and shooting
                name: 'Big',
                execute: () => {
                    //console.log('Boss is getting big');
                    //this.armTimer.paused = true;
                    
                    
                    //this.setOrigin(0.5, 0.5);
                    

                    // Create a tween to scale the boss
                    this.scene.tweens.add({
                        targets: this,
                        scaleX: 4, // Scale to twice the original size
                        scaleY: 4, // Scale to twice the original size
                        ease: 'Linear', // This can be changed to 'Sine.easeInOut' for a more dynamic effect
                        duration: 3000, // Duration in milliseconds, adjust based on how slow you want the scale
                        repeat: 0, // No repeat, only grow once
                        yoyo: false, // No yoyo effect, so it doesn't shrink back immediately
                        loop: false,
                        onComplete: () => {
                            //console.log('Boss is now big!');
                            this.laserTimer.paused = true;
                            this.armTimer.paused = false;
                            if(!this.thrustCreated){
                                this.body.setVelocityY(-800);
                                this.body.setGravity(0, .5);
                                this.thrustCreated = true;
                                this.anims.play("bossStronger");
                            }
                            if(this.hits >= 50){
                                this.armTimer.paused = true;
                                this.changeState("Die");
                            }

                        }
                    });
                }
            },
            Die: { // play ding animaition
                name: 'Die',
                execute: () => {
                    console.log('Boss is dying');
                    this.scene.BossandBullet.destroy();
                    if(!this.bossDead){
                        this.anims.play("bossDie");
                        this.scene.sound.play("bossDied", {loop: true});
                        this.bossDead = true;
                    }
                    this.on('animationcomplete', () => {
                        this.scene.sound.stopAll();
                        this.scene.sound.play("wellDone");
                        this.scene.score += 1500;
                        this.scene.updateScore();
                        this.destroy();
                    })

                }
            }
        }
        
        this.currentState = this.states.patrol;

        // shoot arm every 7.537 secs
        this.armTimer = this.scene.time.addEvent({
            delay: (this.currentState.name === 'Big') ? 3000 : 7537,
            callback: () => {
                if (this.scene.cameras.main.worldView.contains(this.x, this.y)){
                    this.shootArm();
                }
            },
            callbackScope: this,
            loop: true
        });
        this.armTimer.paused = true;

        this.armsGroup = this.scene.physics.add.group({
            defaultKey: 'arm',
            maxSize: Infinity
        })

        // shott laser every 7 seconds
        this.laserTimer = this.scene.time.addEvent({
                        delay: 4000,
                        callback:() => {
                            if(this.scene.cameras.main.worldView.contains(this.x, this.y)){
                                this.anims.play('bossCharge_up');
                                this.on('animationcomplete', () => {
                                    if (this.anims.currentAnim.key === 'bossCharge_up') {
                                        this.body.setVelocityX(0);
                                        this.shootLaser();
                                    }
                                })
                            }                           
                        },
                        callbackScope: this,
                        loop: true
        });
        this.laserTimer.paused = true;
        this.laserGroup = this.scene.physics.add.group({
            maxSize: 1
        })
    }

    update(){
        
        if(!this.init && !this.scene.hiveAlive && this.scene.cameras.main.worldView.contains(this.x, this.y)){ 
            this.initBoss();
        }
        if (this.init && !this.bossDead){
            this.flipX = this.goLeft ? true : false;
            this.currentState.execute();

            // handle needing to go back to spawnpoint
            if(this.walkToSpawn && this.x >= 7684 && this.x <= 7686){
                this.body.setVelocityX(0);
                this.stop = true;
                this.atSpawn = true;
                this.walkToSpawn = false;
            }
            this.flipX = (this.x < this.scene.player.x) ? false : true
        }

    }
    initBoss(){
        console.log("init Boss");
        this.scene.sound.play("initBoss");
        this.init = true
    }
    changeState(newState){
        if(this.states[newState] && this.currentState.name !== this.states[newState].name){
            this.currentState = this.states[newState];
            console.log('State changed to ${newState}');
        }
    }
    damageBoss(boss,bullet){
        let boom = this.scene.add.sprite(bullet.x, bullet.y, "explosion", 0).play("explosion");
        bullet.destroy();
        this.scene.sound.play("bossHit");
        this.hits += 1;
        console.log(this.hits); 
        boom.on('animationcomplete', () => {
            boom.destroy();

        })
    }
    shootLaser(){
        console.log("shoot Laser");
        this.stop = true;
        this.anims.play("bossCharge_up");
        let XspwanOffset = this.flipX ? -195 : 195;
        let XbodyOffset = this.flipX ? 0 : 60;
        if(!this.isFiringLaser){
            this.isFiringLaser = true;
            let laser = this.scene.add.sprite(this.x + XspwanOffset, this.y , "laser", 1).setScale(SCALE);
            laser.anims.play("bossLaser_charge");
            //this.scene.sound.play("charge");        
            laser.flipX = this.flipX ? true : false;
            laser.on('animationcomplete', () => {
                this.scene.sound.play("bossLaser");
                this.stop = true;
                laser.destroy();
                let beam = this.laserGroup.create(this.x + XspwanOffset, this.y , "laser", 9).setScale(SCALE);
                beam.anims.play('bossLaser_fire');
                beam.body.allowGravity = false;
                beam.flipX = this.flipX ? true : false;
                beam.body.setSize(laser.width - 60, laser.height/4 - 9);
                beam.body.setOffset(XbodyOffset, 25);

                beam.on('animationcomplete', () => {
                    beam.destroy();
                    this.isFiringLaser = false;
                    this.stop = false;
                    this.anims.play("bossWalk");
                    
                });              
            })
        }
        
        
    }
    shootArm(){
        console.log("shoot arm");
        this.anims.play("bossRaiseArm");
        this.on('animationcomplete', () => {
            if (this.anims.currentAnim.key === 'bossRaiseArm'){
                let arm = this.armsGroup.create(this.x, this.y, "arm").setScale((this.currentState.name === 'Big') ? SCALE * 2 : SCALE );
                this.scene.sound.play("armShoot");
                arm.anims.play('flyingArm');
                arm.flipX = this.flipX ? true : false;
                arm.body.setSize(arm.width/4 + 10, arm.height/4 - 15);
                arm.body.setOffset( this.flipX ? 5 : 60, 33);
                arm.body.allowGravity = false;
                this.currentArm = arm;

                //arm.setVelocityX(this.goLeft ? -200 : 200);
                let dx =  (this.scene.player.x - this.currentArm.x);
                let dy =  (this.scene.player.y - this.currentArm.y) + this.scene.player.body.height / 2;
                let angle = Math.atan2(dy, dx);

                let speed = 150
                this.currentArm.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
                this.currentArm.setAngle(angle);

                // walk at the end
                this.scene.time.delayedCall(500, () =>{
                    if (this.currentState.name === 'Big'){
                        this.anims.play("bossStronger")
                    }else{
                        this.anims.play("bossWalk");
                    }
                    this.thrustCreated = false;
                });
            }
        });
        
        
    }
}