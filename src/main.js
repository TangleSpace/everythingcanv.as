
import * as THREE from './build/three.module.js';
import { GLTFLoader } from './scripts/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from './scripts/jsm/exporters/GLTFExporter.js';
import { OrbitControls } from './scripts/jsm/controls/OrbitControls2.js';
import { RoomEnvironment } from './scripts/jsm/environments/RoomEnvironment.js';
import { BrushHelper } from './BrushHelper.js';
import { Stroke } from './Stroke.js';
import { ActionHelper } from './ActionHelper.js';
import { Background } from './Background.js';
import { CustomMaterial } from './CustomMaterial.js';
import { TransformControls } from './scripts/jsm/controls/TransformControls.js';
//import { TWEEN } from './scripts/jsm/libs/tween.module.min.js';

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
    scales:[]
};
let canTogglStrokeSelect = true;
let hoverTimeout;
let strokeSelect = false;
let usingCustomDrawObject = false;
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
let btns={space:true};
let sceneMesh;
let shouldRotateAdditiveX = true;
let shouldRotateAdditiveY = true;
let shouldRotateAdditiveZ = true;
let globalAdditiveRotationSpeed = 0;
const geometry = new THREE.BoxGeometry( 5, 5, 5 );
const material = new THREE.MeshStandardMaterial();

let globalShouldAnimateSize = true;
const loadobjs = [
    //{name:"draw objects", url:"./extras/draw/",           amount:2},
    {loaded:false, name:"simple shapes", url:"./extras/models/simple-shapes/", amount:7},
    {loaded:false, name:"animals", url:"./extras/models/everything-animals/", amount:231},
    {loaded:false, name:"consumables", url:"./extras/models/everything-consumables/", amount:107},
    {loaded:false, name:"furnishings", url:"./extras/models/everything-furnishings/", amount:232},
    
    /*
    {loaded:false, name:"flowers", url:"./extras/models/flowers/", amount:19},
    {loaded:false, name:"rocks", url:"./extras/models/rocks/",   amount:6},
    {loaded:false, name:"tools", url:"./extras/models/tools/",   amount:90},
    {loaded:false, name:"toys", url:"./extras/models/toys/",    amount:79},
    */

    {loaded:false, name:"microscopic", url:"./extras/models/everything-microscopic/", amount:226},
    {loaded:false, name:"plants", url:"./extras/models/everything-plants/", amount:496},
    {loaded:false, name:"underwater", url:"./extras/models/everything-underwater/", amount:107},
    {loaded:false, name:"trees", url:"./extras/models/everything-trees/", amount:273},
    {loaded:false, name:"rocks", url:"./extras/models/everything-rocks/", amount:465},
    {loaded:false, name:"human", url:"./extras/models/everything-human/", amount:332},
    {loaded:false, name:"vehicles", url:"./extras/models/everything-vehicles/", amount:83},
    {loaded:false, name:"buildings", url:"./extras/models/everything-buildings/", amount:213},
    {loaded:false, name:"zeometry", url:"./extras/models/everything-geo/", amount:297},
    
]
let currDragImgSrc;
let drawObject;  
const toysAmount = 78;
const toolsAmount = 89;
const flowersAmount = 73;
let drawState = "object" 
let showingSideBar = true;
let movingCamera = false;

let meshScale = 1;
let penSense = 1;
let shouldDoPenPressure = true;
let currentDrawHitPoint;
let globalOffsetRotation = new THREE.Euler( 0, 0, 0, 'XYZ' );
let globalLerpAmount = 1;
let globalDensityAmount = .1;
let globalSmoothAmount = .1;
let globalNormalOffsetAmount = .05;
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

let currentDrawObjectIndex = 0;

let strokeHolder = new THREE.Object3D();
let reflectObjectX = new THREE.Object3D();
let reflectObjectY = new THREE.Object3D();
let reflectObjectZ = new THREE.Object3D();
let reflectObjectXY = new THREE.Object3D();
let reflectObjectXZ = new THREE.Object3D();
let background;
let matHandler;
let urlIndex = 0;
let modelIndex = 0;
const paintMeshes = [];
let strokeSelectStrokes = [];
let transformControls;
let movingTransformControls = false;
const actionHelper = new ActionHelper();
let currentSelectedStrokeIndex = -1;

function mobileCheck() {
    //console.log(navigator.userAgent.match())
    //return navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/iPhone|iPad|iPod/i) || navigator.userAgent.match(/Opera Mini/i) || navigator.userAgent.match(/IEMobile/i);
    //return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // This checks if the current device is in fact mobile
        return true;
    }
    return false;
    
    
};


const isMobile = mobileCheck();


const link = document.createElement( 'a' );
link.style.display = 'none';
document.body.appendChild( link );

init();

function init(){
    
    for(let i = 0; i<loadobjs.length; i++){
        const amt = loadobjs[i].amount; 
        const dHolder = document.createElement("div");
        const dTitle = document.createElement("div");
        const dImgs = document.createElement("div");
        
        document.getElementById("models").append(dHolder);
        dHolder.className="drop-down-holder";
        dTitle.className="drop-down-title";
        dImgs.className="drop-down-content";
        dTitle.innerHTML = loadobjs[i].name;
        dHolder.append(dTitle);
        dHolder.append(dImgs);

        $(dTitle).click(function(){
            if ( $( dImgs ).first().is( ":hidden" ) ) {
                const lo = loadobjs[i]; 
                if(!lo.loaded){
                    lo.loaded = true;
                    const a = lo.amount;
                    for(let k = 0; k<a; k++){
                        const url = lo.url;
                        let img = document.createElement("img");
                        img.className="brush-thumb";
                        
                        if(isMobile)
                            img.classList.add("mobile-brush-thumb");
                        
                        img.src = (url+k)+".png";
                        img.onclick = function(){chooseModel(i,k)};
                        img.onmousedown = function(e){currDragImgSrc = e.srcElement.currentSrc;};
                        //img.onmousedown = function(e){currDragImgSrc = e.srcElement.currentSrc;};
                        dImgs.append(img);
                    }
                }
                $( dImgs ).slideDown();
            } else {
                $( dImgs ).slideUp();
            }
        })
        

        if(i==0){
            $(dImgs).slideDown();
            loadobjs[i].loaded = true;
            for(let k = 0; k<amt; k++){
                const url = loadobjs[i].url;
                let img = document.createElement("img")
                img.className="brush-thumb";
                if(isMobile)
                    img.classList.add("mobile-brush-thumb");
                        
                img.src = (url+k)+".png";
                img.onclick = function(){chooseModel(i,k)};
                img.onmousedown = function(e){currDragImgSrc = e.srcElement.currentSrc;};
                dImgs.append(img);
            }
        }
    }
    
   
    chooseModel(0,0);

    const loader = new GLTFLoader().setPath("./extras/draw/" );
    loader.load( 0+'.glb', function ( gltf ) {
        gltf.scene.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.material.vertexColors = false;
                
            }
        });
        drawObject = gltf.scene;
        scene.add(gltf.scene)
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

    strokeHolder.name = "strokeHolder";
    reflectObjectX.name = "reflectObjectX";
    reflectObjectY.name = "reflectObjectY";
    reflectObjectZ.name = "reflectObjectZ";
    reflectObjectXY.name = "reflectObjectXY";
    reflectObjectXZ.name = "reflectObjectXZ";
    
    scene.add(strokeHolder)
    strokeHolder.add(
        reflectObjectX,
        reflectObjectY,
        reflectObjectZ,
        reflectObjectXY,
        reflectObjectXZ
    );
    // scene.add(reflectObjectY);
    // scene.add(reflectObjectZ);
    // scene.add(reflectObjectXY);
    // scene.add(reflectObjectXZ);
    
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
    
	renderer = new THREE.WebGLRenderer({antialias:true});
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
    controls.zoomSpeed = .2
    //controls.screenSpacePanning = false;

    controls.minDistance = .5;
    controls.maxDistance = 250;

    controls.enableRotate = false;
    controls.enablePan = false;
    //controls.screenSpacePanning = false;
    
    clock = new THREE.Clock();

    transformControls = new TransformControls( camera, canvas );
    transformControls.size = .75;
    
    transformControls.space = 'world';
    transformControls.addEventListener( 'mouseDown', () => {movingTransformControls = true; controls.enabled = false;});
    transformControls.addEventListener( 'mouseUp', () => {movingTransformControls = false; controls.enabled = true;} );
    scene.add( transformControls );

    // function killTransform(){
    //     transformControls.removeEventListener( 'mouseDown', () => orbitControls.enabled = false );
    //     transformControls.removeEventListener( 'mouseUp', () => orbitControls.enabled = true );
    // }



    for(let i = 0; i<10; i++){
        
        document.getElementById("draw-object-"+i).addEventListener("click", function(){
            
            if(i!=currentDrawObjectIndex){
                usingCustomDrawObject = false;
                currentDrawObjectIndex = i;
                replaceDrawObject("./extras/draw/"+i+".glb");
            }
            
        });

    }

    const dds = [
        "export",
        "draw-object",
        "essentials",
        "mirror",
        "rotation",
        "background",
        "shader-effects"
    ]

    for(let i = 0; i<dds.length; i++){
        const t = document.getElementById(dds[i]+"-title");

        t.addEventListener( "click", function(){

            const el = "#"+dds[i]+"-content";
            if ( $( el ).first().is( ":hidden" ) ) {
                $( el ).slideDown( );
            } else {
                $( el ).slideUp();
            }
            
        })
    }
    
    if(isMobile){

        //controls.enableZoom = false;
        document.getElementById("mobile-controls").style.display = "block";
        
        document.getElementById("mobile-rotate").addEventListener("pointerdown", mobileRotateDown)
        document.getElementById("mobile-rotate").addEventListener("pointerup", mobileRotateUp)
        document.getElementById("mobile-rotate").addEventListener('dragleave', mobileRotateUp);

        document.getElementById("mobile-pan").addEventListener("pointerdown", mobilePanDown)
        document.getElementById("mobile-pan").addEventListener("pointerup", mobilePanUp)
        document.getElementById("mobile-pan").addEventListener('dragleave', mobilePanUp);

        // document.getElementById("mobile-zoom").addEventListener("pointerdown", mobileZoomDown)
        // document.getElementById("mobile-zoom").addEventListener("pointerup", mobileZoomUp)

        document.getElementById("mobile-eye").addEventListener("pointerdown", mobileEyeDown)
        const arr = document.getElementsByClassName('mobile-icons');
        for(let i = 0; i<arr.length; i++){
            
            arr[i].setAttribute('draggable', false);
            arr[i].ondragstart = function() { return false; };

        }
        //$("#show-instructions").remove();   
        document.getElementById("tools-holder").classList.add("holders-mobile");
        document.getElementById("select").classList.add("holders-mobile");
         
        
    }

   
    window.addEventListener('focus', onFocus );
    window.addEventListener('blur', onBlur );

	window.addEventListener( 'resize', onWindowResize, false );
    
    window.addEventListener( 'keydown', onKeyDown, false );
    window.addEventListener( 'keyup', onKeyUp, false );
    
    //document.addEventListener( 'touchmove', onTouchMove, false );
    if(!isMobile){
	   document.addEventListener( 'pointermove', onMouseMove, false );
       canvas.addEventListener( 'pointerdown', onMouseDown, false );
    }else{
        document.addEventListener( 'touchmove', onMouseMove, false );
        canvas.addEventListener( 'touchstart', onMouseDown, false );
    }
    
    canvas.addEventListener( 'pointerup', onMouseUp, false );
    
    document.getElementById("reset-cam").addEventListener("click", resetCam);

    document.getElementById("show-instructions").addEventListener("click", toggleInstructions);
    
    document.getElementById("got-it-btn").addEventListener("click", toggleInstructions);
    document.getElementById("got-it-mobile-btn").addEventListener("click", toggleInstructions);
    
    document.getElementById("instructions-overlay").addEventListener("click", toggleInstructions);
    
    document.getElementById("save-geo-ink-file").addEventListener("click", saveGeoInkFile)
    document.getElementById("stroke-select-toggle").addEventListener("click", toggleStrokeSelect)
    
    document.getElementById("toggle-draw-on-view").addEventListener("click", updateDrawState);
    document.getElementById("toggle-draw-object").addEventListener("click", toggleDrawObject);
    document.getElementById("export-gltf").addEventListener("click", exportGLTF);
    document.getElementById("rotation-follows-normal").addEventListener("click", toggleRotationFollowingNormal);
    document.getElementById("mirror-x").addEventListener("click", toggleMirrorX);
    document.getElementById("mirror-y").addEventListener("click", toggleMirrorY);
    document.getElementById("loop-gradient").addEventListener("click", updateModelParams);
    document.getElementById("mirror-z").addEventListener("click", toggleMirrorZ);
    document.getElementById("undo").addEventListener("click", undoClick);
    document.getElementById("redo").addEventListener("click", redoClick);

    document.getElementById("animation-speed-slider").addEventListener("change", updateAniSpeed);
    //updateScaleOffset

    document.getElementById("stroke-scale-offset").addEventListener("change", updateScaleOffset);
    document.getElementById("stroke-scale-offset").addEventListener("input", updateScaleOffset);

    document.getElementById("stroke-rot-offset-x").addEventListener("change", updateRotOffsetX);
    document.getElementById("stroke-rot-offset-x").addEventListener("input", updateRotOffsetX);
    document.getElementById("stroke-rot-offset-y").addEventListener("change", updateRotOffsetY);
    document.getElementById("stroke-rot-offset-y").addEventListener("input", updateRotOffsetY);
    document.getElementById("stroke-rot-offset-z").addEventListener("change", updateRotOffsetZ);
    document.getElementById("stroke-rot-offset-z").addEventListener("input", updateRotOffsetZ);
    
    
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

    document.getElementById("background-gradient-size").addEventListener("input", updateBackgroundParms);
    document.getElementById("background-gradient-size").addEventListener("change", updateBackgroundParms);

    document.getElementById("background-gradient-offset").addEventListener("input", updateBackgroundParms);
    document.getElementById("background-gradient-offset").addEventListener("change", updateBackgroundParms);

    document.getElementById("background-color-top").addEventListener("input", updateBackgroundParms);
    document.getElementById("background-color-top").addEventListener("change", updateBackgroundParms);

    document.getElementById("background-color-bottom").addEventListener("input", updateBackgroundParms);
    document.getElementById("background-color-bottom").addEventListener("change", updateBackgroundParms);

    document.getElementById("rainbow-tint-amount").addEventListener("input", updateModelParams);
    document.getElementById("rainbow-tint-amount").addEventListener("change", updateModelParams);

    document.getElementById("rainbow-size").addEventListener("input", updateModelParams);
    document.getElementById("rainbow-size").addEventListener("change", updateModelParams);

    document.getElementById("model-gradient-size").addEventListener("input", updateModelParams);
    document.getElementById("model-gradient-size").addEventListener("change", updateModelParams);

    document.getElementById("model-gradient-offset").addEventListener("input", updateModelParams);
    document.getElementById("model-gradient-offset").addEventListener("change", updateModelParams);

    document.getElementById("model-color-top").addEventListener("input", updateModelParams);
    document.getElementById("model-color-top").addEventListener("change", updateModelParams);

    document.getElementById("model-color-bottom").addEventListener("input", updateModelParams);
    document.getElementById("model-color-bottom").addEventListener("change", updateModelParams);

    document.getElementById("noise-deform").addEventListener("input", updateModelParams);
    document.getElementById("noise-deform").addEventListener("change", updateModelParams);

    document.getElementById("noise-size").addEventListener("input", updateModelParams);
    document.getElementById("noise-size").addEventListener("change", updateModelParams);

    document.getElementById("twist-deform").addEventListener("input", updateModelParams);
    document.getElementById("twist-deform").addEventListener("change", updateModelParams);

    document.getElementById("twist-size").addEventListener("input", updateModelParams);
    document.getElementById("twist-size").addEventListener("change", updateModelParams);

    document.getElementById("deform-speed").addEventListener("input", updateModelParams);
    document.getElementById("deform-speed").addEventListener("change", updateModelParams);

    document.getElementById("color-speed").addEventListener("input", updateModelParams);
    document.getElementById("color-speed").addEventListener("change", updateModelParams);
    
    document.getElementById("stroke-index-input").addEventListener("input", updateSelectedStroke)
    
    canvas.addEventListener( 'dragover', onDocumentDragOver, false );
    canvas.addEventListener( 'dragleave', onDocumentLeave, false );
    canvas.addEventListener( 'drop', onDocumentDrop, false );

    helper = new BrushHelper({scene:scene, raycaster:raycaster});
    background = new Background({scene:scene});
    matHandler = new CustomMaterial();
	animate();
}



function mobileEyeDown(e){
    toggleUI();
}

function mobileRotateDown(e){
    e.preventDefault();
    if(controls)controls.enableRotate = true;
}
function mobileRotateUp(e){
    e.preventDefault();
    if(controls)controls.enableRotate = false;
}
function mobilePanDown(e){
    e.preventDefault();
    console.log(controls.enablePan)
    if(controls)controls.enablePan = true;
}
function mobilePanUp(e){
    e.preventDefault();
    if(controls)controls.enablePan = false;
}
// function mobileZoomDown(e){
//     e.preventDefault();
//     if(controls)
//         controls.enableZoom = true;
// }
// function mobileZoomUp(e){
//     e.preventDefault();
//     if(controls)
//         controls.enableZoom = false;
// }

function toggleStrokeSelect(){
    strokeSelect = !strokeSelect;   
    const val = strokeSelect ? "draw mode":"stroke select";
    $("#stroke-select-toggle").html(val);
    helper.holder.visible = !strokeSelect;
    
    if(strokeSelect){
        $("#stroke-select-options").slideDown();
        $("#draw-mode-options").slideUp();
    }else{
        currentSelectedStrokeIndex = -1;
        transformControls.detach();
        $("#draw-mode-options").slideDown();
        $("#stroke-select-options").slideUp();
    }
    
    for(let i = 0; i<meshObjects.length; i++){
        meshObjects[i].unHover();
    }
    
}

function updateSelectedStroke(){
    
    let val = $("#stroke-index-input").val();
    
    clearTimeout(hoverTimeout);

    if(strokeSelectStrokes.length>0){
        unHoverStrokes();
    }

    strokeSelectStrokes = [];

    if(val!="" && val!=null){
        if(val > actionHelper.currStrokeIndex-1)val = actionHelper.currStrokeIndex-1;
        if(val<0)val=0
        $("#stroke-index-input").val(val);

        for(let i = 0; i<meshObjects.length; i++){
            if(meshObjects[i].strokeIndex == val){
                strokeSelectStrokes.push(meshObjects[i]);
            }
        }

        hoverStrokes();
        hoverTimeout = setTimeout( function(){
            unHoverStrokes();
        },300)
    }

}


function hoverStrokes(){
    for(let i = 0; i < strokeSelectStrokes.length;i++){
        strokeSelectStrokes[i].hover();
    }
}

function unHoverStrokes(){
    for(let i = 0; i < strokeSelectStrokes.length;i++){
        strokeSelectStrokes[i].unHover();
    }
}

function updateBackgroundParms(){

    const top = $("#background-color-top").val();
    const bottom = $("#background-color-bottom").val();
    const size = $("#background-gradient-size").val()*.01;
    const offset = $("#background-gradient-offset").val();
    
    background.update({top:new THREE.Color(top), bottom:new THREE.Color(bottom), size:size, offset:offset})
}

function updateModelParams(){
    
    const param = getMatParam();
    
    if(strokeSelect){
    
        for(let i = 0;i <strokeSelectStrokes.length; i++){
            strokeSelectStrokes[i].updateParam(param)
        }
        if(strokeSelectStrokes.length > 0){
            actionHelper.updateMatParam(currentSelectedStrokeIndex, param);
        }

    }//else{

        helper.holder.traverse( function ( child ) {
            if ( child.isMesh ) {
                if(child.material.userData.shader!=null){
                    child.material.userData.shader.uniforms.twistAmt.value = param.twistAmt;
                    child.material.userData.shader.uniforms.noiseSize.value = param.noiseSize;
                    child.material.userData.shader.uniforms.twistSize.value = param.twistSize;
                    child.material.userData.shader.uniforms.noiseAmt.value = param.noiseAmt;
                    child.material.userData.shader.uniforms.rainbowAmt.value = param.rainbowAmt;
                    child.material.userData.shader.uniforms.gradientSize.value = param.gradientSize;
                    child.material.userData.shader.uniforms.rainbowGradientSize.value = param.rainbowGradientSize;
                    child.material.userData.shader.uniforms.gradientOffset.value = param.gradientOffset;
                    child.material.userData.shader.uniforms.topColor.value = param.topColor;
                    child.material.userData.shader.uniforms.bottomColor.value = param.bottomColor;
                    child.material.userData.shader.uniforms.deformSpeed.value = param.deformSpeed;
                    child.material.userData.shader.uniforms.colorSpeed.value = param.colorSpeed;
                    child.material.userData.shader.uniforms.shouldLoopGradient.value = param.shouldLoopGradient;
                }
    
            }
    
        });

        // const ind = actionHelper.currStrokeIndex-1;
        // for(let i = 0; i<meshObjects.length; i++){
        //     if(meshObjects[i].strokeIndex == ind){
        //         meshObjects[i].updateParam( param ) ;            
        //     }
        // }
        // actionHelper.updateMatParam(ind, param);

    
    //}
        

} 
    


function animate(){

	requestAnimationFrame( animate );
    //TWEEN.update();
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
            mouse.scales.push( meshScale*penSense );
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
            rotationFollowsNormal:rotationFollowsNormal,
            drawing: mouse.down && currentDrawHitPoint,
            penSense:penSense
        });
    }
    
    bgHolder.position.copy(camera.position);
    bgHolder.rotation.copy(camera.rotation);


    const selectMult = strokeSelect?0:1;
    const d = clock.getDelta();
    const delta = d*globalAnimationSpeed*selectMult ;
    for(var i = 0; i<meshObjects.length; i++){
        meshObjects[i].update({delta:delta});
    }
    matHandler.update({delta:d*globalAnimationSpeed})
    //composer.render();
    renderer.render(scene,camera);
	
}

function getMatParam(){
    
    const loop = $("#loop-gradient:checked").val() ? 1. : 0.0;
    
    return { 
        twistAmt:$("#twist-deform").val()*.03,
        noiseSize:$("#noise-size").val()*.04,
        twistSize:$("#twist-size").val()*.04,
        noiseAmt:$("#noise-deform").val()*.01,
        rainbowAmt:$("#rainbow-tint-amount").val()*.01,
        gradientSize:.1+$("#model-gradient-size").val()*.09,
        rainbowGradientSize:$("#rainbow-size").val()*.08,
        gradientOffset:+$("#model-gradient-offset").val()*.3,
        topColor:new THREE.Color( $("#model-color-top").val() ),
        bottomColor:new THREE.Color( $("#model-color-bottom").val() ),
        deformSpeed:$("#deform-speed").val()*.03,
        colorSpeed:$("#color-speed").val()*.03,
        shouldLoopGradient: loop
    }
}

function chooseModel(i,k, customParams, callback){
    urlIndex = i;
    modelIndex = k;
    const ui = urlIndex;
    const mi = modelIndex;
    
    const loader = new GLTFLoader().setPath( loadobjs[i].url );
    loader.load( k+'.glb', function ( gltf ) {

        const param = customParams == null ? getMatParam() : customParams;

        gltf.scene.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.material = matHandler.getCustomMaterial(child.material, param);
            }
        });

        if(checkShouldAddToPaintMeshes()){
            paintMeshes.push({urlIndex:ui, modelIndex:mi, model:gltf.scene.clone()});
        }

        if(!strokeSelect){
            helper.updateVisual({mesh:gltf.scene});
        }else{

            const modelInfo = { modelIndex : mi, urlIndex : ui};
            
            for(let i = 0; i<strokeSelectStrokes.length; i++){
                strokeSelectStrokes[i].updateModel( { mesh:gltf.scene, modelInfo : modelInfo } );
            }
            if(strokeSelectStrokes.length > 0){
                actionHelper.updateModelInfo(currentSelectedStrokeIndex, modelInfo);
            }
        }

        if(callback !=null ){
            callback(gltf.scene);
        }

    });
}

function checkShouldAddToPaintMeshes(){
    for(let i = 0; i<paintMeshes.length; i++){
        if(urlIndex == paintMeshes[i].urlIndex && modelIndex == paintMeshes[i].modelIndex)
            return false;
    }
    return true;
}

function getModelByIndex(ui,mi){
    for(let i = 0; i<paintMeshes.length; i++){
        // console.log("ui = "+ui)
        // console.log("mi = "+mi)
        // console.log("model = ")
        // console.log(paintMeshes[i].model)
        // console.log("pmesh url index "+paintMeshes[i].urlIndex);
        // console.log("pmesh model index "+paintMeshes[i].modelIndex);
        if(ui == paintMeshes[i].urlIndex && mi == paintMeshes[i].modelIndex){
           // console.log("return")
            return paintMeshes[i].model;
        }
    }
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
    
    if(e.keyCode == 18){//alt
        if(controls){
            controls.enableRotate = true;
        }
    }
    if(e.keyCode == 17){//ctrl
        if(controls){
            controls.enablePan = true;
        }
    }
    if(e.keyCode==16){//shift
        if(canTogglStrokeSelect){
            toggleStrokeSelect();
            canTogglStrokeSelect = false;
        }
        
    }


    if(e.keyCode == 90){
        if(controls.enablePan){
            undoClick();
        }
    }
    if(e.keyCode==89){
        if(controls.enablePan){
            redoClick();
        }
    }

    if(strokeSelect && strokeSelectStrokes.length > 0){
        switch(e.keyCode){
            case 87: // W
                transformControls.setMode( 'translate' );
                break;
            case 69: // E
                transformControls.setMode( 'rotate' );
                break;
            case 82: // R
                transformControls.setMode( 'scale' );
                break;
        }
    }
}


function onKeyUp(e) {
    
    e.preventDefault();
    if(e.keyCode==16){//shift
        //if(canTogglStrokeSelect){
            canTogglStrokeSelect = true;
        //}
        // strokeSelect = false;
        // helper.holder.visible = true;
        // for(let i = 0; i<meshObjects.length; i++){
        //     meshObjects[i].unHover();
        // }
    }

    if(e.keyCode == 18){
        if(controls){
            controls.enableRotate = false;
        }
    } 
    if(e.keyCode == 17){
        if(controls){
            controls.enablePan = false;
        }
    }
    if(e.keyCode==32){

        toggleUI();

    }
}

function toggleUI(){
    btns.space = !btns.space;
    $(".holders").css( "display", btns.space ? "block" :"none" );
    if(mirrorX){
        mirrorMeshX.visible = btns.space; 
    }
    if(mirrorY){
        mirrorMeshY.visible = btns.space; 
    }
    if(mirrorZ){
        mirrorMeshZ.visible = btns.space; 
    }
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0,0,canvas.width, canvas.height);
    //composer.setSize( window.innerWidth, window.innerHeight );

}


function onMouseUp(e){
	
    if(e.button==0){
        
        mouse.down = false;
    	holding = false;
    	
        mouseConstraint = null;
        mouse.previous = new THREE.Vector2();
        ot = false;
        
        if(!movingCamera){
            buildGeo();
            helper.copyMaterial({  param:getMatParam(), matHandler:matHandler });
          
        }

        movingCamera = false;
        
        ctx.clearRect(0,0,canvas.width,canvas.height);
        
        mouse.rots = [];
        mouse.scales = [];
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



function strokeSelectHelper(down){

    raycaster.setFromCamera( mouse.normal, camera );
  
    const intersects = raycaster.intersectObjects( strokeHolder.children );
    // Toggle rotation bool for meshes that we clicked
    if ( intersects.length > 0 ) {
        if(!movingTransformControls)document.body.style.cursor = "pointer";
        
        let ind = intersects[ 0 ].object.paintIndex;
        
        // if(ind==null)
        //     ind = getFirstObjectWithPaintIndex(intersects[ 0 ]);
        
        if(down && !movingTransformControls){
            
            if(ind != currentSelectedStrokeIndex){

                strokeSelectStrokes = [];
                currentSelectedStrokeIndex = ind;
                
                $("#stroke-index-input").val(currentSelectedStrokeIndex)

                for(let i = 0; i<meshObjects.length; i++){
                    
                    if(meshObjects[i].strokeIndex == ind){
                        if(meshObjects[i].scene.name == "strokeHolder"){//if it's not the mirrored stroke
                            transformControls.attach( meshObjects[i].scn );
                        }
                        strokeSelectStrokes.push( meshObjects[i] );
                        updateStrokeSelectSlidersFromObject(meshObjects[i])


                    }

                }
            }

        }
        for(let i = 0; i<meshObjects.length; i++){
            meshObjects[i].unHover();
        }
        for(let i = 0; i<meshObjects.length; i++){
            if(meshObjects[i].strokeIndex == ind && !movingTransformControls && ind != currentSelectedStrokeIndex){
                meshObjects[i].hover();
            }    
        }
        
    }else{
        
        // if(down && !){
        //     strokeSelectStrokes = [];
        // }

        for(let i = 0; i<meshObjects.length; i++){
            meshObjects[i].unHover();
        }
        document.body.style.cursor = "auto";

    }
}

function updateStrokeSelectSlidersFromObject(obj){
    /*
    this.sclMult = OBJ.all.sclMult;
    this.rotOffsetX = OBJ.all.rotOffsetX;
    this.rotOffsetY = OBJ.all.rotOffsetY;
    this.rotOffsetZ = OBJ.all.rotOffsetZ;
    this.param
    */
    //console.log(obj);
    $("#stroke-scale-offset").val(obj.sclMult/.01);
    
    $("#stroke-rot-offset-x").val(obj.rotOffsetX*57.296);
    $("#stroke-rot-offset-y").val(obj.rotOffsetY*57.296);
    $("#stroke-rot-offset-z").val(obj.rotOffsetZ*57.296);
    
    const loop = obj.param.shouldLoopGradient == 1 ? true : false;
    
    $("#twist-deform").val(obj.param.twistAmt/.03);
    $("#noise-size").val(obj.param.noiseSize/.04); 
    $("#twist-size").val(obj.param.twistSize/.04);
    $("#noise-deform").val(obj.param.noiseAmt/.01);
    $("#rainbow-tint-amount").val(obj.param.rainbowAmt/.01);
    $("#model-gradient-size").val(obj.param.gradientSize/.09);
    $("#rainbow-size").val(obj.param.rainbowGradientSize/.08);
    $("#model-gradient-offset").val(obj.param.gradientOffset/.3);
    $("#model-color-top").val("#"+obj.param.topColor.getHexString());
    $("#model-color-bottom").val("#"+obj.param.bottomColor.getHexString())
    $("#deform-speed").val(obj.param.deformSpeed/.03);
    $("#color-speed").val(obj.param.colorSpeed/.03);
    $("#loop-gradient").prop( "checked", loop );

}

function getFirstObjectWithPaintIndex(arr){
    for(let i = 0;i <arr.length; i++){
        if(arr[i].object.paintIndex!=null){
            return arr[i];
        }
    }
}

//function getMeshesFrom



function onMouseDown(e){
    
    if(e.touches != null){//if not mobile just set mouse.nomral in mouse move event  
        var touch = e.touches[0];
        const x = touch.pageX;
        const y = touch.pageY;
        mouse.normal.x =    ( x / window.innerWidth ) * 2 - 1;
        mouse.normal.y =  - ( y / window.innerHeight ) * 2 + 1;
    }

    if(strokeSelect){
        strokeSelectHelper(true);
        return;
    }

    strokeSelectStrokes = [];

    if(controls){

        let mobileTwoFingerCheck = false;
        
        if ( e.touches!=null ) {
            if(e.touches.length > 1)
                mobileTwoFingerCheck = true;
        }
        
        if(controls.enableRotate || controls.enablePan || mobileTwoFingerCheck){
            movingCamera = true;
            return;
        }
    }

    let canDraw = false;
    if(e.button!=null){
        if(e.button==0)
            canDraw = true;
    }
    if(e.touches != null){
        if(e.touches.length == 1)
            canDraw = true;
    }


    if(canDraw ){
            
        if(e.pointerType == "pen" && shouldDoPenPressure){
            penSense = e.pressure;
        }else{
            penSense = 1;
        } 

        mouse.down = true;

    }
    
}


function onMouseMove(e){

    //window.focus();
    if(e.touches==null){
        if(strokeSelect){
            strokeSelectHelper(false);
            //return;
        }
    }

    let x = 0;
    let y = 0;

    if(e.touches!=null){
        var touch = e.touches[0];
        x = touch.pageX;
        y = touch.pageY;
    }else{
        x = e.clientX;
        y = e.clientY;
    }
    
    mouse.position.x =  x;
	mouse.position.y =  y;

	mouse.normal.x =    ( x / window.innerWidth ) * 2 - 1;
	mouse.normal.y =  - ( y / window.innerHeight ) * 2 + 1;
    
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
    ///console.log(movingTransformControls)
    if(strokeSelect && movingTransformControls){//update mirrored local transform when moving control
        
        const t = getSelectedStrokePosition();
        
        for(let i = 0;i <strokeSelectStrokes.length; i++){
            if(strokeSelectStrokes[i].scene.name != "strokeHolder"){
                strokeSelectStrokes[i].scn.position.copy(t.pos);//(param)    
                strokeSelectStrokes[i].scn.rotation.copy(t.rot);
                strokeSelectStrokes[i].scn.scale.copy(t.scl);
            }
        }
        
        if(strokeSelectStrokes.length > 0){
            actionHelper.updateTransform(currentSelectedStrokeIndex, {pos:t.sub, rot:t.rot, scl:t.scl});
        }
    }
    
    if ( e.touches != null ) {
        if(e.touches.length > 1)
            return;
    }

    if(mouse.down){
        
        if(mouse.previous.x != 0 || mouse.previous.y != 0){
            handleDrawGeo();
            if(e.pointerType  == "pen" && shouldDoPenPressure){
                penSense = e.pressure;
            }else{
                penSense = 1;
            }
        }
        
    }
    
    mouse.previous = x;
    mouse.previous = y;
   
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

function getSelectedStrokePosition(){
    for(let i = 0;i <strokeSelectStrokes.length; i++){
        if(strokeSelectStrokes[i].scene.name == "strokeHolder"){
            return {
                pos:strokeSelectStrokes[i].scn.position, 
                rot:strokeSelectStrokes[i].scn.rotation, 
                scl:strokeSelectStrokes[i].scn.scale,
                sub:new THREE.Vector3().subVectors(strokeSelectStrokes[i].scn.position, strokeSelectStrokes[i].avgPos)
            };
        }
    }

}


function toggleInstructions(){
  
    if ( $( "#instructions-overlay" ).is( ":hidden" ) ) {
        $( "#instructions-overlay" ).fadeIn( );
        if(!isMobile){
            $( "#instructions-holder" ).fadeIn( );
        }else{
            $( "#instructions-holder-mobile" ).fadeIn( );
        }
    } else {
        $( "#instructions-overlay" ).fadeOut();
    }
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


function buildGeo(){

    //meshObjects.push(new MeshObject());
    const strokeFinal = [];
    
    if(mouse.smoothAvgs.length>0 ){
        actionHelper.startNewPath();//if you undo remove items in the undo array after the currStrokeIndex
        
        //const meshClone = helper.holder.clone();
        const meshClone = helper.holder;//.clone();

        const all = {
            modelInfo:{modelIndex:modelIndex,urlIndex:urlIndex}, 
            meshClone:meshClone, 
            index:actionHelper.currStrokeIndex, 
            scene:strokeHolder, 
            globalDensityAmount:globalDensityAmount, 
            meshScale:meshScale,
            globalShouldAnimateSize:globalShouldAnimateSize,
            param:getMatParam(),
            sclMult:1,
            rotOffsetX:0,
            rotOffsetY:0,
            rotOffsetZ:0,
            transformOffset:{pos:new THREE.Vector3(), rot:new THREE.Euler(), scl:new THREE.Vector3(1,1,1)}
        }
        
        meshObjects.push(new Stroke( {scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, all:all } ));
        strokeFinal.push({scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, index:actionHelper.currStrokeIndex, all:all, scene:all.scene});
        if(mirrorX){
            all.scene = reflectObjectX;
            meshObjects.push(new Stroke( {scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, all:all} ));
            strokeFinal.push({scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, index:actionHelper.currStrokeIndex, all:all, scene:all.scene});
        }

        if(mirrorY){
            all.scene = reflectObjectY;  
            meshObjects.push(new Stroke( {scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, all:all} ));
            strokeFinal.push({scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, index:actionHelper.currStrokeIndex, all:all, scene:all.scene});
            if(mirrorX){
                all.scene = reflectObjectXY;
                meshObjects.push(new Stroke( {scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, all:all} ));
                strokeFinal.push({scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, index:actionHelper.currStrokeIndex, all:all, scene:all.scene});
            }
        }

        if(mirrorZ){
            all.scene = reflectObjectZ;
            meshObjects.push(new Stroke( {scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, all:all} ));
            strokeFinal.push({scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, index:actionHelper.currStrokeIndex, all:all, scene:all.scene});
            if(mirrorX){
                all.scene = reflectObjectXZ;
                meshObjects.push(new Stroke( {scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, all:all} ));
                strokeFinal.push({scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, index:actionHelper.currStrokeIndex, all:all, scene:all.scene});
            }
        }

        actionHelper.addStrokesArray({array:strokeFinal});

    }

}


function onFocus(){
     if(controls){
        controls.enableRotate=false;
        controls.enablePan = false;
    }
}
function onBlur(){
    if(controls){
        controls.enableRotate=false;
        controls.enablePan = false;
    }
}

function saveGeoInkFile(){
    const arr = [];
    for(let i = 0;i< meshObjects.length; i++){
        if(meshObjects[i].strokeIndex < actionHelper.currStrokeIndex){//make sure you don't export undo  meshes
            arr.push(meshObjects[i].getExportData());
        }
    }

    let drawObj = 0;
    if(!usingCustomDrawObject){
        drawObj = currentDrawObjectIndex;
    }
    download( {strokes:arr, background: background.getExportData(), drawObj:drawObj});
}


function download (geoink){
  const hash = "geo-ink-file";
  const blob = createBlobFromData({
    geoink,
  });
  const fileUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${hash}`;
  link.href = fileUrl;
  link.click();
};

function createBlobFromData (data) {
  const json = JSON.stringify(data);
  const blob = new Blob([json], { type: 'text/plain' });
  return blob;
};


function undoClick(){
    if(actionHelper.currStrokeIndex > 0){
        
        transformControls.detach();
        strokeSelectStrokes = [];
        currentSelectedStrokeIndex = -1;

        const arr = [];
        for(let i = 0; i<meshObjects.length; i++){
            if(meshObjects[i].strokeIndex == actionHelper.currStrokeIndex - 1){
                meshObjects[i].killStroke();
                arr.push(i);
            }   
        }

        for(let k = 0; k<arr.length; k++){
            meshObjects.splice(arr[k], 1);
        }
        actionHelper.undo();
    }
}

function redoClick(){
    
    if(actionHelper.currStrokeIndex < actionHelper.actionsArr.length){
        
        const ind = actionHelper.currStrokeIndex;

        const mi = actionHelper.actionsArr[ind][0].all.modelInfo.modelIndex;
        const ui = actionHelper.actionsArr[ind][0].all.modelInfo.urlIndex;
        console.log("model = "+mi)
        console.log("ui = "+ui)
        const model = getModelByIndex(ui, mi);
      
        for(let i = 0; i<actionHelper.actionsArr[ind].length; i++){
            
            const pos = actionHelper.actionsArr[ind][i].pos;
            const rots = actionHelper.actionsArr[ind][i].rots; 
            const scl = actionHelper.actionsArr[ind][i].scl; 
            const all = actionHelper.actionsArr[ind][i].all;
            
            all.scene = actionHelper.actionsArr[ind][i].scene;
            
            all.meshClone = model;       
            //console.log(all.meshClone)     
            all.meshClone.traverse(function(child){
                if(child.isMesh){
                    let copy = child.material.clone();
                    copy = matHandler.getCustomMaterial(copy, all.param);
                    child.material = copy;
                }
            });

            meshObjects.push( new Stroke( {scl:scl, pos:pos, rots:rots, all:all} ) );

        }   
    
        actionHelper.redo();

    }
    
}

function updateDrawState(){
    if(drawObject){
        if(drawState == "object"){
            drawObject.visible = false;
            //showingDrawObject = false;
            bgMesh.visible = true;
            drawState = "view";
            document.getElementById("toggle-draw-on-view").innerHTML = "draw on object";
        }else{
            //drawObject.material.visible = true;
            drawObject.visible = true;
            drawState = "object";
            bgMesh.visible = false;
            document.getElementById("toggle-draw-on-view").innerHTML = "draw on view";

        }
    }
}

// function killIntroScene(){
//     document.getElementById("instructions-overlay").style.display = "none";
// }

function updateRotOffsetX(){
    const rx = $("#stroke-rot-offset-x").val() * Math.PI/180;
    for(let i = 0; i<strokeSelectStrokes.length; i++){
        strokeSelectStrokes[i].updateRotX( rx );
    }
    if(strokeSelectStrokes.length > 0){
        actionHelper.updateRotOffsetX(currentSelectedStrokeIndex, rx)
    }
}
function updateRotOffsetY(){
    const ry = $("#stroke-rot-offset-y").val() * Math.PI/180;
    for(let i = 0; i<strokeSelectStrokes.length; i++){
        strokeSelectStrokes[i].updateRotY( ry );
    }
    if(strokeSelectStrokes.length > 0){
        actionHelper.updateRotOffsetY(currentSelectedStrokeIndex, ry)
    }
}
function updateRotOffsetZ(){
    const rz = $("#stroke-rot-offset-z").val() * Math.PI/180;
    for(let i = 0; i<strokeSelectStrokes.length; i++){
        strokeSelectStrokes[i].updateRotZ( rz );
    }
    if(strokeSelectStrokes.length > 0){
        actionHelper.updateRotOffsetZ(currentSelectedStrokeIndex, rz)
    }
}

function updateScaleOffset(){
    const s = $("#stroke-scale-offset").val()*.01;
    for(let i = 0; i<strokeSelectStrokes.length; i++){
        strokeSelectStrokes[i].updateScale( {scale:s} );
    }
    if(strokeSelectStrokes.length > 0){
        actionHelper.updateScaleOffset(currentSelectedStrokeIndex, s)
    }
}

function updateMeshSize(){
    handleUiUpdating();
    const s = $("#size-slider").val()*.08;
    meshScale = s;
   
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
    if(globalNormalOffsetAmount<0){
        if(drawObject.isMesh){
            drawObject.material.opacity = .2;
            drawObject.material.transparent  = true;
            drawObject.material.blending = THREE.AdditiveBlending
            drawObject.material.depthWrite = false;
            drawObject.material.needsUpdate = true;
        }else{
            drawObject.traverse(function(obj){
                if(obj.isMesh){
                    obj.material.opacity = .2;
                    obj.material.transparent  = true;
                    obj.material.blending = THREE.AdditiveBlending
                    obj.material.depthWrite = false;
                    obj.material.needsUpdate = true;

                }
            })
        }
        
    }else{

        if(drawObject.isMesh){
            drawObject.material.transparent = false;
            drawObject.material.opacity = 1;
            drawObject.material.blending = THREE.NormalBlending;
            drawObject.material.depthWrite = true;
            drawObject.material.needsUpdate = true;
        }else{
            drawObject.traverse(function(obj){
                if(obj.isMesh){
                    obj.material.transparent = false;
                    obj.material.opacity = 1;
                    obj.material.blending = THREE.NormalBlending;
                    obj.material.depthWrite = true;
                    obj.material.needsUpdate = true;
                }
            })
        }
       
    }

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
    
    for(let i = 0; i<meshObjects.length; i++){
        for(let k = 0; k<meshObjects[i].meshes.length; k++){
            anis.push( meshObjects[i].meshes[k].mesh.animations[0] )
        }
    }
   
    const gltfExporter = new GLTFExporter();

    const options = {
        trs: true,
        onlyVisible: true,
        binary: true,
        maxTextureSize: 2048,
        animations:anis
    };

    gltfExporter.parse(
        strokeHolder,
        function ( result ) {

            if ( result instanceof ArrayBuffer ) {

                saveArrayBuffer( result, 'scene.glb' );

            } else {

                const output = JSON.stringify( result, null, 2 );
                saveString( output, 'scene.gltf' );

            }

        },
        function ( error ) {

            console.log( 'An error happened during parsing', error );

        },
        options
    );

}

function save( blob, filename ) {
    link.href = URL.createObjectURL( blob );
    link.download = filename;
    link.click();
}


function saveArrayBuffer( buffer, filename ) {
    save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
}
function saveString( text, filename ) {
    save( new Blob( [ text ], { type: 'text/plain' } ), filename );
}

function onDocumentDragOver( event ) {
    event.preventDefault();
}

function onDocumentLeave( event ) {
    event.preventDefault();
}


function replaceDrawObject(src,scl){
    
    let s = scl!=null ? scl : 1;
    
    const loader = new GLTFLoader();
    loader.load( src, function ( gltf ) {
        killObject(drawObject);
        
        currentDrawObjectIndex = 100000;
        
        gltf.scene.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.material.vertexColors = false;
               // drawObject = child;
               // scene.add(drawObject);
            }
        });
        gltf.scene.scale.set(s,s,s);
        scene.add(gltf.scene)
        drawObject = gltf.scene;
    });
}

function imgPlaneDrawObject(src){
    killObject(drawObject);
    //const tex = new THREE.Texture()
    const tex = new THREE.TextureLoader().load( src, function(){
        
        currentDrawObjectIndex = 100000;
        
        const w = tex.image.width;
        const h = tex.image.height;
        
        let aspect = (h > w) ? w / h : h / w;  
        let wF = (h > w) ?  1 * aspect : 1;  
        let hF = (w > h) ?  1 * aspect : 1;

        const mat = new THREE.MeshBasicMaterial({map:tex})
        const geo = new THREE.PlaneGeometry(wF*7,hF*7,1,1);
        const plane = new THREE.Mesh(geo,mat);
        const obj = new THREE.Object3D();
        obj.add(plane);
        scene.add(obj);
        drawObject = obj;
        
    } );
    
}


function onDocumentDrop( event ) {

    event.preventDefault();
    
    console.log(event.dataTransfer)
    const file = event.dataTransfer.files[ 0 ];
    //event.origin
    if(file != null){
        const ext = file.name.substr(file.name.length - 3).toLowerCase();
        //console.log(file.name);
        if( ext == "glb" || ext == "ltf" ){
            const reader = new FileReader();
            reader.onload = function ( event ) {
                usingCustomDrawObject = true;
                replaceDrawObject(event.target.result);
            };
            reader.readAsDataURL( file );
        }else if(ext=="peg" || ext=="jpg" || ext=="png" ){
            
            var imageUrl = event.dataTransfer.getData('text/html');
            if(imageUrl!=null){

                const url = $(imageUrl).attr("src");
                if(url!=null){
                    const split = url.split("/");
                    const fileName = split[split.length-1].substr(0,split[split.length-1].length-3)+"glb";
                    const modelUrl = "./extras/models/"+split[split.length-2]+"/"+fileName;
                    usingCustomDrawObject = true;
                    replaceDrawObject(modelUrl, 10);
                    currDragImgSrc = null;
                }
                
            }else{
                
                const reader = new FileReader();
                reader.onload = function ( event ) {
                    usingCustomDrawObject = true;
                    imgPlaneDrawObject(event.target.result);
                    //replaceDrawObject(event.target.result);
                };
                reader.readAsDataURL( file );

            }
        
        }else if(ext == "txt"){
            
            if(strokeSelect){
                toggleStrokeSelect();
            }

            const reader = new FileReader();
            reader.onload = function ( event ) {

                readTextFile( event.target.result,  function(text){
                    //const urlFinal = "final-json-info.json"
                    //{ obj:JSON.parse(text), hash:hash }
                    const obj = JSON.parse(text);

                    const bg = obj.geoink.background;
                    bg.top = new THREE.Color("#"+bg.top);
                    bg.bottom = new THREE.Color("#"+bg.bottom);
                    background.update(bg);
                    
                    if(obj.geoink.drawObj!=currentDrawObjectIndex){
                        replaceDrawObject("./extras/draw/"+obj.geoink.drawObj+".glb");
                    }

                    const strokes = obj.geoink.strokes;
                    const addedStrokeArray = [];
                    //while(i < strokes.length ){
                    for(let i = 0; i<strokes.length; i++){

                        const a = strokes[i].all; 
                        
                        const mi = a.modelInfo.modelIndex;
                        const ui = a.modelInfo.urlIndex;
                        const p =  a.param;
                        const param = {
                            twistAmt:p.twistAmt,
                            noiseSize:p.noiseSize,
                            twistSize:p.twistSize,
                            noiseAmt:p.noiseAmt,
                            rainbowAmt:p.rainbowAmt,
                            gradientSize:p.gradientSize,
                            rainbowGradientSize:p.rainbowGradientSize,
                            gradientOffset:p.gradientOffset,
                            topColor:new THREE.Color("#"+p.topColor),
                            bottomColor:new THREE.Color("#"+p.bottomColor),
                            deformSpeed:p.deformSpeed,
                            colorSpeed:p.colorSpeed,
                            shouldLoopGradient:p.shouldLoopGradient
                        }

                        const rots = [];
                        const pos = [];
                        const scls = [];
                        
                        for(let k = 0; k<strokes[i].rots.length; k++){
                            
                            const r = strokes[i].rots[k];
                            const p = strokes[i].pos[k];
                            const s = strokes[i].scales == null ? a.meshScale : strokes[i].scales[k];
                            
                            rots.push(new THREE.Quaternion(r._x, r._y, r._z, r._w))
                            pos.push(new THREE.Vector3(p.x, p.y, p.z));
                            scls.push(s);

                        }

                        const sclMult = a.sclMult == null ? 1. : a.sclMult;
                        const rotOffsetX = a.rotOffsetX == null ? 0. : a.rotOffsetX;
                        const rotOffsetY = a.rotOffsetY == null ? 0. : a.rotOffsetY;
                        const rotOffsetZ = a.rotOffsetZ == null ? 0. : a.rotOffsetZ;
                        //console.log(a.transformOffset)
                        const transformOffset = a.transformOffset == null 
                        ? {pos:new THREE.Vector3(), rot:new Euler(), scl:new Vector3(1,1,1)} 
                        : {
                            pos:new THREE.Vector3( a.transformOffset.pos.x, a.transformOffset.pos.y, a.transformOffset.pos.z),
                            rot:new THREE.Euler( a.transformOffset.rot._x, a.transformOffset.rot._y, a.transformOffset.rot._z),
                            scl:new THREE.Vector3( a.transformOffset.scl.x, a.transformOffset.scl.y, a.transformOffset.scl.z)
                        };
                        
                        const ss = scene.getObjectByName(a.scene);
                        
                        const all = {
                            modelInfo:{modelIndex:mi,urlIndex:ui}, 
                            meshClone:null, 
                            index:a.index, 
                            scene:ss, 
                            globalDensityAmount:a.globalDensityAmount, 
                            meshScale:a.meshScale,
                            sclMult:sclMult,
                            rotOffsetX:rotOffsetX,
                            rotOffsetY:rotOffsetY,
                            rotOffsetZ:rotOffsetZ,
                            transformOffset:transformOffset,
                            globalShouldAnimateSize:a.globalShouldAnimateSize,
                            param:param
                        }

                      
                        chooseModel(ui, mi, param, function(sn){
                           
                            const meshClone = sn.clone();
                            all.meshClone = meshClone;

                            meshObjects.push(new Stroke( { scl:scls, pos:pos, rots:rots, all:all } ));
                            
                            if(meshObjects.length == strokes.length){
                                for(let f = 0; f < meshObjects.length; f++){
                                    const ind = meshObjects[f].strokeIndex;
                                    if( !hasAddedStrokeIndex(addedStrokeArray, ind) ){
                                        const arr = getAllMeshObjectsWithSameIndex(ind);
                                        actionHelper.addStrokesArray({array:arr});
                                        addedStrokeArray.push(ind);
                                    }
                                }
                            }
                        });
                    }
                });

            };
            reader.readAsDataURL( file );

        }
    }else{
        if(currDragImgSrc!=null){
            usingCustomDrawObject = true;
            const fnl = currDragImgSrc.substr(0,currDragImgSrc.length - 3)+"glb";
            replaceDrawObject(fnl, 10);
            currDragImgSrc = null;
        }
    }

}


function getAllMeshObjectsWithSameIndex(index){
    const arr = [];
    for(let i = 0; i<meshObjects.length; i++){
        if(meshObjects[i].strokeIndex == index){
            //strokeFinal.push({scl:mouse.scales, pos:mouse.smoothAvgs, rots:mouse.rots, index:actionHelper.currStrokeIndex, all:all, scene:all.scene});
            const scl = meshObjects[i].scales;
            const pos = meshObjects[i].arr;
            const rots = meshObjects[i].rots;
            const index = meshObjects[i].strokeIndex;
            const scene = meshObjects[i].scene;
            const all = meshObjects[i].all;

            const obj = {scl:scl, pos:pos, rots:rots, index:index, all:all, scene:scene}
            arr.push(obj);
        }
    }
    return arr;
}

function hasAddedStrokeIndex(arr, index){
    for(let i = 0; i<arr.length; i++){
        if(arr[i] == index){
            return true;
        }
    }
    return false;
}


function readTextFile(file, callback) {
    const rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}
  

function killObject(obj){
    
    obj.traverse( function ( obj ) {
        handleKill(obj);
    });
    handleKill(obj);
    //scene.remove(obj); 
}

function handleKill(obj){
    if(obj.isMesh || obj.isSkinnedMesh){
           
        if(obj.material !=null ){
            
            for (const [key, value] of Object.entries(obj.material)) {
                if( key.includes("Map") || key.includes("map") ){
                    if(value != null && value.isTexture){
                        value.dispose();
                    }
                }
            }
            obj.material.dispose();
        }
        obj.geometry.dispose();
        //obj.dispose();
    }
    scene.remove(obj);
}

