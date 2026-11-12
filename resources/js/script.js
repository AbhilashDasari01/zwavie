const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const footer = document.querySelector(".site-footer");
const footerLinks = footer.querySelectorAll("a, .heart, .social-icons a");

const raveBtn = document.getElementById("raveBtn");
const goldBtn = document.getElementById("goldBtn");

// ==========================================
// MODE MANAGEMENT
// ==========================================

let currentMode = "rave";

function setMode(mode) {
currentMode = mode;
raveBtn.classList.toggle("active", mode === "rave");
goldBtn.classList.toggle("active", mode === "gold");
}

raveBtn.addEventListener("click", () => setMode("rave"));
goldBtn.addEventListener("click", () => setMode("gold"));

// ==========================================
// CANVAS
// ==========================================

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
width = canvas.width = window.innerWidth;
height = canvas.height = window.innerHeight;
});

canvas.addEventListener("click", () => {
if (!document.fullscreenElement) {
canvas.requestFullscreen().catch(err => console.error(err));
}
});

// ==========================================
// RAVE COLORS
// ==========================================

const neonColors = [
"rgb(255, 30, 30)",
"rgb(200, 0, 255)",
"rgb(255, 200, 50)"
];

let currentColor = "black";

// ==========================================
// AUDIO INITIALIZATION
// ==========================================

navigator.mediaDevices.getUserMedia({ audio: true })

.then(stream => {

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
const source = audioCtx.createMediaStreamSource(stream);
analyser.fftSize = 2048;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);
source.connect(analyser);
const sampleRate = audioCtx.sampleRate;
const frequencies = Array.from(
    { length: bufferLength },
    (_, i) => i * sampleRate / analyser.fftSize
);
let lastKick = 0;
let kickWasFalling = false;
const riseThreshold = 5;
// FREQUENCY CALCULATIONS
function getAvgInRange(min, max) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < frequencies.length; i++) {
        const freq = frequencies[i];
        if (freq >= min && freq <= max) {
            sum += dataArray[i];
            count++;
        }
    }
    return count ? sum / count : 0;
}
// ======================================
// ANIMATION
// ======================================
function animate() {
    requestAnimationFrame(animate);
    analyser.getByteFrequencyData(dataArray);
    const kick = getAvgInRange(20, 200);
    const subBass = getAvgInRange(16, 60);
    const bass = getAvgInRange(60, 250);
    const cx = width / 2;
    const cy = height / 2;
    // FOOTER GLOW
    const glow = Math.max(0, Math.min((bass - 100) / 100, 1));
    const boxGlow = 20 + glow * 30;
    const opacity = 0.2 + glow * 0.2;
    // ==================================
    // RAVE MODE
    // ==================================
    if (currentMode === "rave") {
        footer.style.boxShadow =
            `0 0 ${boxGlow}px rgba(255,255,255,${0.2 + glow * 0.4})`;
        footer.style.backgroundColor =
            `rgba(0,0,0,${opacity})`;
        footerLinks.forEach(el => {
            el.style.textShadow =
                `0 0 ${6 + glow * 12}px rgba(255,211,105,${0.4 + glow * 0.4})`;
        });
        // BACKGROUND COLOR TRANSITIONS
        if (kick < lastKick) {
            kickWasFalling = true;
        }
        if (kickWasFalling && kick - lastKick > riseThreshold) {
            let newColor;
            do {
                newColor = neonColors[
                    Math.floor(Math.random() * neonColors.length)
                ];
            } while (newColor === currentColor);
            currentColor = newColor;
            kickWasFalling = false;
        }
        // BACKGROUND TRAIL
        ctx.fillStyle = currentColor;
        ctx.globalAlpha = 0.1;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
        // KICK RING
        if (kick > 160) {
            const radius = kick * 1.2;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255,20,147,0.8)";
            ctx.lineWidth = 5 + Math.random() * 4;
            ctx.shadowBlur = 40;
            ctx.shadowColor = "#ff1493";
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        // BASS CONCENTRIC RINGS
        if (bass > 140) {
            for (let i = 0; i < 3; i++) {
                const radius = bass * 0.8 + i * 20;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.strokeStyle =
                    `rgba(0,255,255,${0.15 * (3 - i)})`;
                ctx.lineWidth = 2 + i;
                ctx.shadowBlur = 30;
                ctx.shadowColor = "#00ffff";
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        }
        // VOCAL BARS
        const vocalStart = Math.floor(
            2000 / (sampleRate / 2) * bufferLength
        );
        const vocalEnd = Math.floor(
            5000 / (sampleRate / 2) * bufferLength
        );
        const bars = 25;
        const spacing = 7;
        const startX = cx - ((bars / 2) * spacing);
        for (let i = 0; i < bars; i++) {
            const x = startX + i * spacing;
            const barIndex = vocalStart +
                Math.floor((i / bars) * (vocalEnd - vocalStart));
            const energy = dataArray[barIndex] || 0;
            const barHeight = (energy / 255) * 60;
            ctx.beginPath();
            ctx.moveTo(x, cy - barHeight);
            ctx.lineTo(x, cy + barHeight);
            ctx.strokeStyle = "rgba(0,0,0,0.8)";
            ctx.lineWidth = 1;
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#0ff";
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }
    // ==================================
    // GOLD MODE
    // ==================================
    else {
        // FOOTER GOLD GLOW
        footer.style.boxShadow =
            `0 0 ${boxGlow}px rgba(255,200,60,${0.3 + glow * 0.4})`;
        footer.style.backgroundColor =
            `rgba(0,0,0,${opacity})`;
        footerLinks.forEach(el => {
            el.style.textShadow =
                `0 0 ${6 + glow * 12}px rgba(255,215,100,${0.5 + glow * 0.4})`;
        });
        // BLACK BACKGROUND
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(0, 0, width, height);
        // GOLD KICK RING
        if (kick > 160) {
            const radius = kick * 1.2;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255,215,0,0.9)";
            ctx.lineWidth = 6 + Math.random() * 3;
            ctx.shadowBlur = 40;
            ctx.shadowColor = "gold";
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        // CYAN BASS RINGS
        if (bass > 140) {
            for (let i = 0; i < 3; i++) {
                const radius = bass * 0.8 + i * 20;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.strokeStyle =
                    `rgba(0,255,255,${0.15 * (3 - i)})`;
                ctx.lineWidth = 2 + i;
                ctx.shadowBlur = 30;
                ctx.shadowColor = "#00ffff";
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        }
        // SYMMETRICAL GOLD VOCAL BARS
        const vocalStart = Math.floor(
            1000 / (sampleRate / 2) * bufferLength
        );
        const vocalEnd = Math.floor(
            20000 / (sampleRate / 2) * bufferLength
        );
        const bars = 25;
        const spacing = 7;
        for (let i = 0; i < bars; i++) {
            const offset = (i - bars / 2) * spacing;
            const xLeft = cx - offset;
            const xRight = cx + offset;
            const barIndex = vocalStart +
                Math.floor((i / bars) * (vocalEnd - vocalStart));
            const energy = dataArray[barIndex] || 0;
            const barHeight = (energy / 255) * 60;
            function drawBar(x) {
                ctx.beginPath();
                ctx.moveTo(x, cy - barHeight);
                ctx.lineTo(x, cy + barHeight);
                ctx.strokeStyle = "rgba(255,215,0,0.85)";
                ctx.lineWidth = 2;
                ctx.shadowBlur = 20;
                ctx.shadowColor = "black";
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
            drawBar(xLeft);
            drawBar(xRight);
        }
    }
    lastKick = kick;
}
animate();

})

.catch(err => {
console.error("Audio input error:", err);
});

// ==========================================
// WAKE LOCK
// ==========================================

let wakeLock = null;

async function keepScreenAwake() {

try {
    if ("wakeLock" in navigator) {
        wakeLock = await navigator.wakeLock.request("screen");
        console.log("Screen Wake Lock enabled");
        document.addEventListener("visibilitychange", async () => {
            if (
                wakeLock !== null &&
                document.visibilityState === "visible"
            ) {
                wakeLock = await navigator.wakeLock.request("screen");
                console.log("Wake Lock reactivated");
            }
        });
    } else {
        console.warn("Wake Lock API not supported");
    }
} catch (err) {
    console.error("Failed to enable Wake Lock:", err);
}

}

window.addEventListener("load", keepScreenAwake);