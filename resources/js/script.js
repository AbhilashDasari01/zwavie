const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const footer = document.querySelector(".site-footer");
const footerLinks = footer.querySelectorAll("a, .heart, .social-icons a");

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

canvas.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen().catch(err => console.error(err));
  }
});

const neonColors = ['#ff004f', '#0ff0fc', '#39ff14', '#ff8800', '#ff00ff'];
let currentColor = 'black';

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
    const frequencies = Array.from({ length: bufferLength }, (_, i) => i * sampleRate / analyser.fftSize);

    let maxKickSeen = 0;
    let wasAboveHalf = false;

    function getAvgInRange(min, max) {
      let sum = 0, count = 0;
      for (let i = 0; i < frequencies.length; i++) {
        const freq = frequencies[i];
        if (freq >= min && freq <= max) {
          sum += dataArray[i];
          count++;
        }
      }
      return count ? sum / count : 0;
    }

     let lastKick = 0;
    let kickWasFalling = false;
    const riseThreshold = 5; // minimum increase after fall to change color

    function animate() {
      requestAnimationFrame(animate);
      analyser.getByteFrequencyData(dataArray);

      const kick = getAvgInRange(20, 200);
      const subBass = getAvgInRange(16, 60);
      const bass = getAvgInRange(60, 250);

      // Footer glow update
    const glow = Math.min((bass - 100) / 100, 1); // normalize bass to 0–1
    const boxGlow = 20 + glow * 30;
    const opacity = 0.2 + glow * 0.2;

footer.style.boxShadow = `0 0 ${boxGlow}px rgba(255, 255, 255, ${0.2 + glow * 0.4})`;
footer.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;

footerLinks.forEach(el => {
  el.style.textShadow = `0 0 ${6 + glow * 12}px rgba(255, 211, 105, ${0.4 + glow * 0.4})`;
});
      // Background color change logic
      if (kick < lastKick) {
        kickWasFalling = true;
      }

   if (kickWasFalling && kick - lastKick > riseThreshold) {
  let newColor;
  do {
    newColor = neonColors[Math.floor(Math.random() * neonColors.length)];
  } while (newColor === currentColor);
  currentColor = newColor;
  kickWasFalling = false;
}

      lastKick = kick;

      // Background trail
      ctx.fillStyle = currentColor;
      ctx.globalAlpha = 0.1;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;

      const cx = width / 2;
      const cy = height / 2;

      // Kick ring
      if (kick > 160) {
        const radius = kick * 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 20, 147, 0.8)`;
        ctx.lineWidth = 5 + Math.random() * 4;
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#ff1493';
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Bass concentric rings
      if (bass > 140) {
        for (let i = 0; i < 3; i++) {
          const radius = bass * 0.8 + i * 20;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 255, 255, ${0.15 * (3 - i)})`;
          ctx.lineWidth = 2 + i;
          ctx.shadowBlur = 30;
          ctx.shadowColor = '#00ffff';
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }

      // Vocal bars (same as your original)
      const vocalStart = Math.floor(2000 / (sampleRate / 2) * bufferLength);
      const vocalEnd = Math.floor(5000 / (sampleRate / 2) * bufferLength);
      const bars = 25;
      const spacing = 7;
      const startX = cx - ((bars / 2) * spacing);
      const centerY = cy;
      const maxBarHeight = 60;

      for (let i = 0; i < bars; i++) {
        const x = startX + i * spacing;
        const barIndex = vocalStart + Math.floor((i / bars) * (vocalEnd - vocalStart));
        const energy = dataArray[barIndex] || 0;
        const height = (energy / 255) * maxBarHeight;

        ctx.beginPath();
        ctx.moveTo(x, centerY - height);
        ctx.lineTo(x, centerY + height);
        ctx.strokeStyle = `rgba(0,0,0,0.8)`;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#0ff';
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
    animate();
  })
  .catch(err => {
    console.error('Audio input error:', err);
  });