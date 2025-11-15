import * as THREE from 'three';

export class Case {
    constructor(scene, coord, height = 0, size = 3) {
        this.scene = scene;
        this.coord = coord;
        this.occupiedBy = null; 

        const geometry = new THREE.PlaneGeometry(size, size);
        const material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            opacity: 0.0,
            transparent: true,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.set(coord[0]+2.2, height, coord[1]-2.2);

        this.mesh.userData.isCase = true;
        this.mesh.userData.case = this;

        scene.add(this.mesh);
    }

    highlight() {
        this.mesh.material.opacity = 0.5;
        this.mesh.material.color.set(0xff0000);
    }

    unhighlight() {
        this.mesh.material.opacity = 0.0;
    }
}
