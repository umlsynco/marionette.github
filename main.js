require.config({
    'paths' : {
        jquery : "lib/jquery.min",
        underscore : "lib/underscore-min",
        backbone : "lib/backbone-min",
		marionette: 'lib/backbone.marionette',
        github : 'marionette.github',
        base64 : 'lib/base64'
        },
    shim : {
        jquery : {
            exports : 'jQuery'
        },
        underscore : {
            exports : '_'
        },
        github : {
            deps : ['underscore', 'base64', 'backbone', 'jquery', 'marionette'],
            exports : 'Github'
        },
        backbone : {
            deps : ['jquery', 'underscore'],
            exports : 'Backbone'
        }
    }
});

require(['github'], function(Github) {
  var github = new Github({username:'umlsynco', token:'49f73b29795878a727847148976b9e9ced692e20'});
  var user = github.getUser('umlsynco');
  user.fetch();
  user.on("sync", function(x, y, z) { 
    
  });
  
  var repos = user.getRepositories();
  var repo = repos.getRepository("umlsync");

  repos.on("add", function(repo) {
    var default_branch = repo.get("default_branch");
    var branches = repo.getBranches();

    branches.on("sync", function() {
      var branch = branches.getBranch(default_branch);
      if (branch) {
	    branch.on("sync", function() {
           var tree = branch.getTree();
           tree.fetch({success: function(data){
             // alert("HANDLE SUCCESS !!!");
           }}); // Fetch root level
           tree.on("add", function(model) {
            // tree.loadSubTree(model);
           });
           github.commit(branch, tree, "message");
		});
		branch.fetch();
	   }
    });
    
    branches.fetch();
  });
});
