// http://jsfiddle.net/zbjLh/2/
(function() {
  angular.module('amdusias')
  .directive('threePanel', ['$window', '$log', '$http', '$rootScope', function ($window, $log, $http, $rootScope) {

    // Avatar array built from game state
    // addAvatar
    // rmAvatar
    //
    var AvatarGroup = function ()
    {
      this.avatars = [];
    };

    AvatarGroup.prototype.add = function (avatar)
    {
      this.avatars.push (avatar);
    };

    AvatarGroup.prototype.update = function ( delta )
    {
      for ( var i = 0; i < this.avatars.length; i++ )
      {
        this.avatars[i].updateAnimation ( delta );
      }
    };

    // Avatar class to store each avatar 3d model
    var Avatar = function (geometry, materials)
    {
      this.geometry   = geometry;
      this.materials  = materials;
      this.mesh       = null;
      this.scale      = 0;
      this.animMixer  = null;
      this.animations = {};
      this.isDancing  = false;
      this.initialize();
    };

    // this initialzes the mesh
    Avatar.prototype.initialize = function ()
    {

      var scaleFactor = 0.05;
      this.scale = 7 * scaleFactor;

      this.materials.forEach( function ( material ) {
        material.skinning = true;
      } );

      var mat = new THREE.MeshFaceMaterial ( this.materials );
      this.mesh = new THREE.SkinnedMesh ( this.geometry, mat );

      this.mesh.scale.set(this.scale, this.scale, this.scale);
      this.mesh.position.z = this.getRandomArbitrary(-3.0, 3.0); // (+)near, (-)far
      this.mesh.position.x = this.getRandomArbitrary(-3.0, 3.0); // (-)left, (+)right
      this.mesh.position.y = 1.0; //(+)up-(-)down

      this.setName("");

      // animation types
      // THREE.LoopOnce
      // THREE.LoopRepeat
      // THREE.LoopPingPong

      // idle animation
      this.animMixer = new THREE.AnimationMixer( this.mesh );
      this.animations.idle = this.animMixer.clipAction( this.geometry.animations[ 1 ] );
      this.animations.idle.setLoop( THREE.LoopRepeat );
      this.animations.idle.setEffectiveWeight( 1 );

      this.animations.dance = this.animMixer.clipAction( this.geometry.animations[ 0 ] );
      this.animations.dance.setLoop( THREE.LoopRepeat );
      this.animations.dance.setEffectiveWeight( 1 );

      // THREE.LoopOnce
      // THREE.LoopRepeat
      // THREE.LoopPingPong

      this.animations.idle.play ();
    };

    Avatar.prototype.setName = function (name)
    {
      this.mesh.name = name;
    };

    Avatar.prototype.addToScene = function (scene)
    {
      scene.add( this.mesh );
    };

    Avatar.prototype.getRandomArbitrary = function (min, max)
    {
      return Math.random() * (max - min) + min;
    };

    Avatar.prototype.fadeAnimation = function (fromName, toName)
    {
          var fromThis = this.animations[ fromName ].play();
          var toThis   = this.animations[ toName   ].play();

          fromThis.enabled = true;
          toThis.enabled = true;

          fromThis.crossFadeTo( toThis, 0.3 );
    };

    Avatar.prototype.toggleDance = function ()
    {
      if ( this.isDancing )
      {
        this.fadeAnimation ("dance", "idle");
        this.isDancing = false;
      }
      else
      {
        this.fadeAnimation ("idle", "dance");
        this.isDancing = true;
      }
    };

    Avatar.prototype.updateAnimation = function ( delta )
    {
      if ( this.animMixer )
        this.animMixer.update( delta );
    };


  // this fades from idle to dancing animation

///////////////////////////////////////////////////////////////////////
      $rootScope.$on('three-view-avatar', function (event, data) {
        $log.info("This is a new avatar event:" + data);
      });

      // directive code
			return {
				restrict: "E",
				scope: {
					assimpUrl: "=assimpUrl", //These are passed in via directive element attribs
          gameState: "=gameState",
          isDancing: "="
				},
				link: function (scope, element, attr) {

  					var camera;
  					var glScene;
            var cssScene;
            var glRenderer;
            var cssRenderer;
            var viewportHeight;
            var viewportWidth;

            // avatars
            var _avatarGroup = new AvatarGroup ();

            // for shaders
            var start = Date.now();
            var shaderMaterial = null;

            ////////////////////////////
            // functions
            ///////////////////////////
            function createCssRenderer (width, height)
            {

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

            function createGlRenderer(width, height)
            {
              var glRenderer = new THREE.WebGLRenderer({antialias:true, alpha:true});

              glRenderer.setClearColor( 0x003399, 0.5 );

              glRenderer.setSize(width, height);
              glRenderer.shadowMap.enabled = true;
              glRenderer.domElement.style.position = 'absolute';
              glRenderer.domElement.style.zIndex = 1;
              glRenderer.domElement.style.top = 0;
              return glRenderer;
            }


            function createPlane(width, height, position, rotation) {

              // any mesh using this material will be transparent to the css renderer
              // this is an ugly hack, but it seems to be the only way to do this
              // right now
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

            function createCssObject(width, height, planeMesh) {

              // create the iframe to contain webpage
              var frame	= document.createElement('iframe');
              frame.src	= "/index.html#youtube";
              frame.name = "youtube";

              // width of iframe in pixels
              var elementWidth  = 640;
              var elementHeight = 360;
              // force iframe to have same relative dimensions as planeGeometry
            //  var aspectRatio = height / width;
            //  var elementHeight = (elementWidth * aspectRatio) + 20;
              frame.style.width  = elementWidth + "px";
              frame.style.height = elementHeight + "px";
              frame.style.overflow = "hidden";
              frame.scrolling = "no";

              //console.log("HEIGHT: " + elementHeight);
              //console.log("WIDTH : " + elementHeight);
              //console.log("ASPR  : " + aspectRatio);

              // create a CSS3DObject to display element
              var cssObject = new THREE.CSS3DObject( frame );

              // synchronize cssObject position/rotation with planeMesh position/rotation
              // XXX Scaling problems here need to be fixed!
              cssObject.position = planeMesh.position;
              cssObject.rotation = planeMesh.rotation;
              cssObject.position.y += 2.82; // this is based on camera floor height
              cssObject.position.x += 0.04;
              //cssObject.scale.x *= 0.0046;//(planeMesh.geometry.width * 0.00001);
              //cssObject.scale.y *= 0.0044;//(planeMesh.geometry.height* 0.00001);
              // resize cssObject to same size as planeMesh (plus a border)
              var percentBorder = 0.05;

              var ratio = Math.min(elementWidth / width, elementHeight / height);

              console.log("RATIO: " + ratio);

              cssObject.scale.x /= width * 15.0;
              cssObject.scale.y /= height * 40.0;
              //console.log("PLANEMESH:" + planeMesh.geometry.width);

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
                  planeMesh);
                cssScene.add(cssObject);

            }

  					// init scene
  					init();

  					// Load jeep model using the AssimpJSONLoader
  					//var loader1 = new THREE.AssimpJSONLoader();
  					scope.$watch("assimpUrl", function(newValue, oldValue) {
  						//if (newValue != oldValue) loadModel(newValue);
              // /toggleDance(newValue);
  					});

            // sync up the gamestate with the controller
            scope.$watch("gameState", function(newValue, oldValue) {
              if (newValue)
                $log.info ("Directive gamestate: " + JSON.stringify(newValue));
            });

            // get the toggle, is char dancing?
            /*scope.$watch("isDancing", function(newValue, oldValue) {
              $log.info ("Directive isDancing oldValue: " + JSON.stringify(oldValue));
              $log.info ("Directive isDancing newValue: " + JSON.stringify(newValue));
            });*/
            // handle events from the three-js webui
            $rootScope.$on('three-view-dance', function (event, data) {
              $log.info("This is a toggle dance event:" + data);
              if ( _g_isDancing )
              {
                fadeAnimation ("dance", "idle");
                _g_isDancing = false;
              }
              else
              {
                fadeAnimation ("idle", "dance");
                _g_isDancing = true;
              }
            });

            // this fades from idle to dancing animation
            function fadeAnimation (fromName, toName)
            {
                  var fromThis = _g_animations[ fromName ].play();
                  var toThis   = _g_animations[ toName   ].play();

                  fromThis.enabled = true;
                  toThis.enabled = true;

                  fromThis.crossFadeTo( toThis, 0.3 );
            }

  					function changeModel ()
            { //modelUrl
              /*
              if($scope.isDancing)
              {
                _g_animations.idle.play();
                $scope.isDancing = false;
              }
              else
              {
                _g_animations.dancing.play();
                $scope.isDancing = true;
              }
*/
  						//loader1.load(modelUrl, function (assimpjson) {
  						//	assimpjson.scale.x = assimpjson.scale.y = assimpjson.scale.z = 0.2;
  					  //	assimpjson.updateMatrix();
  					  //	if (previous) scene.remove(previous);
  					  //	scene.add(assimpjson);

  						//	previous = assimpjson;
  						//});
              /*
              if(!dancing) {
                //glScene.add(android);
                dancing = true;
              } else {
                var objName = glScene.getObjectByName(android.name);
                //glScene.remove(objName);
                dancing = false;
              }
              */
  					}

  					//loadModel(scope.assimpUrl);
  					animate();

  					function init() {

              var screenHeight = 4;
              var screenWidth  = screenHeight * 2;
              var camScreenDistance = 10;
              var camFloorHeight = 4;
              var camSkew = 0.2;

              _g_clock  = new THREE.Clock();

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

              // Youtube video page
              create3dPage(
                screenWidth,                 // width
                screenHeight,                // height
                new THREE.Vector3(0, 1, -7),  // position
                new THREE.Vector3(0, 0, 0)   // rotation
              );

              // XXX: Bug, perspective skew on Firefox -- potential work in progress
              //      fix below. Not ready to be uncommented.
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

              // Add the floor
              var floorHeight      = 1;
              var floorWidth       = 20;
              var floorWidthOffset = 0;
              var floorDepth       = 16;
              var floorDepthOffset = -2;
              var floorOpacity     = 0.3;
              var floorColor       = 0xffff00;
              var materialParams   = {
                transparent: true,
                opacity: floorOpacity,
                color: floorColor,
                side: THREE.DoubleSide
              };
              var floorGeometry = new THREE.PlaneGeometry( floorWidth, floorDepth, floorHeight );
              var floorMaterial = new THREE.MeshBasicMaterial( materialParams );
              var floorPlane    = new THREE.Mesh( floorGeometry, floorMaterial );

              floorPlane.rotation.x = Math.PI / 2;
              floorPlane.position.x = floorWidthOffset;
              floorPlane.position.z = floorDepthOffset;
              glScene.add( floorPlane );

              // Add models into a cache that can load
              var jsonLoader = new THREE.JSONLoader();

              // load animated model into the scene
              jsonLoader.load( "3d-assets/models/cuboid_kakula.json", loadAvatarModel );
              jsonLoader.load( "3d-assets/models/cuboid_mozter.json", loadAvatarModel );
              jsonLoader.load( "3d-assets/models/cuboid_spock.json",  loadAvatarModel );

              var light = new THREE.SpotLight( 0xffffff, 2, 4500 );
              light.position.set(0, 2, 6);
              light.castShadow = true;
              light.shadow.mapSize.width  = 1024;
              light.shadow.mapSize.height = 1024;
              light.shadowMapDarkness = 0.98;

              glScene.add( light );

              // setup the sky
              addSky();
  					}

            // create a new avatar object from the loaded geometry
            function loadAvatarModel ( geometry, materials )
            {
              var avatar = new Avatar ( geometry, materials );
              avatar.addToScene( glScene );
              _avatarGroup.add (avatar);
            }

            // XXX: DEPRECATED add a model to the scene
            /*
            function addModelToScene( geometry, materials )
            {

              //console.log("geometry: "  + JSON.stringify(geometry));
              //console.log("materials: " + JSON.stringify(materials));
              var scaleFactor = 0.05;
              var scale = 7 * scaleFactor;

              materials.forEach( function ( material ) {
                material.skinning = true;
                //material.shading = THREE.FlatShading;
              } );

//https://threejsdoc.appspot.com/doc/three.js/examples.source/webgl_materials.html.html
            	var mat  = new THREE.MeshFaceMaterial( materials );

            	var mesh = new THREE.SkinnedMesh( geometry, mat );


            	mesh.scale.set(scale, scale, scale);
              mesh.position.z = getRandomArbitrary(-3.0, 3.0); // (+)near, (-)far
              mesh.position.x = getRandomArbitrary(-3.0, 3.0); //(-)left-(+)right
              mesh.position.y = 1.0; //(+)up-(-)down

            //  mesh.rotateY(45);

              mesh.name = "chicken";


              // create animation
              //http://www.yomotsu.net/blog/2015/10/31/three-r73-anim.html
              //http://yomotsu.net/blog/2015/10/31/three-r73-anim.html
              _g_animations_mixer = new THREE.AnimationMixer( mesh );
              _g_animations.idle  = _g_animations_mixer.clipAction( geometry.animations[ 1 ] );
              _g_animations.dance = _g_animations_mixer.clipAction( geometry.animations[ 0 ] );
              _g_animations.idle.setEffectiveWeight( 1 );
              _g_animations.dance.setEffectiveWeight( 1 );

              // THREE.LoopOnce
              // THREE.LoopRepeat
              // THREE.LoopPingPong
              _g_animations.idle.setLoop( THREE.LoopRepeat );
            //  _g_animations.dance.setLoop( THREE.LoopOnce, 0 );
              _g_animations.dance.setLoop( THREE.LoopRepeat );
              _g_animations.idle.play();

              glScene.add( mesh );
            }
*/
            // a structure to hold shaders that are loaded from the server
            function dataLoader() {
                this.data_count = 0;
                this.data_array = new Array();
            }

            // a function to load the shaders into the structure
            function loadRemoteFile(file){
                return $http({
                  method: 'GET',
                  url: file
                }).then( function( response ) {
                  return response.data;
                });
            }

            function addSky () {
              //http://threejs.org/docs/#Reference/Materials/ShaderMaterial
            //  var geometry = new THREE.SphereGeometry(15, 15, 15);

              var geometry  = new THREE.PlaneGeometry(10, 20);

              // load shaders from remote instead of from the dom
              var fragShader = null;
              var vertShader = null;
              loadRemoteFile( "shaders/sky/fragment.c")
              .then( function (shader) {
                fragShader = shader;
                loadRemoteFile( "shaders/sky/vertex.c")
                .then( function (shader) {
                 vertShader = shader;
                  shaderMaterial = new THREE.ShaderMaterial( {
                    uniforms: {
                        uTime: { // float initialized to 0
                            type: "f",
                            value: 0.0
                        },
                        uRes: {
                            type: "v2",
                            value: new THREE.Vector2(40,40)
                        }
                    },
                    vertexShader:   vertShader,
                    fragmentShader: fragShader
                  });

                  skyBox = new THREE.Mesh(geometry, shaderMaterial);
                  //skyBox.scale.set(-1, 1, 1);
                  //skyBox.eulerOrder  = 'XZY';
                  skyBox.renderOrder = 1000.0;

                  skyBox.visible = true;

                  skyBox.position.x = 0;
                  skyBox.position.y = 0;
                  skyBox.position.z = -10;

                  skyBox.rotation = new THREE.Vector3( 0, 90, 0 );
                  glScene.add( skyBox );

                });
              });
            }

  					// handle window resize
  					function onWindowResize(event) {
              var h = angular.element(document.querySelector('#three-panel'))[0].offsetHeight;
              var w = angular.element(document.querySelector('#three-panel'))[0].offsetWidth;

  						glRenderer.setSize(w, h);
              cssRenderer.setSize(w, h);
  						camera.aspect = w / h;
  						camera.updateProjectionMatrix();
  					}

            // animate loop
  					function animate() {
  						requestAnimationFrame(animate);
  						render();
  					}

  					// rendering loop
  					function render() {

              /* XXX Make this model agnostic
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
              */
              var delta = _g_clock.getDelta();
              var theta = _g_clock.getElapsedTime();

              if ( _avatarGroup )
                _avatarGroup.update( delta );

              // This is a hack, it is for the shader applied to the sky material
              if (shaderMaterial)
                shaderMaterial.uniforms[ 'uTime' ].value = .00025 * ( Date.now() - start );

              glRenderer.render(glScene, camera);
              cssRenderer.render(cssScene, camera);
  				}

				}
			}
		}
	]);
})();
