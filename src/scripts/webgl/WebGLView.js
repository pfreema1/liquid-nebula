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
import JellyFish from '../Jellyfish';

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

    this.initMouseMoveListen();
    this.initRenderTri();
    this.initPostProcessing();
    this.initResizeHandler();

    this.initJellyfish();
    this.setupFrameBuffer();

    this.box = new THREE.Mesh(new THREE.BoxBufferGeometry(0.5, 0.5, 0.5),
      new THREE.MeshBasicMaterial({ wireframe: true }));
    this.bgScene.add(this.box);
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
        mouse: { value: new THREE.Vector2(0, 0) },
        mod1: {
          value: this.PARAMS.mod1
        },
        mod2: {
          value: this.PARAMS.mod2
        },
        mod3: {
          value: this.PARAMS.mod3
        },
      },
      fragmentShader: glslify(feedbackFrag)
    });
    this.fbMaterial.transparent = true;
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

  initJellyfish() {
    this.jellyfishArr = [];

    for (let i = 0; i < 100; i++) {
      let pos = new THREE.Vector3(
        4.0 * Math.random() - 2,
        4.0 * Math.random() - 2,
        4.0 * Math.random() - 2
      );
      let jellyfish = new JellyFish(this.bgScene, this.bgCamera, this.pane, this.PARAMS, i, pos);

      this.jellyfishArr.push(jellyfish);
    }
    // this.jellyfish = new JellyFish(this.bgScene, this.bgCamera, this.pane, this.PARAMS);
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

    this.PARAMS.mod1 = 1.0;
    this.PARAMS.mod2 = 1.0;
    this.PARAMS.mod3 = 1.0;

    this.pane
      .addInput(this.PARAMS, 'mod1', {
        min: -1.0,
        max: 1.0
      })
      .on('change', value => {
        this.fbMaterial.uniforms.mod1.value = value;
      });

    this.pane
      .addInput(this.PARAMS, 'mod2', {
        min: -1.0,
        max: 1.0
      })
      .on('change', value => {
        this.fbMaterial.uniforms.mod2.value = value;
      });

    this.pane
      .addInput(this.PARAMS, 'mod3', {
        min: -1.0,
        max: 1.0
      })
      .on('change', value => {
        this.fbMaterial.uniforms.mod3.value = value;
      });
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

    if (this.jellyfishArr) {
      for (let i = 0; i < this.jellyfishArr.length; i++) {
        let jf = this.jellyfishArr[i];
        jf.update(time);
      }

    }

    if (this.box) {
      this.box.rotation.x += 0.01;
      this.box.rotation.z += 0.01;
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
