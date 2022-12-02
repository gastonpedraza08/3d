import * as CANNON from 'cannon-es';
import Stats from "three/examples/jsm/libs/stats.module";
import * as THREE from 'three';

let _q1 = new CANNON.Quaternion();

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
	this.rotateOnAxis(new CANNON.Vec3(0, 1, 0), angle)
}

class Game {
	constructor(controlType, enableStats, canvas) {
		this.controlType = controlType;
		this.enableStats = enableStats;
		this.canvas = canvas;
		
		// stats
		this.stats = Stats();

		if (this.enableStats) {
			document.body.appendChild(this.stats.dom);
		}

		this.sizes = {
			width: window.innerWidth,
			height: window.innerHeight
		};
    	this.scene = new THREE.Scene();
    	this.camera = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 100);
    	this.camera.position.set(0, 2, 3);
    	this.scene.add(this.camera);

		// three variables
		this.clock = new THREE.Clock();
		this.oldElapsedTime = 0;
		this.objectsToUpdate = [];
		this.relativeCameraOffset = undefined;
		this.elapsedTime;
		this.deltaTime = undefined
		this.cameraOffset = undefined;

		// controls movement
		this.keys = {
			w: false,
			s: false,
			a: false,
			d: false,
		}
		this.velocity = 0;
		this.vectorHelper = new CANNON.Vec3();
		this._zAxis = new CANNON.Vec3(0, 0, 1)
		this.position = { x: 0, y: 0, z: 0 };

		this.createControls();

		// setup renderer
		this.renderer = new THREE.WebGLRenderer({
			canvas: this.canvas
		});
		this.renderer.setSize(this.sizes.width, this.sizes.height);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		window.addEventListener('resize', () =>
		{
			// Update sizes
			this.sizes.width = window.innerWidth;
			this.sizes.height = window.innerHeight;
	
			// Update camera
			this.camera.aspect = this.sizes.width / this.sizes.height;
			this.camera.updateProjectionMatrix();
	
			// Update renderer
			this.renderer.setSize(this.sizes.width, this.sizes.height);
			this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		});
	}

	update(mesh) {
		// update game
		this.elapsedTime = this.clock.getElapsedTime();
    	this.deltaTime = this.elapsedTime - this.oldElapsedTime;
    	this.oldElapsedTime = this.elapsedTime;

		this.stats.update();

		this.relativeCameraOffset = new THREE.Vector3(0, 2, 3);
    	this.cameraOffset = this.relativeCameraOffset.applyMatrix4(
        	mesh.matrixWorld
    	);
    	this.camera.position.copy(this.cameraOffset);
    	this.camera.lookAt(mesh.position);

    	this.renderer.render(this.scene, this.camera);

		// update physics bodies
		for(const object of this.objectsToUpdate)
		{
			object.mesh.position.copy(object.body.position);
			object.mesh.quaternion.copy(object.body.quaternion);
		}

		// player movement
		this.speed = 0;

		if (this.keys.w) {
			this.speed = -0.05;
		} else if (this.keys.s) {
			this.speed = 0.05;
		}
	
		if (this.keys.a) {
			this.body.rotateY(0.05);
		} else if (this.keys.d) {
			this.body.rotateY(-0.05);
		}
	
		this.velocity += (this.speed - this.velocity) * 0.3;
		this.vectorHelper.copy(this._zAxis).applyQuaternion(this.body.quaternion);
		this.position = this.vectorHelper.scale(this.velocity, this.vectorHelper);
		this.body.position.add(this.position);
	}

	setBody(body) {
		this.body = body;
	}

	createControls() {
		switch (this.controlType) {
			case 'keys':
				window.addEventListener('keydown', e => {
					if (e.key === 'w') {
						this.keys.w = true;
					} else if (e.key === 's') {
						this.keys.s = true;
					}
					if (e.key === 'a') {
						this.keys.a = true;
					} else if (e.key === 'd') {
						this.keys.d = true;
					}
				});
			
				window.addEventListener('keyup', e => {
					if (e.key === 'w') {
						this.keys.w = false;
					} else if (e.key === 's') {
						this.keys.s = false;
					}
					if (e.key === 'a') {
						this.keys.a = false;
					} else if (e.key === 'd') {
						this.keys.d = false;
					}
				});
			default:
		}
	}
}

export default Game;