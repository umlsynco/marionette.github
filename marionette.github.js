// Backbone.Github.js 0.0.1
// (c) 2014 Evgeny Alexeyev 

define(['jquery', 'underscore', 'base64', 'backbone', 'marionette'], function (jQuery, _, Base64, Backbone, Marionette) {

    var API_URL = 'https://api.github.com';

    var Github = Marionette.Controller.extend({

        initialize: function (options) {
            var token = options.token;
            var user = options.username;
            // Wrap basic methods of Backbone
            var wrapSync = function (method, model, options) {
                var beforeSend = options.beforeSend;
                // wrap before send method
                options.beforeSend = function (xhr) {
                    // Setup request headers
                    xhr.setRequestHeader('Accept', 'application/vnd.github.v3.raw+json');
                    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
                    if (token) {
                        xhr.setRequestHeader('Authorization', 'token ' + token);
                    }
                    // apply an original before send method
                    if (beforeSend) return beforeSend.apply(this, arguments);
                };

                if (this.getUrl) {
                    options.url = this.getUrl.apply(this, arguments);
                }
                // Call the Backbone.sync
                Backbone.Model.prototype.sync.apply(this, arguments);
            };

            Backbone.GithubModel = Backbone.Model.extend({
                sync: wrapSync
            });

            Backbone.GithubCollection = Backbone.Collection.extend({
                sync: wrapSync
            });

            var TreeModel = Backbone.GithubModel.extend({
                //repos/:owner/:repo/git/trees
                url: function (args) {
                    var username = this.login;
                    var reponame = this.repository;
                    var sha = this.get("sha");
                    // TODO: check how to update tree
                    if (sha) {
                        return API_URL + "/repos/" + username + "/" + reponame + "/git/trees/" + sha;
                    }
                    else {
                        return API_URL + "/repos/" + username + "/" + reponame + "/git/trees";
                    }
                }
            });


            //////////////////////////////////////////////// RAW TREE
            var TreeCollection = Backbone.GithubCollection.extend({
                model: TreeModel,
                getUrl: function (method, model, options) {
                    if (method == "read") {
                        var username = this.login;
                        var reponame = this.repository;
                        var sha = options.sha || this.commit.sha;
                        return API_URL + "/repos/" + username + "/" + reponame + "/git/trees/" + sha;
                    }
                },
                parse: function (resp, options) {
                    return resp.tree;
                },
                initialize: function (options) {
                    this.commit = options.commit;         // Commit SHA
                    this.repository = options.repository; // Repository name
                    this.branch = options.branch;         // Branch name [optional]
                    this.login = options.login;           // username
                },
                loadSubTree: function (model) {
                    if (model.get("type") == "tree" && model.get("sha")) {
                        this.fetch({sha: model.get("sha")});
                    }
                }
            });

            //////////////////////////////////////////////// BRANCH
            var BranchModel = Backbone.GithubModel.extend({
                url: function (args) {
                    var username = this.login;
                    var reponame = this.repository;
                    var branch = this.get("branch");
                    return API_URL + "/repos/" + username + "/" + reponame + "/branches/" + branch;
                },
                initialize: function (options) {
                    this.login = options.login;
                    this.repository = options.repository;
                },
                getTree: function (commit) {
                    if (this.tree) {
                        this.tree.setCommit(commit || this.get("commit"));
                        return this.tree;
                    }
                    else {
                        this.tree = new TreeCollection({login: this.login, repository: this.repository, branch: this.get("branch"), commit: commit || this.get("commit")});
                    }
                    return this.tree;
                },
                getContentCache: function () {
                    return null;
                }
            });

            var Branches = Backbone.GithubCollection.extend({
                // Groups is an abstraction which allow us to have tags and branches in a single collection
                groups: [
                    {title: "Branches", isDefault: true},
                    {title: "Tags"}
                ],
                defaultGroup: "Branches",
                getUrl: function (method, model, options) {
                    if (method == "read") {
                        var group = options.group || this.defaultGroup;
                        if (group == 'Tags') {
                            return API_URL + "/repos/" + this.login + "/" + this.repository + "/tags";
                        }
                        else {
                            return API_URL + "/repos/" + this.login + "/" + this.repository + "/branches";
                        }
                    }
                    return "/";
                },
                getBranch: function (name) {
                    return this._getRef(name, 'Branches');
                },
                getTag: function (name) {
                    return this._getRef(name, 'Tags');
                },
                _getRef: function (name, group) {
                    var models = this.where({branch: name});
                    if (models.length == 0) {
                        // describe model
                        var model = new BranchModel({branch: name, login: this.login, repository: this.repository, group: group});
                        // add on fetch completion
                        var that = this;
                        model.on("sync", function () {
                            that.add(model);
                        });
                        return model;
                    }
                    else {
                        return models[0];
                    }
                },
                initialize: function (options) {
                    this.login = options.login;
                    this.repository = options.repository;

                    // extend model opptions with login
                    this.modelOptions = {
                        login: this.login,
                        repository: this.repository
                    };
                },
                model: function (attrs, options) {
                    var opt = $.extend({}, options, this.modelOptions);
                    return new BranchModel(attrs, opt);
                }
            });

            var Tags = Branches.extend({defaultGroup: 'Tags'});

            //////////////////////////////////////////////// REPOSITORY
            var RepositoryModel = Backbone.GithubModel.extend({
                url: function (args) {
                    var username = this.login;
                    var reponame = this.get("name");
                    return API_URL + "/repos/" + username + "/" + reponame;
                },
                initialize: function (options) {
                    this.login = options.login;
                },
                getBranches: function () {
                    if (!this.branches) {
                        this.branches = new Branches({login: this.login, repository: this.get("name"), group: 'Branches'});
                    }
                    return this.branches;
                },
                getTags: function () {
                    if (!this.tags) {
                        this.tags = new Branches({login: this.login, repository: this.get("name"), group: 'Tags'});
                    }
                    return this.tags;
                },
            });

            var Repositories = Backbone.GithubCollection.extend({
                url: function () {
                    return API_URL + (this.login ? "/users/" + this.login + "/repos" : "/user/repos");
                },
                getRepository: function (name) {
                    var models = this.where({name: name});
                    if (models.length == 0) {
                        // describe model
                        var model = new RepositoryModel({name: name, login: this.login});
                        // fetch model
                        model.fetch();
                        // add on fetch completion
                        var that = this;
                        model.on("sync", function () {
                            that.add(model);
                        });
                    }
                    return model;
                },
                initialize: function (options) {
                    this.login = options.login;
                    // extend model options with login
                    this.modelOptions = {
                        login: this.login
                    };
                },
                model: function (attrs, options) {
                    var opt = $.extend({}, options, {login: this.login});
                    return new RepositoryModel(attrs, opt);
                }
            });

            //////////////////////////////////////////////// USER
            var UserModel = Backbone.GithubModel.extend({
                url: function () {
                    var name = this.get("login");
                    return API_URL + "/" + (name ? "users/" + name : "user");
                },
                getRepositories: function () {
                    if (!this.repositories) {
                        this.repositories = new Repositories({login: this.get("login")});
                    }
                    return this.repositories;
                }
            });

            //////////////////////////////////////////////// Controller API
            this.getUser = function (username) {
                return new UserModel({login: username});
            };

            this.getRepositories = function (username) {
                return new Repositories({login: username});
            };

            this.getRefs = function (full_name) {
                var items = full_name.split("/");
                if (items.length != 2) return null;
                return new Branches({login: items[0], repository: items[1]});
            };

            this.getTree = function (full_name, commit) {
                var items = full_name.split("/");
                if (items.length != 2) return null;
                return new Branches({login: items[0], repository: items[1], commit: commit});
            };

            this.workingStack = new Array(); // {event, context}
            this.on("github:continue", this.onContinue, this);
            this.on("github:commit:head", this.onCommitHead, this);
            this.on("github:commit:commit", this.onCommitCommit, this);
            this.on("github:commit:tree", this.onCommitTree, this);
            this.on("github:commit:blob", this.onCommitBlob, this);
        },
        onContinue: function(context) {
          var next = this.workingStack.pop();
          this.trigger(next.event, $.extend({}, next.context, context));
        },
        onCommitBlob: function(args) {
          var branch = args[0],
              tree = args[1],
              contentCache = args[2],
              message = args[3];

          this.trigger("github:continue", {branch:branch});
        },
        onCommitTree: function(args) {
            var branch = args[0],
                tree = args[1],
                contentCache = args[2],
                message = args[3];

            this.trigger("github:continue", {branch:branch});
        },
        onCommitCommit: function(args) {
            var branch = args[0],
                tree = args[1],
                contentCache = args[2],
                message = args[3];

            this.trigger("github:continue", {branch:branch});
        },
        onCommitHead: function(args) {
            var branch = args[0],
                tree = args[1],
                contentCache = args[2],
                message = args[3];

            this.trigger("github:continue", {branch:branch});
        },
        // TODO: think about how to make each operation available from API.
        //       For example: patch tree or commit blob or update head
        commit: function(branch, tree, contentCache, message) {
            // clone branch because someone could be subscribed on it's changes
            var context = {branch:branch, tree:tree, contentCache:contentCache, message:message};
            this.workingStack.push({event:"github:commit:head", context:context});
            this.workingStack.push({event:"github:commit:commit", context:context});
            this.workingStack.push({event:"github:commit:tree", context:context});
            this.workingStack.push({event:"github:commit:blob", context:context});

            // Clone branch before check for conflicts and get the latest head
            var cb = branch.clone();
            this.checkForConflicts(cb, tree);
        },
        reload: function(branch, tree, content) {
            // TODO: think about how to reload tree and check for conflicts
            this.checkForConflicts(branch, tree);
        },
        checkForConflicts: function(branch, tree) {
            // Note: there is no 'change' event on fetch of no data change happen
            // Check if branch head was changed
            branch.on("sync", function(data) {
                // Check for changes
                // Continue if everything is Ok
                this.trigger("github:continue", {branch:branch});
            }, this);

            branch.fetch();
        }
    });

    return Github;
});
