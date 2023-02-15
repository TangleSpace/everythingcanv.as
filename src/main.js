
import * as THREE from './build/three.module.js';
import { GLTFLoader } from './scripts/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from './scripts/jsm/exporters/GLTFExporter.js';
import { OrbitControls } from './scripts/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from './scripts/jsm/environments/RoomEnvironment.js';
import { BrushHelper } from './BrushHelper.js';
import { Stroke } from './Stroke.js';
import { ActionHelper } from './ActionHelper.js';
import { Background } from './Background.js';
import { CustomMaterial } from './CustomMaterial.js';

let camera, mesh, scene, renderer;
let mouse = {
    position: new THREE.Vector2(), 
    previousNormal: new THREE.Vector2(), 
    previous: new THREE.Vector2(), 
    avgs:[], 
    smoothAvgs:[],
    normal: new THREE.Vector2(), 
    down:false,
    smoothInc:0,
    smoothLerp:new THREE.Vector3(),
    rots:[],
};

let world, meshBody, joint;
let bodies=[], visuals=[];
let dt = 1 / 60;
let raycaster, intersected;
let point, holding = false, constrainedBody, mouseConstraint, currentZ = 0.0, bgMesh, scenePosition = new THREE.Vector3();
let ot = false, tempGeo, yInc = 0;
let canvas, ctx;
let geoArr = [];
let yOff = 0.1;
let object;
let globalAnimationSpeed = 1;
const meshObjects = [];
let light;
let composer;
let controls;
let bgHolder;
let btns={space:false};
let sceneMesh;
let shouldRotateAdditiveX = true;
let shouldRotateAdditiveY = true;
let shouldRotateAdditiveZ = true;
let globalAdditiveRotationSpeed = 0;
const geometry = new THREE.BoxGeometry( 5, 5, 5 );
const material = new THREE.MeshStandardMaterial();
let meshClone;
let globalShouldAnimateSize = true;
const loadobjs = [
    {url:"./extras/assets/draw/",           amount:2},
    {url:"./extras/assets/models/flowers/", amount:74},
    {url:"./extras/assets/models/rocks/",   amount:27},
    {url:"./extras/assets/models/tools/",   amount:80},
    {url:"./extras/assets/models/toys/",    amount:79}
]
let drawObject;  
const toysAmount = 78;
const toolsAmount = 89;
const flowersAmount = 73;
let drawState = "object" 
let showingSideBar = true;
let movingCamera = false;
let showingDrawObject = true;
let meshScale = 1;
let currentDrawHitPoint;
let globalOffsetRotation = new THREE.Euler( 0, 0, 0, 'XYZ' );
let globalLerpAmount = 1;
let globalDensityAmount = .1;
let globalSmoothAmount = .1;
let globalNormalOffsetAmount = .2;
let previewMesh;
let clock;
let rotationFollowsNormal = true;
let helper;
let helperLocation;
let helperRotation;

let mirrorX = true;
let mirrorY = false;
let mirrorZ = false;

let mirrorMeshX;
let mirrorMeshY;
let mirrorMeshZ;


let reflectObjectX = new THREE.Object3D();
let reflectObjectY = new THREE.Object3D();
let reflectObjectZ = new THREE.Object3D();
let reflectObjectXY = new THREE.Object3D();
let reflectObjectXZ = new THREE.Object3D();
let background;
let matHandler;

const actionHelper = new ActionHelper();

const isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};

const link = document.createElement( 'a' );
link.style.display = 'none';
document.body.appendChild( link );

init();

function init(){

    for(let i = 1; i<loadobjs.length; i++){
        const amt = loadobjs[i].amount; 
        for(let k = 0; k<amt; k++){
            const url = loadobjs[i].url;
            let img = document.createElement("img")
            img.src = (url+k)+".png";
            img.onclick = function(){chooseModel(i,k)};
            document.getElementById("models").append(img);
        }
    }
   
    chooseModel(1,0);

    const loader = new GLTFLoader().setPath( loadobjs[0].url );
    loader.load( 0+'.glb', function ( gltf ) {
        gltf.scene.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.material.vertexColors = false;
                drawObject = child;
                scene.add(drawObject);

            }
        });
        //drawObject = gltf.scene;
        
        
    });

    canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    canvas.className = "customCanvas";
    

	raycaster = new THREE.Raycaster();

	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 20;

	scene = new THREE.Scene();

    reflectObjectX.scale.x =-1;

    reflectObjectY.scale.y =-1;

    reflectObjectZ.scale.z =-1;
    
    reflectObjectXY.scale.y =-1;
    reflectObjectXY.scale.x =-1;
    
    reflectObjectXZ.scale.z =-1;
    reflectObjectXZ.scale.x =-1;

    scene.add(reflectObjectX);
    scene.add(reflectObjectY);
    scene.add(reflectObjectZ);
    scene.add(reflectObjectXY);
    scene.add(reflectObjectXZ);
    
    object = new THREE.Object3D();
    scene.add(object);
    
    bgHolder = new THREE.Object3D();
    scene.add(bgHolder)

    //camera.add(bgHolder);
    bgHolder.position.copy(camera.position);
    bgHolder.rotation.copy(camera.rotation);

    mirrorMeshX = new THREE.Mesh(new THREE.BoxGeometry(.1, 2000, .1), new THREE.MeshBasicMaterial({depthTest :true, color:0xff0000}))
    mirrorMeshX.visible = mirrorX;
    scene.add(mirrorMeshX)

    mirrorMeshY = new THREE.Mesh(new THREE.BoxGeometry(2000, .1, .1), new THREE.MeshBasicMaterial({depthTest :true, color:0x00ff00}))
    mirrorMeshY.visible = mirrorY;
    scene.add(mirrorMeshY)

    mirrorMeshZ = new THREE.Mesh(new THREE.BoxGeometry(.1, .1, 2000), new THREE.MeshBasicMaterial({depthTest :true, color:0x0000ff}))
    mirrorMeshZ.visible = mirrorZ;
    scene.add(mirrorMeshZ)
    // sceneMesh = new THREE.Mesh(
    //     new THREE.SphereBufferGeometry( 5, 32, 32 ),
    //     new THREE.MeshNormalMaterial( {color: 0xffff00} )
    // )
    // scene.add(sceneMesh);

    
	const g = new THREE.PlaneGeometry( 10000, 10000, 1, 1);
    const m = new THREE.MeshBasicMaterial( { color: 0xff0000, transparent:true, side:THREE.DoubleSide, opacity:0.5 } );
    m.blending = THREE.AdditiveBlending;
	bgMesh = new THREE.Mesh( g, m);
    bgMesh.visible = false;
    scene.add(bgMesh);
    bgHolder.attach(bgMesh);
    bgHolder.position.set(camera.position.z,0,0);
   
	// lights
    const light = new THREE.AmbientLight( 0x242424 ); // soft white light
    scene.add( light );

    const dlight = new THREE.DirectionalLight( 0xffffff, 1.0 );
    var d = 20;
    dlight.position.set( d*.5, 0, d );

    scene.add(dlight)
    
	renderer = new THREE.WebGLRenderer();
	renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = .5;
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );
    renderer.domElement.className = "customThree";
    
    const pmremGenerator = new THREE.PMREMGenerator( renderer );
    scene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;
   
    controls = new OrbitControls( camera, canvas);
    
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;

    controls.screenSpacePanning = false;

    controls.minDistance = 1;
    controls.maxDistance = 150;
    controls.enableRotate=false;
    clock = new THREE.Clock();

    //controls.maxPolarAngle = Math.PI / 2;

	window.addEventListener( 'resize', onWindowResize, false );
	document.addEventListener( 'mousemove', onMouseMove, false );
    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );
    document.addEventListener( 'touchmove', onTouchMove, false );
	canvas.addEventListener( 'mousedown', onMouseDown, false );
    document.addEventListener( 'touchstart', onTouchDown, false );
	canvas.addEventListener( 'mouseup', onMouseUp, false );
    document.addEventListener( 'touchend', onTouchUp, false );
    document.addEventListener( 'touchcancel', onTouchUp, false );

    document.getElementById("reset-cam").addEventListener("click", resetCam);
    document.getElementById("toggle-draw-on-view").addEventListener("click", updateDrawState);
    document.getElementById("toggle-draw-object").addEventListener("click", toggleDrawObject);
    document.getElementById("export-gltf").addEventListener("click", exportGLTF);
    document.getElementById("rotation-follows-normal").addEventListener("click", toggleRotationFollowingNormal);
    document.getElementById("mirror-x").addEventListener("click", toggleMirrorX);
    document.getElementById("mirror-y").addEventListener("click", toggleMirrorY);
    document.getElementById("mirror-z").addEventListener("click", toggleMirrorZ);
    document.getElementById("undo").addEventListener("click", undoClick);
    document.getElementById("redo").addEventListener("click", redoClick);

    document.getElementById("animation-speed-slider").addEventListener("change", updateAniSpeed);
    document.getElementById("size-slider").addEventListener("change", updateMeshSize);
    document.getElementById("size-slider").addEventListener("input", updateMeshSize);

    document.getElementById("should-size-ease-in-out").addEventListener("click", toggleSizeEasing);
    document.getElementById("rotate-slider-x").addEventListener("change", rotateBrushX);
    document.getElementById("rotate-slider-x").addEventListener("input", rotateBrushX);

    document.getElementById("rotate-slider-y").addEventListener("change", rotateBrushY);
    document.getElementById("rotate-slider-y").addEventListener("input", rotateBrushY);

    document.getElementById("rotate-slider-z").addEventListener("change", rotateBrushZ);
    document.getElementById("rotate-slider-z").addEventListener("input", rotateBrushZ);

    document.getElementById("additive-rotation-slider").addEventListener("change", updateRotationSpeed);
    document.getElementById("additive-rotation-slider").addEventListener("input", updateRotationSpeed);

    document.getElementById("additive-rotation-x").addEventListener("click", toggleAdditiveRotationX);
    document.getElementById("additive-rotation-y").addEventListener("click", toggleAdditiveRotationY);
    document.getElementById("additive-rotation-z").addEventListener("click", toggleAdditiveRotationZ);

    document.getElementById("smooth-amount").addEventListener("change", updateSmoothAmount);
    document.getElementById("smooth-amount").addEventListener("input", updateSmoothAmount);

    document.getElementById("normal-offset-amount").addEventListener("change", updateNormalOffsetAmount);
    document.getElementById("normal-offset-amount").addEventListener("input", updateNormalOffsetAmount);

    document.getElementById("density-amount").addEventListener("change", updateDensity);
    document.getElementById("density-amount").addEventListener("input", updateDensity);

    helper = new BrushHelper({scene:scene, raycaster:raycaster});
    background = new Background({scene:scene});
    matHandler = new CustomMaterial();
	animate();
}

function animate(){

	requestAnimationFrame( animate );
    
    if(controls)
        controls.update();

    if(mouse.down){
        
        if(currentDrawHitPoint){
            
            if(mouse.smoothInc==0){
                mouse.smoothLerp.set(currentDrawHitPoint.x, currentDrawHitPoint.y, currentDrawHitPoint.z);
            }
            mouse.smoothLerp.lerp(currentDrawHitPoint,globalSmoothAmount);
            mouse.smoothAvgs.push(new THREE.Vector3(mouse.smoothLerp.x,mouse.smoothLerp.y,mouse.smoothLerp.z) )
            const targ = new THREE.Quaternion();
            helper.holder.getWorldQuaternion(targ);
            mouse.rots.push( targ );
            mouse.smoothInc ++;
        }
    }

    if(helper){
        helper.update({
            globalSmoothAmount:globalSmoothAmount,
            meshScale:meshScale, 
            globalSmoothAmount:globalSmoothAmount,
            shouldRotateAdditiveX:shouldRotateAdditiveX,
            shouldRotateAdditiveY:shouldRotateAdditiveY,
            shouldRotateAdditiveZ:shouldRotateAdditiveZ,
            globalAdditiveRotationSpeed:globalAdditiveRotationSpeed,
            globalOffsetRotation:globalOffsetRotation,
            rotationFollowsNormal:rotationFollowsNormal

        });
    }
    
    bgHolder.position.copy(camera.position);
    bgHolder.rotation.copy(camera.rotation);

    const delta = clock.getDelta()*globalAnimationSpeed;
    for(var i = 0; i<meshObjects.length; i++){
        meshObjects[i].update({delta:delta});
    }
    matHandler.update({delta:delta})
    //composer.render();
    renderer.render(scene,camera);
	
}

function chooseModel(i,k){
    const loader = new GLTFLoader().setPath( loadobjs[i].url );
    loader.load( k+'.glb', function ( gltf ) {
        gltf.scene.traverse( function ( child ) {
            if ( child.isMesh ) {
                //roughnessMipmapper.generateMipmaps( child.material );
                //child.material.vertexColors = false;
                const mat = child.material.clone(); 
                child.material = matHandler.getCustomMaterial(mat);
            }
        });

        meshClone = gltf.scene;
        helper.updateVisual({scene:scene, mesh:meshClone});

    });
}

function resetCam(){
    
    camera.position.set(0,0,20);
    camera.rotation.set(0,0,0);
    
    if(controls)
        controls.reset();
}



function getHitPointFromMesh(msh, mse){

	raycaster.setFromCamera(  mse, camera );
	
	var intersects = raycaster.intersectObject( msh );

	if ( intersects.length > 0 ) {
		return { point:intersects[ 0 ].point, normal:intersects[ 0 ].face.normal};
	}
	
	return false;
}


function onKeyDown(e) {
    if(e.keyCode == 18){
        if(controls){
            controls.enableRotate=true;
            //controls.altBtnDown = true;
        }
    }else if(e.keyCode==32){
       
    }


    switch(e.keyCode){
     
      
        case 82://r
            if(state == "drawing"){
                // state = "rotating";
                // //$("#infoImg").show();
                // mouse.d3X = mouse.x;
                // rotatePositionHolder = new THREE.Vector2(icon.position.x, icon.position.y);
                // snapRotating = false;
                //icon.visible = false;
            }
        break;
        case 69://e
            // if(state == "drawing"){
            //     state = "rotating";
            //     mouse.d3X = mouse.x;
            //     rotatePositionHolder = new THREE.Vector2(icon.position.x, icon.position.y);
            //     snapRotating = true;
            // }
            
        break;
        case 84://t
            tempRotValue = 0;
            rotValue = tempRotValue;
        break;
        case 89:
            // if(state == "drawing"){
            //     if(cntrlBtnDown && !backInTime)
            //         redo();
            // }
        break;
        case 9:
            // if(state == "drawing"){
            //     event.preventDefault();
            //     toggleTraceImg();
            // }
        break;
        case 192:
            // if(state == "drawing"){
            //     toggleTraceOpacity();
            // }
        break;
        case 13:
            // if(state == "changingName"){
            //     updateFileName();
            // }
        break;
        case 32:
            

        break;
        case 39://right
            if(state == "drawing"){
                /*
                if(scale<10)
                    changeEmojiSize(0.5);
                else if(scale>=10 && scale<=20)
                    changeEmojiSize(1);
                else
                    changeEmojiSize(5);
                */
            }
        break;
        case 37://left
            
            if(state == "drawing"){
                /*
                if(scale<10)
                    changeEmojiSize(-.5);
                else if(scale>=10 && scale<=20)
                    changeEmojiSize(-1);
                else
                    changeEmojiSize(-5);
                */
            }

        break;
    }
}


function onKeyUp(e) {
    if(e.keyCode == 18){
        if(controls){
            controls.enableRotate=false;
        }
    }else if(e.keyCode==32){
        btns.space = false;
    }
}

function onWindowResize() {
    
    if(controls)
        //controls.handleResize();
	
    camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0,0,canvas.width, canvas.height);
    //composer.setSize( window.innerWidth, window.innerHeight );

}

function onTouchUp(e){

    mouse.down = false;
    holding = false;

    mouseConstraint = null;
    mouse.previous = new THREE.Vector2();
    ot = false;

    buildGeo();

    ctx.clearRect(0,0,canvas.width,canvas.height);

    mouse.avgs = [];
    mouse.smoothAvgs = [];
    mouse.rots = [];
    currentDrawHitPoint = null;
    mouse.smoothInc = 0;
    geoArr = [];

    yInc+=yOff;
    bgMesh.position.z = yInc;

}

function onMouseUp(e){
	
    if(e.button == 0){
        
        mouse.down = false;
    	holding = false;
    	
        mouseConstraint = null;
        mouse.previous = new THREE.Vector2();
        ot = false;
        
        if(!movingCamera){
            buildGeo();    
        }

        movingCamera = false;
        
        ctx.clearRect(0,0,canvas.width,canvas.height);
        
        mouse.rots = [];
        mouse.avgs = [];
        mouse.smoothAvgs = [];
        currentDrawHitPoint = null;
        mouse.smoothInc = 0;
        geoArr = [];

        //if(controls)
            //controls.enabled = true;
        
       // yInc+=yOff;
       // bgMesh.position.z = yInc;
    }

}

function onMouseDown(e){
    
    var cntrl = false;

    if(controls){
        if(!controls.enableRotate){
            cntrl = true;
        }else{
            movingCamera = true;
            cntrl = false;
        }
    }

    if(e.button == 0 && cntrl){
        mouse.down = true;
        //if(controls)
            //controls.enabled = false;

    }
    
}



function onTouchDown(e){
    
    mouse.down = true;
    
}

function onTouchMove(e){
    
    e.preventDefault();
    var touch = e.touches[0];
        
    var x = touch.pageX;
    var y = touch.pageY;
    
    mouse.position.x =  x;
    mouse.position.y =  y;

    mouse.normal.x =    ( x / window.innerWidth ) * 2 - 1;
    mouse.normal.y =  - ( y / window.innerHeight ) * 2 + 1;

    if(mouse.down){
        
        if(mouse.previous.x != 0 || mouse.previous.y != 0)
            handleDrawGeo();

    }
    
    mouse.previous = x;
    mouse.previous = y;
   
    mouse.previousNormal.x =    ( mouse.position.x / window.innerWidth ) * 2 - 1;
    mouse.previousNormal.y =  - ( mouse.position.y / window.innerHeight ) * 2 + 1;
    
}
function onMouseMove(e){

	mouse.position.x =  e.clientX;
	mouse.position.y =  e.clientY;

	mouse.normal.x =    ( e.clientX / window.innerWidth ) * 2 - 1;
	mouse.normal.y =  - ( e.clientY / window.innerHeight ) * 2 + 1;

    

    // See if the ray from the camera into the world hits one of our meshes
    if(drawObject){
        if(helper){
            helper.doMouseInteraction({
                mouse:mouse, 
                camera:camera, 
                bgMesh:bgMesh, 
                drawObject:drawObject,
                drawState:drawState,
                globalNormalOffsetAmount:globalNormalOffsetAmount
            });
        }
    }

    if(mouse.down){
        
        if(mouse.previous.x != 0 || mouse.previous.y != 0)
            handleDrawGeo();

    }
    
    mouse.previous = e.clientX;
    mouse.previous = e.clientY;
   
    mouse.previousNormal.x =    ( mouse.position.x / window.innerWidth ) * 2 - 1;
    mouse.previousNormal.y =  - ( mouse.position.y / window.innerHeight ) * 2 + 1;

    // if(btns.space){

    //     var meshData = getHitPointFromMesh(sceneMesh, mouse.normal);
        
    //     if(meshData){
    //         console.log(meshData.point)
    //         bgMesh.position.copy(meshData.point);
    //         bgMesh.lookAt(meshData.normal);    
    //     }
        
    // }
}

function handleDrawGeo(){
    
    if(!ot){
        ctx.beginPath();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 1;
        ot = true;        
    }
    
    ctx.moveTo(mouse.previous.x, mouse.previous.y);
    ctx.lineTo(mouse.position.x, mouse.position.y);
    ctx.stroke();
    let drawMesh = bgMesh;
    if(drawState == "object"){
        drawMesh = drawObject;
    }
    const point = getHitPointFromMesh(drawMesh, mouse.normal).point;
    const normal = getHitPointFromMesh(drawMesh, mouse.normal).normal;
    if(point){
        currentDrawHitPoint = getHitPointFromMesh(drawMesh, mouse.normal).point.add(normal.multiplyScalar(globalNormalOffsetAmount));
    }

   

}


function idk(xx, yy, zz, a)
{
    // Here we calculate the sin( theta / 2) once for optimization
    const factor = sin( a / 2.0 );

    // Calculate the x, y and z of the quaternion
    const x = xx * factor;
    const y = yy * factor;
    const z = zz * factor;

    // Calcualte the w value by cos( theta / 2 )
    const w = cos( a / 2.0 );

    return new THREE.Quaternion(x, y, z, w).normalize();
}

function buildGeo(){

    //meshObjects.push(new MeshObject());
    const strokeFinal = [];
    
    if(meshClone != null && mouse.smoothAvgs.length>0 ){
        const all = {
            helper:helper, 
            meshClone:meshClone, 
            index:actionHelper.currStrokeIndex, 
            scene:scene, 
            globalDensityAmount:globalDensityAmount, 
            meshScale:meshScale,
            globalShouldAnimateSize:globalShouldAnimateSize,
          
        }
        //function Stroke(SMOOTHARR, OBJ, DENSITY){
        meshObjects.push(new Stroke( { pos:mouse.smoothAvgs, rots:mouse.rots, all:all } ));
        strokeFinal.push({pos:mouse.smoothAvgs, rots:mouse.rots, index:actionHelper.currStrokeIndex, mesh:meshClone, scene:all.scene});

        if(mirrorX){
            all.scene = reflectObjectX;
            meshObjects.push(new Stroke( {pos:mouse.smoothAvgs, rots:mouse.rots, all:all} ));
            strokeFinal.push({pos:mouse.smoothAvgs, rots:mouse.rots, index:actionHelper.currStrokeIndex, mesh:meshClone, scene:all.scene});
        }

        if(mirrorY){
            all.scene = reflectObjectY;  
            meshObjects.push(new Stroke( {pos:mouse.smoothAvgs, rots:mouse.rots, all:all} ));
            strokeFinal.push({pos:mouse.smoothAvgs, rots:mouse.rots, index:actionHelper.currStrokeIndex, mesh:meshClone, scene:all.scene});

            if(mirrorX){
                all.scene = reflectObjectXY;
                meshObjects.push(new Stroke( {pos:mouse.smoothAvgs, rots:mouse.rots, all:all} ));
                strokeFinal.push({pos:mouse.smoothAvgs, rots:mouse.rots, index:actionHelper.currStrokeIndex, mesh:meshClone, scene:all.scene});

            }
        }

        if(mirrorZ){
            all.scene = reflectObjectZ;
            meshObjects.push(new Stroke( {pos:mouse.smoothAvgs, rots:mouse.rots, all:all} ));
            strokeFinal.push({pos:mouse.smoothAvgs, rots:mouse.rots, index:actionHelper.currStrokeIndex, mesh:meshClone, scene:all.scene});

            if(mirrorX){
                all.scene = reflectObjectXZ;
                meshObjects.push(new Stroke( {pos:mouse.smoothAvgs, rots:mouse.rots, all:all} ));
                strokeFinal.push({pos:mouse.smoothAvgs, rots:mouse.rots, index:actionHelper.currStrokeIndex, mesh:meshClone, scene:all.scene});
            }
        }

        actionHelper.addStrokesArray({array:strokeFinal});


    }

}

function undoClick(){
    if(actionHelper.currStrokeIndex > 0){
        for(let i = 0; i<meshObjects.length; i++){
            if(meshObjects[i].strokeIndex == actionHelper.currStrokeIndex - 1){
                meshObjects[i].killStroke();
            }   
        }
        actionHelper.undo();
    }
}

function redoClick(){
    if(actionHelper.currStrokeIndex < actionHelper.actionsArr.length){

        const ind = actionHelper.currStrokeIndex;
        const all = {
            helper:helper, 
            meshClone:meshClone, 
            index:actionHelper.currStrokeIndex, 
            scene:scene, 
            globalDensityAmount:globalDensityAmount, 
            meshScale:meshScale,
            globalShouldAnimateSize:globalShouldAnimateSize
        }
        for(let i = 0; i<actionHelper.actionsArr[ind].length; i++){
            const pos = actionHelper.actionsArr[ind][i].pos;
            const rots = actionHelper.actionsArr[ind][i].rots; 
            all.meshClone = actionHelper.actionsArr[ind][i].mesh;
            all.scene = actionHelper.actionsArr[ind][i].scene;
            meshObjects.push( new Stroke( {pos:pos, rots:rots, all:all} ) );
        }   
    
        actionHelper.redo();
    }
}

function updateDrawState(){
    if(drawObject){
        if(drawState == "object"){
            //drawObject.visible = false;
            //showingDrawObject = false;
            bgMesh.visible = true;
            drawState = "view";
            document.getElementById("toggle-draw-on-view").innerHTML = "draw on object";
        }else{
            drawObject.material.visible = true;
            showingDrawObject = true;
            drawObject.visible = true;
            drawState = "object";
            bgMesh.visible = false;
            document.getElementById("toggle-draw-on-view").innerHTML = "draw on view";

        }
    }
}

function updateMeshSize(val){
    handleUiUpdating();
    meshScale = $("#size-slider").val()*.1;
}

function rotateBrushX(){
    globalOffsetRotation.x = $("#rotate-slider-x").val()*0.01745329251;
    handleUiUpdating();
}
function rotateBrushY(){
    globalOffsetRotation.y = $("#rotate-slider-y").val()*0.01745329251;
    handleUiUpdating();
}
function rotateBrushZ(){
    globalOffsetRotation.z = $("#rotate-slider-z").val()*0.01745329251;
    handleUiUpdating();
}
function updateSmoothAmount(){
    globalSmoothAmount = 1-($("#smooth-amount").val()*.01);
}
function updateNormalOffsetAmount(){
   
    globalNormalOffsetAmount = $("#normal-offset-amount").val()*.01;
    handleUiUpdating();
}

function toggleSizeEasing(){
    globalShouldAnimateSize = !globalShouldAnimateSize;
}

function handleUiUpdating(){
    mouse.normal.x = 0;
    mouse.normal.y = 0;

    helper.doMouseInteraction({
        mouse:mouse, 
        camera:camera, 
        bgMesh:bgMesh, 
        drawObject:drawObject,
        drawState:drawState,
        globalNormalOffsetAmount:globalNormalOffsetAmount
    });
}

function updateDensity(){
    globalDensityAmount = $("#density-amount").val()*.0031;
    console.log(globalDensityAmount)
}

function toggleRotationFollowingNormal(){
    rotationFollowsNormal = !rotationFollowsNormal;
}

function updateRotationSpeed(){
    globalAdditiveRotationSpeed = $("#additive-rotation-slider").val()*.0015;
}
function toggleAdditiveRotationX(){
    shouldRotateAdditiveX = !shouldRotateAdditiveX;
}
function toggleAdditiveRotationY(){
    shouldRotateAdditiveY = !shouldRotateAdditiveY;
}
function toggleAdditiveRotationZ(){
    shouldRotateAdditiveZ = !shouldRotateAdditiveZ;
}

function updateAniSpeed(){
    globalAnimationSpeed = $("#animation-speed-slider").val()*.1;
}

function toggleDrawObject(){
    drawObject.visible = !drawObject.visible
}

function toggleMirrorX(){
    mirrorX = !mirrorX;
    mirrorMeshX.visible = mirrorX;
}
function toggleMirrorY(){
    mirrorY = !mirrorY;
    mirrorMeshY.visible = mirrorY;
}
function toggleMirrorZ(){
    mirrorZ = !mirrorZ;
    mirrorMeshZ.visible = mirrorZ;
}


function exportGLTF(  ) {
    const anis = [];
    const meshes = [];
    //meshes.push(scene);
    for(let i = 0; i<meshObjects.length; i++){
        for(let k = 0; k<meshObjects[i].meshes.length; k++){
            //meshes.push(meshObjects[i].meshes[k].mesh);
            //console.log(meshObjects[i].meshes[k].mesh);
            //console.log(meshObjects[i].meshes[k].clip)
            anis.push(meshObjects[i].meshes[k].mesh.animations[0])
            //anis.push(meshObjects[i].meshes[k].clip)
        }
    }


    
    const gltfExporter = new GLTFExporter();
    const options = {
        trs: false,//document.getElementById( 'option_trs' ).checked,
        onlyVisible: true,
        truncateDrawRange: true,//document.getElementById( 'option_drawrange' ).checked,
        binary: false,//document.getElementById( 'option_binary' ).checked,
        maxTextureSize: 1024, // To prevent NaN value
        animations:anis,
    };
   
    gltfExporter.parse(
        scene,
        function ( result ) {

            if ( result instanceof ArrayBuffer ) {

                saveArrayBuffer( result, 'scene.glb' );

            } else {

                const output = JSON.stringify( result, null, 2 );
                //console.log( output );
                saveString( output, 'scene.gltf' );

            }
            //drawObject.visible = true;

        },
        options
    );

}

function save( blob, filename ) {
    link.href = URL.createObjectURL( blob );
    link.download = filename;
    link.click();
}

function saveString( text, filename ) {
    save( new Blob( [ text ], { type: 'text/plain' } ), filename );
}