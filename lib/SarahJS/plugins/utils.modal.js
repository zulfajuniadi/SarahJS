requirejs(['sarah'], function(app){
    var Utils = app.Utils;
    Utils.Modal = function(){
        $('body').append('<div class="modal fade" id="modal"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h4 id="modal-title"></h4><button type="button" class="btn btn-secondary close" data-dismiss="modal" aria-hidden="true">&times;</button></div><div class="modal-body" id="modal-body"><div id="modal-events"></div></div></div></div></div>');
        return this;
    };

    Utils.Modal.prototype.setTitle = function(title) {
        $('#modal-title').html(title);
        return this;
    }

    Utils.Modal.prototype.setBody = function(templateName, data) {
        var data = data || {};
        if(typeof app.Templates[templateName] !== 'undefined') {
            $('#modal-events').html(app.Templates[templateName].render(data));
        }
        app.Templates[templateName].bindEvents($('#modal-events')[0]);
        return this;
    }

    Utils.Modal.prototype.reset = function() {
        var data = data || {};
        $('#modal-title').empty();
        $('#modal-body').empty().html('<div id="modal-events"></div>');
        return this;
    }

    Utils.Modal.prototype.show = function(options){
        this.reset();
        if(options) {
            if(options.title){
                this.setTitle(options.title);
            }
            if(options.templateName) {
                options.data = options.data || {};
                this.setBody(options.templateName, options.data);
            }
        }
        $('#modal').modal('show');
    }

    Utils.Modal.prototype.hide = function(){
        $('#modal').modal('hide');
    }

    Utils.Modal = new Utils.Modal();
})


