// http://jsfiddle.net/zbjLh/2/
(function() {
  angular.module('amdusias')
  .directive('threePanel', ['$window', function ($window) {
			return {
				restrict: "E",
				scope: {
					assimpUrl: "=assimpUrl"
				},
				link: function (scope, element, attr) {

					var camera;
					var scene;
          var object;
					var renderer;
					var previous;

					// init scene
					init();

					// Load jeep model using the AssimpJSONLoader
					//var loader1 = new THREE.AssimpJSONLoader();

					scope.$watch("assimpUrl", function(newValue, oldValue) {
						//if (newValue != oldValue) loadModel(newValue);
					});

					function loadModel(modelUrl) {
						//loader1.load(modelUrl, function (assimpjson) {
						//	assimpjson.scale.x = assimpjson.scale.y = assimpjson.scale.z = 0.2;
					//		assimpjson.updateMatrix();
					//		if (previous) scene.remove(previous);
					//		scene.add(assimpjson);

						//	previous = assimpjson;
						//});
					}

					//loadModel(scope.assimpUrl);
					animate();

					function init() {

            //XXX Put this on the login page !! :)
						camera = new THREE.PerspectiveCamera(50, $window.innerWidth / $window.innerHeight, 1, 2000);
            camera.position.z = 1000;

						scene = new THREE.Scene();
						scene.fog = new THREE.FogExp2(0x000000, 0.035);

            // Temporary geometry
            object = new THREE.Object3D();
            scene.add( object );

            var geometry = new THREE.SphereGeometry( 1, 4, 4 );
            var material = new THREE.MeshPhongMaterial( { color: 0xffffff, shading: THREE.FlatShading } );

            for ( var i = 0; i < 100; i ++ ) {
              material = new THREE.MeshPhongMaterial( { color: 0xffffff * Math.random(), shading: THREE.FlatShading } );

              var mesh = new THREE.Mesh( geometry, material );
              mesh.position.set( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 ).normalize();
              mesh.position.multiplyScalar( Math.random() * 400 );
              mesh.rotation.set( Math.random() * 2, Math.random() * 2, Math.random() * 2 );
              mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 50;
              object.add( mesh );
            }

						// Lights
						scene.add(new THREE.AmbientLight(0xcccccc));
						var directionalLight = new THREE.DirectionalLight(0xeeeeee); //Math.random() * 0xffffff
						directionalLight.position.x = Math.random() - 0.5;
						directionalLight.position.y = Math.random() - 0.5;
						directionalLight.position.z = Math.random() - 0.5;
						directionalLight.position.normalize();
						scene.add(directionalLight);

						// Renderer
						renderer = new THREE.WebGLRenderer();
            var h = angular.element(document.querySelector('#three-panel'))[0].offsetHeight;
            var w = angular.element(document.querySelector('#three-panel'))[0].offsetWidth;
						renderer.setSize(w,h); //element[0].innerWidth, element[0].innerHeight);
						element[0].appendChild(renderer.domElement);

						// Events
						$window.addEventListener('resize', onWindowResize, false);
					}

					//
					function onWindowResize(event) {
            var h = angular.element(document.querySelector('#three-panel'))[0].offsetHeight;
            var w = angular.element(document.querySelector('#three-panel'))[0].offsetWidth;

						renderer.setSize(w, h);
						camera.aspect = w / h;
						camera.updateProjectionMatrix();
					}

					//
					var t = 0;

					function animate() {
						requestAnimationFrame(animate);
						render();
					}

					//
					function render() {
						var timer = Date.now() * 0.0005;

						camera.position.x = Math.cos(timer) * 100;
						camera.position.y = 4;
						camera.position.z = Math.sin(timer) * 100;
						camera.lookAt(scene.position);
						renderer.render(scene, camera);
					}
				}
			}
		}
	]);
})();
