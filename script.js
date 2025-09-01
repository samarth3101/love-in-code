// --- Config ---
const N = 2500;
const RETURN_K = 0.08;
const DAMPING = 0.9;
const REPULSE_STRENGTH = 8000;
const REPULSE_RADIUS = 70;
const MOUSE_REPULSE_STRENGTH = 3500;
const MOUSE_REPULSE_RADIUS = 90;
const STEP = 4;
const HEART_SCALE_DESKTOP = 14;
const HEART_SCALE_MOBILE = 10;

let particles = [];
let homes = [];
let maskPoints = [];
let arrows = [];
let aimStart = null;
let mouseInteraction = false;
let isMobile = false;

// Super cute sound that girls will love
function createSuperCuteSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Create adorable "kyaa~" or "piu piu" sound
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const oscillator3 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    oscillator3.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Main cute tone - bouncy ascending
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator1.frequency.linearRampToValueAtTime(900, audioContext.currentTime + 0.08);
    oscillator1.frequency.linearRampToValueAtTime(1200, audioContext.currentTime + 0.15);
    oscillator1.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);

    // Harmony for sparkle effect
    oscillator2.type = 'triangle';
    oscillator2.frequency.setValueAtTime(900, audioContext.currentTime);
    oscillator2.frequency.linearRampToValueAtTime(1350, audioContext.currentTime + 0.08);
    oscillator2.frequency.linearRampToValueAtTime(1800, audioContext.currentTime + 0.15);
    oscillator2.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.3);

    // Soft sub-harmonic for warmth
    oscillator3.type = 'sine';
    oscillator3.frequency.setValueAtTime(300, audioContext.currentTime);
    oscillator3.frequency.linearRampToValueAtTime(450, audioContext.currentTime + 0.08);
    oscillator3.frequency.linearRampToValueAtTime(600, audioContext.currentTime + 0.15);
    oscillator3.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);

    // Cute volume envelope with bounce
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.06, audioContext.currentTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(0.09, audioContext.currentTime + 0.08);
    gainNode.gain.linearRampToValueAtTime(0.04, audioContext.currentTime + 0.12);
    gainNode.gain.linearRampToValueAtTime(0.07, audioContext.currentTime + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.35);

    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime + 0.02); // Slight delay for sparkle
    oscillator3.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.35);
    oscillator2.stop(audioContext.currentTime + 0.35);
    oscillator3.stop(audioContext.currentTime + 0.35);
}

function getButtonPosition(direction) {
    const buttonSize = isMobile ? 55 : 60;
    const margin = isMobile ? 15 : 20;
    const bottomOffset = isMobile ? 80 : 20;

    switch (direction) {
        case 'top-left':
            return createVector(margin + buttonSize / 2, margin + buttonSize / 2);
        case 'top-right':
            return createVector(width - margin - buttonSize / 2, margin + buttonSize / 2);
        case 'bottom-left':
            return createVector(margin + buttonSize / 2, height - bottomOffset - buttonSize / 2);
        case 'bottom-right':
            return createVector(width - margin - buttonSize / 2, height - bottomOffset - buttonSize / 2);
        default:
            return createVector(width / 2, height / 2);
    }
}

function setup() {
    isMobile = windowWidth <= 768;
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent(document.body);
    pixelDensity(1);

    const heartScale = isMobile ? HEART_SCALE_MOBILE : HEART_SCALE_DESKTOP;
    const pg = createGraphics(width, height);
    drawHeart(pg, width / 2, height / 2, heartScale);
    pg.loadPixels();

    for (let y = 0; y < height; y += STEP) {
        for (let x = 0; x < width; x += STEP) {
            const idx = 4 * (y * width + x);
            const a = pg.pixels[idx + 3];
            if (a > 128) maskPoints.push(createVector(x, y));
        }
    }

    shuffle(maskPoints, true);
    initializeParticles();
    noStroke();

    // Auto-scatter particles initially for dramatic effect
    setTimeout(() => {
        for (let i = 0; i < particles.length; i++) {
            const scatter = p5.Vector.random2D().mult(random(200, 400));
            particles[i].pos = particles[i].home.copy().add(scatter);
        }
    }, 100);
}

function windowResized() {
    isMobile = windowWidth <= 768;
    resizeCanvas(windowWidth, windowHeight);

    maskPoints = [];
    const heartScale = isMobile ? HEART_SCALE_MOBILE : HEART_SCALE_DESKTOP;
    const pg = createGraphics(width, height);
    drawHeart(pg, width / 2, height / 2, heartScale);
    pg.loadPixels();

    for (let y = 0; y < height; y += STEP) {
        for (let x = 0; x < width; x += STEP) {
            const idx = 4 * (y * width + x);
            const a = pg.pixels[idx + 3];
            if (a > 128) maskPoints.push(createVector(x, y));
        }
    }
    shuffle(maskPoints, true);
    initializeParticles();
}

function initializeParticles() {
    particles = [];
    homes = [];

    for (let i = 0; i < N; i++) {
        const h = maskPoints[i % maskPoints.length].copy();
        homes.push(h);
        const jitter = p5.Vector.random2D().mult(random(15, 80));
        const p = h.copy().add(jitter);
        particles.push({
            pos: p,
            vel: createVector(0, 0),
            home: h
        });
    }
}

function shootArrow(direction) {
    // Play super cute sound
    try {
        createSuperCuteSound();
    } catch (e) {
        console.log('Audio not supported');
    }

    const button = document.querySelector(`.arrow-${direction}`);
    button.classList.add('pulse');
    setTimeout(() => button.classList.remove('pulse'), 800);

    // Get exact button position
    const startPos = getButtonPosition(direction);
    const heartCenter = createVector(width / 2, height / 2);

    // Calculate direction toward heart center
    let targetDirection = p5.Vector.sub(heartCenter, startPos).normalize();

    // 60% accuracy: 6 out of 10 arrows hit heart accurately
    const accuracy = random(0, 1);
    let randomAngle;

    if (accuracy < 0.6) {
        // Accurate shot - very small deviation (±8 degrees)
        randomAngle = random(-PI / 22.5, PI / 22.5);
    } else {
        // Less accurate shot - larger deviation (±30 degrees)
        randomAngle = random(-PI / 6, PI / 6);
    }

    // Rotate the direction by random angle
    const rotatedX = targetDirection.x * cos(randomAngle) - targetDirection.y * sin(randomAngle);
    const rotatedY = targetDirection.x * sin(randomAngle) + targetDirection.y * cos(randomAngle);

    targetDirection.set(rotatedX, rotatedY);

    // Speed variation
    const speed = random(11, 13);
    const velocity = targetDirection.mult(speed);

    // Very slight curve for visual interest
    const spin = random(-0.015, 0.015);

    arrows.push({
        pos: startPos.copy(),
        vel: velocity,
        spin: spin,
        active: true,
        trail: [],
        life: 255,
        age: 0,
        accurate: accuracy < 0.6
    });
}

function draw() {
    // Dynamic background with subtle gradient
    background(10, 10, 15);

    mouseInteraction = (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height);

    // Update arrows with improved targeting
    for (let i = arrows.length - 1; i >= 0; i--) {
        const arrow = arrows[i];
        if (!arrow.active) continue;

        arrow.trail.push({ pos: arrow.pos.copy(), life: arrow.life });
        if (arrow.trail.length > 15) arrow.trail.shift();

        // Gentle course correction for accurate arrows
        if (arrow.accurate && arrow.age < 100) {
            const heartCenter = createVector(width / 2, height / 2);
            const toHeart = p5.Vector.sub(heartCenter, arrow.pos);
            const correctionForce = toHeart.normalize().mult(0.3);
            arrow.vel.add(correctionForce);
            arrow.vel.normalize().mult(12); // Maintain speed
        }

        // Very gentle spin/curve
        arrow.vel.rotate(arrow.spin);

        // Minimal turbulence for accurate arrows, more for others
        const turbulenceStrength = arrow.accurate ? 0.02 : 0.08;
        const turbulence = p5.Vector.random2D().mult(turbulenceStrength);
        arrow.vel.add(turbulence);

        arrow.pos.add(arrow.vel);
        arrow.vel.mult(0.999);
        arrow.life -= 1.2;
        arrow.age++;

        // Remove arrows when they're way off screen or too old
        if (arrow.pos.x < -300 || arrow.pos.x > width + 300 ||
            arrow.pos.y < -300 || arrow.pos.y > height + 300 ||
            arrow.life <= 0 || arrow.age > 700) {
            arrows.splice(i, 1);
        }
    }

    // Update particles with enhanced physics
    for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];

        const toHome = p5.Vector.sub(pt.home, pt.pos).mult(RETURN_K);

        let repel = createVector(0, 0);
        for (let arrow of arrows) {
            if (!arrow.active) continue;
            const d = p5.Vector.dist(pt.pos, arrow.pos);
            if (d < REPULSE_RADIUS) {
                const dir = p5.Vector.sub(pt.pos, arrow.pos);
                const strength = REPULSE_STRENGTH / (d * d + 15);
                dir.setMag(strength);
                repel.add(dir);
            }
        }

        // Enhanced touch interaction
        if (mouseInteraction && mousePressed) {
            const mouseVec = createVector(mouseX, mouseY);
            const d = p5.Vector.dist(pt.pos, mouseVec);
            if (d < MOUSE_REPULSE_RADIUS) {
                const dir = p5.Vector.sub(pt.pos, mouseVec);
                const strength = MOUSE_REPULSE_STRENGTH / (d * d + 20);
                dir.setMag(strength);
                repel.add(dir);
            }
        }

        pt.vel.add(toHome).add(repel);
        pt.vel.mult(DAMPING);
        pt.pos.add(pt.vel);
    }

    // Draw particles with enhanced visuals
    noStroke();
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i].pos;
        const distFromCenter = p5.Vector.dist(p, createVector(width / 2, height / 2));
        const brightness = map(distFromCenter, 0, 400, 255, 180);

        // Subtle color variation
        const r = brightness;
        const g = brightness * 0.92;
        const b = brightness * 0.96;
        fill(r, g, b, map(brightness, 180, 255, 200, 255));

        const size = random(1.8, 3.2);
        ellipse(p.x, p.y, size, size);
    }

    // Draw enhanced arrow trails and arrows
    for (let arrow of arrows) {
        if (!arrow.active) continue;

        // Different trail colors for accurate vs inaccurate arrows
        const baseHue = arrow.accurate ? [255, 150, 200] : [255, 120, 180];
        stroke(baseHue[0], baseHue[1], baseHue[2], 180);
        strokeWeight(arrow.accurate ? 5 : 4);
        noFill();

        if (arrow.trail.length > 1) {
            beginShape();
            for (let i = 0; i < arrow.trail.length; i++) {
                const trailPoint = arrow.trail[i];
                const alpha = map(i, 0, arrow.trail.length - 1, 0, trailPoint.life);
                stroke(baseHue[0], baseHue[1], baseHue[2], alpha);
                vertex(trailPoint.pos.x, trailPoint.pos.y);
            }
            endShape();
        }

        drawEnhancedArrow(arrow.pos, arrow.vel.copy().setMag(25), arrow.life, arrow.accurate);
    }

    // Draw manual aim UI
    if (aimStart) {
        stroke(255, 255, 255, 180);
        strokeWeight(2.5);
        line(aimStart.x, aimStart.y, mouseX, mouseY);
        noStroke();
        fill(255, 255, 255, 220);
        circle(aimStart.x, aimStart.y, 10);
    }
}

function mousePressed() {
    if (mouseInteraction) {
        aimStart = createVector(mouseX, mouseY);
    }
}

function mouseReleased() {
    if (!aimStart || !mouseInteraction) return;
    const aimEnd = createVector(mouseX, mouseY);
    const dir = p5.Vector.sub(aimEnd, aimStart);
    if (dir.mag() > 5) {
        // Add sound for manual arrows too
        try {
            createSuperCuteSound();
        } catch (e) {
            console.log('Audio not supported');
        }

        arrows.push({
            pos: aimStart.copy(),
            vel: dir.mult(0.15),
            spin: random(-0.01, 0.01),
            active: true,
            trail: [],
            life: 255,
            age: 0,
            accurate: true // Manual arrows are always accurate
        });
    }
    aimStart = null;
}

function drawHeart(pg, cx, cy, scale) {
    pg.clear();
    pg.push();
    pg.translate(cx, cy);
    pg.noStroke();
    pg.fill(255);

    const outline = [];
    for (let t = 0; t <= TWO_PI; t += 0.008) {
        const x = 16 * pow(sin(t), 3);
        const y = 13 * cos(t) - 5 * cos(2 * t) - 2 * cos(3 * t) - cos(4 * t);
        outline.push(createVector(x, -y));
    }

    let scaled = outline.map(v => p5.Vector.mult(v, scale));

    pg.beginShape();
    for (let v of scaled) pg.vertex(v.x, v.y);
    pg.endShape(CLOSE);
    pg.pop();
}

function drawEnhancedArrow(pos, tipVec, life, accurate) {
    const alpha = map(life, 0, 255, 100, 240);
    const color = accurate ? [255, 160, 220] : [255, 140, 200];
    stroke(color[0], color[1], color[2], alpha);
    strokeWeight(accurate ? 6 : 5);
    const tail = p5.Vector.sub(pos, tipVec);
    line(tail.x, tail.y, pos.x, pos.y);

    push();
    translate(pos.x, pos.y);
    const a = atan2(tipVec.y, tipVec.x);
    rotate(a);
    strokeWeight(accurate ? 5 : 4);
    line(0, 0, -15, -10);
    line(0, 0, -15, 10);
    pop();
    noStroke();
}

function shuffle(array, inPlace) {
    let arr = inPlace ? array : array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}