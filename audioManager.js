
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let source;
let buffer;

fetch('audio/pelimusa.mp3')
    .then(response => response.arrayBuffer())
    .then(data => audioContext.decodeAudioData(data))
    .then(decodedBuffer => {
        buffer = decodedBuffer;
    })
    .catch(e => {
        console.error(e);
    });

let currentSource;

function playSound(audioBuffer) {
    let soundSource = audioContext.createBufferSource();
    soundSource.buffer = audioBuffer;
    soundSource.loop = true;
    soundSource.connect(audioContext.destination);
    soundSource.start();
    currentSource = soundSource;  // Päivitä currentSource
    return soundSource;
}

let isPlaying = false;  // Muuttuja, joka seuraa, onko musiikki päällä vai ei

let gameMusicBuffer;

fetch('audio/pelimusa-juoksu.mp3')
    .then(response => response.arrayBuffer())
    .then(data => audioContext.decodeAudioData(data))
    .then(decodedBuffer => {
        gameMusicBuffer = decodedBuffer;
    })
    .catch(e => {
        console.error(e);
    });

let gameOverMusicBuffer;

fetch('audio/gameOver.mp3')
    .then(response => response.arrayBuffer())
    .then(data => audioContext.decodeAudioData(data))
    .then(decodedBuffer => {
        gameOverMusicBuffer = decodedBuffer;
    })
    .catch(e => {
        console.error(e);
    });

let kipitysBuffer;

fetch('audio/kipitys.mp3')
    .then(response => response.arrayBuffer())
    .then(data => audioContext.decodeAudioData(data))
    .then(decodedBuffer => {
        kipitysBuffer = decodedBuffer;
    })
    .catch(e => {
        console.error(e);
    });
    
let isKipitysPlaying = false;

function playKipitys() {
    if (!isKipitysPlaying) {
        let kipitysSource = audioContext.createBufferSource();
        kipitysSource.buffer = kipitysBuffer;
        kipitysSource.connect(audioContext.destination);
        kipitysSource.start();
        isKipitysPlaying = true;

        kipitysSource.onended = function() {
            isKipitysPlaying = false;
        };
    }
}

let kurnausBuffer;

fetch('audio/kurnaus.mp3')
    .then(response => response.arrayBuffer())
    .then(data => audioContext.decodeAudioData(data))
    .then(decodedBuffer => {
        kurnausBuffer = decodedBuffer;
    })
    .catch(e => {
        console.error(e);
    });

function playKurnaus() {
    let soundSource = audioContext.createBufferSource();
    soundSource.buffer = kurnausBuffer;
    soundSource.connect(audioContext.destination);
    soundSource.start();
}
    
let royhBuffer;

fetch('audio/royh3.mp3')
    .then(response => response.arrayBuffer())
    .then(data => audioContext.decodeAudioData(data))
    .then(decodedBuffer => {
        royhBuffer = decodedBuffer;
    })
    .catch(e => {
        console.error(e);
    });

function playRoyh() {
    let soundSource = audioContext.createBufferSource();
    soundSource.buffer = royhBuffer;
    soundSource.connect(audioContext.destination);
    soundSource.start();
}
    
document.getElementById("musicToggle").addEventListener("change", function() {
    if (this.checked) {
        playSound(buffer);  // Aloita musiikki
    } else {
        stopSound();  // Pysäytä musiikki
    }
});

// Kun haluat pysäyttää musiikin
function stopSound() {
    if (currentSource) {
        currentSource.stop();
        currentSource = null;
    }
}

let kipitysSource;

function stopKipitys() {
    if (kipitysSource) {
        kipitysSource.stop();
        kipitysSource = null;
        isKipitysPlaying = false;
    }
}