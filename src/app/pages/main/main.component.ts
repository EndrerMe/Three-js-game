// Vendors
import { Component, OnInit } from '@angular/core';
import * as THREE from 'three';
import * as fps from 'stats.js';
import * as OrbitControls from 'three-orbitcontrols';
import {MTLLoader, OBJLoader} from 'three-obj-mtl-loader';
import FirstPersonControls from 'first-person-controls';
// import * as ThreeControls from 'three-controls'

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  private fps = new fps();
  private prevTime = performance.now();
  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private mapWidth = 500;
  private camera;
  private scene;
  private renderer;
  private controls;
  private audioListenet;
  private meshes;
  private models;
  private mtlLoader;
  private loadingScreen;
  private loadingManager;
  private resourcesLoad;
  private keyboard = [];
  private raycaster;
  private canJump = true;
  private moveKeys = [87, 83, 68, 65];
  // private moveKeys = {
  //   moveForward: false,
  //   moveLeft: false,
  //   moveBackward: false,
  //   moveRight: false,
  //   canJump: false,
  // };
  private clock;
  private player = {
    height: 1.8,
    speed: 0.2,
    turnSpeed: Math.PI * 0.02,
  }
  private exporter;
  private element: {[k: string]: any} = {};
  private lights: {[k: string]: any} = {};
  private sounds: {[k: string]: any} = {};
  private windowHalf;

  constructor() {
  }

  ngOnInit() {
    this.init();
    this.anim();
  }

  private init() {

    this.raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

    this.initLoadingScreen();
    this.loadingScreen.box.position.set(0, 0, 5);
    this.loadingScreen.camera.lookAt(this.loadingScreen.box.position);
    this.loadingScreen.scene.add(this.loadingScreen.box);

    this.loadingManager = new THREE.LoadingManager();
    this.loadingManager.onProgress = (item, loaded, total) => {
      console.log(item, loaded, total);
    }
    this.loadingManager.onLoad = () => {
      this.resourcesLoad = true;
      this.onResourceLoaded();
      this.loadAutio();
    }

    this.loadModels();
    this.fps.showPanel( 0 );
    this.windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0x9c9c9c );
    // this.scene.fog = new THREE.Fog( 0x9c9c9c, 0.0025, 35 );

    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    document.body.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(100, 5 / 5, 0.1, 1000);
    this.camera.position.set( 0, this.player.height, -5 );
    this.camera.lookAt(0, this.player.height, 0);

    this.audioListenet = new THREE.AudioListener();
    this.camera.add(this.audioListenet);

    // this.controls = new ThreeControls.PointerLockControls(this.camera, this.renderer.domElement)

    this.controls = new FirstPersonControls(this.camera);
    this.controls.noFly = true;
    this.controls.lookSpeed = 0.3;
    this.controls.movementSpeed = 5;
    this.controls.lookVertical = false;

    this.clock = new THREE.Clock(true);

    // this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    // this.controls.enableDamping = true;
    // this.controls.dampingFactor = 0.05;
    // this.controls.screenSpacePanning = false;
    // this.controls.minDistance = 150;
    // this.controls.maxPolarAngle = Math.PI / 2;
    // this.controls.keyPanSpeed = 1;
    // this.controls.panSpeed = 0.05;
    // this.controls.rotateSpeed = 0.05;

    document.body.appendChild(this.fps.dom);
    window.addEventListener('resize', () => {
      const width = innerWidth;
      const height = innerHeight;

      this.renderer.setSize( width, height );
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    });

    this.createLight();
    this.createGeometry();
    this.initListeners();
    // this.createRoom();
  }

  private loadAutio() {
    this.sounds.runRoad = new THREE.Audio( this.audioListenet );
    const soundRun = this.sounds.runRoad;
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('assets/sounds/user/run-road.ogg', (buffer) => {
      soundRun.setBuffer(buffer);
      soundRun.setLoop(true);
      soundRun.setVolume(1);
    }, null, null);

    soundRun.hasPlayBackControl = true;


    const enemyMove = new THREE.PositionalAudio( this.audioListenet );
    audioLoader.load('assets/sounds/enemy/record_dust_loop.ogg', (buffer) => {
      enemyMove.setBuffer(buffer);
      enemyMove.setLoop(true);
      enemyMove.setRefDistance(20);
      enemyMove.play();
    }, null, null);
    this.sounds.enemyMove = enemyMove;
  }

  private onResourceLoaded() {

    for (let i = 0; i < 770; i++) {
      this.meshes[`tree${i}`] = this.models.tree.mesh.clone();

      let x = Math.floor(Math.random() * 240) + 1;
      x *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
      let z = Math.floor(Math.random() * 240) + 1;
      z *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
      this.meshes[`tree${i}`].position.set(x, 0, z);

      this.scene.add(this.meshes[`tree${i}`]);
    }

    for (let i = 0; i < 70; i++) {
      this.meshes[`tent${i}`] = this.models.tent.mesh.clone();

      let x = Math.floor(Math.random() * this.mapWidth - 10) + 1;
      x *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
      let z = Math.floor(Math.random() * this.mapWidth - 10) + 1;
      z *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
      this.meshes[`tent${i}`].position.set(x, 0, z);

      this.scene.add(this.meshes[`tent${i}`]);
    }

    this.meshes['playerWeapon'] = this.models.knife.mesh.clone();
    this.meshes['playerWeapon'].position.set(0, 1, 0);
    this.meshes['playerWeapon'].scale.set(10, 10, 10);
    // this.scene.add(this.meshes['playerWeapon']);

    for (let i = 0; i < 5; i++) {
      this.meshes[`enemy${i}`] = this.models.enemy.mesh.clone();
      let enemyx = Math.floor(Math.random() * this.mapWidth - 10) + 1;
      enemyx *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
      let enemyz = Math.floor(Math.random() * this.mapWidth - 10) + 1;
      enemyz *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
      this.meshes[`enemy${i}`].position.set(enemyx, 1, enemyz);
      this.meshes[`enemy${i}`].stepCount = 0;
      this.meshes[`enemy${i}`].direction = 0;
      this.scene.add(this.meshes[`enemy${i}`]);
    }
  }

  private loadModels() {
    this.models = {
      tree: {
        obj: 'assets/3d-models/Models/naturePack_074.obj',
        mtl: 'assets/3d-models/Models/naturePack_074.mtl',
        mesh: null,
      },

      tent: {
        obj: 'assets/3d-models/Models/naturePack_076.obj',
        mtl: 'assets/3d-models/Models/naturePack_076.mtl',
        mesh: null,
      },

      knife: {
        obj: 'assets/3d-models/weapons/knife_sharp.obj',
        mtl: 'assets/3d-models/weapons/knife_sharp.mtl',
        mesh: null,
      },

      rocket: {
        obj: 'assets/3d-models/weapons/ammo_rocket.obj',
        mtl: 'assets/3d-models/weapons/ammo_rocket.mtl',
        mesh: null,
      },

      shotgun: {
        obj: 'assets/3d-models/weapons/ammo_shotgun.obj',
        mtl: 'assets/3d-models/weapons/ammo_shotgun.mtl',
        mesh: null,
      },

      enemy: {
        obj: 'assets/3d-models/enemy/Santa_Claus.obj',
        mtl: 'assets/3d-models/enemy/Santa_Claus.mtl',
        mesh: null,
        stepCount: 0,
        direction: 0,
      }
    };

    this.meshes = {}

    // tslint:disable-next-line: forin tslint:disable-next-line: variable-name
    for (const _key in this.models) {
      ((key) => {
        this.mtlLoader = new MTLLoader(this.loadingManager);
        this.mtlLoader.load(this.models[key].mtl, (materials) => {
          materials.preload();
          const objLoader = new OBJLoader(this.loadingManager);
          objLoader.setMaterials(materials);
          objLoader.load(this.models[key].obj, (mesh) => {
            mesh.traverse((node) => {
              if (node instanceof THREE.Mesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                node.add(this.sounds.enemyMove);
              }
            });

            this.models[key].mesh = mesh;
          })
        });
      })(_key);
    }

    // this.mtlLoader = new MTLLoader(this.loadingManager);
    // for (let i = 0; i < 470; i++) {
    //   this.mtlLoader.load('assets/3d-models/Models/naturePack_074.mtl', (materials) => {
    //     materials.preload();
    //     const objLoader = new OBJLoader(this.loadingManager);
    //     objLoader.setMaterials(materials);
  
    //     objLoader.load('assets/3d-models/Models/naturePack_074.obj', (mesh) => {

    //       mesh.traverse((node) => {
    //         if (node instanceof THREE.Mesh) {
    //           node.castShadow = true;
    //           node.receiveShadow = true;
    //         }
    //       })

          // let x = Math.floor(Math.random() * 200) + 1;
          // x *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
          // let z = Math.floor(Math.random() * 200) + 1;
          // z *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
          // mesh.position.set(x, 0, z);
    //       this.scene.add(mesh);
    //     });
    //   });
    // }
  }

  private initLoadingScreen() {
    this.loadingScreen = {
      scene: new THREE.Scene(),
      camera: new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000),
      box: new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.MeshBasicMaterial({color: 0x4444ff}),
      )
    };

    this.resourcesLoad = false;
  }

  private keyDown = (event) => {

    // switch (event.keyCode) {
    //   case 38:
    //   case 87:
    //     this.moveKeys.moveForward = true;
    //     break;

    //   case 37: // left
    //   case 65: // a
    //     this.moveKeys.moveLeft = true;
    //     break;
    //   case 40: // down
    //   case 83: // s
    //     this.moveKeys.moveBackward = true;
    //     break;
    //   case 39: // right
    //   case 68: // d
    //     this.moveKeys.moveRight = true;
    //     break;

      // case 32: // space
      //   if ( canJump === true ) velocity.y += 350;
      //   canJump = false;
      //   break;
    // }

    const keyCode = event.keyCode;
    const soundRunRoad = this.sounds.runRoad;

    if (this.moveKeys.includes(keyCode) && !soundRunRoad.isPlaying) {
      soundRunRoad.play();
      this.sounds.runRoad.isPlaying = true;
    }
  }

  private keyUp = (event) => {

    // switch ( event.keyCode ) {
    //   case 38: // up
    //   case 87: // w
    //     this.moveKeys.moveForward = false;
    //     break;
    //   case 37: // left
    //   case 65: // a
    //     this.moveKeys.moveLeft = false;
    //     break;
    //   case 40: // down
    //   case 83: // s
    //     this.moveKeys.moveBackward = false;
    //     break;
    //   case 39: // right
    //   case 68: // d
    //     this.moveKeys.moveRight = false;
    //     break;
    // }

    const soundRunRoad = this.sounds.runRoad;
    if (!this.keyboard.includes(true)) {
      soundRunRoad.pause();
    }
  }

  private initListeners() {
    window.addEventListener('keydown', this.keyDown, false);
    window.addEventListener('keyup', this.keyUp, false);
  }

  private move() {
    if (this.keyboard[87]) {
      this.camera.position.x -= Math.sin(this.camera.rotation.y) * this.player.speed;
      this.camera.position.z -= -Math.cos(this.camera.rotation.y) * this.player.speed;
    }

    if (this.keyboard[83]) {
      this.camera.position.x += Math.sin(this.camera.rotation.y) * this.player.speed;
      this.camera.position.z += -Math.cos(this.camera.rotation.y) * this.player.speed;
    }

    if (this.keyboard[68]) {
      this.camera.position.x += Math.sin(this.camera.rotation.y - Math.PI / 2) * this.player.speed;
      this.camera.position.z += -Math.cos(this.camera.rotation.y - Math.PI / 2) * this.player.speed;
    }

    if (this.keyboard[65]) {
      this.camera.position.x += Math.sin(this.camera.rotation.y + Math.PI / 2) * this.player.speed;
      this.camera.position.z += -Math.cos(this.camera.rotation.y + Math.PI / 2) * this.player.speed;
    }

    if (this.keyboard[37]) {
      this.camera.rotation.y -= this.player.turnSpeed;
    }

    if (this.keyboard[39]) {
      this.camera.rotation.y += this.player.turnSpeed;
    }
  }

  private update() {

    this.meshes['playerWeapon'].position.set(
      this.camera.position.x - Math.sin(this.camera.rotation.y) * 0.6,
      this.camera.position.y - 0.5,
      this.camera.position.z + Math.cos(this.camera.rotation.y) * 0.6,
    );

    this.meshes['playerWeapon'].rotation.set(
      this.camera.rotation.x,
      this.camera.rotation.y - Math.PI,
      this.camera.rotation.z,
    );

    this.controls.update( this.clock.getDelta() );

    // this.raycaster.ray.origin.copy( this.controls.getObject().position );
    // this.raycaster.ray.origin.y -= 10;
    // const intersections = this.raycaster.intersectObjects( this.meshes );
    // const onObject = intersections.length > 0;
    // const time = performance.now();
    // const delta = ( time - this.prevTime ) / 1000;
    // this.velocity.x -= this.velocity.x * 10.0 * delta;
    // this.velocity.z -= this.velocity.z * 10.0 * delta;
    // this.velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
    // this.direction.z = Number( this.moveKeys.moveForward ) - Number( this.moveKeys.moveBackward );
    // this.direction.x = Number( this.moveKeys.moveRight ) - Number( this.moveKeys.moveLeft );
    // this.direction.normalize();

    // if ( this.moveKeys.moveForward || this.moveKeys.moveBackward ) this.velocity.z -= this.direction.z * 400.0 * delta;
    // if ( this.moveKeys.moveLeft || this.moveKeys.moveRight ) this.velocity.x -= this.direction.x * 400.0 * delta;

    // if ( onObject === true ) {
    //   this.velocity.y = Math.max( 0, this.velocity.y );
    //   this.canJump = true;
    // }

    // this.controls.moveRight( - this.velocity.x * delta );
    // this.controls.moveForward( - this.velocity.z * delta );

    // this.controls.getObject().position.y += ( this.velocity.y * delta ); // new behavior

    // if ( this.controls.getObject().position.y < 10 ) {
    //   this.velocity.y = 0;
    //   this.controls.getObject().position.y = 10;
    //   this.canJump = true;
    // }

    // this.prevTime = time;

    // this.controls.update();
    // const cube = this.element.cube;
    // cube.rotation.x += 0.035;
    // cube.rotation.y -= 0.015;
    // const time = Date.now() * 0.0005;
    // this.lights.pointLight1.position.x = Math.sin(time * 0.7) * 30;
    // this.lights.pointLight1.position.y = Math.cos(time * 0.5) * 40;
    // this.lights.pointLight1.position.z = Math.cos(time * 0.3) * 30;

    // this.lights.pointLight2.position.x = Math.cos(time * 0.3) * 30;
    // this.lights.pointLight2.position.y = Math.sin(time * 0.7) * 40;
    // this.lights.pointLight2.position.z = Math.sin(time * 0.5) * 30;

    // this.lights.pointLight3.position.x = Math.sin(time * 0.7) * 30;
    // this.lights.pointLight3.position.y = Math.cos(time * 0.3) * 40;
    // this.lights.pointLight3.position.z = Math.sin(time * 0.5) * 30;
  }

  private render() {
    if (!this.resourcesLoad) {
      this.loadingScreen.box.position.x -= 0.05;
      this.loadingScreen.box.position.y = Math.sin(this.loadingScreen.box.position.x);

      if (this.loadingScreen.box.position.x < -10) {
        this.loadingScreen.box.position.x = 10;
      }

      this.renderer.render(this.loadingScreen.scene, this.loadingScreen.camera);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private createGeometry() {
    const loader = new THREE.TextureLoader(this.loadingManager);

    // const cylingrGeometry = new THREE.CylinderBufferGeometry(0, 10, 30, 4, 1);
    // const cylinderMaterial = new THREE.MeshPhongMaterial({color: 0xffffff, flatShading: true});

    // for (let i = 0; i < 500; i++) {
    //   const cylinderMesh = new THREE.Mesh(cylingrGeometry, cylinderMaterial);
    //   const x = Math.random() * 1600 - 800;
    //   const y = Math.random() * 1600 - 800;
    //   cylinderMesh.position.set(x, 0, y);
    //   cylinderMesh.updateMatrix();
    //   cylinderMesh.matrixAutoUpdate = true;
    //   this.scene.add(cylinderMesh);
    // }

    const planeGeometry = new THREE.PlaneGeometry(this.mapWidth, this.mapWidth);
    const planeMaterial = new THREE.MeshPhongMaterial({color: 0xffffff, wireframe: false});
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.rotation.x -= Math.PI / 2;
    planeMesh.receiveShadow = true;
    this.element.plane = planeMesh;
    this.scene.add(planeMesh);

    // const cubeGeometry = new THREE.BoxGeometry(3, 3, 3);
    // const cubeTexture = loader.load('assets/textures/myTexture/crate0/crate0_diffuse.png');
    // const cubeBumpTexture = loader.load('assets/textures/myTexture/crate0/crate0_bump.png');
    // const cubeNormalTexture = loader.load('assets/textures/myTexture/crate0/crate0_normal.png')
    // const cubeMaterial = new THREE.MeshPhongMaterial({
    //   map: cubeTexture,
    //   bumpMap: cubeBumpTexture,
    //   normalMap: cubeNormalTexture,
    //   side: THREE.DoubleSide
    // });
    // const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
    // cubeMesh.receiveShadow = true;
    // cubeMesh.castShadow = true;
    // cubeMesh.position.set(2.5, 3/2, 2.5);
    // this.element.cube = cubeMesh;
    // this.scene.add(cubeMesh);

    // const material = new THREE.MeshStandardMaterial({
    //   color: 0xf3ffe2,
    //   roughness: 0.5,
    //   metalness: 0.7,
    // });
    // const cubeGeometry = new THREE.BoxGeometry(100, 100, 100);
    // const cubeMaterial = new THREE.MeshBasicMaterial();
    // const cubeMesh = new THREE.Mesh(cubeGeometry, material);
    // cubeMesh.position.set(-100, 0, -1000);
    // this.element.cube = cubeMesh;
    // this.scene.add(cubeMesh);

    // const sphereGeometry = new THREE.SphereGeometry(50, 20, 20);
    // const sphereMaterial = new THREE.MeshBasicMaterial();
    // const sphereMesh = new THREE.Mesh(sphereGeometry, material);
    // sphereMesh.position.set(100, 0, -1000);
    // this.element.sphere = sphereMesh;
    // this.scene.add(sphereMesh);

    // const planeGeometry = new THREE.PlaneGeometry(10000, 10000, 100, 100);
    // const planeMaterial = new THREE.MeshBasicMaterial();
    // const planeMesh = new THREE.Mesh(planeGeometry, material);
    // planeMesh.rotation.x = -90 * Math.PI / 180;
    // planeMesh.position.y = -100;
    // this.element.plane = planeMesh;
    // this.scene.add(planeMesh);

    // const geometry = new THREE.BoxGeometry(5, 5, 5);
    // const loader = new THREE.TextureLoader();
    // const cubeMaterial = new THREE.MeshLambertMaterial({color: 0xF3FFE2});
    // const cube = new THREE.Mesh(geometry, cubeMaterial);
    // this.element.cube = cube;
    // cube.position.set(0, 0, -10);
    // this.scene.add(cube);
    // this.camera.position.z = 10;
  }

  private createLight() {
    // const hemisphereLight = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    // hemisphereLight.castShadow = true;
    // hemisphereLight.position.set(-3, 25, -75);
    // this.scene.add(hemisphereLight);

    const ambientLight = new THREE.AmbientLight( 0xffffff, 0.2 );
    this.scene.add(ambientLight);

    // const directionalLight1 = new THREE.DirectionalLight(0xffffff);
    // directionalLight1.castShadow = true;
    // directionalLight1.position.set(-3, 25, -150);
    // this.scene.add(directionalLight1);

    // const directionalLight2 = new THREE.DirectionalLight(0x002288);
    // directionalLight2.position.set(-1, -1, -1);
    // this.scene.add(directionalLight2);

    // const pointLight1 = new THREE.PointLight( 0xffffff, 0.8, 18 );
    // pointLight1.position.set(-3, 6, -115);
    // pointLight1.castShadow = true;
    // this.scene.add(pointLight1);

    const spotLight = new THREE.SpotLight( 0xffffff, 0.3, 1500, 1, 1, 2 );
    spotLight.position.set(-3, 250, -370);
    spotLight.castShadow = true;
    this.scene.add(spotLight);

    // const pointLight2 = new THREE.PointLight( 0x0040ff, 1.5, 50 );
    // this.lights.pointLight2 = pointLight2;
    // this.scene.add(pointLight2);

    // const pointLight3 = new THREE.PointLight( 0x80ff80, 1, 50 );
    // this.lights.pointLight3 = pointLight3;
    // this.scene.add(pointLight3);
  }

  private anim = () => {

    if (!this.resourcesLoad) {
      this.render();
      requestAnimationFrame(this.anim);
      return;
    }

    this.fps.update();
    requestAnimationFrame(this.anim);
    this.update();
    // this.move();
    this.enemyMove();
    this.render();
  }

  private enemyMove() {
    for (let i = 0; i < 5; i++) {
      const enemy = this.meshes[`enemy${i}`];
    
      if (enemy.stepCount === 0) {
        enemy.stepCount = Math.floor(Math.random() * 550);
        enemy.direction = Math.floor(Math.random() * 8);
      } else {
        enemy.stepCount--;
      }

      const dx = this.camera.position.x - enemy.position.x;
      const dz = this.camera.position.z - enemy.position.z;
      const distance = Math.sqrt( dx * dx + dz * dz );
      
      if (distance > 20) {
        switch (enemy.direction) {
          case 0 :
            // top
            enemy.position.z = enemy.position.z - 0.05;
            break;
          case 1 :
            // right
            enemy.position.x = enemy.position.x + 0.05;
            break;
          case 2 :
            // bottom
            enemy.position.z = enemy.position.z + 0.05;
            break;
          case 3 :
            // left
            enemy.position.x = enemy.position.x - 0.05;
            break;
          case 4 :
            // right-top
            enemy.position.x = enemy.position.x + 0.05;
            enemy.position.z = enemy.position.z - 0.05;
            break;
          case 5 :
            // right-bottom
            enemy.position.x = enemy.position.x + 0.05;
            enemy.position.z = enemy.position.z + 0.05;
            break;
          case 6 :
            // left-bottom
            enemy.position.x = enemy.position.x - 0.05;
            enemy.position.z = enemy.position.z + 0.05;
            break;
          case 7 :
            // left-top
            enemy.position.x = enemy.position.x - 0.05;
            enemy.position.z = enemy.position.z - 0.05;
            break;
        }
    
        if (enemy.position.x < -249 || enemy.position.x > 249 || enemy.position.z < -249 || enemy.position.z > 249) {
          enemy.stepCount = 0;
        }
      } else {
        
        if (distance > 1) {
          const angleRad = Math.atan2(this.camera.position.z - enemy.position.z, this.camera.position.x - enemy.position.x);
          enemy.direction = Math.atan2( (Math.sin(enemy.direction)*3 + Math.sin(angleRad) ),
          (Math.cos(enemy.direction)*3 + Math.cos(angleRad) ));

          const addX = Math.cos(enemy.direction)*0.2 * 0.2;
          const addY = Math.sin(enemy.direction)*0.2 * 0.2;

          enemy.position.z = enemy.position.z + addY;
          enemy.position.x = enemy.position.x + addX;
        } else {
          console.log('game over')
        }

      }
    }
  }

  private createRoom() {
    const loader = new THREE.TextureLoader();

    const floorGeometry = new THREE.BoxGeometry(10, .2, 10);
    const floorMaterial = new THREE.MeshLambertMaterial({map: loader.load('assets/textures/walls.png'), side: THREE.DoubleSide});
    const floorCube = new THREE.Mesh(floorGeometry, floorMaterial);
    floorCube.position.y = -5;
    this.scene.add(floorCube);

    const rightGeometry = new THREE.BoxGeometry(.2, 10, 10);
    const rightMaterial = new THREE.MeshLambertMaterial({map: loader.load('assets/textures/walls.png'), side: THREE.DoubleSide});
    const rightCube = new THREE.Mesh(rightGeometry, rightMaterial);
    rightCube.position.x = 5;
    this.scene.add(rightCube);

    const ceilingGeometry = new THREE.BoxGeometry(10, .2, 10);
    const ceilingMaterial = new THREE.MeshLambertMaterial({map: loader.load('assets/textures/walls.png'), side: THREE.DoubleSide});
    const ceilingCube = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceilingCube.position.y = 5;
    this.scene.add(ceilingCube);

    const leftGeometry = new THREE.BoxGeometry(.2, 10, 10);
    const leftMaterial = new THREE.MeshLambertMaterial({map: loader.load('assets/textures/walls.png'), side: THREE.DoubleSide});
    const leftCube = new THREE.Mesh(leftGeometry, leftMaterial);
    leftCube.position.x = -5;
    this.scene.add(leftCube);
  }

}
