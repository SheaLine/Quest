class Load extends Phaser.Scene {
    constructor(){
        super("loadScene");
    }

    preload(){
        this.load.setPath("./assets/");

        // Load characters
        this.load.spritesheet('haloGuy', 'haloGuy.png', { frameWidth: 46, frameHeight: 46 });
        this.load.spritesheet('haloGuyHurt', 'haloGuyHurt.png', { frameWidth: 46, frameHeight: 46 });

        // Load tilemap
        this.load.image("terrain_tiles", "Terrain (16x16).png");
        //this.load.image("coins", "pixel_platform_01_tileset_final.png");
        this.load.image("trophy", "End (Idle).png");
        this.load.image("grayBackground", "Gray.png");
        this.load.image("spikes", "Idle.png");
        this.load.image("fallingLedge", "Off.png");
        this.load.tilemapTiledJSON("level1", "level1.tmj");   // Tilemap in JSON
        this.load.spritesheet("coins", "pixel_platform_01_tileset_final.png", { frameWidth: 32, frameHeight: 32 });

        //bullets
        this.load.spritesheet("bullets", "projectiles-sheet-alpha.png", { frameWidth: 18, frameHeight: 18 })

        //Enemies
        this.load.spritesheet("bee", "Bee(36x34).png", { frameWidth: 36, frameHeight: 34 });
        this.load.spritesheet("beeHit", "beeHit (36x34).png", { frameWidth: 36, frameHeight: 34 });
        this.load.spritesheet('tree', "Run (64x32).png", { frameWidth: 64, frameHeight: 32 });
        this.load.image("treeBullet", "Treebullet.png");
        this.load.spritesheet('treeHit', 'treeHit (64x32).png', { frameWidth: 64, frameHeight: 32 });
        this.load.spritesheet('turtle', "turtle (44x26).png", { frameWidth: 44, frameHeight: 26 } );
        this.load.image("hive", "Hive.png");
        this.load.image("hiveHit", "hiveHit.png");

        //Boss
        this.load.spritesheet("boss", "boss_sheet.png", {frameWidth: 100, frameHeight: 100});
        this.load.spritesheet("arm", "arm_projectile_glowing.png", {frameWidth: 100, frameHeight: 100})
        this.load.spritesheet("laser", "Laser_sheet.png", {frameWidth: 300, frameHeight: 100})


        //particles
        this.load.image("dust", "Dust Particle.png");
        this.load.image("confet", "Confetti.png");
        this.load.spritesheet("explosion", "explosion.png", { frameWidth: 32, frameHeight: 32 });
        //audio
        this.load.audio("coinSound", 'coin.ogg');
        this.load.audio("shoot", "zipclick.ogg");
        this.load.audio("pop", "pop_.ogg");
        this.load.audio("beeBuzz", "bee.wav");
        this.load.audio("cork", "cork.ogg");
        this.load.audio("wellDone", "applause.wav");
        this.load.audio("bossHit", "impactMetal_004.ogg");
        this.load.audio("ouch", "22._damage_grunt_male.wav");
        this.load.audio("bossLaser", "bossLaser.wav");
        this.load.audio("charge", "charge.wav");
        this.load.audio("jump", "jump.wav");
        this.load.audio("armShoot", "armShoot.wav");
        this.load.audio("initBoss", "03._target_acquired.wav");
        this.load.audio("bossKill", "04._target_neutralized.wav");
        this.load.audio("bossLow", "13._health_levels_critical.wav");
        this.load.audio("bossDied", "robot_chatter_09.wav");


    }

    create(){
        this.anims.create({
            key: 'idle',
            defaultTextureKey: 'haloGuy',
            frames: [
                {frame: 0},
            ],
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('haloGuy', { start: 2, end: 5 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            defaultTextureKey: 'haloGuy',
            frames: [
                {frame: 20},
            ],
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'shootUp',
            defaultTextureKey: 'haloGuy',
            frames: [
                {frame: 72},
            ],
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'crouch',
            defaultTextureKey: 'haloGuy',
            frames: [
                {frame: 1},
            ],
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'coinSpin',
            frames: this.anims.generateFrameNumbers('coins', { start: 5, end: 10 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'beeAttack_down',
            frames: this.anims.generateFrameNumbers('bee', { start: 0, end: 1}),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'beeAttack_idle',
            frames: this.anims.generateFrameNumbers('bee', { start: 2, end: 4}),
            frameRate: 3,
            repeat: -1
        });

        this.anims.create({
            key: 'beeHit',
            frames: this.anims.generateFrameNumbers('beeHit', {start: 0, end: 2}),
            frameRate: 10,
            repeat: 0
        });

        this.anims.create({
            key: 'treeWalk',
            frames: this.anims.generateFrameNumbers('tree', {start: 0, end: 4}),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'treeJump',
            frames: this.anims.generateFrameNumbers('tree', {start: 5, end: 13}),
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: 'treeHit',
            frames: this.anims.generateFrameNumbers('treeHit', {start: 0, end: 2}),
            frameRate: 30,
            repeat: 0,
        });

        this.anims.create({
            key: 'bossWalk',
            frames: this.anims.generateFrameNumbers('boss', {start: 0, end: 3}),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'bossRaiseArm',
            frames: this.anims.generateFrameNumbers('boss', {start: 20, end: 28}),
            frameRate: 30,
            repeat: 0
        });

        this.anims.create({
            key: 'flyingArm',
            frames: this.anims.generateFrameNumbers('arm', {start: 0, end: 5}),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'bossCharge_up',
            frames: this.anims.generateFrameNumbers('boss', {start: 50, end: 56}),
            frameRate: 10,
            repeat: 0
        });

        this.anims.create({
            key: 'bossStronger',
            frames: this.anims.generateFrameNumbers('boss', {start: 10, end: 17},),
            duration: 2000,
            repeat: -1
        });

        this.anims.create({
            key: 'bossArmor',
            frames: this.anims.generateFrameNumbers('boss', {start: 60, end: 68},),
            frameRate: 10,
            repeat: 0
        });

        this.anims.create({
            key: 'bossLaser_charge',
            frames: this.anims.generateFrameNumbers('laser', {start: 1, end: 8}),
            duration: 2000,
            repeat: 0
        });

        this.anims.create({
            key: 'bossLaser_fire',
            frames: this.anims.generateFrameNumbers('laser', {start: 8, end: 14}),
            frameRate: 10,
            repeat: 0
        });

        this.anims.create({
            key: 'bossDie',
            frames: this.anims.generateFrameNumbers('boss', {start: 70, end: 83}),
            duration: 3000,
            repeat: 0
        });

        this.anims.create({
            key: 'explosion',
            frames: this.anims.generateFrameNumbers('explosion', {start: 0, end: 5}),
            frameRate: 30,
            repeat: 0
        });

        this.scene.start("platformerScene");
    }
}