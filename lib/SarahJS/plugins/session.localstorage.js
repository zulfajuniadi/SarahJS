define(['sarah'], function(app){
    app.Session.data = app.Utils.Store.get('___session___') || {};
    app.Runtime.onClose.push(function(event) {
        if (app.Session)
            app.Utils.Store.set('___session___', app.Session.data);
    });

    return {};
});

