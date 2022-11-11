define(function (require, exports, module) {
    const events = require('base/js/events');
    const codeCell = require('notebook/js/codecell');
    const textCell = require('notebook/js/textcell');
    const CodeCell = codeCell.CodeCell;
    const MarkdownCell = textCell.MarkdownCell;


    const set_state = ($, cell, state) => {
        if (!(cell instanceof CodeCell || cell instanceof MarkdownCell)) {
            return;
        }

        state = state || 'normal';

        switch (state) {
            case 'normal':
                cell.metadata.editable = true;
                cell.metadata.deletable = true;
                if (cell.metadata.run_control !== undefined) {
                    delete cell.metadata.run_control.frozen;
                }
                break;
            case 'read_only':
            case 'readonly':
                cell.metadata.editable = false;
                cell.metadata.deletable = false;
                if (cell.metadata.run_control !== undefined) {
                    delete cell.metadata.run_control.frozen;
                }
                break;
            case 'frozen':
                cell.metadata.editable = false;
                cell.metadata.deletable = false;
                $.extend(true, cell.metadata, {run_control: {frozen: true}});
                break;
        }
        // remove whole object if it's now empty
        if (cell.metadata.run_control !== undefined && Object.keys(cell.metadata.run_control).length === 0) {
            delete cell.metadata.run_control;
        }
        cell.code_mirror.setOption('readOnly', !cell.metadata.editable);
        const prompt = cell.element.find('div.input_area');
        prompt.css("background-color", '#CCCCCC');
    };

    const setState = ($, cell, state) => {
        set_state($, cell, state);
        const dirty_state = {value: true};
        events.trigger("set_dirty.Notebook", dirty_state);
    }

    module.exports = {
        setState
    };
});