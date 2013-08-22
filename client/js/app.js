/* TODOS
    - ACL
    - Backends
    - Validation
    - Modules
*/

/* Start App */

/* Define Collections */

var Users = new Collection('Users', {
    softDelete : false,
    persistance : {
        // todo : json sync
        rest: {
            path: '/api/users',
        },
        localStorage : {
            name : 'Users'
        }
    },
    fixtures : [{
        username: 'Zulfa',
        age: 27
    }, {
        username: 'Norseta',
        age: 29
    }]
});

var pages = [
    { link : '/', name : 'Home'},
    { link : '/users', name : 'Users'}
];

var active = '';

Template.menu.attributes({
    pages : function(){
        return pages;
    },
    active : function() {
        return active;
    }
});

Template.notification.events({
    'click .close' : function(event){
        Session.unsetFlash(event.data);
    }
});

Template.notification.attributes({
    messages : function() {
        var records = Session.getFlash().map(function(message){
            if(message.type === 'notification') {
                return message;
            }
        });
        return _.last(records, 5);
    }
});

/* Sets Default Outlets */

Template.notification.setOutlet('#notifications', true);
Template.menu.setOutlet('#menu', true);

/* Define Some Views */

var HomeView = new View('home', {
    layout : {
        '#main' : {
            template : Template.home,
            attributes : {
                title : function() {
                    return 'Home';
                }
            }
        }
    }
});

var UsersView = new View('users', {
    layout : {
        '#main' : {
            template : Template.fourEight,
            attributes : {
                title : function() {
                    return active;
                }
            }
        }
    },
    partials : {
        '#content' : {
            template : Template.userList,
            attributes : {
                tblSort : function() {
                    return {
                        sortBy : Session.get('userTblSortBy'),
                        sortDir : Session.get('userTblSortDir')
                    };
                },
                users : function() {
                    return Users.getAll().sort(function(a, b){
                        var by = Session.get('userTblSortBy'); 
                        return (Session.get('userTblSortDir') === 'up') ?
                            a[by] > b[by] :
                            a[by] < b[by];
                    });
                }
            },
            events : {
                'click .sortable' : function(event, element) {
                    var current = Session.get('userTblSortDir');
                    var $t = $(element);
                    if($t.data('prop') !== Session.get('userTblSortBy')) {
                        Session.set('userTblSortBy', $t.data('prop'));
                    }
                    var sortDir = (current === 'up') ? 'down' : 'up';
                    Session.set('userTblSortDir', sortDir);
                },
                'click .decr': function(event, element) {
                    var user = event.data;
                    Users.update({_id : user._id}, {age : user.age - 1});
                },
                'click .edit': function(event, element) {
                    var user = event.data;
                    Session.set('editUser', user);
                    Session.set('userFormState', 'Edit');
                },
                'click .incr': function(event, element) {
                    var user = event.data;
                    Users.update({_id : user._id}, {age : user.age + 1});
                },
                'click .remv': function(event, element) {
                    var user = event.data;
                    Users.remove({_id : user._id});
                    Session.set('editUser');
                    Session.set('userFormState', 'New');
                }
            }
        },
        '#sidebar' : {
            template : Template.userForm,
            events : {
                'click #setNew' : function(){
                    Session.set('userFormState','New');
                    Session.set('editUser');
                }
            },
            attributes : {
                state : function() {
                    return Session.get('userFormState');
                },
                user : function() {
                    return Session.get('editUser', []);
                }
            }
        }
    }
});


/* Add some routes */

Router.get('/', function(event){
    active = 'Home';
    HomeView.render();
});

Router.get('/users', function(event){
    active = 'Users';
    UsersView.render();

    /* On form post */
    Router.post('/user', function(event){
        event.target.reset();
        var obj = event.values;
        obj.age = parseInt(obj.age, 10);
        Users.insert(obj);
    });

    Router.post('/user/:id', function(event){
        event.target.reset();
        var obj = event.values;
        obj.age = parseInt(obj.age, 10);
        obj.updatedAt = new Date();
        Users.update({_id : event.params.id}, obj);
    });
});


