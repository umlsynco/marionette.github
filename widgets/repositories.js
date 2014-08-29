
define(['marionette'], function (Marionette, Bootstrap) {
    var DropDownItem = Marionette.ItemView.extend({
        tagName: 'li',
        template:  _.template('<a href="#"><%= full_name %></a>'),
        ui : {
            'menuItem': 'a'
        },
        triggers: {
            'click @ui.menuItem': 'menu:selected'
        }

    });

    var DropDownList = Marionette.CollectionView.extend({
       tagName: 'ul',
       className: 'dropdown-menu',
       childView: DropDownItem,
       onRender: function() {
           this.$el.attr('role', 'menu');
       }
    });

    var DropDownMenu = Marionette.LayoutView.extend({
        template: _.template('<button type="button" class="btn btn-primary btn-sm  dropdown-toggle" data-toggle="dropdown">Primary <span class="caret"></span></button>' +
        '<div class="mask"></div>'),
        onShow: function() {

           this.view = new  DropDownList({collection:this.collection});
           this.view.render();
           this.$el.append(this.view.$el);
        },
        onRender: function() {
            if (this.view) {
                this.view.render();
                this.$el.append(this.view.$el);
            }
        }
    });
/*
    <script type="text/html" id="dropdown-tpl">
        <button type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown">Primary <span class="caret"></span></button>
        <ul class="dropdown-menu" role="menu">
            <li></li>
            <li><a href="#">Another action</a></li>
            <li><a href="#">Something else here</a></li>
            <li class="divider"></li>
            <li><a href="#">Separated link</a></li>
        </ul>
        <div class="mask"></div>
    </script>*/

    return DropDownMenu;
});
