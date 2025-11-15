import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Pion } from './pion.js';
import { Case } from './case.js';

const CASE = 3.2;
const PLATE_HEIGHT = 7.6;
const P_C = [
    [[1,-1], [4.2,-1], [7.4,-1], [10.6,-1]],
    [[1,-4.2], [4.2,-4.2], [7.4,-4.2], [10.6,-4.2]],
    [[1,-7.4], [4.2,-7.4], [7.4,-7.4], [10.6,-7.4]],
    [[1,-10.6], [4.2,-10.6], [7.4,-10.6], [10.6,-10.6]],
];
const N_C = [
    // At the left of the board
    [-10,-10],
    [-10,-15],
    [-15,-10],
    [-15,-15],
    [-10,-20],
    [-10,-25],
    [-15,-20],
    [-15,-25],
    // At the right of the board
    [10,10],
    [10,15],
    [15,10],
    [15,15],
    [20,10],
    [20,15],
    [25,10],
    [25,15],
]
const pawnNames = [
    'brbh',
    'brbn',
    'brsh',
    'brsn',
    'bsbh',
    'bsbn',
    'bssh',
    'bssn',
    'wrbh',
    'wrbn',
    'wrsh',
    'wrsn',
    'wsbh',
    'wsbn',
    'wssh',
    'wssn',
]

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf5edd0);

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 28, 0);
camera.lookAt(P_C[2][2][0], PLATE_HEIGHT, P_C[2][2][1]);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(P_C[2][2][0], PLATE_HEIGHT, P_C[2][2][1]);  // Regarder vers le centre de la scène
controls.update();

// Surligner
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredPion = null;
let hoveredCase = null;

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});


addOBJwithMTL('plateau', [0,0,0], 4);

const pionList = [];    
const caseList = [];

function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}

window.addEventListener('load', (event) => {
    shuffle(pawnNames);
    pawnNames.forEach((pawnName, index) => {
        //console.log(index, pawnName);
        let pion = new Pion(scene, 'pion_' + pawnName, N_C[index], 1, 0);
        pionList.push(pion);
    });
}); 

// const pion1 = new Pion(scene, 'pion_wssh', N_C[12], 1, 0);
// const pion12 = new Pion(scene, 'pion_wssh', N_C[13], 1, 0);
// const pion13 = new Pion(scene, 'pion_wssh', N_C[14], 1, 0);
// const pion14 = new Pion(scene, 'pion_wssh', N_C[15], 1, 0);
// const pion2 = new Pion(scene, 'pion_bssh', N_C[10], 1, 0);
// const pion3 = new Pion(scene, 'pion_brbh', N_C[11], 1, 0);

// pionList.push(pion1, pion2, pion3, pion12, pion13, pion14);

for (let i = 0; i < P_C.length; i++) {
    for (let j = 0; j < P_C[i].length; j++) {
        const c = new Case(scene, P_C[i][j], + 9.65, 3);
        caseList.push(c);
    }
}

let selectedPion = null;

function animate() {

    raycaster.setFromCamera(mouse, camera);

    const pionMeshes = pionList
        .map(p => p.object3D)
        .filter(o => o !== null);

    const caseMeshes = caseList.map(c => c.mesh);

    const intersects = raycaster.intersectObjects(
        [...pionMeshes, ...caseMeshes],
        true
    );

    let hoveredSomething = false;

    if (intersects.length > 0) {
        const obj = intersects[0].object;

    // 🎯 Si c’est une CASE
    if (obj.userData.isCase) {
        const c = obj.userData.case;

        // ❌ case occupée → pas de surlignage
        if (c.occupiedBy !== null) {
            // enleve un surlignage précédent éventuel
            if (hoveredCase && hoveredCase !== c) hoveredCase.unhighlight();
            hoveredCase = null;
            return;
        }

        // ✔ case libre → surligner
        c.highlight();

        if (hoveredCase && hoveredCase !== c) hoveredCase.unhighlight();
        hoveredCase = c;
        hoveredSomething = true;

        } else {
            // 🎯 Sinon c’est un PION
            const pion = obj.parent;
            hoveredSomething = true;

            if (hoveredPion !== pion) {
                if (hoveredPion) hoveredPion.userData.restoreColor();
                hoveredPion = pion;
                hoveredPion.userData.highlight();
            }
        }
    }

    // Rien survolé → on reset
    if (!hoveredSomething) {
        if (hoveredPion) hoveredPion.userData.restoreColor();
        hoveredPion = null;

        if (hoveredCase) hoveredCase.unhighlight();
        hoveredCase = null;
    }

    controls.update();
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

function addOBJwithMTL(objName, coordinates = [0, 0, 0], scale = 1) {
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath('models/');
    mtlLoader.load(objName + '.mtl', (materials) => {
        materials.preload();

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('models/');

        objLoader.load(objName + '.obj', (object) => {

            object.scale.set(scale, scale, scale); // agrandit un peu
            object.position.set(coordinates[0], coordinates[1], coordinates[2]);

            scene.add(object);
        },
        undefined,
        (err) => {
            console.error('Erreur loading OBJ :' + objName, err);
        });
    });
}

window.addEventListener('mousedown', () => {
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(
        [...pionList.map(p => p.object3D), ...caseList.map(c => c.mesh)],
        true
    );

    if (intersects.length === 0) return;

    const obj = intersects[0].object;

    // 👉 Sélection d’un pion en réserve uniquement
    if (obj.parent && pionList.some(p => p.object3D === obj.parent)) {
        selectedPion = pionList.find(p => p.object3D === obj.parent);

        // Le pion placé ne peut pas être sélectionné
        if (selectedPion.placed === true) {
            selectedPion = null;
            return;
        }

        console.log("Pion sélectionné :", selectedPion.objName);
        return;
    }


    // 👉 Déplacement du pion sélectionné vers une case
    if (selectedPion && obj.userData.isCase) {
        const targetCase = obj.userData.case;

        // ❌ Case occupée → rien ne se passe
        if (targetCase.occupiedBy !== null) {
            console.log("Cette case est déjà occupée !");
            return;
        }

        // ✔ déplacer
        selectedPion.moveTo(targetCase.coord, PLATE_HEIGHT);
        selectedPion.placed = true;

        // ✔ marquer la case comme occupée
        targetCase.occupiedBy = selectedPion;

        // ✔ optionnel : stocker la case sur le pion
        selectedPion.onCase = targetCase;

        targetCase.unhighlight();

        selectedPion = null;
        return;
    }

});
