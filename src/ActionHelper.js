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

    deleteStrokeHelper(index){
        let ind = 0;
        for(let i = 0; i<this.actionsArr.length; i++){
            if(this.actionsArr[i].index == index){
                ind = i;
            }
        }
        
        this.actionsArr.splice(ind,1);
        
        for(let t = 0; t<this.actionsArr.length; t++){
            if(this.actionsArr[t].index > index){
                this.actionsArr[t].index--;
            }
        }
        this.currStrokeIndex --;
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

    updateTransform(index, val){
        for(let i = 0; i < this.actionsArr[index].length; i++){
            this.actionsArr[index][i].all.transformOffset = val;
        }
    }

    startNewPath(){
        if(this.currStrokeIndex<this.actionsArr.length){
            const len = this.actionsArr.length - this.currStrokeIndex;
            for(let i = 0; i<len; i++){
                this.actionsArr.pop()
            }
        }
    }
    
    updateMatParam(index, val){
        for(let i = 0; i < this.actionsArr[index].length; i++){ 
            // const p = {};
            // for (const property in val) {
            //     p[property] = val[property]
            // }
            this.actionsArr[index][i].all.param = val;

        }
    }

    updateModelInfo(index, val){
        for(let i = 0; i < this.actionsArr[index].length; i++){
            this.actionsArr[index][i].all.modelInfo = val;
            //this.actionsArr[index][i].all.modelInfo.modelIndex = val.modelIndex;
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