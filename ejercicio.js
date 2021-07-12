// <============================================ EJERCICIOS ============================================>
// a) Implementar la función:
//
//      GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
//
//    Si la implementación es correcta, podrán hacer rotar la caja correctamente (como en el video). IMPORTANTE: No
//    es recomendable avanzar con los ejercicios b) y c) si este no funciona correctamente. 
//
// b) Implementar los métodos:
//
//      setMesh( vertPos, texCoords )
//      swapYZ( swap )
//      draw( trans )
//
//    Si la implementación es correcta, podrán visualizar el objeto 3D que hayan cargado, asi como también intercambiar 
//    sus coordenadas yz. Para reenderizar cada fragmento, en vez de un color fijo, pueden retornar: 
//
//      gl_FragColor = vec4(1,0,gl_FragCoord.z*gl_FragCoord.z,1);
//
//    que pintará cada fragmento con un color proporcional a la distancia entre la cámara y el fragmento (como en el video).
//    IMPORTANTE: No es recomendable avanzar con el ejercicio c) si este no funciona correctamente. 
//
// c) Implementar los métodos:
//
//      setTexture( img )
//      showTexture( show )
//
//    Si la implementación es correcta, podrán visualizar el objeto 3D que hayan cargado y su textura.
//
// Notar que los shaders deberán ser modificados entre el ejercicio b) y el c) para incorporar las texturas.  
// <=====================================================================================================>



// Esta función recibe la matriz de proyección (ya calculada), una traslación y dos ángulos de rotación
// (en radianes). Cada una de las rotaciones se aplican sobre el eje x e y, respectivamente. La función
// debe retornar la combinación de las transformaciones 3D (rotación, traslación y proyección) en una matriz
// de 4x4, representada por un arreglo en formato column-major. El parámetro projectionMatrix también es 
// una matriz de 4x4 alamcenada como un arreglo en orden column-major. En el archivo project4.html ya está
// implementada la función MatrixMult, pueden reutilizarla. 

function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
{
	const cosX = Math.cos(rotationX);
	const sinX = Math.sin(rotationX);
	const cosY = Math.cos(rotationY);
	const sinY = Math.sin(rotationY);

	// Matriz de traslación y rotación
	var transRot = [
		cosY,  sinX*sinY, -cosX*sinY, 0,
		0   ,  cosX     ,  sinX     , 0,
		sinY, -sinX*cosY,  cosX*cosY, 0,
		translationX, translationY, translationZ, 1
	];

	var mvp = MatrixMult( projectionMatrix, transRot );
	return mvp;
}

// [COMPLETAR] Completar la implementación de esta clase.
class MeshDrawer
{
	// El constructor es donde nos encargamos de realizar las inicializaciones necesarias. 
	constructor()
	{
		this.swap = false;
		this.showTex = true;
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvp = gl.getUniformLocation(this.prog, 'mvp');
		this.texMask = gl.getUniformLocation(this.prog, 'texMask');
		this.pos = gl.getAttribLocation(this.prog, 'pos');
		this.posBuffer = gl.createBuffer();
		this.tex = gl.getAttribLocation(this.prog, 'tex');
		this.texBuffer = gl.createBuffer();
	}
	
	// Esta función se llama cada vez que el usuario carga un nuevo archivo OBJ.
	// En los argumentos de esta función llegan un areglo con las posiciones 3D de los vértices
	// y un arreglo 2D con las coordenadas de textura. Todos los items en estos arreglos son del tipo float. 
	// Los vértices se componen de a tres elementos consecutivos en el arreglo vertexPos [x0,y0,z0,x1,y1,z1,..,xn,yn,zn]
	// De manera similar, las cooredenadas de textura se componen de a 2 elementos consecutivos y se 
	// asocian a cada vértice en orden. 
	setMesh( vertPos, texCoords )
	{
		this.numTriangles = vertPos.length / 3;

		gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
	}

	// Esta función se llama cada vez que el usuario cambia el estado del checkbox 'Intercambiar Y-Z'
	// El argumento es un boleano que indica si el checkbox está tildado
	swapYZ( swap )
	{
        this.swap = swap;
	}
	
	// Esta función se llama para dibujar la malla de triángulos
	// El argumento es la matriz de transformación, la misma matriz que retorna GetModelViewProjection
	draw( trans )
	{
		// 1. Seleccionamos el shader
        gl.useProgram(this.prog);

		// 2. Setear matriz de transformacion
		const swapMat = this.swap ?
			[
				1, 0, 0, 0,
				0, 0, 1, 0,
				0, 1, 0, 0,
				0, 0, 0, 1,
			] :
			[
				1, 0, 0, 0,
				0, 1, 0, 0,
				0, 0, 1, 0,
				0, 0, 0, 1,
			];
        trans = MatrixMult(trans, swapMat);
        gl.uniformMatrix4fv(this.mvp, false, trans);

	    // 3.Binding de los buffers
		gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
		gl.vertexAttribPointer(this.pos, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.pos);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
		gl.vertexAttribPointer(this.tex, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.tex);

		// Texturas
		const sampler = gl.getUniformLocation(this.prog, 'texGPU');
		gl.uniform1i(sampler, 0);
		gl.uniform1f(this.texMask, this.showTex ? 1 : 0);

		// Dibujamos
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}

	// Esta función se llama para setear una textura sobre la malla
	// El argumento es un componente <img> de html que contiene la textura. 
	setTexture( img )
	{
		// [COMPLETAR] Binding de la textura
		const textura = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, textura);
		gl.texImage2D(gl.TEXTURE_2D, // Textura 2D
			0, // Mipmap nivel 0
			gl.RGB, // formato (en GPU)
			gl.RGB, // formato del input
			gl.UNSIGNED_BYTE, // tipo
			img // arreglo o <img>
		);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.activeTexture(gl.TEXTURE0); // digo que voy a usar la Texture Unit 0
		gl.bindTexture(gl.TEXTURE_2D, textura);
	}
	
	// Esta función se llama cada vez que el usuario cambia el estado del checkbox 'Mostrar textura'
	// El argumento es un boleano que indica si el checkbox está tildado
	showTexture( show )
	{
		// [COMPLETAR] Setear variables uniformes en el fragment shader
        this.showTex = show;
	}
}

// Vertex Shader
// Si declaras las variables pero no las usas es como que no las declaraste y va a tirar error. Siempre va punto y coma al finalizar la sentencia. 
// Las constantes en punto flotante necesitan ser expresadas como x.y, incluso si son enteros: ejemplo, para 4 escribimos 4.0
var meshVS = `
	attribute vec3 pos;
	attribute vec2 tex;
	uniform mat4 mvp;
	varying vec2 texCoord;

	void main()
	{ 
		gl_Position = mvp * vec4(pos,1);
		texCoord = tex;
	}
`;

// Fragment Shader
var meshFS = `
	precision mediump float;
	uniform sampler2D texGPU;
	uniform float texMask;
	varying vec2 texCoord;

	void main()
	{
		gl_FragColor = vec4(texMask, texMask, texMask, 1) * texture2D(texGPU,texCoord);
	}
`;

function InitShaderProgram( vsSource, fsSource )
{
	// Función que compila cada shader individualmente
	const vs = CompileShader( gl.VERTEX_SHADER,   vsSource );
	const fs = CompileShader( gl.FRAGMENT_SHADER, fsSource );

	// Crea y linkea el programa
	const prog = gl.createProgram();
	gl.attachShader(prog, vs);
	gl.attachShader(prog, fs);
	gl.linkProgram(prog);

	if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
	{
		alert('No se pudo inicializar el programa: ' + gl.getProgramInfoLog(prog));
		return null;
	}
	return prog;
}
