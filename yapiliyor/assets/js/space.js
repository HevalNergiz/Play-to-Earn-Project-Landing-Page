import { SVG } from "https://cdn.skypack.dev/@svgdotjs/svg.js@3.1.1";
import SimplexNoise from "https://cdn.skypack.dev/simplex-noise@3.0.1";
import {
  random,
  randomSnap,
  map,
  createVoronoiTessellation,
  seedPRNG,
  spline
} from "https://cdn.skypack.dev/@georgedoescode/generative-utils@1.0.37";
// import gsap from "https://cdn.skypack.dev/gsap@3.9.1";

const simplex = new SimplexNoise();

const width = 1080;
const height = 1080;

let numShapes = 24;

const state = {
  rate: 0.0002
};

const svg = SVG("#canvas")
  .viewbox(0, 0, width, height)
  .addTo("body")
  .attr("preserveAspectRatio", "xMidYMid slice")
  .attr("id", "canvas");

const { cells } = createVoronoiTessellation({
  width,
  height,
  points: [...Array(12)].map(() => {
    return {
      x: random(0, width),
      y: random(0, height)
    };
  }),
  relaxIterations: 0
});

const blobWrapper = svg.group();

gsap.set(blobWrapper.node, {
  scale: 1.25
});

cells.forEach((cell) => {
  blob({ x: cell.centroid.x, y: cell.centroid.y }, cell.innerCircleRadius).fill(
    "hsla(0, 0%, 0%, 0.25)"
  );
});

for (let i = 0; i < 256; i++) {
  svg
    .circle(random(1, 4))
    .cx(random(0, width))
    .cy(random(0, height))
    .fill("#fff")
    .opacity(0.5);
}

let noiseInc = state.rate;

class Point {
  constructor(x, y, canvasWidth, canvasHeight) {
    this.x = x;
    this.y = y;

    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.xOff = random(0, 10000);
    this.yOff = random(0, 10000);

    this.noiseIncrement = noiseInc;
  }

  update() {
    const x = Math.floor(
      map(simplex.noise2D(this.xOff, this.xOff), -1, 1, 0, this.canvasWidth)
    );
    const y = Math.floor(
      map(simplex.noise2D(this.yOff, this.yOff), -1, 1, 0, this.canvasHeight)
    );

    gsap.set(this, { x, y });

    this.xOff += this.noiseIncrement;
    this.yOff += this.noiseIncrement;
  }
}

class Layout {
  constructor() {
    this.maxSize = numShapes;

    this.points = [...Array(this.maxSize)].map(() => {
      return new Point(random(0, width), random(0, height), width, height);
    });

    this.cells = [];

    this.duration = 0.8;

    const { cells } = createVoronoiTessellation({
      width,
      height,
      points: this.points,
      relaxIterations: 0
    });

    for (let i = 0; i < cells.length; i++) {
      this.cells.push({
        x: cells[i].centroid.x,
        y: cells[i].centroid.y,
        rad: cells[i].innerCircleRadius
      });
    }
  }

  update() {
    let { cells } = createVoronoiTessellation({
      width,
      height,
      points: this.points,
      relaxIterations: 0
    });

    if (cells.length === this.maxSize) {
      for (let i = 0; i < this.maxSize; i++) {
        gsap.to(this.cells[i], {
          x: cells[i].centroid.x,
          y: cells[i].centroid.y,
          duration: this.duration
        });

        gsap.to(this.cells[i], {
          rad: cells[i].innerCircleRadius,
          duration: this.duration * 2
        });
      }
    }

    for (let index = 0; index < this.points.length; index++) {
      const point = this.points[index];

      point.update();

      for (let i = 0; i < this.points.length; i++) {
        if (
          i !== index &&
          this.points[i].x === point.x &&
          this.points[i].y === point.y
        ) {
          point.xOff += 0.025;
          point.yOff += 0.025;

          point.update();
        }
      }
    }
  }
}

class Character {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.rad = 0;

    this.width = 1024;
    this.height = 1024;

    this.rotationXOff = random(0, 10000);
    this.rotationYOff = random(0, 10000);
    this.rotationInc = 0.000375;

    this.group = svg.group();
    this.group.rect(this.width, this.height).fill("none");

    this.wrapper = this.group.group();

    const bodyColors = ["#7438FF", "#FFD057", "#FF6842"];

    const bodyColor = random(bodyColors);

    if (random(0, 1) > 0.5) {
      this.body = this.wrapper.ellipse(this.width, this.height).fill(bodyColor);
    } else {
      this.body = this.wrapper
        .rect(this.width, this.height)
        .fill(bodyColor)
        .rx(128);
    }

    if (random(0, 1) > 0.5) {
      const l = this.wrapper
        .rect(this.width / 12, this.height / 8)
        .cx(this.width / 2 + this.width / 6)
        .y(this.height * 0.95)
        .fill(bodyColor)
        .rx(24);

      const r = this.wrapper
        .rect(this.width / 12, this.height / 8)
        .cx(this.width / 2 - this.width / 6)
        .y(this.height * 0.95)
        .fill(bodyColor)
        .rx(24);
    } else {
      this.wrapper
        .rect(this.width / 6, this.height / 8)
        .cx(this.width / 2)
        .y(this.height * 0.95)
        .fill(bodyColor)
        .rx(24);
    }

    gsap.set(this.wrapper.node, { scale: 0, transformOrigin: "50% 50%" });

    gsap.to(this.wrapper.node, {
      scale: 1,
      delay: random(0.5, 1),
      transformOrigin: "50% 50%",
      duration: 1
    });

    this.texture = this.wrapper.group();
    this.texture.clipWith(this.body.clone());

    for (let i = 0; i < 1; i++) {
      this.texture
        .circle(random(this.width / 2, this.width * 0.75))
        .cx(random(0, this.width))
        .cy(random(0, this.height))
        .fill("hsla(0, 0%, 100%, 0.25)");
    }

    this.wrapper
      .circle(this.width / 4)
      .cx(this.width / 2 - this.width / 10)
      .cy(this.height / 3)
      .fill("#fff");

    this.wrapper
      .circle(this.width / 4)
      .cx(this.width / 2 + this.width / 10)
      .cy(this.height / 3)
      .fill("#fff");

    const eyeBallGroup = this.wrapper.group();

    const eyeLeft = eyeBallGroup
      .circle(this.width / 10)
      .cx(this.width / 2 + this.width / 10)
      .cy(this.height / 3)
      .fill("#000")
      .attr("class", "eyeball");

    const eyeRight = eyeBallGroup
      .circle(this.width / 10)
      .cx(this.width / 2 - this.width / 10)
      .cy(this.height / 3)
      .fill("#000")
      .attr("class", "eyeball");

    this.eyeBalls = [eyeLeft.node, eyeRight.node];

    gsap.to(eyeBallGroup.node, {
      x: `random(-${this.width / 24}, ${this.width / 24}, ${this.width / 24})`,
      y: `random(-${this.width / 24}, ${this.width / 24}, ${this.width / 24})`,
      repeat: -1,
      repeatRefresh: true,
      duration: 4,
      delay: random(0, 2)
      // repeatDelay: 1
    });
  }

  update(x, y, rad) {
    this.x = x;
    this.y = y;
    this.rad = rad;

    this.rotationXOff += this.rotationInc;
    this.rotationYOff += this.rotationInc;
  }

  render() {
    const noise = simplex.noise2D(this.rotationXOff, this.rotationYOff);
    const rotation = map(noise, -1, 1, 0, 360);
    const rotationEye = map(noise, -1, 1, 0, 360);

    gsap.set(this.group.node, {
      x: this.x - this.rad / 2,
      y: this.y - this.rad / 2,
      scale: this.rad / this.width
    });

    gsap.set(this.wrapper.node, {
      rotate: rotation,
      transformOrigin: "50% 50%"
    });
  }
}

const layout = new Layout();

const shapes = [];

for (let i = 0; i < numShapes; i++) {
  const character = new Character();

  shapes.push(character);
}

function addShape() {
  const thing = svg.circle();
  shapes.push(thing);
}

function update() {
  for (let i = 0; i < shapes.length; i++) {
    const cell = layout.cells[i];
    const point = layout.points[i];
    const rotation = map(
      simplex.noise2D(point.xOff, point.yOff),
      -1,
      1,
      0,
      360
    );

    shapes[i].update(cell.x, cell.y, cell.rad);
    shapes[i].render();
  }

  layout.update();
}

function pushShapeToCanvas(x, y) {
  numShapes++;

  layout.maxSize++;

  layout.points.push(new Point(x, y, width, height));
  layout.cells.push({
    x,
    y,
    rad: 0
  });

  addShape();

  wiggle();
}

function wiggle() {
  layout.points.forEach((p) => {
    p.noiseIncrement = 0.01;
    setTimeout(() => {
      p.noiseIncrement = 0.0002;
    }, 100);
  });
}

document.addEventListener("click", wiggle);

let xOffGlobal = random(0, 10000);
let yOffGlobal = random(0, 10000);

window.tl = gsap.timeline({
  repeat: -1,
  onUpdate() {
    update();
  }
});

function blob(center, maxRadius) {
  const simplex = new SimplexNoise(Math.random() * 100000000);

  const numPoints = 1024;
  const points = [];

  const angleStep = (Math.PI * 2) / numPoints;

  const detail = (Math.PI * 2) / numPoints;
  const maxVariance = random(maxRadius / 4, maxRadius / 2);

  const offsetMult = random(0.5, 1);

  for (let i = 0; i < Math.PI * 2 - detail; i += detail) {
    const xoff = map(Math.cos(i), -1, 1, 0, offsetMult);
    const yoff = map(Math.sin(i), -1, 1, 0, offsetMult);

    const radius = map(
      simplex.noise2D(xoff, yoff),
      -1,
      1,
      maxVariance,
      maxRadius
    );

    const x = center.x + radius * Math.cos(i);
    const y = center.y + radius * Math.sin(i);

    points.push({ x, y });
  }

  return blobWrapper.path(spline(points, 1, true)).fill("#000");
}
