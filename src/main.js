
import * as THREE from './build/three.module.js';
import { GLTFLoader } from './scripts/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from './scripts/jsm/exporters/GLTFExporter.js';
import { OrbitControls } from './scripts/jsm/controls/OrbitControls.js';

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
let meshObjects = [];
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

const link = document.createElement( 'a' );
link.style.display = 'none';
document.body.appendChild( link );

init();

function chooseModel(i,k){
    const loader = new GLTFLoader().setPath( loadobjs[i].url );
    loader.load( k+'.glb', function ( gltf ) {
        gltf.scene.traverse( function ( child ) {
            if ( child.isMesh ) {
                //roughnessMipmapper.generateMipmaps( child.material );
                //child.material.vertexColors = false;
                
            }
        });
        meshClone = gltf.scene;
        helper.updateVisual(meshClone)
    });
}

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
                scene.add(drawObject)
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
	//camera.position.set(0, 20, 0);
    //
    
    //camera.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI/2);
    //camera.rotation.x=-Math.PI*0.5;
    camera.position.z = 20;

    
    //if(!isMobile.any()){
    //controls = new THREE.TrackballControls( camera, canvas );
    //controls.rotateSpeed = 4.0;
    //controls.enableDamping = true;
    //controls.dampingFactor = .2; 
    ////controls.zoomSpeed = 1.2;
    //controls.panSpeed = 0.8;
    //controls.noZoom = false;
    //controls.noPan = false;
    //controls.staticMoving = true;
    //controls.dynamicDampingFactor = 0.3;
    //}
   
    
	scene = new THREE.Scene();

    helper = new GeoHelper();
	
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
    
    //bgMesh.rotation.x = -Math.PI;
    //bgMesh.position.z = camera.position.z+1;
	//bgMesh.material.visible = true;
    
    
	// lights
    const light = new THREE.AmbientLight( 0x242424 ); // soft white light
    scene.add( light );

    const dlight = new THREE.DirectionalLight( 0xffffff, 1.0 );
    var d = 20;
    dlight.position.set( d*.5, 0, d );

    scene.add(dlight)
    //light.castShadow = true;
    //light.shadow.mapSize.width = light.shadow.mapSize.height = 2048;
    //light.shadow.camera.left =  -d*2;
    //light.shadow.camera.right =  d*2;
    //light.shadow.camera.top =    d*2;
    //light.shadow.camera.bottom =-d*2;
    //light.shadow.camera.far = d*5;
    //light.shadow.camera.near = 0.1;
    //light.shadow.darkness = 0.5;
	
	renderer = new THREE.WebGLRenderer();
	renderer.shadowMap.enabled = true;
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );
    renderer.domElement.className = "customThree";

    // var effectCopy = new THREE.ShaderPass( THREE.CopyShader );
    // effectCopy.renderToScreen = true;
    //composer = new THREE.EffectComposer( renderer );
    //composer.addPass( new THREE.RenderPass( scene, camera ) );
    //var pixelSize = 800;
    //var effectPixelate = new THREE.ShaderPass( THREE.PixelateShader );
    //effectPixelate.uniforms[ 'size' ].value.x = window.innerWidth;
    //effectPixelate.uniforms[ 'size' ].value.y = window.innerHeight;
    //effectPixelate.uniforms[ 'pixelSize' ].value = pixelSize;
    //composer.addPass( effectPixelate );
    //var effectDither = new THREE.ShaderPass( THREE.DitherShader );
    //effectDither.renderToScreen = true;
    //composer.addPass( effectDither );

    controls = new OrbitControls( camera, canvas);
    //controls.listenToKeyEvents( window ); // optional

    //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

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
        helper.update();
    }
    
    bgHolder.position.copy(camera.position);
    bgHolder.rotation.copy(camera.rotation);
    const delta = clock.getDelta()*globalAnimationSpeed;
    for(var i = 0; i<meshObjects.length; i++){
        meshObjects[i].update(delta);
    }

    //composer.render();
    renderer.render(scene,camera);
	
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
    var touch = event.touches[0];
        
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
            helper.doMouseInteraction();
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


function Stroke( SMOOTHARR, ROTS){
   
    this.arr = SMOOTHARR;
    this.rots = ROTS;
   
    this.total = Math.ceil( this.arr.length * globalDensityAmount);
    this.speed = 200;
    this.meshes = [];

    this.curve = new THREE.CatmullRomCurve3(this.arr);
    this.curve.curveType = 'centripetal';
    this.curve.closed = false;
    this.curve.tension = .5;

    // const points = this.curve.getPoints( 50 );
    // const geometry = new THREE.BufferGeometry().setFromPoints( points );
    // const material = new THREE.LineBasicMaterial( { color : 0xff0000 } );

    // const curveObject = new THREE.Line( geometry, material );
    // scene.add(curveObject)
    //const points = this.curve.getPoints( 10 );
    //const extrudePath = this.curve;
    //tubeGeometry = new THREE.TubeGeometry( extrudePath, params.extrusionSegments, 2, params.radiusSegments, params.closed );
    this.tubeGeometry = new THREE.TubeGeometry( this.curve, 10, .01, 10, false );
    //this.tubeGeometry = new THREE.TubeGeometry( extrudePath, 2, .1, 2, false );
    this.mesh = new THREE.Mesh( this.tubeGeometry, material.clone() );
    
    scene.add(this.mesh)
    //let start = 0;
    for(var i = 0; i<this.total; i++){
        const start = (i / this.total);
        const endInc = (i == this.total-1) ? i : (i + 1); 
        const end = (endInc / this.total);

        //console.log("start = "+start)
        //console.log("end = "+end)
        
        //start += 1/this.total;
        const avgStart = Math.floor(start);
        const rotFnl = {from:this.rots[Math.floor(start*this.rots.length)], to:this.rots[Math.floor(end*this.rots.length)]};
        // if(i<2){
             //console.log(rotFnl);
        // }
        const pmesh = new PaintMesh(this, this.tubeGeometry, start, meshScale, this.total, i, rotFnl);
        pmesh.initAnimation();
        this.meshes.push(pmesh);
    }

    this.update = function(D){
        for(var i = 0; i<this.meshes.length; i++){
            this.meshes[i].update(D);
            //console.log(this.meshes[i].mesh.name)
        }  
    }

}



function PaintMesh(PARENT, GEO, START, SCALE, TOTAL, I, ROTATION){

    //this.mesh = new THREE.Mesh(geometry.clone(), material.clone());
    //console.log(ROTATION)
    this.parent = PARENT;

    this.rots = ROTATION;
    this.mesh = meshClone.clone();
    this.mesh.name = "s_"+meshObjects.length+"_m_"+I;
    //conso.e
    this.total = TOTAL;
    const s = SCALE;
    this.i = I;
    //this.mesh.scale.set(s,s,s);
    // if(!rotationFollowsNormal){
    //     this.mesh.rotation.set(globalOffsetRotation.x, globalOffsetRotation.y, globalOffsetRotation.z);
    // }else{
    //     this.mesh.rotation.set(helper.holder.rotation.x+globalOffsetRotation.x, helper.holder.rotation.y+globalOffsetRotation.z, helper.holder.rotation.z+globalOffsetRotation.z)
    // }
    this.mesh.scale.copy(helper.holder.scale);
    //this.mesh.rotation.copy(helper.holder.rotation);
    scene.add(this.mesh);
    this.geo = GEO;
    this.start = START;
    this.position = new THREE.Vector3();
    this.binormal = new THREE.Vector3();
    this.normal = new THREE.Vector3();
    this.lookAt = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.inc = 0
    this.speed = .0031;
    this.keyframelength = 30*3;
    this.mixer = new THREE.AnimationMixer(this.mesh); 
    this.clip;
    this.positionkf;
    this.scalef;
    this.rotationkf
    this.lookObj = new THREE.Object3D();
    //scene.add(this.lookObj);

     //for t in range(speed):
            //bpy.context.scene.frame_set(t)
            //fnl = (start + ( t * (( 1/total )/speed) ) )%1.0
            //constraint.offset_factor = fnl
            //constraint.keyframe_insert(data_path="offset_factor")
    this.initAnimation = function(){
        
        const keys = [];
        const valuesP = [];
        const valuesR = [];
        const valuesS = [];
        
        for(let t = 0; t<this.keyframelength; t++){
        
            keys.push(t/30);
          
            const frameFraction = t * (( 1 / this.total ) / this.keyframelength) ;
          
            const key =  (this.start + ( frameFraction ));
            const trans = this.getTransforms( key );//.pos;

            let rots = new THREE.Quaternion();
           
            rots.slerpQuaternions ( this.rots.from, this.rots.to, t / this.keyframelength );
            
            valuesP.push(trans.pos.x);
            valuesP.push(trans.pos.y);
            valuesP.push(trans.pos.z);
            valuesR.push(rots.x);
            valuesR.push(rots.y);
            valuesR.push(rots.z);
            valuesR.push(rots.w);
            let s = meshScale;
            if(globalShouldAnimateSize){
                if(this.i == 0){
                    s = (t / this.keyframelength) * meshScale;
                } 
                if(this.i == this.total-1){
                    s = (1.0 - (t / this.keyframelength)) * meshScale;
                }
            }

            valuesS.push(s);
            valuesS.push(s);
            valuesS.push(s);

        }   
      
        this.positionkf = new THREE.VectorKeyframeTrack( '' +this.mesh.name+ '.position', keys, valuesP );
        this.rotationkf = new THREE.QuaternionKeyframeTrack('' +this.mesh.name+ '.quaternion', keys, valuesR );
        this.scalef = new THREE.VectorKeyframeTrack('' +this.mesh.name+ '.scale', keys, valuesS );
        // this.mixer = new THREE.AnimationMixer(this.mesh); 
        this.clip = new THREE.AnimationClip( 'Action_'+this.i+'', -1  , [ this.positionkf, this.rotationkf, this.scalef  ] );
        const clipAction = this.mixer.clipAction( this.clip );
        clipAction.play();
        this.mesh.animations.push(this.clip);
    
    }

    this.update = function(D){

        if(this.mixer)
            this.mixer.update( D );
    }
    

    this.getTransforms = function(key){
        
        //this.inc += this.speed;
        const time = key;//this.i+key
        
        const t = time%1;
        const pos = new THREE.Vector3();
        
        this.geo.parameters.path.getPointAt( t, pos );

        pos.multiplyScalar( 1 );

        const segments = this.geo.tangents.length;
        const pickt = t * segments;
        const pick = Math.floor( pickt );
        const pickNext = ( pick + 1 ) % segments;
        const binormal = new THREE.Vector3();
        //this.binormal.subVectors( this.geo.binormals[ pickNext ], this.geo.binormals[ pick ] );
        //this.binormal.multiplyScalar( pickt - pick ).add( this.geo.binormals[ pick ] );
        binormal.subVectors( this.geo.binormals[ pickNext ], this.geo.binormals[ pick ] );
        binormal.multiplyScalar( pickt - pick ).add( this.geo.binormals[ pick ] );
        const direction = new THREE.Vector3();

        this.geo.parameters.path.getTangentAt( t, direction );
        const offset = 15;
        const normal = new THREE.Vector3();
        normal.copy( binormal ).cross( direction );

        pos.add( this.normal.clone().multiplyScalar( 0 ) );
        this.lookObj.position.copy( pos );
        this.lookAt.copy( pos ).add( direction );
        this.lookObj.matrix.lookAt( this.lookObj.position, this.lookAt, normal );
        this.lookObj.quaternion.setFromRotationMatrix( this.lookObj.matrix );
        return {pos:pos, rot:this.lookObj.rotation};
        
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
    if(meshClone != null && mouse.smoothAvgs.length>0 ){
        //function Stroke(SMOOTHARR, OBJ, DENSITY){
        meshObjects.push(new Stroke( mouse.smoothAvgs, mouse.rots ))
        if(mirrorX){
            const posArrX = [];
            const rotArrX = [];
            for(let i = 0; i<mouse.smoothAvgs.length; i++){
                posArrX.push(new THREE.Vector3(mouse.smoothAvgs[i].x*-1, mouse.smoothAvgs[i].y, mouse.smoothAvgs[i].z));
            }
            for(let i = 0; i<mouse.rots.length; i++){
                const eul = new THREE.Euler().setFromQuaternion(mouse.rots[i]);
                eul.y*=-1;
                const quat = new THREE.Quaternion().setFromEuler(eul);
                rotArrX.push(quat);
            }
            meshObjects.push(new Stroke( posArrX, rotArrX ));
        }
        if(mirrorY){
            const posArrY = [];
            const rotArrY = [];
            for(let i = 0; i<mouse.smoothAvgs.length; i++){
                posArrY.push(new THREE.Vector3(mouse.smoothAvgs[i].x, mouse.smoothAvgs[i].y*-1, mouse.smoothAvgs[i].z));
            }
            for(let i = 0; i<mouse.rots.length; i++){
                const eul = new THREE.Euler().setFromQuaternion(mouse.rots[i]);
                eul.x*=-1;
                const quat = new THREE.Quaternion().setFromEuler(eul);
                rotArrY.push(quat);
            }
            meshObjects.push(new Stroke( posArrY, rotArrY ));

            if(mirrorX){
                const posArrX_Y = [];
                const rotArrX_Y = [];
                for(let i = 0; i<posArrY.length; i++){
                    posArrX_Y.push(new THREE.Vector3(posArrY[i].x*-1, posArrY[i].y, posArrY[i].z));
                }
                for(let i = 0; i<rotArrY.length; i++){
                    const eul = new THREE.Euler().setFromQuaternion(rotArrY[i]);
                    eul.y*=-1;
                    const quat = new THREE.Quaternion().setFromEuler(eul);
                    rotArrX_Y.push(quat);
                }
                meshObjects.push(new Stroke( posArrX_Y, rotArrX_Y ));
            }

        }
        if(mirrorZ){
            const posArrZ = [];
            const rotArrZ = [];
            for(let i = 0; i<mouse.smoothAvgs.length; i++){
                posArrZ.push(new THREE.Vector3(mouse.smoothAvgs[i].x, mouse.smoothAvgs[i].y, mouse.smoothAvgs[i].z*-1));
            }
            for(let i = 0; i<mouse.rots.length; i++){
                const eul = new THREE.Euler().setFromQuaternion(mouse.rots[i]);
                eul.z*=-1;
                const quat = new THREE.Quaternion().setFromEuler(eul);
                rotArrZ.push(quat);
            }
            meshObjects.push(new Stroke( posArrZ, rotArrZ ));

            if(mirrorX){
                const posArrX_Z = [];
                const rotArrX_Z = [];
                for(let i = 0; i<posArrZ.length; i++){
                    posArrX_Z.push(new THREE.Vector3(posArrZ[i].x*-1, posArrZ[i].y, posArrZ[i].z));
                }
                for(let i = 0; i<rotArrZ.length; i++){
                    const eul = new THREE.Euler().setFromQuaternion(rotArrZ[i]);
                    eul.y*=-1;
                    const quat = new THREE.Quaternion().setFromEuler(eul);
                    rotArrX_Z.push(quat);
                }
                meshObjects.push(new Stroke( posArrX_Z, rotArrX_Z ));
            }

        }
    }

}

var isMobile = {
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

function exportObj(){

}

function updateDrawState(){
    if(drawObject){
        if(drawState == "object"){
            //drawObject.visible = false;
            //showingDrawObject = false;
            bgMesh.visible = true;
            drawState = "view";
            document.getElementById("draw-toggle").innerHTML = "draw on object";
        }else{
            drawObject.material.visible = true;
            showingDrawObject = true;
            drawObject.visible = true;
            drawState = "object";
            bgMesh.visible = false;
            document.getElementById("draw-toggle").innerHTML = "draw on view";

        }
    }
}

function updateMeshSize(val){
    handleUiUpdating();
    if(val == null){

        //$("#infoImg").css("display", "block");
        meshScale = $("#size-slider").val()*.1;
        
    }else{
        
        var tmp = meshScale;
        tmp+=meshScale;
        var maxSliderVal = 100;
        if(tmp >  maxSliderVal)tmp = maxSliderVal;
        if(tmp<.001)tmp = .001;
        
        meshScale = tmp;

        $("#size-slider").attr("value", meshScale*10);
        
    }

}

function rotateBrushX(){
    globalOffsetRotation.x = $("#rotate-sliderX").val()*0.01745329251;
    handleUiUpdating();
}

function rotateBrushY(){
    globalOffsetRotation.y = $("#rotate-sliderY").val()*0.01745329251;
    handleUiUpdating();
}
function rotateBrushZ(){
    globalOffsetRotation.z = $("#rotate-sliderZ").val()*0.01745329251;
    handleUiUpdating();
}
function updateSmoothAmount(){
    globalSmoothAmount = 1-($("#smoothAmount").val()*.01);
}
function updateNormalOffsetAmount(){
   
    globalNormalOffsetAmount = $("#normalOffsetAmount").val()*.01;
    handleUiUpdating();
}

function toggleFollowCurve(){

}

function toggleSizeEasing(){
    globalShouldAnimateSize = !globalShouldAnimateSize;
}

function handleUiUpdating(){
    mouse.normal.x = 0;
    mouse.normal.y = 0;

    helper.doMouseInteraction();
}
function toggleShouldRotate(){

}
function updateDensity(){
    globalDensityAmount = $("#densityAmount").val()*.0031;
    console.log(globalDensityAmount)
}

function toggleRotationFollowingNormal(){
    rotationFollowsNormal = !rotationFollowsNormal;
}

function updateRotationSpeed(){
    globalAdditiveRotationSpeed = $("#additiveRotationSlider").val()*.0015;
    console.log(globalAdditiveRotationSpeed)
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

function GeoHelper(){
    const geometryHelper = new THREE.ConeGeometry( .1, .2, 5 );
    geometryHelper.translate( 0, -.1, 0 );
    geometryHelper.rotateX( Math.PI / 2 );
    this.mesh = new THREE.Mesh( geometryHelper, new THREE.MeshBasicMaterial({visible:false}) );
    this.visual = new THREE.Mesh(geometryHelper, new THREE.MeshStandardMaterial());
    this.holder;
    this.rotAdditive = new THREE.Euler();
    scene.add( this.mesh, this.visual );
    this.update = function(){
        // if(!this.holder){
        //     if(mouse.down){
        //         this.visual.visible = false;
        //     }else{
        //         this.visual.visible = true;
        //     }
        // }else{
        //     if(mouse.down){
        //         this.holder.visible = false;
        //     }else{
        //         this.holder.visible = true;
        //     }
        // }
        //this.visual.position.lerp(this.mesh.position, globalSmoothAmount);
        this.visual.position.lerp(this.mesh.position, globalSmoothAmount);// , globalSmoothAmount);
        this.visual.rotation.copy(this.mesh.rotation);
                
        if(this.holder){
            this.visual.visible = false;
            this.holder.scale.set(meshScale, meshScale, meshScale);
            this.holder.position.lerp(this.mesh.position, globalSmoothAmount);// , globalSmoothAmount);
            this.rotAdditive.x += shouldRotateAdditiveX ? globalAdditiveRotationSpeed : 0;
            this.rotAdditive.y += shouldRotateAdditiveY ? globalAdditiveRotationSpeed : 0;
            this.rotAdditive.z += shouldRotateAdditiveZ ? globalAdditiveRotationSpeed : 0;
            
            if(rotationFollowsNormal){
                this.holder.rotation.set(this.mesh.rotation.x+globalOffsetRotation.x+this.rotAdditive.x, helper.visual.rotation.y+globalOffsetRotation.z+this.rotAdditive.y, helper.visual.rotation.z+globalOffsetRotation.z+this.rotAdditive.z)
            }else{
                this.holder.rotation.set(globalOffsetRotation.x+this.rotAdditive.x, globalOffsetRotation.z+this.rotAdditive.x, globalOffsetRotation.z+this.rotAdditive.z)
            }
        }

 
    }

    this.doMouseInteraction = function(){
        raycaster.setFromCamera( mouse.normal, camera );
        let mesh = bgMesh;
        if(drawState=="object"){
            mesh = drawObject;
        }
        const intersects = raycaster.intersectObject( mesh );
        // Toggle rotation bool for meshes that we clicked
        if ( intersects.length > 0 ) {
            
            //var p = intersects[ 0 ].point;
            //mouseHelper.position.copy( p );
            //intersection.point.copy( p );
            var n = intersects[ 0 ].face.normal.clone();
            n.transformDirection( drawObject.matrixWorld );
            n.multiplyScalar( 10 );
            n.add( intersects[ 0 ].point );

            //intersection.normal.copy( intersects[ 0 ].face.normal );
            this.mesh.lookAt( n );

            this.mesh.position.copy( intersects[ 0 ].point.add(intersects[ 0 ].face.normal.multiplyScalar(globalNormalOffsetAmount) ) );
        }
    }

    this.updateVisual = function(mesh){

        if(this.holder)
            scene.remove(this.holder);
        
        this.holder = mesh.clone();
        scene.add(this.holder)
    }
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

function rotateVectorWithNormal(toRotate, normal) {

    const newVector = new THREE.Vector3().copy(toRotate);

    // set up direction
    let up = new THREE.Vector3(0, 1, 0);
    let axis = new THREE.Vector3();
    // we want the vector to point in the direction of the face normal
    // determine an axis to rotate around
    // cross will not work if vec == +up or -up, so there is a special case
    if (normal.y == 1 || normal.y == -1) {
        axis = new THREE.Vector3(1, 0, 0);
    } else {
        axis = up.cross( normal);
    }

    // determine the amount to rotate
    let radians = Math.acos(normal.dot(up));
    const quat = new THREE.Quaternion().setFromAxisAngle(axis, radians);
    newVector.applyQuaternion(quat);

    return newVector;

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