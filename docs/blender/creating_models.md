
http://stackoverflow.com/questions/28203846/three-js-blender-is-only-exporting-a-single-object
Select scene options
Export texture to disk if it is packed
Make sure mesh is parented to armature

```
'm using three.js r73. I'm looking at one of the examples, examples/webgl_skinning_simple.html. As is it works fine.

The model used in the example lives in examples/models/skinned/simple/. In this directory is the .js file imported by the example as well as the .blend file used to create it.

The problem I'm having is that if I load the blend file in blender and then export it I don't get usable JSON. Just loading the blend file and then exporting (enabling the Bones and Skinning checkboxes and setting Skeletal animations to "Rest" in the exporter) results in a JSON export with an empty animations array:

{
"normals": [-0.301492,-0.301492,-0.904508,-0.301492,-0.301492,0.904508,0.301492,-0.301492,0.904508,0.301492,-0.301492,-0.904508,0,0.707083,-0.707083,0,0.707083,0.707083,0.577349,0.577349,0.577349,0.577349,0.577349,-0.577349,-0.577349,0.577349,-0.577349,-0.577349,0.577349,0.577349,0.707083,0,-0.707083,0.707083,0,0.707083,0.577349,-0.577349,-0.577349,-0.577349,-0.577349,-0.577349,-0.707083,0,0.707083,-0.707083,0,-0.707083,-0.577349,-0.577349,0.577349,0.577349,-0.577349,0.577349],
"animations": [],
"faces": [33,0,1,2,3,0,1,2,3,33,4,5,11,10,4,5,6,7,33,1,5,6,2,1,5,5,2,33,6,7,15,14,5,4,8,9,33,4,0,3,7,4,0,3,4,33,8,10,11,9,10,7,6,11,33,5,1,9,11,5,1,11,6,33,0,4,10,8,0,4,7,10,33,0,8,18,16,0,10,12,13,33,12,14,15,13,14,9,8,15,33,7,3,13,15,4,3,15,8,33,2,6,14,12,2,5,9,14,33,2,12,22,20,2,14,16,17,33,17,16,18,19,16,13,12,17,33,9,1,17,19,11,1,16,17,33,8,9,19,18,10,11,17,12,33,1,0,16,17,1,0,13,16,33,21,20,22,23,12,17,16,13,33,13,3,21,23,15,3,12,13,33,12,13,23,22,14,15,13,16,33,3,2,20,21,3,2,17,12,33,4,7,6,5,4,4,5,5],
"skinIndices": [],
"uvs": [],
"name": "Cube.001Geometry",
"skinWeights": [],
"influencesPerVertex": 2,
"metadata": {
    "version": 3,
    "type": "Geometry",
    "vertices": 24,
    "normals": 18,
    "generator": "io_three",
    "uvs": 0,
    "faces": 22,
    "bones": 0
},
"bones": [],
"vertices": [1.51034,-1,-1,1.51034,-1,1,-0.489661,-1,1,-0.489661,-1,-1,1.51034,1,-1,1.51034,1,1,-0.489662,1,1,-0.489661,1,-1,3.23233,-1,-0.999999,3.23233,-1,1,3.23233,1,-0.999999,3.23233,1,1,-1.98848,-1,1,-1.98848,-1,-1,-1.98848,1,0.999999,-1.98848,1,-1,1.51034,-5.70811,-1,1.51034,-5.70811,1,3.23233,-5.70811,-0.999999,3.23233,-5.70811,1,-0.489661,-5.62708,1,-0.48966,-5.62708,-1,-1.98848,-5.62708,1,-1.98848,-5.62708,-1]
}
This appears to be because the mesh is not parented to the armature. Doing that (in object mode selecting the mesh, selecting the armature, and then hitting Ctrl-P and then selecting "With automatic weights") and then re-exporting results in an error: "Armature is not a valid mesh object". Some googling tells me that this is a quirk of recent builds of the exporter, and deselecting everything except the mesh before export yields a JSON export containing animations:

{
"normals": [-0.282418,-0.67925,-0.677358,-0.424085,0.174688,0.888607,0.240852,-0.608905,0.75576,0.405591,0.077914,-0.910703,0.069918,0.400647,-0.913541,-0.036134,0.917844,0.395215,0.568163,0.804376,0.173559,0.567186,0.16834,-0.806177,-0.031129,0.496384,0.867519,0.089602,0.873012,-0.479324,-0.559404,0.786401,-0.26191,-0.563891,0.265114,0.782098,0.704337,-0.381054,-0.598895,0.698752,0.390973,0.599048,0.58092,-0.798425,-0.158238,-0.574175,-0.803095,-0.159154,-0.705985,-0.311563,0.635975,-0.695151,0.3202,-0.643574,-0.581011,-0.774102,0.25132,0.574023,-0.778802,0.252846,-0.584796,-0.155614,0.796106,0.568834,-0.157781,0.807154,0.587298,-0.247291,-0.770623,-0.566118,-0.251869,-0.784875],
"animations": [{
    "length": 0.416667,
    "name": "ArmatureAction",
    "hierarchy": [{
        "keys": [{
            "scl": [1,1,1],
            "time": 0,
            "pos": [-1.24994,0.43791,0.191651],
            "rot": [0.232637,0,0,0.972564]
        },{
            "time": 0.208333,
            "pos": [-1.24994,0.43791,0.191651],
            "rot": [-0.289459,0.009033,-0.000455,0.957148]
        },{
            "scl": [1,1,1],
            "time": 0.416667,
            "pos": [-1.24994,0.43791,0.191651],
            "rot": [0.232637,0,0,0.972564]
        }],
        "parent": -1
    },{
        "keys": [{
            "scl": [1,1,1],
            "time": 0,
            "pos": [2.49995,0.280193,0.066556],
            "rot": [-0.2896,0,-0,0.957148]
        },{
            "time": 0.208333,
            "pos": [2.49995,0.280193,0.066556],
            "rot": [0.232524,-0.007256,0.000365,0.972564]
        },{
            "scl": [1,1,1],
            "time": 0.416667,
            "pos": [2.49995,0.280193,0.066556],
            "rot": [-0.2896,0,-0,0.957148]
        }],
        "parent": 0
    }],
    "fps": 24
}],
"faces": [33,0,1,2,3,0,1,2,3,33,4,5,11,10,4,5,6,7,33,1,5,6,2,1,5,8,2,33,6,7,15,14,8,9,10,11,33,4,0,3,7,4,0,3,9,33,8,10,11,9,12,7,6,13,33,5,1,9,11,5,1,13,6,33,0,4,10,8,0,4,7,12,33,0,8,18,16,0,12,14,15,33,12,14,15,13,16,11,10,17,33,7,3,13,15,9,3,17,10,33,2,6,14,12,2,8,11,16,33,2,12,22,20,2,16,18,19,33,17,16,18,19,20,15,14,21,33,9,1,17,19,13,1,20,21,33,8,9,19,18,12,13,21,14,33,1,0,16,17,1,0,15,20,33,21,20,22,23,22,19,18,23,33,13,3,21,23,17,3,22,23,33,12,13,23,22,16,17,23,18,33,3,2,20,21,3,2,19,22,33,4,7,6,5,4,9,8,5],
"skinIndices": [0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,0,0,0,0,0,0,0,0],
"uvs": [],
"name": "Cube.001Geometry.1",
"skinWeights": [0,0,0,0,0,0,0,0,0,0.868939,0,0.875994,0,0.905899,0,0.88856,0,0,0,0,0,0.977301,0,0.979217,0,0,0,0,0,0.983883,0,0.974775,0,0.997457,0,0.99792,0,0.999279,0,0.999454,0,0.998395,0,0.997626,0,0.999572,0,0.999166],
"influencesPerVertex": 2,
"metadata": {
    "version": 3,
    "type": "Geometry",
    "vertices": 24,
    "normals": 24,
    "generator": "io_three",
    "uvs": 0,
    "faces": 22,
    "bones": 2
},
"bones": [{
    "name": "leg.R",
    "rotq": [0,0,0,1],
    "parent": -1,
    "pos": [-1.24994,0.43791,0.191651]
},{
    "name": "leg.L",
    "rotq": [0,0,0,1],
    "parent": -1,
    "pos": [2.49995,0.280193,0.066556]

    }],
"vertices": [1.51034,-1.30307,-0.208094,1.51034,-0.322326,1.4784,-0.489661,-1.16521,0.323416,-0.489661,-0.368492,-1.43828,1.51034,0.444001,-1.14105,1.51034,1.29464,0.533973,-0.489662,0.650854,1.09887,-0.489661,1.34573,-0.683916,3.23233,-1.37654,-0.111386,3.23233,-0.267782,1.55314,3.23233,0.287986,-1.22015,3.23233,1.39675,0.444382,-1.98848,-1.21015,0.261836,-1.98848,-0.305127,-1.52168,-1.98848,0.573374,1.16685,-1.98848,1.47784,-0.616943,1.51034,-5.29493,2.49869,1.51034,-4.18617,4.16322,3.23233,-5.29493,2.49869,3.23233,-4.18617,4.16322,-0.489661,-5.33639,-1.83196,-0.48966,-4.43137,-3.61548,-1.98848,-5.33639,-1.83196,-1.98848,-4.43137,-3.61548]
}
Unfortunately, when this file is used in the example, it throws an error: "TypeError: l is undefined" in line 538 of three.min.js.

What I'm really looking for is an example or documentation or something covering how an export from blender and import into three.js is supposed to work. Most of the information I've been able to find is outdated, involving the r69 and earlier exporter, and even the official three.js examples and documentation disagree: the documentation covers THREE.AnimationHandler(), which appears to be deprecated, and the examples use THREE.AnimationMixer().

To be clear I'm specifically asking for information/documentation/examples/whatever specifically involving animations. Exporting non-animated objects from blender and importing them into three.js works fine.

Update: The "TypeError: l is undefined" error is due to needing to check the "Face Materials" (not "Materials") checkbox during export. Doing this and re-exporting results in a JSON file that loads with a different error: "Loader.createMaterial: Unsupported colorAmbient". This appears to be identical to r73 issue #7368. Removing the colorAmbient declaration allows the JSON to be loaded without error, but the result still doesn't render correctly. So I'm still looking for the correct ritual to export a blender animation into three.js.

Update:

Just to follow up on my own question, the steps appear to be:

Open up simple.blend in blender
Select the mesh
Go into edit mode
Under Properties > Data > Vertex Groups delete "topGroup" and "bottomGroup"
Go back to object mode
Select the mesh, select the armature, and the Ctrl-P to parent the mesh to the armature, selecting "With Automatic Weights"
Deselect the armature (e.g. by selecting the mesh again)
Export with the Bones, Skinning, Face Materials, and Materials checkboxes checked, and Skeletal animations set to Pose
Manually edit the output JSON to remove the colorAmbient declaration inside the materials section
The main gotcha here appears to be that any vertex group that's not associated with a bone causes problems: the animation will still render in three.js, it'll just be all munged up.

The other gotchas are that the current exporter requires that you not have the armature selected before export (and the export process twiddles the selection in some way, so it's best to manually re-select the mesh every time); and you have to manually edit the results of the export because the exporter doesn't generate righteous output.

If anyone understands the subject in greater depth, please chime in. Because although I solved this specific problem---getting the simplest possible toy problem from one of the official examples working---I still feel like I could use a real reference on the process. A checklist for exporting an animation created using a Rigify rig would be ideal, but at this stage of the game I'm not convinced that's even possible.
```
