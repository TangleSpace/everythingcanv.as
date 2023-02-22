import {
    ConeGeometry,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Euler,
    Mesh
} from './build/three.module.js';

class ActionHelper {
    
    constructor(OBJ){
        this.currStrokeIndex = 0;
        this.actionsArr = []; 
    }
    addStrokesArray(OBJ){
        this.actionsArr[this.currStrokeIndex] = OBJ.array;
        this.currStrokeIndex ++;
    }
    undo(){
        //this.actionsArr[this.currStrokeIndex] = OBJ.array;
        this.currStrokeIndex --;
    }
    redo(){
        //this.actionsArr[this.currStrokeIndex] = OBJ.array;
        this.currStrokeIndex ++;
    }
    
    updateMatParam(index, val){
        for(let i = 0; i < this.actionsArr[index].length; i++){
            
            const p = {};
            for (const property in val) {
                p[property] = val[property]
            }
            this.actionsArr[index][i].all.param = p;

        }
    }

    updateModelInfo(index, val){
        for(let i = 0; i < this.actionsArr[index].length; i++){
            this.actionsArr[index][i].all.modelInfo.urlIndex = val.urlIndex;
            this.actionsArr[index][i].all.modelInfo.modelIndex = val.modelIndex;
        }
    }

    updateScaleOffset(index, val){
        for(let i = 0; i < this.actionsArr[index].length; i++){
            this.actionsArr[index][i].all.sclMult = val;
        }
    }
    
    updateRotOffsetX(index, val){
        for(let i = 0; i < this.actionsArr[index].length; i++){
            this.actionsArr[index][i].all.rotOffsetX = val;
        }
    }

    updateRotOffsetY(index, val){
        for(let i = 0; i < this.actionsArr[index].length; i++){
            this.actionsArr[index][i].all.rotOffsetY = val;
        }
    }

    updateRotOffsetZ(index, val){
        for(let i = 0; i < this.actionsArr[index].length; i++){
            this.actionsArr[index][i].all.rotOffsetZ = val;
        }
    }
   
}

export { ActionHelper };