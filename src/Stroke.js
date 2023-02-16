import {
    Vector3,
    AnimationMixer,
    Object3D,
    CatmullRomCurve3,
    TubeGeometry,
    ConeGeometry,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Euler,
    Mesh,
    VectorKeyframeTrack,
    QuaternionKeyframeTrack,
    AnimationClip,
    Quaternion,
    Matrix4
} from './build/three.module.js';
class Stroke {
    constructor(OBJ){

        this.arr = OBJ.pos;
        this.rots = OBJ.rots;
        this.strokeIndex = OBJ.all.index;
        this.modelInfo = OBJ.all.modelInfo;
        this.total = Math.ceil( this.arr.length * OBJ.all.globalDensityAmount);
        this.speed = 200;
        this.meshes = [];

        this.curve = new CatmullRomCurve3(this.arr);
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
        this.tubeGeometry = new TubeGeometry( this.curve, 10, .01, 10, false );
        //this.tubeGeometry = new THREE.TubeGeometry( extrudePath, 2, .1, 2, false );
        //this.mesh = new Mesh( this.tubeGeometry, material.clone() );
        
        //scene.add(this.mesh)
        //let start = 0;
        for(var i = 0; i<this.total; i++){
            const start = (i / this.total);
            const endInc = (i == this.total-1) ? i : (i + 1); 
            const end = (endInc / this.total);

            const avgStart = Math.floor(start);
            const rotFnl = {from:this.rots[Math.floor(start*this.rots.length)], to:this.rots[Math.floor(end*this.rots.length)]};
        
            const pmesh = new PaintMesh({
                parent:this, 
                geo:this.tubeGeometry, 
                start:start, 
                scene:OBJ.all.scene, 
                scale:OBJ.all.meshScale, 
                total:this.total, 
                index:i, 
                rotation:rotFnl,
                meshClone:OBJ.all.meshClone,
                strokeIndex:this.strokeIndex,
                helper:OBJ.all.helper,
                globalShouldAnimateSize:OBJ.all.globalShouldAnimateSize,
            
            });
            pmesh.initAnimation();
            this.meshes.push(pmesh);
        }
       
    
    }
    update = function(OBJ){
        for(var i = 0; i<this.meshes.length; i++){
            this.meshes[i].update(OBJ);
        }  
    }

    killStroke(){
        for(var i = 0; i<this.meshes.length; i++){
            this.meshes[i].kill();
        }
    }

}


//PARENT, GEO, START, SCALE, TOTAL, I, ROTATION
class PaintMesh {
    constructor(OBJ) {
        //this.mesh = new THREE.Mesh(geometry.clone(), material.clone());
        //console.log(ROTATION)
        this.parent = OBJ.parent;

        this.rots = OBJ.rotation;
        
    
        this.mesh = OBJ.meshClone.clone();
        ///this.material = OBJ.material;
        this.scene = OBJ.scene;
        
        this.mesh.name = "scn_"+this.scene.name+"_s_"+OBJ.strokeIndex+"_m_"+OBJ.index;
        //conso.e
        this.total = OBJ.total;
        const s = OBJ.scale;
        this.i = OBJ.index;
        this.meshScale = OBJ.scale;
        this.globalShouldAnimateSize = OBJ.globalShouldAnimateSize;
        
        this.mesh.scale.set(this.meshScale, this.meshScale, this.meshScale);
        //this.mesh.rotation.copy(helper.holder.rotation);
        
        this.scene.add(this.mesh);

        this.geo = OBJ.geo;
        this.start = OBJ.start;
        this.position = new Vector3();
        this.binormal = new Vector3();
        this.normal = new Vector3();
        this.lookAt = new Vector3();
        this.direction = new Vector3();
        this.inc = 0
        this.speed = .0031;
        this.keyframelength = 30*3;
        this.mixer = new AnimationMixer(this.mesh); 
        this.clip;
        this.positionkf;
        this.scalef;
        this.rotationkf
        this.lookObj = new Object3D();
        
        //scene.add(this.lookObj);

     //for t in range(speed):
            //bpy.context.scene.frame_set(t)
            //fnl = (start + ( t * (( 1/total )/speed) ) )%1.0
            //constraint.offset_factor = fnl
            //constraint.keyframe_insert(data_path="offset_factor")
    }
    kill(){
        const self = this;
        // this.mesh.traverse( function ( obj ) {
        //     self.handleKill(obj);
        // });
        // this.handleKill(this.mesh); 
        this.scene.remove(this.mesh);
    }

    handleKill(obj){
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
    }

    initAnimation (){
        
        const keys = [];
        const valuesP = [];
        const valuesR = [];
        const valuesS = [];
        
        for(let t = 0; t<this.keyframelength; t++){
        
            keys.push(t/30);
          
            const frameFraction = t * (( 1 / this.total ) / this.keyframelength) ;
          
            const key =  (this.start + ( frameFraction ));
            const trans = this.getTransforms( key );//.pos;

            let rots = new Quaternion();
           
            rots.slerpQuaternions ( this.rots.from, this.rots.to, t / this.keyframelength );
            
            valuesP.push(trans.pos.x);
            valuesP.push(trans.pos.y);
            valuesP.push(trans.pos.z);
            valuesR.push(rots.x);
            valuesR.push(rots.y);
            valuesR.push(rots.z);
            valuesR.push(rots.w);
            let s = this.meshScale;
            if(this.globalShouldAnimateSize){
                if(this.i == 0){
                    s = (t / this.keyframelength) * this.meshScale;
                } 
                if(this.i == this.total-1){
                    s = (1.0 - (t / this.keyframelength)) * this.meshScale;
                }
            }

            valuesS.push(s);
            valuesS.push(s);
            valuesS.push(s);

        }   
      
        this.positionkf = new VectorKeyframeTrack( '' +this.mesh.name+ '.position', keys, valuesP );
        this.rotationkf = new QuaternionKeyframeTrack('' +this.mesh.name+ '.quaternion', keys, valuesR );
        this.scalef = new VectorKeyframeTrack('' +this.mesh.name+ '.scale', keys, valuesS );
        // this.mixer = new THREE.AnimationMixer(this.mesh); 
        this.clip = new AnimationClip( 'Action_'+this.mesh.name, -1  , [ this.positionkf, this.rotationkf, this.scalef  ] );
        const clipAction = this.mixer.clipAction( this.clip );
        clipAction.play();
        this.mesh.animations.push(this.clip);
    
    }

    update = function(OBJ){

        if(this.mixer)
            this.mixer.update( OBJ.delta );
    }
    
    getTransforms (key) {
        
        //this.inc += this.speed;
        const time = key;//this.i+key
        
        const t = time%1;
        const pos = new Vector3();
        
        this.geo.parameters.path.getPointAt( t, pos );

        pos.multiplyScalar( 1 );

        const segments = this.geo.tangents.length;
        const pickt = t * segments;
        const pick = Math.floor( pickt );
        const pickNext = ( pick + 1 ) % segments;
        const binormal = new Vector3();
        //this.binormal.subVectors( this.geo.binormals[ pickNext ], this.geo.binormals[ pick ] );
        //this.binormal.multiplyScalar( pickt - pick ).add( this.geo.binormals[ pick ] );
        binormal.subVectors( this.geo.binormals[ pickNext ], this.geo.binormals[ pick ] );
        binormal.multiplyScalar( pickt - pick ).add( this.geo.binormals[ pick ] );
        const direction = new Vector3();

        this.geo.parameters.path.getTangentAt( t, direction );
        const offset = 15;
        const normal = new Vector3();
        normal.copy( binormal ).cross( direction );

        pos.add( this.normal.clone().multiplyScalar( 0 ) );
        this.lookObj.position.copy( pos );
        this.lookAt.copy( pos ).add( direction );
        this.lookObj.matrix.lookAt( this.lookObj.position, this.lookAt, normal );
        this.lookObj.quaternion.setFromRotationMatrix( this.lookObj.matrix );
        return {pos:pos, rot:this.lookObj.rotation};
        
    }
}


export { Stroke };