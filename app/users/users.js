
/* All modules are loaded using requirejs define function */

define(['sarah'], function(app){

    /* Don't forget the return statement! */

    return {

        /* Collections are SarahJS's Model Layer */

        collections : {

            /* Users is the collection name. Once defined, it can be referenced from Sarah.Collections.Users */
            
            Users : {

                /* 'plugins' are what plugins the collection uses */
                plugins : {

                    /* Here we use localstorage */
                    localstorage : {}
                }
            }
        },

        /* Templates are SarahJS's View layer. */

        templates : {

            /* userList is the template name. Once defined, it can be referenced from Sarah.Templates.userList */

            userList : {

                /* Here we define the template html file. The file is placed in the same directory as this current file */

                template : 'userList.html',

                /* Events are defined here */

                events : {

                    /**
                     * Events are targeted using 'action querySelector'. 
                     * The anonymous function is a callback that is ran everytime the event triggers.
                     */

                    'click .details' : function() {
                        app.Router('/user/' + this._id);
                    },

                    /**
                     * The querySelector supports cascading as displayed below :
                     */

                    'click li .edit' : function() {
                        app.Router('/user/edit/' + this._id);
                    },

                    /**
                     * The anonymous function called on defined event is called with the event and element argument
                     * whereby the event is a normal javascript event object and the element is the element object which
                     * the event is bound to.
                     */

                    'click .delete' : function(event, elem) {
                        if(confirm('Are you sure you want to delete ' + this.name + '?')) {

                            /**
                             * We use the remove function to remove a record from a collection. 
                             * To view all collection methods, run Sarah.Collection.prototype from Developer Tools / 
                             * Firebug.
                             */

                            app.Collections.Users.remove({_id : this._id});
                        }
                    }
                }
            },
            userForm : {
                template : 'userForm.html',
                events : {

                    /**
                     *  The submit event is rigged so that the function context (this) is bound to the form data filled
                     *  in by the user.
                     */

                    'submit form' : function(event) {

                        /**
                         * The Collection.prototype.save method will choose the action to either insert or update the 
                         * data based on wether the _id parameter is set on the object being saved. By using this 
                         * method, we can use the same view for create / update / view details of the model.
                         */
                        app.Collections.Users.save(this);

                        /* This upon saving, redirect the user back. */
                        app.Router('/users');

                        /* For this to work, don't forget event.preventDefault and returning false. */
                        event.preventDefault();
                        return false;
                    }
                },

                /**
                 * The before and afterRender methods are called before and after the template is rendered to the dom.
                 * The afterRender method is particularly useful to handle jquery plugins that rely on dom rediness.
                 */

                beforeRender : function() {
                    console.log('Just about to render "userForm"! Hang on tight');
                },

                afterRender : function() {
                    console.log('Pheww!');
                },
            }
        },

        /* The routes argument is this Controller layer. */
        
        routes : {

            /* Routes are defined using '/path' followed by an anonymous functions */

            '/users' : function() {

                /* This is where we set the template's attributes, based on routes */
                app.Templates.userList.attributes({

                    /**
                     * Notice that the users property is referencing an anonymous function. This is where SarahJS's
                     * magic happens. The function will be run forever and whenever the variable changes, the template
                     * will be rerendered automagically.
                     */
                    users : function(){

                        /**
                         * The Collection.prototype.getAll method is used to return all data in the collection.
                         */
                        
                        return app.Collections.Users.getAll() || {};
                    }
                });

                /**
                 * The Template.prototype.setOutlet method is used to render a template inside an element which you can
                 * define using a querySelector In this case, we are rendering the userList template inside the #outlet
                 * div.
                 */

                app.Templates.userList.setOutlet('#outlet');
            },
            '/user/new' : function() {
                app.Templates.userForm.attributes({

                    /**
                     * If the value is static (non-changing) we can just pass this to the template and it will render
                     * accordingly.
                     */
                    state : 'new',
                    user : {},
                }).setOutlet('#outlet');
            },

            /**
             * Params are defined using :paramName. The route callback will be called with the paramName's value as it's
             * first argument.
             */
            '/user/:_id' : function(_id) {
                app.Templates.userForm.attributes({
                    state : 'view',
                    user : function(){

                        /**
                         * The Collection.prototype.get method is used to return a specific model in a the collection.
                         * The first argument is the _id for the model.
                         */
                        
                        return app.Collections.Users.get(_id) || {};
                    }
                }).setOutlet('#outlet');
            },
            '/user/edit/:_id' : function(_id) {
                app.Templates.userForm.attributes({
                    state : 'edit',
                    user : function(){
                        return app.Collections.Users.get(_id) || {};
                    }
                }).setOutlet('#outlet');
            }
        },

        /* Use preInit function to define a function for SarahJS to call before parsing the module config */

        preInit : function() {

            /* 'this' function context is the module config */
            console.log(this);
        },

        /* Use this to define a function to call after parsing the module config */

        postInit : function() {

            /* This is how we set the default route */
            app.Router('*', this.routes['/users']);
        }
    }
});