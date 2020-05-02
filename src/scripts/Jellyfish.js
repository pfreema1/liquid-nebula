import * as THREE from 'three';
import glslify from 'glslify';
import basicDiffuseVert from '../shaders/basicDiffuse.vert';
import basicDiffuseFrag from '../shaders/basicDiffuse.frag';


export default class JellyFish {
    constructor(bgScene, bgCamera, pane, PARAMS, index, pos) {
        this.bgScene = bgScene;
        this.bgCamera = bgCamera;
        this.pane = pane;
        this.PARAMS = PARAMS;
        this.index = index;
        this.pos = pos;


        this.init();

    }

    initHead() {
        this.geo = new THREE.SphereBufferGeometry(0.5, 64, 64);
        // this.geo = new THREE.SphereBufferGeometry(0.5, 64, 64, 3, 6.3, 1, 1.8);
        this.mat = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: null },
                u_lightColor: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
                u_lightPos: {
                    value: new THREE.Vector3(-3.0, 3.0, 0.0)
                },
                mouse: {
                    value: null
                },
                index: {
                    value: this.index
                }
            },
            vertexShader: glslify(basicDiffuseVert),
            fragmentShader: glslify(basicDiffuseFrag)
        });
        this.mat.transparent = true;

        this.mesh = new THREE.Mesh(this.geo, this.mat);

        this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
        this.mesh.scale.set(0.15, 0.1, 0.1);

        this.bgScene.add(this.mesh);
    }

    initTentacles() {
        this.tentacles = {};

        this.tentacles.geo = new THREE.BoxBufferGeometry(1.0, 1.0, 1.0);
        this.tentacles.mat = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: null },
                u_lightColor: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
                u_lightPos: {
                    value: new THREE.Vector3(-3.0, 3.0, 0.0)
                },
                mouse: {
                    value: null
                },
                index: {
                    value: this.index
                }
            },
            vertexShader: glslify(basicDiffuseVert),
            fragmentShader: glslify(basicDiffuseFrag)
        });

        this.tentacles.mesh = new THREE.Mesh(this.tentacles.geo, this.tentacles.mat);
        this.tentacles.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);

        this.tentacles.mesh = this.mesh.clone();
        this.tentacles.mesh.scale.set(0.5, 0.5, 0.5);
        this.tentacles.mesh.position.set(-1.0, 1.0, 0.0);


        this.mesh.add(this.tentacles.mesh);

    }

    init() {
        this.initHead();
        this.initTentacles();
    }

    update(time) {
        this.mat.uniforms.u_time.value = time + this.index;
        this.mesh.position.x -= 0.002 * Math.sin(time + (this.pos.z * 0.5 * this.pos.x));
        this.mesh.position.y += 0.002 * Math.sin(time + (this.pos.z * 0.5 * this.pos.x));


        this.tentacles.mat.uniforms.u_time.value = time + this.index;
        this.tentacles.mesh.position.x -= 0.002 * Math.sin(time + (this.pos.z * 0.5 * this.pos.x));
        this.tentacles.mesh.position.y += 0.002 * Math.sin(time + (this.pos.z * 0.5 * this.pos.x));
    }
}