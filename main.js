import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
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

// The board array
const board = [
  [null, null, null, null],
  [null, null, null, null],
  [null, null, null, null],
  [null, null, null, null],
];


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
if (window.screen.width <= window.screen.height) {
    camera.position.set(-30, 75, 30);
    document.getElementById('infoMobile').style.display = "block";
} else {
    camera.position.set(0, 28, 0);
}
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
let gameOver = false;

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
    document.querySelector('canvas').style.display = "none";
    document.getElementById('beginGame').onclick = beginGame;
    document.getElementById('rules').onclick = openRules;
    document.getElementById('rulesInfoQuit').onclick = closeRules;
    shuffle(pawnNames);
    heightMobile = (window.screen.width <= window.screen.height ? 6 : 0);
    pawnNames.forEach((pawnName, index) => {
        let pion = new Pion(scene, 'pion_' + pawnName, N_C[index], 1, heightMobile);
        pionList.push(pion);
    });

    for (let i = 0; i < P_C.length; i++) {
        for (let j = 0; j < P_C[i].length; j++) {
            const c = new Case(scene, P_C[i][j], 9.65, 3);
            c.row = i;
            c.col = j;
            caseList.push(c);
            board[i][j] = c;
        }
    }
}); 


// Function to animate the scene
function animate() {
    if(gameOver) {
        controls.update();
        renderer.render(scene, camera);
        return;
    }

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
window.addEventListener('mousedown', mouseEvent);

function mouseEvent(){
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
            selectedPion.selected = false;
            selectedPion.object3D.userData.restoreColor();
        }
        selectedPion = pionList.find(p => p.object3D === obj.parent);

        selectedPion.selected = true;
        selectedPion.moveTo([selectedPion.position[0], selectedPion.position[2]], selectedPion.position[1] + 5);

        game.onSelectPiece();
        return;
    }

    if (selectedPion && obj.userData.isCase) {
        const targetCase = obj.userData.case;

        if (targetCase.occupiedBy !== null) {
            return;
        }

        selectedPion.moveTo(targetCase.coord, PLATE_HEIGHT);
        pionList.splice(pionList.indexOf(selectedPion), 1);

        targetCase.occupiedBy = selectedPion;

        targetCase.unhighlight();

        selectedPion.selected = false;
        selectedPion.object3D.userData.restoreColor();
        selectedPion = null;
        game.onPlacePiece();
        checkVictory(targetCase);
        return;
    }
}

// To play and win 
function getGroupsToCheck(row, col) {
    const groups = [];

    // Line
    groups.push([board[row][0], board[row][1], board[row][2], board[row][3]]);

    // Column
    groups.push([board[0][col], board[1][col], board[2][col], board[3][col]]);

    // Diagonals
    if (row === col) {
        groups.push([board[0][0], board[1][1], board[2][2], board[3][3]]);
    }
    if (row + col === 3) {
        groups.push([board[0][3], board[1][2], board[2][1], board[3][0]]);
    }

    return groups;
}

// Check if a group of coordinates are similar
function checkSimilarityOnGroup(group) {
    const pawns = group.map(c => c.occupiedBy);

    if (pawns.some(p => p === null || p === undefined)) return false;

    const attributes = ['pawnColor', 'pawnShape', 'pawnHeight', 'pawnType'];

    for (const attr of attributes) {
        const first = pawns[0][attr];
        if (pawns.every(p => p[attr] === first)) {
            return { attribute: attr, value: first, pawns };
        }
    }

    return false;
}

// Check if the pawn give the victory to the player
function checkVictory(targetCase) {
    if (!targetCase || targetCase.row === undefined || targetCase.col === undefined) return false;

    const row = targetCase.row;
    const col = targetCase.col;

    const groups = getGroupsToCheck(row, col);

    for (const group of groups) {
        const res = checkSimilarityOnGroup(group);
        if (res) {
            displayWinner(res, group);
            return true;
        }
    }
    if(pionList.length == 0) {
        displayDraw();
    }

    return false;
}

// Display the winner and the winning line/column/diagonal
function displayWinner(result, winningGroup) {
    const ui = document.getElementById('player');
    const current = game.opponentPlayer || 'Joueur';

    ui.innerText = `${current} a gagné ! (${result.attribute} = ${result.value})`;

    winningGroup.forEach(c => {
        if (c && c.mesh && c.mesh.material) {
            c.mesh.material.opacity = 0.5;
            c.mesh.material.color.set(0xffff00);
        }
        if (c.occupiedBy && c.occupiedBy.object3D) {
            c.occupiedBy.object3D.traverse(child => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                    child.material.color.set(0xffff00);
                }
            });
        }
    });

    window.removeEventListener('mousedown', mouseEvent);
    gameOver = true;
    reduceCanva();
    addBtnRestart();
}

// Display draw
function displayDraw() {
    const ui = document.getElementById('player');
    ui.innerText = `Match Nul`;

    window.removeEventListener('mousedown', mouseEvent);
    gameOver = true;
    reduceCanva();
    addBtnRestart();
}

// To remove canva and display the end of the match
function reduceCanva() {
    renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);

    const canva = document.querySelector('canvas');
    canva.classList.add('moveToBottom');

    const player = document.getElementById('player');
    player.classList.add('moveToBottom');
    player.style.fontSize = '4em';
}

// To add the button to restart the game (by reloading)
function addBtnRestart() {
    const btnRestart = document.createElement('button');
    btnRestart.innerText = "Relancer une partie";
    btnRestart.addEventListener('click', restartGame);

    const body = document.querySelector('body');
    body.append(btnRestart);
}

// reload the page to restart the game
function restartGame() {
    location.reload();
}

// To begin the game when the button is pressed
function beginGame() {
    document.querySelector('canvas').style.display = "block";
    const menu = document.querySelector('.menu');
    menu.style.display = "none";
}

function openRules() {
    document.querySelector('#rulesInfo').style.display = "flex";
}

function closeRules() {
    document.querySelector('#rulesInfo').style.display = "none";
}