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
            for(let k = 0; k < this.actionsArr[i].length; k++){
                if(this.actionsArr[i][k].index == index){
                    ind = i;
                }
            }
            
        }
        
        this.actionsArr.splice(ind,1);
        
        for(let t = 0; t<this.actionsArr.length; t++){
            for(let l = 0; l < this.actionsArr[t].length; l++){
                if(this.actionsArr[t][l].index > index){
                    this.actionsArr[t][l].index--;       
                }
            }
        }
        
        for(let z = 0; z<this.actionsArr.length; z++){
            for(let x = 0; x < this.actionsArr[z].length; x++){
                console.log(this.actionsArr[z][x].index)
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
        console.log(index)
        for(let i = 0; i < this.actionsArr[index].length; i++){
            this.actionsArr[index][i].all.transformOffset = val;
        }
    }

    startNewPath(){
        //console.log(this.currStrokeIndex<this.actionsArr.length);
        //console.log("len first= "+this.actionsArr.length)
        if(this.currStrokeIndex<this.actionsArr.length){//only calls if undo
            const len = this.actionsArr.length - this.currStrokeIndex;
            for(let i = 0; i<len; i++){
                this.actionsArr.pop()
            }
            ///console.log("len after = "+this.actionsArr.length)
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