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
    world = game.cannon.world;
    defaultMaterial = game.cannon.defaultMaterial;
    body = game.body;
    mesh = game.mesh;
    
    makeEnvironment();

    animate();
}

function makeEnvironment() {
    createFloor();
    createLight();
    createWalls();
    createStairs();
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

    game.body.addEventListener('collide', function(e) {
        if (e.body.id === stairsId) {
            console.log("gravity stairs")
            game.cannon.world.gravity.set(0, - 9.82, -7);
        } else {
            console.log("normal gravity")
            game.cannon.world.gravity.set(0, - 9.82, 0);
        }
    });
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

const animate = () =>
{
    game.update(mesh);

    window.requestAnimationFrame(animate);
}

initThree();