class Won extends Phaser.Scene{
    constructor(){
        super("won");
        this.my = {
            text: {}
        };
    }
    create(){
        this.add.text(this.game.config.width/2, this.game.config.height/2, 'You Won!',
        { 
            fontFamily: 'Times, serif',
            color:'#C70039',
            fontSize: '128px'
        }).setOrigin(0.5);
        this.add.text(this.game.config.width/2, this.game.config.height/2 + 80, 'Press P to play again!',
        { 
            fontFamily: 'Times, serif',
            color:'#FFFFFF',
            fontSize: '28px'
        }).setOrigin(0.5);

        //key
        this.nextScene = this.input.keyboard.addKey("P");
    }
    update(){
        if (Phaser.Input.Keyboard.JustDown(this.nextScene)) {
            this.scene.start("platformerScene");
            this.scene.stop();
        }
    }
}