// design idea from:  https://www.youtube.com/watch?v=NJE48IVzNVc

import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';
import glslify from 'glslify';
import Tweakpane from 'tweakpane';
import OrbitControls from 'three-orbitcontrols';
import TweenMax from 'TweenMax';
import baseDiffuseFrag from '../../shaders/basicDiffuse.frag';
import basicDiffuseVert from '../../shaders/basicDiffuse.vert';
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
    // this.initTweakPane();

    this.initMouseMoveListen();
    this.initRenderTri();
    this.initPostProcessing();
    this.initResizeHandler();

    this.initCircles();
    this.setupFrameBuffer();
  }

  setupFrameBuffer() {
    this.renderTargetA = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });
    this.renderTargetB = this.renderTargetA.clone();

    // create scene and camera
    this.fbScene = new THREE.Scene();
    this.fbCamera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000);
    this.fbCamera.position.z = 2;

    // create mesh to render onto
    this.fbMaterial = new THREE.ShaderMaterial({
      uniforms: {
        bufferTexture: { value: this.renderTargetA.texture },
        videoTexture: { value: this.bgRenderTarget.texture },
        res: { type: 'v2', value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        time: { value: 0.0 },
        mouse: { value: new THREE.Vector2(0, 0) }
      },
      fragmentShader: glslify(feedbackFrag)
    });
    const geo = new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight);
    this.fbo = new THREE.Mesh(geo, this.fbMaterial);
    this.fbScene.add(this.fbo);

    this.renderer.setRenderTarget(this.renderTargetA);
    this.renderer.render(this.bgScene, this.bgCamera);
    this.renderer.setRenderTarget(this.renderTargetB);
    this.renderer.render(this.bgScene, this.bgCamera);
    this.renderer.setRenderTarget(null);

    // this.renderTri.triMaterial.uniforms.uScene.value = this.renderTargetB.texture;

  }

  returnRandomColor() {
    // const colors = [
    //   '#B41C3A',
    //   '#DB508F',
    //   '#2E306F',
    //   '#3455A7',
    //   '#EDC3E1',
    //   '#CC99C9',
    //   '#2758A6',
    // ];

    const colors = [
      '#FF0000',
      '#0000FF',
      '#FFFFFF'
    ];

    return colors[THREE.Math.randInt(0, colors.length - 1)];
  }

  initCircles() {
    this.numCircles = 50;
    this.circles = [];
    this.circlesGroup = new THREE.Group();

    for (let i = 0; i < this.numCircles; i++) {
      const geo = new THREE.CircleBufferGeometry(Math.random() * 0.1 + 0.01, 32);
      const mat = new THREE.MeshBasicMaterial({
        color: this.returnRandomColor()
      });
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

      this.circlesGroup.add(mesh);
      // this.bgScene.add(mesh);
    }

    this.bgScene.add(this.circlesGroup);
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



        // composer
        this.composer.setSize(this.width, this.height);
      }, 500)
    );
  }

  initPostProcessing() {
    // this.composer = new EffectComposer(this.renderer);

    // this.composer.addPass(new RenderPass(this.scene, this.camera));

    // const bloomPass = new BloomPass(
    //   0.2, // strength
    //   25, // kernel size
    //   100, // sigma ?
    //   512 // blur render target resolution
    // );
    // this.composer.addPass(bloomPass);

    // const filmPass = new FilmPass(
    //   0.0035, // noise intensity
    //   0.0025, // scanline intensity
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


  initMouseMoveListen() {
    this.mouse = new THREE.Vector2();
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    window.addEventListener('mousemove', ({ clientX, clientY }) => {
      this.mouse.x = (clientX / this.width) * 2 - 1;
      this.mouse.y = -(clientY / this.height) * 2 + 1;

    });
  }

  initThree() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.OrthographicCamera();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.autoClear = true;

    this.clock = new THREE.Clock();
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
      window.innerHeight, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    }
    );

    this.bgCamera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );

    this.bgCamera.position.z = 3;


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

  updateCirclesGroup() {
    // console.log(this.mouse);
    // console.log(this.circlesGroup);
    // TweenMax.to(this.circlesGroup.rotation, 1.0, {
    //   yoyo: true,
    //   z: '+=0.3'
    // });
    TweenMax.to(this.circlesGroup.rotation, 0.5, {
      y: this.mouse.x,
      x: -this.mouse.y
    });
  }

  update() {
    const delta = this.clock.getDelta();
    const time = performance.now() * 0.0005;



    if (this.renderTri) {
      this.renderTri.triMaterial.uniforms.uTime.value = time;
    }

    if (this.fbMaterial) {
      this.fbMaterial.uniforms.time.value = time;
      this.fbMaterial.uniforms.mouse.value = this.mouse;
    }

    if (this.circles) {
      this.updateCircles(time);
      this.updateCirclesGroup();
    }

    if (this.trackball) this.trackball.update();
  }

  draw() {

    // render bg to texture
    this.renderer.setRenderTarget(this.bgRenderTarget);
    this.renderer.render(this.bgScene, this.bgCamera);
    this.renderer.setRenderTarget(null);

    // render to B
    this.renderer.setRenderTarget(this.renderTargetB);
    this.renderer.render(this.fbScene, this.fbCamera);
    this.renderer.setRenderTarget(null);

    let t = this.renderTargetA;
    this.renderTargetA = this.renderTargetB;
    this.renderTargetB = t;


    this.renderTri.triMaterial.uniforms.uScene.value = this.renderTargetB.texture;

    this.fbMaterial.uniforms.bufferTexture.value = this.renderTargetA.texture;

    // render to screen
    this.renderer.render(this.scene, this.camera);

    if (this.composer) {
      this.composer.render();
    }
  }
}
