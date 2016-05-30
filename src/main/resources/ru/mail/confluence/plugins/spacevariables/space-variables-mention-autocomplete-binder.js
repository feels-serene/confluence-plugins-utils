(function($) {
    AJS.EventQueue = AJS.EventQueue || [];

    function activateMentions() {
        AJS.EventQueue.push({name: 'confluencementioninsert'});
        Confluence.Editor.Autocompleter.Manager.shortcutFired(CRMCLMentionCharacter, true);
    }

    function isAtKey(event) {
        return event && event.shiftKey && !event.ctrlKey && !event.altKey && !event.altGraphKey && !event.metaKey && event.which === 64;
    }

    tinymce.create('tinymce.plugins.InsertMention', {
        init : function() {
            AJS.bind('editor.text-placeholder.activated', function(e, data) {
                if (data && data.placeholderType === "mention") {
                    if(isAtKey(data.triggerEvent))
                        tinymce.dom.Event.cancel(data.triggerEvent);
                    activateMentions();
                }
            });
        }
    });

    tinymce.PluginManager.add('insertmention', tinymce.plugins.InsertMention);
})(AJS.$);

AJS.Rte.BootstrapManager.addOnInitCallback(function() {
    if (!Confluence.Editor.Autocompleter)
        Confluence.Editor.Autocompleter = tinymce.confluence.Autocompleter;

    Confluence.Editor.Autocompleter.Settings['#'] = {
        ch : '#',
        endChars : [],
        dropDownClassName: "space-variable-autocomplete-mentions",
        selectFirstItem: true,
        getHeaderText: function (autoCompleteControl, value) {
            return AJS.I18n.getText("ru.mail.confluence.plugins.spacevariables.suggestions");
        },
        getAdditionalLinks : function (autoCompleteControl, value, callback) {
            return [];
        },
        getDataAndRunCallback : function(autoCompleteControl, val, callback) {
            var unescapedVal = Confluence.unescapeEntities(val);
            var dropdownItems = [];
            $.ajax({
                type: 'GET',
                url: AJS.contextPath() + '/rest/spacevariables/1.0/spacevariable',
                data: {
                    spaceKey: AJS.params.spaceKey,
                    filter: unescapedVal,
                    limit: 5
                },
                success: function (result) {
                    for(var i = 0; i < result.length; i++) {
                        var variable = result[i];
                        console.log(variable);
                        var item = {
                            id: variable.id,
                            title: variable.name,
                            pageId: variable.page.id,
                            alias: variable.page.title,
                            link: variable.page.url,
                            type: 'page',
                            contentType: 'text',
                            className: "space-variable-autocomplete-mention",
                            html: Confluence.Editor.Autocompleter.Util.dropdownLink(variable.name + ' (' + variable.page.title + ')', '', 'icon-page')
                        };
                        dropdownItems.push(item);
                    }
                    callback([dropdownItems], val);
                },
                error: function(xhr) {
                    alert(xhr.responseText);
                }
            });
            callback([dropdownItems], val);
        },
        update : function(autoCompleteControl, link) {
            Confluence.Link.fromData({
                attrs: {
                    "data-base-url": AJS.Confluence.getBaseUrl(),
                    "data-linked-resource-id": link.pageId,
                    "data-linked-resource-type": link.type,
                    "data-linked-resource-content-type": link.contentType,
                    "data-linked-resource-default-alias": link.alias,
                    href: AJS.REST.findLink(link.link)
                },
                body: {
                    html: link.title,
                    text: link.title
                },
                classes: ["confluence-link"]
            }).insert();
        }
    };
});