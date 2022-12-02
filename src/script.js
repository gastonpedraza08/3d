import './style.css';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Game from './utils/game';

// game
let game, mesh;

// cannon variables
let world, defaultMaterial, body, stairsId;

function initThree() {
    let canvas = document.querySelector('canvas.webgl');
    game = new Game('keys', true, canvas);
    
    initCannon();

    let player = createSphere();
    body = player.body;
    mesh = player.mesh;

    game.setBody(body);
    
    createFloor();
    createLight();
    createWalls();
    createStairs();

    animate();
}

function createStairs() {
    let width = 1, height = 8, depth = 0.001;
    let position = { x: 0, z: -3, y: height / 4 };

    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMaterial = new THREE.MeshStandardMaterial();

    // Three.js mesh
    const mesh = new THREE.Mesh(boxGeometry, boxMaterial);
    mesh.scale.set(width, height, depth);
    mesh.position.copy(position);
    mesh.rotateX(-1);
    game.scene.add(mesh);

    // Cannon.js body
    const shape = new CANNON.Box(new CANNON.Vec3(
        width / 2,
        height / 2,
        depth / 2
    ));

    let body = new CANNON.Body({
        type: CANNON.Body.STATIC,
        position,
        shape: shape,
        material: defaultMaterial,
        quaternion: mesh.quaternion,
    });

    stairsId = body.id;

    world.addBody(body);
}

function createWalls() {
    let width = 10, height = 2, depth = 0.001;
    let walls = [
        {
            width: width / 3,
            height,
            depth,
            position: new THREE.Vector3(-width / 3, height / 2, -5),
            rotation: 0,
        },
        {
            width: width / 3,
            height,
            depth,
            position: new THREE.Vector3(width / 3, height / 2, -5),
            rotation: 0,
        },
        {
            width: width / 3,
            height,
            depth,
            position: new THREE.Vector3(width / 3, height / 2, 5),
            rotation: 0,
        },
        {
            width: width / 3,
            height,
            depth,
            position: new THREE.Vector3(-width / 3, height / 2, 5),
            rotation: 0,
        },
        {
            width: width / 3,
            height,
            depth,
            position: new THREE.Vector3(5, height / 2, width / 3),
            rotation: Math.PI / 2,
        },
        {
            width: width / 3,
            height,
            depth,
            position: new THREE.Vector3(5, height / 2, -width / 3),
            rotation: Math.PI / 2,
        },
        {
            width: width / 3,
            height,
            depth,
            position: new THREE.Vector3(-5, height / 2, width / 3),
            rotation: Math.PI / 2,
        },
        {
            width: width / 3,
            height,
            depth,
            position: new THREE.Vector3(-5, height / 2, -width / 3),
            rotation: Math.PI / 2,
        },
    ];
    const boxGeometry = new THREE.BoxGeometry();
    const boxMaterial = new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide
    });

    for (let i = 0; i < walls.length; i++) {
        // Three
        const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
        boxMesh.scale.set(
            walls[i].width,
            walls[i].height,
            walls[i].depth
        );
        boxMesh.position.copy(walls[i].position);
        boxMesh.rotateY(walls[i].rotation);
        game.scene.add(boxMesh);
        
        // Cannon.js body
        const shape = new CANNON.Box(new CANNON.Vec3(
            walls[i].width / 2,
            walls[i].height / 2,
            walls[i].depth / 2
        ));
        
        const boxBody = new CANNON.Body({
            shape: shape,
            type: CANNON.Body.STATIC,
            material: defaultMaterial,
            quaternion: boxMesh.quaternion,
            position: walls[i].position,
        });
        world.addBody(boxBody);
    }
}

function createLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    game.scene.add(ambientLight);
}

function createFloor() {
    // grid helper
    const size = 20;
    const divisions = 20;
    const gridHelper = new THREE.GridHelper(size, divisions);
    game.scene.add(gridHelper);

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshStandardMaterial({
            color: '#777777',
        })
    );
    floor.rotation.x = - Math.PI * 0.5;
    //game.scene.add(floor);
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
    let mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    mesh.position.copy(position);
    game.scene.add(mesh);

    // Cannon.js body
    const shape = new CANNON.Sphere(radius)

    let body = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0, 3, 0),
        shape: shape,
        material: defaultMaterial,
        angularFactor: new CANNON.Vec3(0, 0, 0),
    });
    body.position.copy(position);

    body.position.add = function(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
    }

    world.addBody(body);

    body.addEventListener('collide', function(e) {
        if (e.body.id === stairsId) {
            console.log("gravity stairs")
            world.gravity.set(0, - 9.82, -7);
        } else {
            console.log("normal gravity")
            world.gravity.set(0, - 9.82, 0);
        }
    });

    // Save in objects
    game.objectsToUpdate.push({ mesh, body });

    return {
        body,
        mesh,
    };
};

const animate = () =>
{
    game.update(mesh);

    // Update physics
    world.step(1 / 60, game.deltaTime, 3);

    window.requestAnimationFrame(animate);
}

initThree();