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
   
}

export { ActionHelper };