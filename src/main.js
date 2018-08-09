let game;

const gameOptions = {
	tileSize: 200,
	tileSpacing: 20,
	boardSize: {
		rows: 4,
		cols: 4
	},
	tweenSpeed: 50,
	swipeMaxTime: 1000,
	swipeMinDistance: 20,
	swipeMinNormal: 0.85,
	aspectRatio: 16/9, 
	localStorageName: "topscore4096"
}

const LEFT = 0;
const RIGHT = 1;
const UP = 2;
const DOWN = 3;

window.onload = function() {
	let tileAndSpacing = gameOptions.tileSize + gameOptions.tileSpacing;
	let width = gameOptions.boardSize.cols * tileAndSpacing;
	width += gameOptions.tileSpacing;
	let gameConfig = {
		width: width,
		height: width * gameOptions.aspectRatio,
		backgroundColor: 0xecf0f1,
		scene: [bootGame, playGame]
	}
	game = new Phaser.Game(gameConfig);
	window.focus();
	resizeGame();
	window.addEventListener("resize", resizeGame);
}

function resizeGame() {
	let canvas = document.querySelector("canvas");
	let windowWidth = window.innerWidth;
	let windowHeight = window.innerHeight;
	let windowRatio = windowWidth / windowHeight;
	let gameRatio = game.config.width / game.config.height;
	if(windowRatio < gameRatio) {
		canvas.style.width = windowWidth + "px";
		canvas.style.height = (windowWidth / gameRatio) + "px";
	} else {
		canvas.style.width = (windowHeight * gameRatio) + "px";
		canvas.style.height = windowHeight + "px";
	}
}

class bootGame extends Phaser.Scene {
	constructor() {
		super("BootGame");
	}

	preload() {
		this.load.image("restart", "./assets/sprites/restart.png");
		this.load.image("scorepanel", "./assets/sprites/scorepanel.png");
		this.load.image("scorelabels", "./assets/sprites/scorelabels.png");
		this.load.image("logo", "./assets/sprites/logo.png");
		this.load.image("howtoplay", "./assets/sprites/howtoplay.png");
		this.load.image("gametitle", "./assets/sprites/gametitle.png");
		this.load.image("emptytile", "./assets/sprites/emptytile.png");
		this.load.spritesheet("tiles", "./assets/sprites/tiles.png", {
			frameWidth: gameOptions.tileSize,
			frameHeight: gameOptions.tileSize
		});
		this.load.audio("move",["./assets/sounds/move.ogg", "./assets/sounds/move.mp3"]);
		this.load.audio("grow",["./assets/sounds/grow.ogg", "./assets/sounds/grow.mp3"]);
		this.load.bitmapFont("font", "./assets/fonts/font.png", "./assets/fonts/font.fnt");
	}

	create() {
		this.scene.start("PlayGame");
	}
}

class playGame extends Phaser.Scene {
	constructor() {
		super("PlayGame");
	}

	create() {
		this.score = 0;
		this.bestScore = localStorage.getItem(gameOptions.localStorageName);
		if(this.bestScore == null) {
			this.bestScore = 0;
		}

		let restartXY = this.getTilePosition(-0.8, gameOptions.boardSize.cols - 1)
		let restartButton = this.add.sprite(restartXY.x, restartXY.y, "restart");
		restartButton.setInteractive();
		restartButton.on("pointerdown", function(){
  		this.scene.start("PlayGame");
		}, this);
 
		let scoreXY = this.getTilePosition(-0.8, 1);
		this.add.image(scoreXY.x, scoreXY.y, "scorepanel");
		this.add.image(scoreXY.x, scoreXY.y - 70, "scorelabels");

		let textXY = this.getTilePosition(-0.92, -0.4);
		this.scoreText = this.add.bitmapText(textXY.x, textXY.y, "font", "0");

		textXY = this.getTilePosition(-0.92, 1.1);
		this.bestScoreText = this.add.bitmapText(textXY.x, textXY.y, "font", this.bestScore.toString());

		let gameTitle = this.add.image(10, 5, "gametitle");
		gameTitle.setOrigin(0, 0);

		let howTo = this.add.image(game.config.width, 5, "howtoplay");
		howTo.setOrigin(1, 0);

		let logo = this.add.sprite(game.config.width / 2, game.config.height -100, "logo");
		logo.setOrigin(0.5, 1);
		logo.setInteractive();
		logo.on("pointerdown", function(){
			window.location.href = "http://www.yourihuig.nl/";
		})

		this.canMove = false;
		this.boardArray = [];

		this.input.keyboard.on("keydown", this.handleKey, this);
		this.input.on("pointerup", this.handleSwipe, this);

		this.moveSound = this.sound.add("move");
		this.growSound = this.sound.add("grow");

		for(let row = 0; row < gameOptions.boardSize.rows; row++) {
			this.boardArray[row] = [];
			for (let col = 0; col < gameOptions.boardSize.cols; col++) {
				let tilePosition = this.getTilePosition(row, col);

				this.add.image(tilePosition.x, tilePosition.y, "emptytile");

				let tile = this.add.sprite(tilePosition.x, tilePosition.y, "tiles", 0);
				tile.visible = false;

				this.boardArray[row][col] = {
					tileValue: 0,
					tileSprite: tile,
					upgraded: false
				};
			}
		}

		this.addTile();
		this.addTile();
	}

	handleKey(e) {
		if(this.canMove) {
			switch(e.code) {
				case "KeyA":
				case "ArrowLeft":
					this.makeMove(LEFT);
					break;
				case "KeyD":
				case "ArrowRight":
					this.makeMove(RIGHT);
					break;
				case "KeyW":
				case "ArrowUp":
					this.makeMove(UP);
					break;
				case "KeyS":
				case "ArrowDown":
					this.makeMove(DOWN);
					break;
			}
		}
	}

	handleSwipe(e) {
		let swipeTime = e.upTime - e.downTime;
		let fastEnough = swipeTime < gameOptions.swipeMaxTime;
		let swipe = new Phaser.Geom.Point(e.upX - e.downX, e.upY - e.downY);
		let swipeMagnitude = Phaser.Geom.Point.GetMagnitude(swipe);
		let longEnough = swipeMagnitude > gameOptions.swipeMinDistance;
		if(longEnough && fastEnough){
			Phaser.Geom.Point.SetMagnitude(swipe, 1);
			if(swipe.x < -gameOptions.swipeMinNormal){
				this.makeMove(LEFT);
			}
			if(swipe.x > gameOptions.swipeMinNormal){
				this.makeMove(RIGHT);
			}
			if(swipe.y < -gameOptions.swipeMinNormal){
				this.makeMove(UP);
			}
			if(swipe.y > gameOptions.swipeMinNormal){
				this.makeMove(DOWN);
			}
		}
	}

	makeMove(d){
		this.movingTiles = 0;
    let dRow = (d == LEFT || d == RIGHT) ? 0 : (d == UP) ? -1 : 1;
    let dCol = (d == UP || d == DOWN) ? 0 : d == LEFT ? -1 : 1;
    this.canMove = false;
    let firstRow = (d == UP) ? 1 : 0;
    let lastRow = gameOptions.boardSize.rows - ((d == DOWN) ? 1 : 0);
    let firstCol = (d == LEFT) ? 1 : 0;
    let lastCol = gameOptions.boardSize.cols - ((d == RIGHT) ? 1 : 0);
    for(let row = firstRow; row < lastRow; row++) {
			for (let col = firstCol; col < lastCol; col++) {
				let curRow = dRow == 1 ? (lastRow - 1) - row : row;
				let curCol = dCol == 1 ? (lastCol - 1) - col : col;
				let tileValue = this.boardArray[curRow][curCol].tileValue;
				if(tileValue != 0){
					let newRow = curRow;
					let newCol = curCol;
					while(this.isLegalPosition(newRow + dRow, newCol + dCol, tileValue)) {
						newRow += dRow;
						newCol += dCol;
					}
					if(newRow != curRow || newCol != curCol) {
						let newPos = this.getTilePosition(newRow, newCol);
						let willUpgrade = this.boardArray[newRow][newCol].tileValue == tileValue;
						this.moveTile(this.boardArray[curRow][curCol].tileSprite, newPos, willUpgrade);
						this.boardArray[curRow][curCol].tileValue = 0;
						if(willUpgrade) {
							this.boardArray[newRow][newCol].upgraded = true;
							this.boardArray[newRow][newCol].tileValue ++;
							this.score += Math.pow(2, this.boardArray[newRow][newCol].tileValue);
						} else {
							this.boardArray[newRow][newCol].tileValue = tileValue;
						}
					}
				}
			}
		}
		if(this.movingTiles == 0) {
			this.canMove = true;
		} else {
			this.moveSound.play();
		}
	}

	moveTile(tile, point, upgrade) {
		this.movingTiles++;
		tile.depth = this.movingTiles;
		let distance = Math.abs(tile.x - point.x) + Math.abs(tile.y - point.y);
		this.tweens.add({
			targets: [tile],
			x: point.x,
			y: point.y,
			duration: gameOptions.tweenSpeed * distance / gameOptions.tileSize,
			callbackScope: this,
			onComplete: function(){
				if(upgrade) {
					this.upgradeTile(tile);
				} else {
					this.endTween(tile);
				}
			}
		})
	}

	upgradeTile(tile) {
		this.growSound.play();
		tile.setFrame(tile.frame.name + 1);
		this.tweens.add({
			targets: [tile],
			scaleX: 1.1,
			scaleY: 1.1,
			duration: gameOptions.tweenSpeed,
			yoyo: true,
			repeat: 1,
			callbackScope: this,
			onComplete: function(){
				this.endTween(tile);
			}
		})
	}

	endTween(tile) {
		this.movingTiles --;
		tile.depth = 0;
		if(this.movingTiles == 0){
			this.refreshBoard();
		}
	}

	refreshBoard() {
		this.scoreText.text = this.score.toString();
		if(this.score > this.bestScore) {
			this.bestScore = this.score;
			localStorage.setItem(gameOptions.localStorageName, this.score);
			this.bestScoreText.text = this.bestScore.toString();
		}
		for(let row = 0; row < gameOptions.boardSize.rows; row++) {
			for (let col = 0; col < gameOptions.boardSize.cols; col++) {
				let spritePosition = this.getTilePosition(row, col);
				this.boardArray[row][col].tileSprite.x = spritePosition.x;
				this.boardArray[row][col].tileSprite.y = spritePosition.y;
				let tileValue = this.boardArray[row][col].tileValue;
				if(tileValue > 0) {
					this.boardArray[row][col].tileSprite.visible = true;
					this.boardArray[row][col].tileSprite.setFrame(tileValue - 1);
					this.boardArray[row][col].upgraded = false;
				} else {
					this.boardArray[row][col].tileSprite.visible = false;
				}
			}
		}
		this.addTile();
	}

	getTilePosition(row, col) {
		let posX = gameOptions.tileSpacing * (col + 1) + gameOptions.tileSize * (col + 0.5);
		let posY = gameOptions.tileSpacing * (row + 1) + gameOptions.tileSize * (row + 0.5);
		let boardHeight = gameOptions.boardSize.rows * gameOptions.tileSize;
		boardHeight += (gameOptions.boardSize.rows + 1) * gameOptions.tileSpacing;
		var offsetY = (game.config.height - boardHeight) / 2;
		posY += offsetY;
		return new Phaser.Geom.Point(posX, posY);
	}

	isLegalPosition(row, col, value) {
		let rowInside = row >= 0 && row < gameOptions.boardSize.rows;
		let colInside = col >= 0 && col < gameOptions.boardSize.cols;
		if(!rowInside || !colInside) {
			return false;
		}
		if(this.boardArray[row][col].tileValue == 12) {
			return false;
		}
		let emptySpot = this.boardArray[row][col].tileValue == 0;
		let sameValue = this.boardArray[row][col].tileValue == value;
		var alreadyUpgraded = this.boardArray[row][col].upgraded;
		return emptySpot || (sameValue && !alreadyUpgraded); 
	}

	addTile() {
		let emptyTiles = [];
		for(let row = 0; row < gameOptions.boardSize.rows; row++) {
			for (let col = 0; col < gameOptions.boardSize.cols; col++) {
				if(this.boardArray[row][col].tileValue == 0) {
					emptyTiles.push({
						row: row,
						col: col
					});
				}
			}
		}
		if(emptyTiles.length > 0) {
			let chosenTile = Phaser.Utils.Array.GetRandom(emptyTiles);
			this.boardArray[chosenTile.row][chosenTile.col].tileValue = 1;
			this.boardArray[chosenTile.row][chosenTile.col].tileSprite.setFrame(0);
			this.boardArray[chosenTile.row][chosenTile.col].tileSprite.visible = true;
			this.boardArray[chosenTile.row][chosenTile.col].tileSprite.alpha = 0;
			this.tweens.add({
				targets: [this.boardArray[chosenTile.row][chosenTile.col].tileSprite],
				alpha: 1,
				duration: gameOptions.tweenSpeed,
				callbackScope: this,
				onComplete: function(){
					this.canMove = true;
				}
			});
		}
	}
}