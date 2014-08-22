# Marionette.Github.js

Marionette.Github.js provides a Backbone models/collections for User, Repository, Branches/Tags, Tree and Content APIs.
and Marionette's controller for the multiple files commit and conflicts detection.
  
## Installation

TBD

## Usage

Create a Github instance.

```js
var github = new Github({
  username: "YOUR_USER",
  token: "YOUR_TOKEN"
});
```

Get user and repositories

```js
// get loged-in user
var user = github.getUser(), // Backbone.Model

//get repositories
repos = user.getRepositries(), // Backbone.Collection
repo = repos.getRepository('REPO_NAME'),  // Backbone.Model
```

Get Branches and Tags

```js
// get branches
branches = repo.getBranches(), // Backbone.Collection
branch = branches.getBranch('BRANCH_NAME')   // Backbone.Model

// get Tags
tags = repo.getTags(), // Backbone.Collection
tag = branches.getTag('TAG_NAME'),   // Backbone.Model
```

Get Tree and CotnentCache

```js
// Raw tree
tree = branch.getTree(); // Backbone.Collection
tree.on("add", tree.loadSubTree, tree); // load tree recusively [just an example]
tree.fetch(); // start tree loading

// Content
var contentCache = branch.getContentCache(); // Backbone.Collection
contentCache.load({sha: 'SHA', path: 'path'}); // load content by sha or path
```

[Github API OAuth Overview] (http://developer.github.com/v3/oauth)
## User API
```js
var logedInUser = github.getUser();

var anyUser = github.getUser(username);
```

## Repository API

```js
// Get user repositories as Backbone.Collection
var userRepos = user.getRepositories();
// or
userRepos = github.getRepositories(username);

// Get repository item without collection fetch:
var repoItem = userRepos.getRepository('REPO_NAME'); // Backbone.Model
repoItem.fetch();


// Fetch all repositories from Gtihub
userRepos.fetch({
  success: function() {},
  error: functinon() {}
});

// common collection for all users:
userRepos.fetch({username: 'ANOTHER_USER'});

```

## Branches API

Branches API has a 

```js
// An empty Backbone.Collection
var Branches = repoItem.getBranches(),
// or
Branches = github.getBranches('USER_NAME', 'REPO_NAME');

// How to get branch:
branchItem = Branches.getBranch('BRANCH_NAME');
branchItem.fetch();

```

## Tree API
There is a raw tree implementation

```js
// An empty Backbone.Collection
var tree = branchItem.getTree();  // required fetched branch item
tree.fetch({recursive:false}); // extract root

// Lazy load of sub-tree
tree.loadSubTree(treeItem); // load sub tree for of the concreate model
```

## Content Cache API
Content cache uses for loading content from GitHub and keep it in cache and finally commit it:

```js
var contentCache = branchItem.getContentCache();
// return Backbone.Model
contentCache.loadContent({sha:sha, path:path}); // load content by SHA or PATH
```
