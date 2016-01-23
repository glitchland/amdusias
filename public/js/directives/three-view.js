// http://jsfiddle.net/zbjLh/2/
(function() {
  angular.module('amdusias')
  .directive('threePanel', ['$window', '$log', function ($window, $log) {

      // directive code
			return {
				restrict: "E",
				scope: {
					assimpUrl: "=assimpUrl",
          gameState: "=gameState"
				},
				link: function (scope, element, attr) {

  					var camera;
  					var glScene;
            var cssScene;
            var glRenderer;
            var cssRenderer;
            var viewportHeight;
            var viewportWidth;

            var dancing = false; // XXX: For testing model load unload.

            var avatarModels = {
              "models" : [
                {"id" : 0, "url" : "3d-assets/models/android/animations.js"},
                {"id" : 1, "url" : "3d-assets/models/android/animations.js"},
              ]
            };

            // the following code is from
            //    http://catchvar.com/threejs-animating-blender-models
            var android; //XXX Testing
            var animOffset    = 0,   // starting frame of animation
            	walking         = false,
            	duration        = 1000, // milliseconds to complete animation
            	keyframes       = 20,   // total number of animation frames
            	interpolation   = duration / keyframes, // milliseconds per frame
            	lastKeyframe    = 0,    // previous keyframe
            	currentKeyframe = 0;

            ////////////////////////////
            // functions
            ///////////////////////////
            function createCssRenderer(width, height) {

              var cssRenderer = new THREE.CSS3DRenderer();
              cssRenderer.setSize(width, height);

              // this underlays the css renderer under the webgl
              // renderer to allow us to blend web pages into our
              // 3d scene
              cssRenderer.domElement.style.position = 'absolute';
            	cssRenderer.domElement.style.top	    = 0;
            	cssRenderer.domElement.style.margin	  = 0;
            	cssRenderer.domElement.style.padding  = 0;
              return cssRenderer;
            }

            function createGlRenderer(width, height) {
              var glRenderer = new THREE.WebGLRenderer({antialias:true, alpha:true});

              //var renderer = new THREE.WebGLRenderer( { alpha: true } );

              glRenderer.setClearColor( 0x003399, 0.5 );
              //http://stackoverflow.com/questions/22160379/how-to-set-webglrender-background-to-transparent
              //http://stackoverflow.com/questions/24681170/three-js-properly-blending-css3d-and-webgl
              //https://github.com/mrdoob/three.js/tree/r61
              //glRenderer.setClearColor(0x003399);
              //XXX: Note in r61  glRenderer.setPixelRatio(window.devicePixelRatio);
              glRenderer.setSize(width, height);
              glRenderer.shadowMapEnabled = true;
              glRenderer.domElement.style.position = 'absolute';
              glRenderer.domElement.style.zIndex = 1;
              glRenderer.domElement.style.top = 0;
              return glRenderer;
            }

//This works in firefox
//https://github.com/stemkoski/stemkoski.github.com/blob/master/Three.js/CSS3D.html
//http://stemkoski.github.io/Three.js/CSS3D.html
            function createPlane(width, height, position, rotation) {

              // any mesh using this material will be transparent to the css renderer
              var material  = new THREE.MeshBasicMaterial({
                color   : 0x000000,
                opacity : 0.1,
                side    : THREE.DoubleSide
              });
              var geometry  = new THREE.PlaneGeometry(width, height);
              var planeMesh = new THREE.Mesh(geometry, material);

              //planeMesh.visible = true;
              planeMesh.position.y += height/2;

              planeMesh.position.x = position.x;
              planeMesh.position.z = position.z;

              planeMesh.rotation.x = rotation.x;
              planeMesh.rotation.y = rotation.y;
              planeMesh.rotation.z = rotation.z;

              return planeMesh;

            }

            function createCssObject(width, height, planeMesh, url) {
/*
              var html = [
                '<iframe src="' + url + '" width="' + 1 + '" height="' + 1 + '">',
                '</iframe>'
              ].join('\n');
              var div = document.createElement('div');
              $(div).html(html);
              var cssObject = new THREE.CSS3DObject(div);

              cssObject.position.x = position.x;
              cssObject.position.y = position.y;
              cssObject.position.z = position.z;

              cssObject.rotation.x = rotation.x;
              cssObject.rotation.y = rotation.y;
              cssObject.rotation.z = rotation.z;
*/
              //http://stackoverflow.com/questions/26034204/unify-the-routing-urls-for-independent-pages-rendered-inside-an-iframe
              // create the iframe to contain webpage
              var frame	= document.createElement('iframe');
              frame.src	= "/index.html#youtube"; //"http://stemkoski.github.io/Three.js/index.html";
              frame.name = "youtube";

              // width of iframe in pixels
              var elementWidth = 1024;

              // force iframe to have same relative dimensions as planeGeometry
              var aspectRatio = height / width;
              var elementHeight = elementWidth * aspectRatio;
              frame.style.width  = elementWidth + "px";
              frame.style.height = elementHeight + "px";
              frame.style.overflow = "hidden";
              frame.scrolling = "no";
              // create a CSS3DObject to display element
              var cssObject = new THREE.CSS3DObject( frame );

              // synchronize cssObject position/rotation with planeMesh position/rotation
              cssObject.position = planeMesh.position;
              cssObject.rotation = planeMesh.rotation;

              // resize cssObject to same size as planeMesh (plus a border)
              var percentBorder = 0.05;
              cssObject.scale.x /= (1 + percentBorder) * (elementWidth / planeMesh.geometry.width);
              cssObject.scale.y /= (1 + percentBorder) * (elementWidth / planeMesh.geometry.width);
              console.log("PLANEMESH:" + planeMesh.geometry.width);
              //cssObject.position.x = position.x;
              //cssObject.position.y = position.y;
              //cssObject.position.y -= 0.1;
              //cssObject.position.z = position.z;
              //cssObject.position.z += 0.1;

              //cssObject.rotation.x = rotation.x;
              //cssObject.rotation.y = rotation.y;
              //cssObject.rotation.z = rotation.z;
              //cssObject.rotation = new THREE.Vector3(0, 90, 0);

              // synchronize cssObject position/rotation with planeMesh position/rotation

//              cssObject.position = planeMesh.position;
//              cssObject.position.y += 1; // Adjust the height
//              cssObject.rotation = planeMesh.rotation;

              // resize cssObject to same size as planeMesh (plus a border)
            //  var percentBorder = 0.05;
              //cssObject.scale.x /= (1 + percentBorder) * (1024 / width);
              //cssObject.scale.y /= (1 + percentBorder) * (1024 / width);
              return cssObject;
            }

            function create3dPage(width, height, position, rotation) {
              var planeMesh = createPlane(
                  width,
                  height,
                  position,
                  rotation);
              glScene.add(planeMesh);

            var cssObject = createCssObject(
                  width,
                  height,
                  planeMesh,
                  "https://www.youtube.com/embed/3f20L0msLsM?autoplay=1");
                cssScene.add(cssObject);

            }

  					// init scene
  					init();

  					// Load jeep model using the AssimpJSONLoader
  					//var loader1 = new THREE.AssimpJSONLoader();

  					scope.$watch("assimpUrl", function(newValue, oldValue) {
  						//if (newValue != oldValue) loadModel(newValue);
              toggleDance(newValue);
  					});

            // sync up the gamestate with the controller
            scope.$watch("gameState", function(newValue, oldValue) {
              if (newValue)
                $log.info ("Directive gamestate: " + JSON.stringify(newValue));
            });

  					function toggleDance(modelUrl) {
  						//loader1.load(modelUrl, function (assimpjson) {
  						//	assimpjson.scale.x = assimpjson.scale.y = assimpjson.scale.z = 0.2;
  					//		assimpjson.updateMatrix();
  					//		if (previous) scene.remove(previous);
  					//		scene.add(assimpjson);

  						//	previous = assimpjson;
  						//});
              if(!dancing) {
                //glScene.add(android);
                dancing = true;
              } else {
                var objName = glScene.getObjectByName(android.name);
                //glScene.remove(objName);
                dancing = false;
              }

  					}

  					//loadModel(scope.assimpUrl);
  					animate();

  					function init() {

              var screenHeight = 4;
              var screenWidth  = screenHeight * 2;
              var camScreenDistance = 10;
              var camFloorHeight = 2;
              var camSkew = 0.2;

              // initialize viewport size
              viewportHeight   = angular.element(document.querySelector('#three-panel'))[0].offsetHeight;
              viewportWidth    = angular.element(document.querySelector('#three-panel'))[0].offsetWidth;
              viewportPosition = angular.element(document.querySelector('#three-panel'))[0].position;
              /*
              PerspectiveCamera( fov, aspect, near, far )
                fov — Camera frustum vertical field of view.
                aspect — Camera frustum aspect ratio.
                near — Camera frustum near plane.
                far — Camera frustum far plane.
              */
  						camera = new THREE.PerspectiveCamera(45, viewportWidth / viewportHeight, 1, 2000);
              camera.position.set(camSkew, camFloorHeight, camScreenDistance);
              camera.lookAt(new THREE.Vector3(0, 1, 0));

              // create 2 scenes for css and gl
  						glScene  = new THREE.Scene();
              cssScene = new THREE.Scene();

  						// set up the renderers
              glRenderer  = createGlRenderer(viewportWidth, viewportHeight, viewportPosition);
              cssRenderer = createCssRenderer(viewportWidth, viewportHeight, viewportPosition);

  						glRenderer.setSize(viewportWidth, viewportHeight);
  						cssRenderer.setSize(viewportWidth, viewportHeight);


              element[0].appendChild(cssRenderer.domElement);

            	// when window resizes, also resize this renderer
            	//THREEx.WindowResize(rendererCSS, camera);
            	cssRenderer.domElement.appendChild( glRenderer.domElement );

              // http://stemkoski.github.io/Three.js/CSS3D.html
              // https://github.com/stemkoski/stemkoski.github.com/blob/master/Three.js/CSS3D.html

              // Youtube video page
              create3dPage(
                screenWidth,                 // width
                screenHeight,                // height
                new THREE.Vector3(0, 1, 0),  // position
                new THREE.Vector3(0, 0, 0)   // rotation
              );

              //var vFOV = camera.fov * (Math.PI / 180); // convert VERTICAL fov to radians
              //var targetZ = viewportHeight / (2 * Math.tan(vFOV / 2) );
              //camera.position.z = targetZ;

              // Helpers
              var axes = new THREE.AxisHelper(2);
              glScene.add(axes);

              //grid xz
              var gridXZ = new THREE.GridHelper(10, 1);
              glScene.add(gridXZ);

  						// Events
  						$window.addEventListener('resize', onWindowResize, false);

              var jsonLoader = new THREE.JSONLoader();

              // Add models into a cache that can load
              for (var i=0; i < avatarModels.length; i++){

              }

              jsonLoader.load( "3d-assets/models/android/animations.js", addModelToScene );
              //https://github.com/stemkoski/stemkoski.github.com/blob/master/Three.js/Model-Animation.html

              var light = new THREE.SpotLight( 0x4aa592, 2, 4500 );
              light.position.set(0, 2, 6);
              light.castShadow = true;
              light.shadowMapWidth = 1024;
              light.shadowMapHeight = 1024;
              light.shadowMapDarkness = 0.98;

              glScene.add( light );
  					}

            //Add a model to the scene
            function addModelToScene( geometry, materials )
            {
              var scaleFactor = 0.05;
              var scale = 1 * scaleFactor;

            	// for preparing animation
            	for (var i = 0; i < materials.length; i++)
            		materials[i].morphTargets = true;

            	var material = new THREE.MeshFaceMaterial( materials );
            	android = new THREE.Mesh( geometry, material );
            	android.scale.set(scale, scale, scale);
              android.position.z = 4;
              android.name = "android";
            	glScene.add( android );
            }

  					//
  					function onWindowResize(event) {
              var h = angular.element(document.querySelector('#three-panel'))[0].offsetHeight;
              var w = angular.element(document.querySelector('#three-panel'))[0].offsetWidth;

  						glRenderer.setSize(w, h);
              cssRenderer.setSize(w, h);
  						camera.aspect = w / h;
  						camera.updateProjectionMatrix();
  					}

  					function animate() {
  						requestAnimationFrame(animate);
  						render();
  					}

  					//
  					function render() {

              if ( android && dancing) {
              	// Alternate morph targets
              	time = new Date().getTime() % duration;
              	keyframe = Math.floor( time / interpolation ) + animOffset;
              	if ( keyframe != currentKeyframe ) {
              			android.morphTargetInfluences[ lastKeyframe ] = 0;
              			android.morphTargetInfluences[ currentKeyframe ] = 1;
              			android.morphTargetInfluences[ keyframe ] = 0;
              			lastKeyframe = currentKeyframe;
              			currentKeyframe = keyframe;
              		}
              		android.morphTargetInfluences[ keyframe ] = ( time % interpolation ) / interpolation;
              		android.morphTargetInfluences[ lastKeyframe ] = 1 - android.morphTargetInfluences[ keyframe ];
              }

              glRenderer.render(glScene, camera);
              cssRenderer.render(cssScene, camera);
  				}

				}
			}
		}
	]);
})();
