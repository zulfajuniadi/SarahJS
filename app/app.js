define([
    'sarah',
    
    /** 
     * Define modules here.
     *
     * Modules are placed in app/ModuleName directory whereby ModuleName is the Module's Name.
     * The directory *MUST* contain a .js file named according to the Modules' Name.
     * 
     * i.e. If you are creating a 'projects' module, you should create a directory named projects inside the app directory
     * with a 'projects.js' file inside the projects directory.
     * 
     * Modules are loaded using 'sarah.modules![ModuleName]' (make sure you don't leave out the exclamation mark).
     */

    /* Let's load the users module */
    'sarah.modules!users',
    // 'sarah.modules!anotherModule'
], function(app){

    /* Anything here will be ran after successful load of all modules. */

    console.log('All modules loaded!');

    /* Go to default route */

    // app.Router('#/');
});