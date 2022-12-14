import './style.css';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Stats from "three/examples/jsm/libs/stats.module";

// utils 
const _yAxis = new CANNON.Vec3(0, 1, 0);
const _q1 = new CANNON.Quaternion();
let velocity = 0.0, speed = 0;
let vectorHelper = new CANNON.Vec3();
let _zAxis = new CANNON.Vec3(0, 0, 1);
let keys = {
    w: false,
    s: false,
    a: false,
    d: false,
}

// stats
const stats = Stats();

//classes
CANNON.Vec3.prototype.applyQuaternion = function(q) {
    const x = this.x,
        y = this.y,
        z = this.z;
    const qx = q.x,
        qy = q.y,
        qz = q.z,
        qw = q.w;

    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;

    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return this;
};

CANNON.Body.prototype.rotateOnAxis = function (axis, angle) {
    _q1.setFromAxisAngle(axis, angle);
    this.quaternion.mult(_q1, this.quaternion);
}

CANNON.Body.prototype.rotateY = function(angle) {
    body.rotateOnAxis(_yAxis, angle);
}

// three variables
let canvas, scene, camera, renderer, mesh;
let sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};
const clock = new THREE.Clock();
let oldElapsedTime = 0;
let objectsToUpdate = [];
let relativeCameraOffset;
let elapsedTime, deltaTime;
let position;
let cameraOffset;

// cannon variables
let world, defaultMaterial, body;

function initThree() {
    document.body.appendChild(stats.dom);
    initCannon();

    canvas = document.querySelector('canvas.webgl');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(0, 2, 3);
    scene.add(camera);

    createSphere();
    createFloor();
    createLight();
    setupRenderer();
    createControls();
    createWalls();

    animate();
}

function createWalls() {
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMaterial = new THREE.MeshStandardMaterial();

    let width = 3, height = 3, depth = 0.001;
    let position = new THREE.Vector3(0, 0, -5);

    // Three.js mesh
    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial)
    boxMesh.scale.set(width, height, depth)
    boxMesh.castShadow = true
    boxMesh.position.copy(position)
    scene.add(boxMesh)

    // Cannon.js body
    const shape = new CANNON.Box(new CANNON.Vec3(width, height, depth))

    const boxBody = new CANNON.Body({
        shape: shape,
        type: CANNON.Body.STATIC,
        material: defaultMaterial
    })
    boxBody.position.copy(position)
    world.addBody(boxBody)
}

function createControls() {
    window.addEventListener('keydown', function(e) {
        if (e.key === 'w') {
            keys.w = true;
        } else if (e.key === 's') {
            keys.s = true;
        }
        if (e.key === 'a') {
            keys.a = true;
        } else if (e.key === 'd') {
            keys.d = true;
        }
    });

    window.addEventListener('keyup', function(e) {
        if (e.key === 'w') {
            keys.w = false;
        } else if (e.key === 's') {
            keys.s = false;
        }
        if (e.key === 'a') {
            keys.a = false;
        } else if (e.key === 'd') {
            keys.d = false;
        }
     });
}

function setupRenderer() {
    renderer = new THREE.WebGLRenderer({
        canvas: canvas
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    window.addEventListener('resize', () =>
    {
        // Update sizes
        sizes.width = window.innerWidth;
        sizes.height = window.innerHeight;

        // Update camera
        camera.aspect = sizes.width / sizes.height;
        camera.updateProjectionMatrix();

        // Update renderer
        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
}

function createLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
}

function createFloor() {
    // grid helper
    const size = 20;
    const divisions = 20;
    const gridHelper = new THREE.GridHelper(size, divisions);
    scene.add(gridHelper);

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshStandardMaterial({
            color: '#777777',
        })
    );
    floor.rotation.x = - Math.PI * 0.5;
    scene.add(floor);
}

function initCannon() {
    world = new CANNON.World();
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.allowSleep = false;
    world.gravity.set(0, - 9.82, 0);

    // Default material
    defaultMaterial = new CANNON.Material('default');
    const defaultContactMaterial = new CANNON.ContactMaterial(
        defaultMaterial,
        defaultMaterial,
        {
            friction: 0.1,
            restitution: 0
        }
    );
    world.defaultContactMaterial = defaultContactMaterial;

    // Floor
    const floorShape = new CANNON.Plane();
    const floorBody = new CANNON.Body({
        type: CANNON.Body.STATIC
    });
    floorBody.addShape(floorShape);
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(- 1, 0, 0), Math.PI * 0.5);
    world.addBody(floorBody);
}

function createSphere() {
    let radius = 0.5;
    let position = { x: 0, z: 0, y: 3 };

    const sphereGeometry = new THREE.SphereGeometry(radius, 20, 20);
    const sphereMaterial = new THREE.MeshStandardMaterial({
        metalness: 0.3,
        roughness: 0.4,
    });

    // Three.js mesh
    mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    mesh.position.copy(position);
    scene.add(mesh);

    // Cannon.js body
    const shape = new CANNON.Sphere(radius)

    body = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0, 3, 0),
        shape: shape,
        material: defaultMaterial,
        angularFactor: new CANNON.Vec3(0, 0, 0)
    });
    body.position.copy(position);

    body.position.add = function(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
    }

    world.addBody(body);

    // Save in objects
    objectsToUpdate.push({ mesh, body });
};

const animate = () =>
{
    elapsedTime = clock.getElapsedTime();
    deltaTime = elapsedTime - oldElapsedTime;
    oldElapsedTime = elapsedTime;

    // player movement
    speed = 0;

    if (keys.w) {
        speed = -0.1;
    } else if (keys.s) {
        speed = 0.1;
    }

    if (keys.a) {
        body.rotateY(0.05);
    } else if (keys.d) {
        body.rotateY(-0.05);
    }

    velocity += (speed - velocity) * 0.3;
    vectorHelper.copy(_zAxis).applyQuaternion(body.quaternion);
    position = vectorHelper.scale(velocity, vectorHelper);
    body.position.add(position);

    // Update physics
    world.step(1 / 60, deltaTime, 3);
    
    for(const object of objectsToUpdate)
    {
        object.mesh.position.copy(object.body.position);
        object.mesh.quaternion.copy(object.body.quaternion);
    }

    relativeCameraOffset = new THREE.Vector3(0, 2, 3);
    cameraOffset = relativeCameraOffset.applyMatrix4(
        mesh.matrixWorld
    );
    camera.position.copy(cameraOffset);
    camera.lookAt(mesh.position);

    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);
    stats.update();
}

initThree();