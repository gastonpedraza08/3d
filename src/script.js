import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'lil-gui';
import * as CANNON from 'cannon-es';

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

// cannon variables
let world, defaultMaterial, body;

function initThree() {
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

    animate();
}

function createControls() {
    window.addEventListener('keydown', function(e) {
        if (e.key === 'w') {
            // w
        } else if (e.key === 's') {
            // s
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
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
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
    world.allowSleep = true;
    world.gravity.set(0, - 9.82, 0);

    // Default material
    defaultMaterial = new CANNON.Material('default');
    const defaultContactMaterial = new CANNON.ContactMaterial(
        defaultMaterial,
        defaultMaterial,
        {
            friction: 0.1,
            restitution: 0.7
        }
    );
    world.defaultContactMaterial = defaultContactMaterial;

    // Floor
    const floorShape = new CANNON.Plane();
    const floorBody = new CANNON.Body();
    floorBody.mass = 0;
    floorBody.addShape(floorShape);
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(- 1, 0, 0), Math.PI * 0.5);
    world.addBody(floorBody);
}

function createSphere() {
    let radius = 1;
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
        material: defaultMaterial
    });
    body.position.copy(position);
    world.addBody(body);

    // Save in objects
    objectsToUpdate.push({ mesh, body });
};

const animate = () =>
{
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - oldElapsedTime;
    oldElapsedTime = elapsedTime;

    // Update physics
    world.step(1 / 60, deltaTime, 3);
    
    for(const object of objectsToUpdate)
    {
        object.mesh.position.copy(object.body.position);
        object.mesh.quaternion.copy(object.body.quaternion);
    }

    relativeCameraOffset = new THREE.Vector3(0, 2, 3);
    const cameraOffset = relativeCameraOffset.applyMatrix4(
        mesh.matrixWorld
    );
    //camera.position.copy(cameraOffset);
    //camera.lookAt(mesh.position);

    renderer.render(scene, camera)
    window.requestAnimationFrame(animate)
}

initThree();