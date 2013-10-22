requirejs(['sarah'], function(app){
    var Utils = app.Utils;
    Utils.Modal = function(){
        $('body').append('<div class="modal fade" id="modal"><div class="modal-header" id="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h3 id="modal-title">Modal header</h3></div><div id="modal-body"></div>');
        return this;
    };

    Utils.Modal.prototype.setTitle = function(title) {
        $('#modal-title').html(title);
        return this;
    }

    Utils.Modal.prototype.setBody = function(template, data) {
        var data = data || {};
        if(typeof Template[template] !== 'undefined') {
            $('#modal-body').html(Template[template].render(data));
        }
        return this;
    }

    Utils.Modal.prototype.reset = function(template, data) {
        var data = data || {};
        if(typeof Template[template] !== 'undefined') {
            $('#modal-header').empty();
            $('#modal-title').empty();
        }
        return this;
    }

    Utils.Modal.prototype.show = function(options){
        if(options) {
            if(options.title){
                this.setTitle(options.title);
            }
            if(options.template) {
                options.data = options.data || {};
                this.setBody(options.template, options.data);
            }
        }
        $('#modal').modal('show');
    }

    Utils.Modal.prototype.hide = function(){
        $('#modal').modal('hide');
    }

    Utils.Modal = new Utils.Modal();
})


