import {
    ConeGeometry,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Euler,
    Mesh
} from './build/three.module.js';
import { CustomMaterial } from './CustomMaterial.js';
class BrushHelper {
    
    constructor(OBJ){
        this.raycaster = OBJ.raycaster;
        const geometryHelper = new ConeGeometry( .1, .2, 5 );
        geometryHelper.translate( 0, -.1, 0 );
        geometryHelper.rotateX( Math.PI / 2 );
        this.mesh = new Mesh( geometryHelper, new MeshBasicMaterial({visible:false}) );
        this.visual = new Mesh(geometryHelper, new MeshStandardMaterial());
        this.holder;
        this.rotAdditive = new Euler();
        this.scene = OBJ.scene;
        this.scene.add( this.mesh, this.visual );
        this.mathHandler = new CustomMaterial();
    }

    update(OBJ){
       
        this.visual.position.lerp(this.mesh.position, OBJ.globalSmoothAmount);// , globalSmoothAmount);
        this.visual.rotation.copy(this.mesh.rotation);
                
        if(this.holder){
            this.visual.visible = false;
            this.holder.scale.set(OBJ.meshScale, OBJ.meshScale, OBJ.meshScale);
            this.holder.position.lerp(this.mesh.position, OBJ.globalSmoothAmount);// , globalSmoothAmount);
            this.rotAdditive.x += OBJ.shouldRotateAdditiveX ? OBJ.globalAdditiveRotationSpeed : 0;
            this.rotAdditive.y += OBJ.shouldRotateAdditiveY ? OBJ.globalAdditiveRotationSpeed : 0;
            this.rotAdditive.z += OBJ.shouldRotateAdditiveZ ? OBJ.globalAdditiveRotationSpeed : 0;
            
            if(OBJ.rotationFollowsNormal){
                const x = this.visual.rotation.x + OBJ.globalOffsetRotation.x + this.rotAdditive.x;
                const y = this.visual.rotation.y + OBJ.globalOffsetRotation.y + this.rotAdditive.y;
                const z = this.visual.rotation.z + OBJ.globalOffsetRotation.z + this.rotAdditive.z;
                this.holder.rotation.set(x, y, z);
            }else{
                this.holder.rotation.set( OBJ.globalOffsetRotation.x + this.rotAdditive.x, OBJ.globalOffsetRotation.y + this.rotAdditive.y, OBJ.globalOffsetRotation.z + this.rotAdditive.z)
            }
        }
    }

    doMouseInteraction (OBJ) {
        this.raycaster.setFromCamera( OBJ.mouse.normal, OBJ.camera );
        let mesh = OBJ.bgMesh;
        if(OBJ.drawState=="object"){
            mesh = OBJ.drawObject;
        }
        const intersects = this.raycaster.intersectObject( mesh );
        // Toggle rotation bool for meshes that we clicked
        if ( intersects.length > 0 ) {
            
            //var p = intersects[ 0 ].point;
            //mouseHelper.position.copy( p );
            //intersection.point.copy( p );
            var n = intersects[ 0 ].face.normal.clone();
            n.transformDirection( OBJ.drawObject.matrixWorld );
            n.multiplyScalar( 10 );
            n.add( intersects[ 0 ].point );

            //intersection.normal.copy( intersects[ 0 ].face.normal );
            this.mesh.lookAt( n );

            this.mesh.position.copy( intersects[ 0 ].point.add(intersects[ 0 ].face.normal.multiplyScalar(OBJ.globalNormalOffsetAmount) ) );
        }
    }
    updateVisual(OBJ){
        if(this.holder){
            this.killObject(this.holder);
           // this.scene.remove(this.holder);
        }
        this.holder = OBJ.mesh.clone();
        this.scene.add(this.holder)
    }
    copyMaterial(OBJ){
        const self = this;
        this.holder.traverse( function ( child ) {
            if ( child.isMesh ) {
                if(child.material!=null){
                    
                    let copy = new MeshStandardMaterial();
                    
                    for (const [key, value] of Object.entries(child.material)) {
                        copy[key] = value;
                    }

                    const newParam = {};
                    for (const [key, value] of Object.entries(OBJ.param)) {
                        newParam[key] = value;
                    }
                    
                    copy = self.mathHandler.getCustomMaterial(copy, newParam);
                    child.material = copy;
                    
                }
            }
        });
    }
    
    killObject(obj){
        
        obj.traverse( function ( obj ) {
            handleKill(obj);
        });
        handleKill(obj);
        scene.remove(obj); 
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
}

export { BrushHelper };