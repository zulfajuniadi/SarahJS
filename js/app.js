/* TODOS
    - ACL
    - Backends // https://github.com/lincolnbrito/php-ajax-long-polling
    - Validation
    - Layouts
    - Modules
*/

/* Start App */


/* Define Collections */
var Users = new Collection('Users', {
    softDelete : false,
    persistance : {
        // todo : json sync
        // json: {
        //     path: '/users',
        //     emulateHttp : false
        // },
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

Template.userList.tblSort = function() {
    return {
        sortBy : Session.get('userTblSortBy'),
        sortDir : Session.get('userTblSortDir')
    };
}

function setTableData() {
    Template.userList.users = function() {
        return Users.getAll().sort(function(a, b){
            return (Session.get('userTblSortDir') === 'up') ?
                a[Session.get('userTblSortBy')] > b[Session.get('userTblSortBy')] :
                a[Session.get('userTblSortBy')] < b[Session.get('userTblSortBy')];
        });
    }
}

setTableData();

Template.userList.events({
    'click .sortable' : function(event, element) {
        var current = Session.get('userTblSortDir');
        var $t = $(element);
        if($t.data('prop') !== Session.get('userTblSortBy')) {
            Session.set('userTblSortBy', $t.data('prop'));
        }
        var sortDir = (current === 'up') ? 'down' : 'up';

        Session.set('userTblSortDir', sortDir);
        setTableData();
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
});

Template.notification.events({
    'click .close' : function(event){
        Session.unsetFlash(event.data);
    }
});

Template.notification.messages = function() {
    var records = Session.getFlash().map(function(message){
        if(message.type === 'notification') {
            return message;
        }
    });
    return _.last(records, 5);
}

Template.userForm.events({
    'click #setNew' : function(){
        Session.set('userFormState','New');
        Session.set('editUser');
    }
});

Template.userForm.state = function() {
    return Session.get('userFormState');
}

Template.userForm.user = function() {
    return Session.get('editUser', []);
}

/* Add some routes for our forms */

Router.post('/deps/user', function(event){
    event.target.reset();
    var obj = event.values;
    obj.age = parseInt(obj.age, 10);
    Users.insert(obj);
});

Router.post('/deps/user/:id', function(event){
    event.target.reset();
    var obj = event.values;
    obj.age = parseInt(obj.age, 10);
    obj.updatedAt = new Date();
    Users.update({_id : event.params.id}, obj);
});

/* Sets Default Outlets */

Template.userList.setOutlet('#content');
Template.userForm.setOutlet('#sidebar');
Template.notification.setOutlet('#notifications');
