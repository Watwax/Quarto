import * as THREE from 'three';

export class Case {
    constructor(scene, coord, height = 0, size = 3) {
        this.scene = scene;
        this.coord = coord;
        this.occupiedBy = null;   // ← nouveau : aucun pion au départ

        const geometry = new THREE.PlaneGeometry(size, size);
        const material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            opacity: 0.0,      // invisible mais cliquable
            transparent: true,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2; // à plat
        this.mesh.position.set(coord[0]+2.2, height, coord[1]-2.2);

        // Ajoute une info pour le raycaster
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
