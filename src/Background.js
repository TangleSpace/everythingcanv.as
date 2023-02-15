import {
    ConeGeometry,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Euler,
    Mesh,
    SphereGeometry,
    ShaderMaterial,
    Color,
    BackSide
} from './build/three.module.js';

class Background {
    
    constructor(OBJ){
        const self = this;
        const vertexShader = self.getBgVertex();
		const fragmentShader = self.getBgFragment();
		const uniforms = {
			topColor: { value: new Color(0x000000) },
			bottomColor: { value: new Color(0x000000) },
			offset: { value: 0 },
			exponent: { value: 0.9 }
		};

		//uniforms.topColor.value.copy( light.color );

		const skyGeo = new SphereGeometry( 500, 12, 12 );
		const skyMat = new ShaderMaterial( {
			uniforms: uniforms,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			side: BackSide
		} );

		this.sky = new Mesh( skyGeo, skyMat );
		OBJ.scene.add(this.sky);
      
    }

	update(OBJ){
		if(this.sky.userData.shader!=null){
			this.sky.userData.shader.uniforms.topColor.value = OBJ.top;
			this.sky.userData.shader.uniforms.bottomColor.value = OBJ.bottom;
		}
	}

    getBgVertex(){
		const str = [
				
			'varying vec3 vWorldPosition;',
			'void main() {',
				'vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
				'vWorldPosition = worldPosition.xyz;',
				'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
			'}',
			
		].join( '\n' );
		return str;
	}
	getBgFragment(){
		const str = [
			'uniform vec3 topColor;',
			'uniform vec3 bottomColor;',
			'uniform float offset;',
			'uniform float exponent;',
			'varying vec3 vWorldPosition;',

			'void main() {',
				'float h = normalize( vWorldPosition + offset ).y;',
				'gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h, 0.0 ), exponent ), 0.0 ) ), 1.0 );',
			'}',
			
		].join( '\n' );
		return str;
	}


}

export { Background };