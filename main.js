import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib';
import { MTLLoader } from 'three-stdlib';
import { OrbitControls } from 'three-stdlib';
import { Pion } from './pion.js';
import { Case } from './case.js';
import { GamePlayer } from './gamePlayer.js';

// Info about height and width
const CASE = 3.2;
const PLATE_HEIGHT = 7.6;

// Array of coordinates
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

// List of pawn
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

// Camera controllers (DEV : to remove or modify later)
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(P_C[2][2][0], PLATE_HEIGHT, P_C[2][2][1]); 
controls.update();

// To hover pawn and case
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredPion = null;
let hoveredCase = null;
let selectedPion = null;

// To manage game turn
const game = new GamePlayer("player");

// To get mouse position
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Add plate into scene
addOBJwithMTL('plateau', [0,0,0], 4);

// List of objects for the game
const pionList = [];    
const caseList = [];

// Function to shuffle the array of name
function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle
  while (currentIndex != 0) {

    // Pick a remaining element
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}

// Add pawns
window.addEventListener('load', (event) => {
    shuffle(pawnNames);
    pawnNames.forEach((pawnName, index) => {
        let pion = new Pion(scene, 'pion_' + pawnName, N_C[index], 1, 0);
        pionList.push(pion);
    });

    for (let i = 0; i < P_C.length; i++) {
        for (let j = 0; j < P_C[i].length; j++) {
            const c = new Case(scene, P_C[i][j], + 9.65, 3);
            caseList.push(c);
        }
    }
}); 


// Function to animate the scene
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

        if (obj.userData.isCase) {
            const c = obj.userData.case;

            if (c.occupiedBy !== null) {
                if (hoveredCase && hoveredCase !== c) hoveredCase.unhighlight();
                hoveredCase = null;
                hoveredSomething = true;
            } else {
                c.highlight();
                if (hoveredCase && hoveredCase !== c) hoveredCase.unhighlight();
                hoveredCase = c;
                hoveredSomething = true;
            }

            if (hoveredCase && hoveredCase !== c) hoveredCase.unhighlight();
            hoveredCase = c;
            hoveredSomething = true;

        } else {
            const pion = obj.parent;
            hoveredSomething = true;

            if (hoveredPion !== pion) {
                if (hoveredPion) hoveredPion.userData.restoreColor();
                hoveredPion = pion;
                hoveredPion.userData.highlight();
            }
        }
    }

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

// function to add OBJ with an MTL (only for plate, to remove)
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

// To select a pawn and a case to play
window.addEventListener('mousedown', () => {
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(
        [...pionList.map(p => p.object3D), ...caseList.map(c => c.mesh)],
        true
    );

    if (intersects.length === 0) return;

    const obj = intersects[0].object;

    if (obj.parent && pionList.some(p => p.object3D === obj.parent)) {

        if(selectedPion != null) {
            selectedPion.moveTo([selectedPion.position[0], selectedPion.position[2]], selectedPion.position[1]);
        }
        selectedPion = pionList.find(p => p.object3D === obj.parent);

        if (selectedPion.placed === true) {
            selectedPion = null;
            return;
        }

        selectedPion.moveTo([selectedPion.position[0], selectedPion.position[2]], selectedPion.position[1] + 5);

        game.onSelectPiece();

        console.log("Pion sélectionné :", selectedPion.objName);
        return;
    }

    if (selectedPion && obj.userData.isCase) {
        const targetCase = obj.userData.case;

        if (targetCase.occupiedBy !== null) {
            console.log("Cette case est déjà occupée !");
            return;
        }

        selectedPion.moveTo(targetCase.coord, PLATE_HEIGHT);
        selectedPion.placed = true;
        pionList.splice(pionList.indexOf(selectedPion), 1);

        targetCase.occupiedBy = selectedPion;
        selectedPion.onCase = targetCase;

        targetCase.unhighlight();

        selectedPion = null;
        game.onPlacePiece();
        return;
    }

});
