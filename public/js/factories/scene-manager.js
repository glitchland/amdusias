(function() {

    angular.module('amdusias')
        .factory('SceneManager', ['$log', '$rootScope', function SceneManager($log, $rootScope) {

            /* A small class to manage scene changes */
            var SceneChanges = function() {
                this.deleted = [];
                this.created = [];
                this.modified = [];
                this.hasUnpublishedChanges = false;
            };

            SceneChanges.prototype.getDeleted = function() {
                return this.deleted;
            };

            SceneChanges.prototype.getCreated = function() {
                return this.created;
            };

            SceneChanges.prototype.tainted = function(input = []) {
                if (input.length > 0)
                    this.hasUnpublishedChanges = true;
                return input;
            };

            SceneChanges.prototype.setDeleted = function(deleted) {
                this.deleted = this.tainted(deleted);
            };

            SceneChanges.prototype.setCreated = function(created) {
                this.created = this.tainted(created);
            };

            SceneChanges.prototype.setModified = function(modified) {
                this.modified = this.tainted(modified);
            };

            SceneChanges.prototype.toJSON = function() {
                let sceneChanges = {
                    "deleted": [],
                    "created": [],
                    "modified": []
                };

                sceneChanges.deleted = this.deleted;
                sceneChanges.created = this.created;
                sceneChanges.modified = this.modified;

                return sceneChanges;
            };

            // publish items to listeners if required
            SceneChanges.prototype.publishConditionally = function() {

                if (this.hasUnpublishedChanges) {
                    // notify three-view.js to update the scene
                    $rootScope.$emit('scene-changes', this.toJSON());
                    this.hasUnpublishedChanges = false;
                    $log.info("================================================");
                    $log.info("Published Scene Changes: " + JSON.stringify(this.toJSON()));
                    $log.info("================================================");
                }

            };

            /* A class to represent out layout for the level */
            var MyLevelState = function(guid) {
                this.localScene = {};
                this.currentChanges = {};
                this.tainted = false;
            };

            // search old data for items that are not in new data and remove
            MyLevelState.prototype.itemsInLeftNotInRight = function(left, right) {
                let itemsNotInRight = [];

                for (let item in left) {
                    if (right.hasOwnProperty(item))
                        continue;

                    itemsNotInRight.push(left[item]);
                }

                return itemsNotInRight;
            };

            MyLevelState.prototype.removeItemsFrom = function(here, items) {
                for (let item in items) {
                    delete here[item];
                }
            };

            MyLevelState.prototype.addItemsTo = function(here, items) {
                for (let item in items) {
                    here[item] = items[item];
                }
            };

            MyLevelState.prototype.mergeModified = function(localState, remoteState) {
                let modified = [];
                for (let key in remoteState) {
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
                let key = objJson.g;
                if (!key) {
                    throw "Could not get key from player JSON";
                }
                return key;
            };

            // this will only get called when the server decides
            // that the state needs to be synchronized
            // consumes : server JSON
            // produces : scene changes
            MyLevelState.prototype.processServerJSON = function(remoteScene) {

                let theseSceneChanges = new SceneChanges();

                // items not in remote scene tree but in local tree (deleted)
                let deletedItems = this.itemsInLeftNotInRight(this.localScene, remoteScene);
                // items not in local tree but in remote tree (created)
                let createdItems = this.itemsInLeftNotInRight(remoteScene, this.localScene);
                // items in both trees, but modified in remote tree
                let modifiedItems = this.mergeModified(this.localScene, remoteScene);

                theseSceneChanges.setDeleted(deletedItems);
                theseSceneChanges.setCreated(createdItems);
                theseSceneChanges.setModified(modifiedItems);

                // update the local scene tree
                this.removeItemsFrom(this.localScene, theseSceneChanges.getDeleted());
                this.addItemsTo(this.localScene, theseSceneChanges.getCreated());

                // XXX How do I tell my own player from other state?
                // Whats my guid? Get it from the server, and store it in thre scene, layout state renderer?
                theseSceneChanges.publishConditionally();

            };

            // initialize global gamestate
            let _myLevelState = new MyLevelState();

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
