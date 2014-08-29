require.config({
    'paths': {
        jquery: "lib/jquery.min",
        underscore: "lib/underscore-min",
        backbone: "lib/backbone-min",
        marionette: 'lib/backbone.marionette',
        github: 'marionette.github',
        base64: 'lib/base64'
    },
    shim: {
        jquery: {
            exports: 'jQuery'
        },
        underscore: {
            exports: '_'
        },
        github: {
            deps: ['underscore', 'base64', 'backbone', 'jquery', 'marionette'],
            exports: 'Github'
        },
        backbone: {
            deps: ['jquery', 'underscore'],
            exports: 'Backbone'
        },
        marionette: {
            deps: ['backbone'],
            exports: 'Marionette'
        },
    }
});

require(['github', 'marionette', 'widgets/repositories'], function (Github, Marionette, Repos) {
    var MyApp = new Marionette.Application();

    MyApp.addRegions({
        repos: "#repos",
        branches: "#branches"
    });

    var github = new Github({username: 'umlsynco', token: '60ff53bafae6051c7f3f1efee38abfe8f8385741'});
    var user = github.getUser('umlsynco');

    user.fetch();
    user.on("sync", function (x, y, z) {

    });

    var repos = user.getRepositories();

    MyApp.addInitializer(function (options) {

        // do useful stuff here
        var myView = new Repos({
            collection: repos
        });
        MyApp.repos.show(myView);

        repos.on("sync", function() {
            myView.render();
        });

        repos.fetch({add:true, remove: false, merge: false});
/*
        repos.on("add", function (repo) {
            var default_branch = repo.get("default_branch");
            var branches = repo.getBranches();

            branches.on("sync", function () {
                var branch = branches.getBranch(default_branch);
                if (branch) {
                    branch.on("sync", function () {
                        var tree = branch.getTree();
                        tree.fetch({success: function (data) {
                            // alert("HANDLE SUCCESS !!!");
                        }}); // Fetch root level
                        tree.on("add", function (model) {
                            // tree.loadSubTree(model);
                        });
                        github.commit(branch, tree, "message");
                    });
                    branch.fetch();
                }
            });

            branches.fetch();
        });
*/
    }); // APP INITIALIZER

    MyApp.start();
});
