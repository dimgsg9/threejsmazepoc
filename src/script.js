import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { GUI } from 'dat.gui'

// Debug

const size = 30
const divisions = 30

const gridHelper = new THREE.GridHelper(size, divisions)

const axesHelper = new THREE.AxesHelper(5)

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Objects
const blockGeometry = new THREE.BoxGeometry(1, 1, 5)

// Materials
const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xfb8e00 })

// Mesh
const wallBlock = new THREE.Mesh(blockGeometry, wallMaterial)
wallBlock.position.set(0, 1.5, 13)

const wallBlock2 = new THREE.Mesh(blockGeometry, wallMaterial)
wallBlock2.position.set(0, 1.5, 8)

const wallBlock3 = new THREE.Mesh(blockGeometry, wallMaterial)
wallBlock3.position.set(-5, 1.5, 13)

const wallBlock4 = new THREE.Mesh(blockGeometry, wallMaterial)
wallBlock4.position.set(-5, 1.5, 8)


scene.add(wallBlock)
scene.add(wallBlock2)
scene.add(wallBlock3)
scene.add(wallBlock4)


// model

let model
let clock = new THREE.Clock();

const loader = new GLTFLoader()
let activeAction, mixer, actions, gui, face, previousAction
const api = { state: 'Walking' };

loader.load('RobotExpressive.glb', function (gltf) {

    model = gltf.scene;
    model.position.z = 14
    model.position.x = -3
    model.rotateY(Math.PI)
    scene.add(model)

    createGUI(model, gltf.animations)

}, undefined, function (e) {

    console.error(e);

});

// Lights

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);


const pointLight = new THREE.PointLight(0xffffff, 0.5)
pointLight.position.x = 2
pointLight.position.y = 3
pointLight.position.z = 4
scene.add(pointLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */

const width = 20
const height = width * (window.innerHeight / window.innerWidth)

const camera = new THREE.OrthographicCamera(
    -width,
    width,
    height,
    -height,
    1,
    100
)
camera.position.set(16, 16, 16)
camera.lookAt(0, 0, 0)

scene.add(camera)

scene.add(gridHelper)
scene.add(axesHelper)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding


function animate() {

    const dt = clock.getDelta()

    if (mixer) mixer.update(dt);

    // requestAnimationFrame(animate)

    // model.position.z -= 0.01

    renderer.render(scene, camera)


}

function animate2Go() {

    const dt = clock.getDelta()

    if (mixer) mixer.update(dt);

    // requestAnimationFrame(animate)

    
    if (model.position.z <= 0) {
        fadeToAction("Idle", 0.2);
    }
    if (model.position.z > 0) {
        model.position.z -= 0.1
    }

    renderer.render(scene, camera)

}

renderer.setAnimationLoop(animate)

/**
 * Animate
 */

// const clock = new THREE.Clock()

// const tick = () =>
// {

//     const elapsedTime = clock.getElapsedTime()

//     // Update objects
//     sphere.rotation.y = .5 * elapsedTime

//     // Update Orbital Controls
//     // controls.update()

//     // Render
//     renderer.render(scene, camera)

//     // Call tick again on the next frame
//     window.requestAnimationFrame(tick)
// }

// tick()


function createGUI(model, animations) {

    const states = ['Idle', 'Walking', 'Running', 'Dance', 'Death', 'Sitting', 'Standing'];
    const emotes = ['Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp'];

    gui = new GUI();

    mixer = new THREE.AnimationMixer(model);

    actions = {};

    for (let i = 0; i < animations.length; i++) {

        const clip = animations[i];
        const action = mixer.clipAction(clip);
        actions[clip.name] = action;

        if (emotes.indexOf(clip.name) >= 0 || states.indexOf(clip.name) >= 4) {

            action.clampWhenFinished = true;
            action.loop = THREE.LoopOnce;

        }

    }

    // states

    const statesFolder = gui.addFolder('States');

    const clipCtrl = statesFolder.add(api, 'state').options(states);

    clipCtrl.onChange(function () {

        fadeToAction(api.state, 0.5);

    });

    statesFolder.open();

    // emotes

    const emoteFolder = gui.addFolder('Emotes');

    function createEmoteCallback(name) {

        api[name] = function () {

            fadeToAction(name, 0.2);

            mixer.addEventListener('finished', restoreState);

        };

        emoteFolder.add(api, name);

    }

    function restoreState() {

        mixer.removeEventListener('finished', restoreState);

        fadeToAction(api.state, 0.2);

    }

    for (let i = 0; i < emotes.length; i++) {

        createEmoteCallback(emotes[i]);

    }

    emoteFolder.open();

    // expressions

    face = model.getObjectByName('Head_4');

    const expressions = Object.keys(face.morphTargetDictionary);
    const expressionFolder = gui.addFolder('Expressions');

    for (let i = 0; i < expressions.length; i++) {

        expressionFolder.add(face.morphTargetInfluences, i, 0, 1, 0.01).name(expressions[i]);

    }

    activeAction = actions['Idle'];
    activeAction.play();

    expressionFolder.open();

}

function fadeToAction(name, duration) {

    previousAction = activeAction;
    activeAction = actions[name];

    if (previousAction !== activeAction) {

        previousAction.fadeOut(duration);

    }

    activeAction
        .reset()
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(1)
        .fadeIn(duration)
        .play();

}


function sendCommand(value) {
    console.log(value)
    if (value == "WALK") {
        renderer.setAnimationLoop(animate2Go);
        console.log("Activating Walking mode")
        fadeToAction("Walking", 0.2);

    }
}


const commInput = document.getElementById("command-input")
commInput.oninput = (e) => {
    sendCommand(e.target.value)
}