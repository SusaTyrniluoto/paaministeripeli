document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("startButton").addEventListener("click", startGame);
    document.getElementById("restartButton").addEventListener("click", restartGame);

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const playerImage = new Image();
    playerImage.src = 'kuvat/pelaaja.png';

    let gameState = "notStarted";
    //let gameLoopRunning = false;

    const baseSpeed = 20; // esimerkiksi 25 pikseliä per päivitys referenssinäytön leveydellä
    const referenceScreenWidth = 1220; // esimerkiksi Full HD -näytön leveys

    let playerSpeed = (canvas.width / referenceScreenWidth) * baseSpeed;

    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    let playerBaseWidth = 170;
    let playerBaseHeight = 170;
    if (isMobileDevice()) {
        playerBaseWidth = 80;  // Pienennä pelaajan leveyttä
        playerBaseHeight = 80; // Pienennä pelaajan korkeutta
    }

    let esineBaseWidth = 50;  // oletuskoko
    let esineBaseHeight = 50; // oletuskoko
    if (isMobileDevice()) {
        esineBaseWidth = 30;  // Pienennä esineen leveyttä mobiililaitteilla
        esineBaseHeight = 30; // Pienennä esineen korkeutta mobiililaitteilla
    }
    
    let hahmoBaseWidth = 150;  // esimerkkikoko
    let hahmoBaseHeight = 150; // esimerkkikoko
    if (isMobileDevice()) {
        hahmoBaseWidth = 80;  // Pienennä hahmon leveyttä
        hahmoBaseHeight = 80; // Pienennä hahmon korkeutta
    }
    
    let distanceFromBottom = 20; // esimerkiksi 50 pikseliä alareunasta

    let player = {
        x: canvas.width / 2 - playerBaseWidth / 2,
        y: canvas.height - playerBaseHeight - distanceFromBottom,
        width: playerBaseWidth,
        height: playerBaseHeight,
        speed: 25,
        direction: 1  // 1 for right, -1 for left
    };

    const hahmoImages = [
        new Image(),
        new Image(),
        new Image()
    ];
    hahmoImages[0].src = 'kuvat/hahmo1.png';
    hahmoImages[1].src = 'kuvat/hahmo2.png';
    hahmoImages[2].src = 'kuvat/hahmo3.png';

    const ristiImage = new Image();
    ristiImage.src = 'kuvat/risti.png';

    const sammakkoImage = new Image();
    sammakkoImage.src = 'kuvat/sammakko.png';

    let esineet = [];
    let hahmot = [];
    let score = 0;
    let toimintakyky = 10;

    let isTouching = false;
    let touchDirection = 0; // -1 vasemmalle, 1 oikealle
    
    let movementInterval;
    canvas.addEventListener('touchstart', handleTouch, false);
    canvas.addEventListener('touchend', handleTouch, false);

    let baseEsineSpeed = 5;  // Oletusnopeus esineille
    let baseHahmoSpeed = 2;  // Oletusnopeus hahmoille
    let gameSpeedMultiplier = 1;

    esineet.speed = baseEsineSpeed * gameSpeedMultiplier;
    hahmot.speed = baseHahmoSpeed * gameSpeedMultiplier;

    function startGame() {
        stopSound();
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }        
        console.log("startGame called");
        document.getElementById("startScreen").style.display = "none";  // Piilota aloitusnäyttö
        document.body.style.overflow = 'hidden';
        if (gameState !== "playing") {
            gameState = "playing";
            
            if (audioContext.state !== 'suspended') {
                playSound(gameMusicBuffer);
            }
            gameLoop();
        }
    }
    
    function restartGame() {
        // Nollaa pelin tila ja muuttujat
        stopSound();
        gameState = "playing";
        esineet = [];
        hahmot = [];
        score = 0;
        toimintakyky = 10;

        // Piilota pelin päättyneen näyttö ja käynnistä peli uudelleen
        document.getElementById("gameOverScreen").style.display = "none";
        //gameLoopRunning = false;
        if (audioContext.state !== 'suspended') {
            playSound(gameMusicBuffer);
        }
        gameLoop();
    }

    function drawPlayer() {
        ctx.save();
        if (player.direction === -1) {
            ctx.scale(-1, 1);
            ctx.drawImage(playerImage, -player.x - player.width, player.y, player.width, player.height);
        } else {
            ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
        }
        ctx.restore();
    }

    function spawnEsine() {
        let esineType = Math.random() < 0.9 ? 'sammakko' : 'risti';
        let hahmoType = esineType === 'risti' ? 2 : Math.floor(Math.random() * 2);

        let esine = {
            x: Math.random() * (canvas.width - esineBaseWidth),
            y: -esineBaseHeight,
            width: esineBaseWidth,
            height: esineBaseHeight,
            speed: baseEsineSpeed * gameSpeedMultiplier,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            type: esineType,
            active: false
        };

        let hahmo = {
            x: esine.x,
            y: -150,
            width: hahmoBaseWidth,
            height: hahmoBaseHeight,
            speed: baseHahmoSpeed * gameSpeedMultiplier,
            type: hahmoType,
            state: 'descending',
            esine: esine  // Liitä esine hahmoon
        };
  
        hahmot.push(hahmo);
    }

    function updateGame() {
        if (Math.random() < 0.02) {
            spawnEsine();
        }
        
        hahmot.forEach((hahmo) => {
            if (hahmo.state === 'descending' && hahmo.y < 0) {
                hahmo.y += hahmo.speed;
            } else if (hahmo.state === 'descending' && hahmo.y >= 0) {
                hahmo.state = 'pausing';
        
                if (hahmo.esine) {
                    hahmo.esine.x = hahmo.x + hahmo.width / 2 - hahmo.esine.width / 2;  // Aseta esineen sijainti hahmon keskelle
                    hahmo.esine.y = hahmo.y + 50;  // Aseta esineen y-sijainti hahmon yläpuolelle
                    hahmo.esine.active = true;  // Aktivoi hahmoon liitetty esine
                    esineet.push(hahmo.esine);  // Siirrä esine esineet-taulukkoon
                    
                    if (hahmo.esine.type === "sammakko") {
                        playKurnaus();
                    } else {
                        playRoyh();
                    }
                    hahmo.esine = null;  // Poista esine hahmosta
                }
                
                setTimeout(() => {
                    hahmo.state = 'ascending';
                }, 1000);
            } else if (hahmo.state === 'ascending') {
                hahmo.y -= hahmo.speed;
                if (hahmo.y < -hahmo.height) {
                    hahmot.splice(hahmot.indexOf(hahmo), 1);
                }
            }
        });
    
    

        // Esineiden päivitys
        esineet.forEach((esine, index) => {
            if (esine.active) {
                esine.y += esine.speed;
                esine.rotation += esine.rotationSpeed;

                if (esine.y + esine.height > player.y && esine.y < player.y + player.height && esine.x + esine.width > player.x && esine.x < player.x + player.width) {
                    if (esine.type === 'risti') {
                        toimintakyky += 1;
                    } else {
                        toimintakyky += 1;
                    }
                    score += 1;
                    esineet.splice(index, 1);  // Poista esine esineet-taulukosta
                } else if (esine.y > canvas.height) {
                    if (esine.type === 'risti') {
                        toimintakyky -= 10;
                    } else {
                        toimintakyky -= 1;
                    }
                    esineet.splice(index, 1);  // Poista esine esineet-taulukosta
                }
                if (esine.x + esine.width > canvas.width) {
                    esine.x = canvas.width - esine.width;
                }
            }
        });
        if (toimintakyky <= 0) {
            gameState = "gameover";
            canvas.removeEventListener('touchstart', handleTouch);
            document.getElementById("finalScore").textContent = "Sait " + score + " pistettä";
        }
        if (isTouching) {
            if (touchDirection === 1 && player.x + player.width < canvas.width) {
                player.x += playerSpeed;
            } else if (touchDirection === -1 && player.x > 0) {
                player.x -= playerSpeed;
            }
        }
    
    }

    function drawGame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        hahmot.forEach(hahmo => {
            ctx.drawImage(hahmoImages[hahmo.type], hahmo.x, hahmo.y, hahmo.width, hahmo.height);
        
            let esine = hahmo.esine;
            if (esine && esine.active) {
                ctx.save();
                ctx.translate(esine.x + esine.width / 2, esine.y + esine.height / 2);
                ctx.rotate(esine.rotation);
                if (esine.type === 'risti') {
                    ctx.drawImage(ristiImage, -esine.width / 2, -esine.height / 2, esine.width, esine.height);
                } else {
                    ctx.drawImage(sammakkoImage, -esine.width / 2, -esine.height / 2, esine.width, esine.height);
                }
                ctx.restore();
            }
        });
        

        esineet.forEach(esine => {
            if (esine.active) {  // Tarkista, onko esine aktiivinen ennen kuin päivität sen sijaintia.

            }    
            ctx.save();
            ctx.translate(esine.x + esine.width / 2, esine.y + esine.height / 2);
            ctx.rotate(esine.rotation);
            if (esine.type === 'risti') {
                ctx.drawImage(ristiImage, -esine.width / 2, -esine.height / 2, esine.width, esine.height);
            } else {
                ctx.drawImage(sammakkoImage, -esine.width / 2, -esine.height / 2, esine.width, esine.height);
            }
            ctx.restore();
        });

        drawPlayer();

        ctx.font = "20px Arial"; // Voit muokata fontin kokoa ja tyyliä tarpeen mukaan
        ctx.fillStyle = "#000"; // Tekstin väri
        ctx.fillText("Toimintakykypisteet: " + toimintakyky, 10, 30); // Piirrä teksti ruudun yläkulmaan

    
        if (gameState === "gameover") {
            stopSound();
            playSound(gameOverMusicBuffer);
            ctx.fillText("Peli päättyi!", canvas.width / 2, canvas.height / 2 - 20);
            document.getElementById("gameOverScreen").style.display = "block";
            return;  // lopeta piirto tässä
        }  
    }

    function gameLoop() {
        if (gameState === "playing") {
            updateGame();
            drawGame();
            requestAnimationFrame(gameLoop);  // Kutsu gameLoop-funktiota uudelleen vain, jos gameState on "playing"
        }
    }

    document.addEventListener("keydown", function(e) {
        if (e.key === "ArrowLeft" && player.x > 0) {
            playKipitys();
            player.x -= playerSpeed;
            player.direction = -1;
        } else if (e.key === "ArrowRight" && player.x + player.width < canvas.width) {
            playKipitys();
            player.x += playerSpeed;
            player.direction = 1;
        }
        
    });

    function handleTouch(e) {
        e.preventDefault();
        
        if (e.type === 'touchstart') {
            let touchX = e.touches[0].clientX;
            let touchDirection = touchX > canvas.width / 2 ? 1 : -1;
            player.direction = touchDirection;
            playKipitys();
            // Aloita toistuva liike
            movementInterval = setInterval(() => {
                if (touchDirection === 1 && player.x + player.width < canvas.width) {
                    player.x += playerSpeed;
                    playKipitys();
                } else if (touchDirection === -1 && player.x > 0) {
                    player.x -= playerSpeed;
                    playKipitys();
                }
            }, 100);  // 100ms välein, voit säätää tätä arvoa tarpeesi mukaan
        } else if (e.type === 'touchend') {
            // Lopeta toistuva liike
            clearInterval(movementInterval);
            stopKipitys();
        }
        
    }
    setInterval(() => {
        gameSpeedMultiplier += 0.1;
        esineet.speed = baseEsineSpeed * gameSpeedMultiplier;
        hahmot.speed = baseHahmoSpeed * gameSpeedMultiplier;
    }, 30000);
    
});

