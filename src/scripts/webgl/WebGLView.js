import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';
import glslify from 'glslify';
import Tweakpane from 'tweakpane';
import OrbitControls from 'three-orbitcontrols';
import TweenMax from 'TweenMax';
import baseDiffuseFrag from '../../shaders/basicDiffuse.frag';
import basicDiffuseVert from '../../shaders/basicDiffuse.vert';
import MouseCanvas from '../MouseCanvas';
import TextCanvas from '../TextCanvas';
import RenderTri from '../RenderTri';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { debounce } from '../utils/debounce';
import feedbackFrag from '../../shaders/feedback.frag';

export default class WebGLView {
  constructor(app) {
    this.app = app;
    this.PARAMS = {
      rotSpeed: 0.005
    };

    this.init();
  }

  async init() {
    this.initThree();
    this.initBgScene();
    this.initTweakPane();
    this.setupTextCanvas();
    this.initMouseMoveListen();
    this.initMouseCanvas();
    this.initRenderTri();
    this.initPostProcessing();
    this.initResizeHandler();

    this.initCircles();
    this.setupFrameBuffer();
  }

  setupFrameBuffer() {
    this.renderTargetA = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter
    });
    this.renderTargetB = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter
    });

    // create scene and camera
    this.fbScene = new THREE.Scene();
    this.fbCamera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000);
    this.fbCamera.position.z = 2;

    // create mesh to render onto
    this.fbMaterial = new THREE.ShaderMaterial({
      uniforms: {
        bgTexture: { value: this.bgRenderTarget.texture },
        res: { type: 'v2', value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
      fragmentShader: glslify(feedbackFrag)
    });
    const geo = new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight);
    this.fbo = new THREE.Mesh(geo, this.fbMaterial);

    this.fbScene.add(this.fbo);
  }

  initCircles() {
    this.numCircles = 50;
    this.circles = [];

    for (let i = 0; i < this.numCircles; i++) {
      const geo = new THREE.CircleBufferGeometry(Math.random() * 0.1 + 0.01, 16);
      const mat = new THREE.MeshBasicMaterial();
      mat.transparent = true;
      mat.opacity = 0.5;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      );
      mesh.amplitude = Math.random() * 3 + 1;
      mesh.frequency = Math.random() + 0.05;
      mesh.startPos = new THREE.Vector3(
        mesh.position.x,
        mesh.position.y,
        mesh.position.z
      );

      this.circles.push(mesh);
      this.bgScene.add(mesh);
    }
  }

  initResizeHandler() {
    window.addEventListener(
      'resize',
      debounce(() => {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.renderer.setSize(this.width, this.height);

        // render tri
        this.renderTri.renderer.setSize(this.width, this.height);
        this.renderTri.triMaterial.uniforms.uResolution.value = new THREE.Vector2(
          this.width,
          this.height
        );

        // bg scene
        this.bgRenderTarget.setSize(this.width, this.height);
        this.bgCamera.aspect = this.width / this.height;
        this.bgCamera.updateProjectionMatrix();

        // text canvas
        this.textCanvas.canvas.width = this.width;
        this.textCanvas.canvas.height = this.height;
        this.setupTextCanvas();
        this.renderTri.triMaterial.uniforms.uTextCanvas.value = this.textCanvas.texture;

        // mouse canvas
        this.mouseCanvas.canvas.width = this.width;
        this.mouseCanvas.canvas.height = this.height;

        // composer
        this.composer.setSize(this.width, this.height);
      }, 500)
    );
  }

  initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);

    this.composer.addPass(new RenderPass(this.scene, this.camera));

    // const bloomPass = new BloomPass(
    //   1, // strength
    //   25, // kernel size
    //   4, // sigma ?
    //   256 // blur render target resolution
    // );
    // this.composer.addPass(bloomPass);

    // const filmPass = new FilmPass(
    //   0.35, // noise intensity
    //   0.025, // scanline intensity
    //   648, // scanline count
    //   false // grayscale
    // );
    // filmPass.renderToScreen = true;
    // this.composer.addPass(filmPass);
  }

  initTweakPane() {
    this.pane = new Tweakpane();

    this.pane
      .addInput(this.PARAMS, 'rotSpeed', {
        min: 0.0,
        max: 0.5
      })
      .on('change', value => { });
  }

  initMouseCanvas() {
    this.mouseCanvas = new MouseCanvas();
  }

  initMouseMoveListen() {
    this.mouse = new THREE.Vector2();
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    window.addEventListener('mousemove', ({ clientX, clientY }) => {
      this.mouse.x = clientX; //(clientX / this.width) * 2 - 1;
      this.mouse.y = clientY; //-(clientY / this.height) * 2 + 1;

      this.mouseCanvas.addTouch(this.mouse);
    });
  }

  initThree() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.OrthographicCamera();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.autoClear = true;

    this.clock = new THREE.Clock();
  }

  setupTextCanvas() {
    this.textCanvas = new TextCanvas(this);
  }

  initRenderTri() {
    this.resize();

    this.renderTri = new RenderTri(
      this.scene,
      this.renderer,
      this.bgRenderTarget
    );
  }

  initBgScene() {
    this.bgRenderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight
    );
    this.bgCamera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );
    this.controls = new OrbitControls(this.bgCamera, this.renderer.domElement);

    this.bgCamera.position.z = 3;
    this.controls.update();

    this.bgScene = new THREE.Scene();
  }

  resize() {
    if (!this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.fovHeight =
      2 *
      Math.tan((this.camera.fov * Math.PI) / 180 / 2) *
      this.camera.position.z;
    this.fovWidth = this.fovHeight * this.camera.aspect;

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    if (this.trackball) this.trackball.handleResize();
  }

  updateTextCanvas(time) {
    this.textCanvas.textLine.update(time);
    this.textCanvas.textLine.draw(time);
    this.textCanvas.texture.needsUpdate = true;
  }

  updateCircles(time) {
    for (let i = 0; i < this.numCircles; i++) {
      const circle = this.circles[i];
      const scaleVal = Math.sin(time * circle.frequency) * circle.amplitude;
      const startPos = circle.startPos;
      time *= 1.02;
      // const newX = Math.sin(time + startPos.x); //Math.cos(time * 0.001) + Math.sin(time * 0.001) * 0.001;
      // const newY = Math.cos(time + startPos.y); //Math.sin(time * 0.001) + Math.cos(time * 0.002) * 0.001;
      const newX =
        (Math.cos(time + startPos.x + circle.amplitude) +
          Math.sin(time + startPos.x + circle.amplitude)) *
        0.5;
      const newY =
        (Math.sin(time + startPos.y) + Math.cos(time + startPos.y)) * 0.5;

      circle.position.x = newX;
      circle.position.y = newY;
      circle.scale.set(scaleVal, scaleVal, 1);
    }
  }

  update() {
    const delta = this.clock.getDelta();
    const time = performance.now() * 0.0005;

    this.controls.update();

    if (this.renderTri) {
      this.renderTri.triMaterial.uniforms.uTime.value = time;
    }

    if (this.mouseCanvas) {
      this.mouseCanvas.update();
    }

    if (this.textCanvas) {
      this.updateTextCanvas(time);
    }

    if (this.circles) {
      this.updateCircles(time);
    }

    if (this.trackball) this.trackball.update();
  }

  draw() {

    // render bg to texture
    this.renderer.setRenderTarget(this.bgRenderTarget);
    this.renderer.render(this.bgScene, this.bgCamera);
    this.renderer.setRenderTarget(null);

    this.renderer.setRenderTarget(this.renderTargetB);
    this.renderer.render(this.fbScene, this.fbCamera);
    this.renderer.setRenderTarget(null);

    let t = this.renderTargetA;
    this.renderTargetA = this.renderTargetB;
    this.renderTargetB = t;
    this.renderTri.triMaterial.uniforms.uScene = this.renderTargetB.texture;



    // render to screen
    this.renderer.render(this.scene, this.camera);

    if (this.composer) {
      this.composer.render();
    }
  }
}
