(function() {

    angular.module('amdusias')
        .factory('SceneManager', ['$log', '$rootScope', function SceneManager($log, $rootScope) {

            /* A small class to manage scene changes */
            var SceneChanges = function() {
                this.deleted = [];
                this.created = [];
                this.modified = [];
            };

            SceneChanges.prototype.getDeleted = function() {
                return this.deleted;
            };

            SceneChanges.prototype.getCreated = function() {
                return this.created;
            };

            SceneChanges.prototype.setDeleted = function(deleted) {
                this.deleted = deleted;
            };

            SceneChanges.prototype.setCreated = function(created) {
                this.created = created;
            };

            SceneChanges.prototype.setModified = function(modified) {
                this.modified = modified;
            };

            SceneChanges.prototype.toJSON = function() {
                var sceneChanges = {
                    "deleted": [],
                    "created": [],
                    "modified": []
                };

                sceneChanges.deleted = this.deleted;
                sceneChanges.created = this.created;
                sceneChanges.modified = this.modified;

                return sceneChanges;
            };

            /* A class to represent out layout for the level */
            var MyLevelState = function(guid) {
                this.localScene = {};
                this.currentChanges = {};
                this.tainted = false;
            };

            // search old data for items that are not in new data and remove
            MyLevelState.prototype.itemsInLeftNotInRight = function(left, right) {
                var itemsNotInRight = [];

                for (var item in left) {
                    if (right.hasOwnProperty(item))
                        continue;

                    itemsNotInRight.push(left[item]);
                }

                return itemsNotInRight;
            };

            MyLevelState.prototype.removeItemsFrom = function(here, items) {
                for (var item in items) {
                    delete here[item];
                }
            };

            MyLevelState.prototype.addItemsTo = function(here, items) {
                for (var item in items) {
                    here[item] = items[item];
                }
            };

            MyLevelState.prototype.mergeModified = function(localState, remoteState) {
                var modified = [];
                for (var key in remoteState) {
                    // if it is tanted, add to modified, and update local state
                    if (remoteState[key].t === "1") {
                        localState[key] = remoteState[key];
                        localState[key].t = "0";
                        modified.push(localState[key]);
                    }
                }
                return modified;
            };

            // generate a key for the player json
            MyLevelState.prototype.key = function(objJson) {
                var key = objJson.g;
                if (!key) {
                    throw "Could not get key from player JSON";
                }
                return key;
            };

            // this will only get called when the server decides
            // that the state needs to be synchronized
            // consumes : server JSON
            // produces : scene changes
            MyLevelState.prototype.processServerJson = function(remoteScene) {

                /* XXX TEST DATA
                    // local copy
                    var testPlayer1L = {t: "0", "g":"56b980a97168211b0ad94fa2","m":"spock","p":{"x":7,"y":7,"z":1},"d":"0"};
                    // Remote copy
                    var testPlayer1R = {t: "1", "g":"56b980a97168211b0ad94fa2","m":"spock","p":{"x":7,"y":8,"z":1},"d":"1"};

                    var testPlayer2R = {t: "0", "g":"66b980a97168211b0ad94fa2","m":"spock","p":{"x":7,"y":7,"z":1},"d":"0"};
                    var testPlayer3R = {t: "0", "g":"76b980a97168211b0ad94fa2","m":"spock","p":{"x":7,"y":7,"z":1},"d":"0"};

                    // removed
                    var testPlayer4  = {t: "0", "g":"86b980a97168211b0ad94fa2","m":"spock","p":{"x":7,"y":7,"z":1},"d":"0"};

                    var localScene   = {};
                    var remoteScene  = {};

                    //this.localScene

                    //  XXX need to put same key function on server
                    remoteScene[key(testPlayer1R)] = testPlayer1R;
                    remoteScene[key(testPlayer2R)] = testPlayer2R;
                    remoteScene[key(testPlayer3R)] = testPlayer3R;

                    localScene[key(testPlayer1L)]  = testPlayer1L;
                    localScene[key(testPlayer4)]   = testPlayer4;

                    // Instantiate a scene changes here

                    var sceneChanges = {
                      "deleted":  [],
                      "created":  [],
                      "modified": []
                    }
                    // update removed items
                    console.log("Before Changes");
                    console.log("================================================");
                    console.log("remoteScene: " + JSON.stringify (remoteScene));
                    console.log("localScene : " + JSON.stringify (localScene));
                    console.log("================================================");

                    // scenechanges setDeleted
                    //
                    */
                var theseSceneChanges = new SceneChanges();

                var deletedItems = this.itemsInLeftNotInRight(this.localScene, remoteScene);
                var createdItems = this.itemsInLeftNotInRight(remoteScene, this.localScene);
                var modifiedItems = this.mergeModified(this.localScene, remoteScene);
                theseSceneChanges.setDeleted(deletedItems);
                theseSceneChanges.setCreated(createdItems);
                theseSceneChanges.setModified(modifiedItems);


                // scenechanges getDeleted()
                this.removeItemsFrom(localScene, theseSceneChanges.getDeleted());
                // scenechanges getCreated()
                this.addItemsTo(localScene, theseSceneChanges.getCreated());

                console.log("(After Updated) localScene : " + JSON.stringify(localScene));
                console.log("================================================");
                console.log("Scene Changes: " + JSON.stringify(sceneChanges));
                console.log("================================================");

                // XXX How do I tell my own player from other state?
                // Whats my guid? Get it from the server, and store it in thre scene, layout state renderer

                // If there are changes, this will notify three-view.js to add
                // or remove the characters from the scene .
                $rootScope.$emit('scene-changes', theseSceneChanges.toJSON());

            };

            // initialize global gamestate
            var _myLevelState = new MyLevelState();

            ///////////////////////////////////////////////////////////////////////
            // exported
            return {
                updateSceneFromRemoteState: updateSceneFromRemoteState,
                getCharacterData: getCharacterData
            };

            // return my game state, or an empty object if there is no change
            // since the last time we checked
            function updateSceneFromRemoteState(jsonState) {
                _myLevelState.processServerJSON(jsonState);
            }

            function getCharacterData() {
                return _myLevelState.getCharacterData();
            }

        }]);

})();
