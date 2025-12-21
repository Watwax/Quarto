import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

// Enumeration of caracteristics of pawn
const enumPawnColor = {
    BLACK: "b",
    WHITE: "w"
}

const enumPawnShape = {
    SQUARE: "s",
    ROUND: "r"
}

const enumPawnHeight = {
    SMALL: "s",
    BIG: "b"
}

const enumPawnType = {
    NOTHOLE: "n",
    HOLE: "h"
}

export class Pion {
    constructor(scene, objName, position = [1, -1], scale = 1, height = 0) {
        this.scene = scene;
        this.objName = objName;
        this.position = [position[0], height, position[1]];
        this.scale = scale;
        this.object3D = null;
        this.originalMaterials = [];
        this.loadModel();

        // Features of pawn
        this.pawnColor = null;
        this.pawnShape = null;
        this.pawnHeight = null;
        this.pawnType = null;
        this.loadPawn();

        this.selected = false;
    }

    loadModel() {
        const mtlLoader = new MTLLoader();
        mtlLoader.setPath('./models/');
        mtlLoader.load(this.objName + '.mtl', (materials) => {
            materials.preload();

            const objLoader = new OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.setPath('./models/');

            objLoader.load(
                this.objName + '.obj',
                (object) => {
                    object.scale.set(this.scale, this.scale, this.scale);
                    object.position.set(...this.position);

                    // Save original color
                    object.traverse((child) => {
                        if (child.isMesh) {
                            this.originalMaterials.push({
                                mesh: child,
                                material: child.material.clone()
                            });
                        }
                    });

                    // To add color when hover
                    object.userData.highlight = () => {
                        object.traverse((child) => {
                            if (child.isMesh) {
                                child.material = child.material.clone();
                                child.material.color.set(0xff0000);
                            }
                        });
                    };

                    // To restore the original color
                    object.userData.restoreColor = () => {
                        if(!this.selected) {
                            this.originalMaterials.forEach((entry) => {
                                entry.mesh.material = entry.material.clone();
                            });
                        }
                    };

                    this.object3D = object;
                    this.scene.add(object);
                },
                undefined,
                (err) => {
                    console.error('Erreur de chargement du pion :', this.objName, err);
                }
            );
        });
    }

    loadPawn() {
        const features = this.objName.slice(-4);
        this.pawnColor = features[0] == enumPawnColor.BLACK ? enumPawnColor.BLACK : enumPawnColor.WHITE;
        this.pawnShape = features[1] == enumPawnShape.ROUND ? enumPawnShape.ROUND : enumPawnShape.SQUARE;
        this.pawnHeight = features[2] == enumPawnHeight.BIG ? enumPawnHeight.BIG : enumPawnHeight.SMALL;
        this.pawnType = features[3] == enumPawnType.HOLE ? enumPawnType.HOLE : enumPawnType.NOTHOLE;
    }

    moveTo(newPosition, height) {
        if (!this.object3D) return;
        this.object3D.position.set(...[newPosition[0], height, newPosition[1]]);
    }

    remove() {
        if (this.object3D && this.scene) {
            this.scene.remove(this.object3D);
        }
    }
}
