(function () {
  class RosePetalsScene {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.petals = [];
      this.pointer = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        active: false
      };
      this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      this.count = Math.max(26, Math.floor(window.innerWidth / 38));

      this.handleResize = this.handleResize.bind(this);
      this.handlePointerMove = this.handlePointerMove.bind(this);
      this.handlePointerLeave = this.handlePointerLeave.bind(this);
      this.animate = this.animate.bind(this);

      this.handleResize();
      this.seed();
      window.addEventListener("resize", this.handleResize);
      window.addEventListener("pointermove", this.handlePointerMove, { passive: true });
      window.addEventListener("pointerleave", this.handlePointerLeave);
      requestAnimationFrame(this.animate);
    }

    handleResize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width * this.pixelRatio;
      this.canvas.height = this.height * this.pixelRatio;
      this.canvas.style.width = this.width + "px";
      this.canvas.style.height = this.height + "px";
      this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    }

    handlePointerMove(event) {
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
      this.pointer.active = true;
    }

    handlePointerLeave() {
      this.pointer.active = false;
    }

    seed() {
      this.petals = Array.from({ length: this.count }, () => this.createPetal(true));
    }

    createPetal(allowAnywhere = false) {
      return {
        x: Math.random() * this.width,
        y: allowAnywhere ? Math.random() * this.height : -30 - Math.random() * this.height * 0.35,
        size: 9 + Math.random() * 15,
        speedY: 0.7 + Math.random() * 1.45,
        speedX: -0.35 + Math.random() * 0.7,
        drift: Math.random() * Math.PI * 2,
        driftSpeed: 0.008 + Math.random() * 0.018,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: -0.02 + Math.random() * 0.04,
        colorA: Math.random() > 0.5 ? "rgba(216,154,166,0.85)" : "rgba(158,75,95,0.8)",
        colorB: "rgba(255,237,227,0.65)"
      };
    }

    respawn(petal) {
      Object.assign(petal, this.createPetal(false), {
        x: Math.random() * this.width
      });
    }

    drawPetal(petal) {
      const ctx = this.ctx;
      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.rotation);

      const gradient = ctx.createLinearGradient(-petal.size, -petal.size, petal.size, petal.size);
      gradient.addColorStop(0, petal.colorB);
      gradient.addColorStop(1, petal.colorA);
      ctx.fillStyle = gradient;

      ctx.beginPath();
      ctx.moveTo(0, -petal.size);
      ctx.bezierCurveTo(petal.size * 0.9, -petal.size * 0.8, petal.size * 0.9, petal.size * 0.5, 0, petal.size);
      ctx.bezierCurveTo(-petal.size * 0.9, petal.size * 0.5, -petal.size * 0.9, -petal.size * 0.8, 0, -petal.size);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.beginPath();
      ctx.ellipse(petal.size * 0.18, -petal.size * 0.15, petal.size * 0.24, petal.size * 0.65, Math.PI / 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    animate() {
      this.ctx.clearRect(0, 0, this.width, this.height);

      for (const petal of this.petals) {
        petal.drift += petal.driftSpeed;
        petal.rotation += petal.rotationSpeed;
        petal.x += petal.speedX + Math.sin(petal.drift) * 0.7;
        petal.y += petal.speedY + Math.cos(petal.drift * 0.8) * 0.2;

        if (this.pointer.active) {
          const dx = petal.x - this.pointer.x;
          const dy = petal.y - this.pointer.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance < 110) {
            const force = (110 - distance) / 110;
            petal.x += (dx / distance) * force * 5.5;
            petal.y += (dy / distance) * force * 4.2;
          }
        }

        if (petal.y > this.height + 40 || petal.x < -60 || petal.x > this.width + 60) {
          this.respawn(petal);
        }

        this.drawPetal(petal);
      }

      requestAnimationFrame(this.animate);
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("petal-canvas");
    if (canvas) {
      window.rosePetalsScene = new RosePetalsScene(canvas);
    }
  });
})();
