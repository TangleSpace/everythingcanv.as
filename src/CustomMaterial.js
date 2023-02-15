import {
    ConeGeometry,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Euler,
    Mesh,
    SphereGeometry,
    ShaderMaterial,
    Color,
    BackSide, 
    Vector3
} from './build/three.module.js';

class CustomMaterial {
    
    constructor(OBJ){
        this.all = [];
        this.inc = 0;

    }

    update(OBJ){
        this.inc+=OBJ.delta*10;
        
        for(let i =0; i<this.all.length; i++){
            if(this.all[i].userData.shader!=null){
           
              this.all[i].userData.shader.uniforms.time.value = this.inc;
            }
        }
    }
    // makeNewMaterial(OBJ){
    //     this.getCustomMaterial(OBJ.material);
    // }
    getCustomMaterial(mat) {

        const material = mat.clone();
        const col = mat.color;
        material.onBeforeCompile = function (shader) {

            shader.uniforms.time = { value: 0};
            shader.uniforms.col = { value: new Vector3(col.r, col.g, col.b)};
            shader.uniforms.twistAmt = { value: 10+Math.random()*50};
            shader.uniforms.noiseSize = { value: -5+Math.random()};
            shader.uniforms.twistSize = { value: -5+Math.random()};
            shader.uniforms.noiseMult = { value: -5+Math.random()};
            shader.uniforms.rndOffset = { value: new Vector3(-2+Math.random()*4,-2+Math.random()*4,-2+Math.random()*4 )};
            shader.vertexShader = `
                uniform float time;
                varying vec3 vPos;
                varying vec3 vnorm;
                varying vec3 vsn;
                varying vec3 vPositionW;
                varying vec3 vNormalW;
                varying float nse;
                uniform vec3 rndOffset;
                uniform float twistAmt;
                uniform float noiseSize;
                uniform float noiseMult;
                uniform float twistSize;

                float hash(float n) {
                    return fract(sin(n)*43758.5453);
                }
                float noise(vec2 p) {
                    return hash(p.x + p.y*57.0);
                }
                float valnoise(vec2 p) {
                    vec2 c = floor(p);
                    vec2 f = smoothstep(0.,1.,fract(p));
                    return mix (mix(noise(c+vec2(0,0)), noise(c+vec2(1,0)), f.x), mix(noise(c+vec2(0,1)), noise(c+vec2(1,1)), f.x), f.y);
                }
                
            ${shader.vertexShader}
                `.replace(
                `#include <begin_vertex>`,
                `#include <begin_vertex>
                
                vec4 world = vec4(modelMatrix * vec4(position, 1.0));
                vPos = vec3(world.xyz) ;
                float n = valnoise(vec2((vPos.x*(noiseSize*.1)), (vPos.y*(noiseSize*.1))+(time))) * (noiseMult*0.001);
                vsn = vec3( projectionMatrix  * modelViewMatrix  * vec4(vNormal, 0.0));
                vnorm = vec3(vec4(vNormal, 0.0));
                vPositionW = normalize(vec3(modelViewMatrix * vec4(position, 1.0)).xyz);
                vec3 view_space_normal = vec3(projectionMatrix  * modelViewMatrix  * vec4(vNormal, 0.0));
                vNormalW = normalize(normalMatrix * normal);


                float theta = sin( (time) + ((vPos.y*(twistSize*.5)) ) ) / (twistAmt*.1);
                float c = cos( theta );
                float s = sin( theta );
                mat3 m = mat3( c, 0, s, 0, 1, 0, -s, 0, c );
                //transformed = vec3( position + ( (view_space_normal*n) ));
                transformed = vec3( position ) * (m) + ((( rndOffset )) * (n) );
                vNormal = vNormal * m;


                `
            );
            shader.fragmentShader = 
                'uniform float time;\n'+  
                'uniform vec3 col;\n '+
                'varying vec3 vPos;\n '+
                'varying vec3 vnorm;\n'+
                'varying vec3 vsn;\n' +
                'varying vec3 vPositionW;\n' +
                'varying vec3 vNormalW;\n' +
                'varying float nse;\n' +
                'uniform vec3 rndOffset;\n' +
                'uniform float twistAmt;\n' +
                'uniform float noiseSize;\n' +
                'uniform float twistSize;\n' +
              
              
                shader.fragmentShader;
                shader.fragmentShader = shader.fragmentShader.replace(
                    //'#include <map_fragment>',
                    'vec4 diffuseColor = vec4( diffuse, opacity );',
                    `
                    vec4 sampledDiffuseColor1 = vec4(col.xyz,1.);//texture2D( map, vUv );
                    
                    vec3 color = vec3(1., 1., 1.);
                    vec3 viewDirectionW = normalize(cameraPosition - vPositionW);
                    float fresnelTerm = ( 1.0 - -min(dot(vPositionW, normalize(vNormalW)*2.4 ), 0.0) ); 

                    vec3 trip = sampledDiffuseColor1.rgb;
                    trip.x *= (( .5 + sin( (0.0 *1.) +  ((vPos.y*0.18) + (time*0.8) ) )*.5 ) *1.);
                    trip.y *= (( .5 + sin( (6.28*.33) + ((vPos.y*0.18) + (time*0.8) ) )*.5 ) *1.);
                    trip.z *= (( .5 + sin( (6.28*.66) + ((vPos.y*0.18) + (time*0.8) ) )*.5 ) *1.);

                
                    vec4 diffuseColor = vec4( trip.xyz, opacity );
            
                `);
            material.userData.shader = shader;
        }  

        this.all.push(material);
        return material;

    }


}

export { CustomMaterial };