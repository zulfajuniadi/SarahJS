define(['sarah'], function(app){
    return {
        collections : {
            Users : {
                plugins : {
                    localstorage : {}
                }
            }
        },
        templates : {
            'userList' : {
                template : 'userList.html',
                events : {
                    'click .details' : function() {
                        app.Router('/user/' + this._id);
                    },
                    'click .edit' : function() {
                        app.Router('/user/edit/' + this._id);
                    },
                    'click .delete' : function(event, elem) {
                        if(confirm('Are you sure you want to delete ' + this.name + '?')) {
                            app.Collections.Users.remove({_id : this._id});
                        }
                    }
                }
            },
            'userForm' : {
                template : 'userForm.html',
                events : {
                    'submit form' : function(event) {
                        app.Collections.Users.save(this);
                        app.Router('/users');
                        event.preventDefault();
                        return false;
                    }
                }
            }
        },
        routes : {
            '/users' : function() {
                app.Templates.userList.attributes({
                    users : function(){
                        return app.Collections.Users.getAll() || {};
                    }
                }).setOutlet('#outlet');
            },
            '/user/new' : function() {
                app.Templates.userForm.attributes({
                    state : 'new',
                    user : {},
                }).setOutlet('#outlet');
            },
            '/user/:uid' : function(uid) {
                app.Templates.userForm.attributes({
                    state : 'view',
                    user : function(){
                        return app.Collections.Users.get(uid) || {};
                    }
                }).setOutlet('#outlet');
            },
            '/user/edit/:uid' : function(uid) {
                app.Templates.userForm.attributes({
                    state : 'edit',
                    user : function(){
                        return app.Collections.Users.get(uid) || {};
                    }
                }).setOutlet('#outlet');
            }
        }
    }
});