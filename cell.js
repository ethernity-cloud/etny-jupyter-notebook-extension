define(function (require, exports, module) {
    const Jupyter = require('base/js/namespace');
    const events = require('base/js/events');
    const codeCell = require('notebook/js/codecell');
    const textCell = require('notebook/js/textcell');
    const utils = require('./utils');
    const $ = require('jquery');
    const CodeCell = codeCell.CodeCell;
    const MarkdownCell = textCell.MarkdownCell;


    const set_state = (cell, state) => {
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
                cell.metadata.deletable = true;
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

    const setState = async (cell, state) => {
        set_state(cell, state);
        await utils.delay(500);
        const dirty_state = {value: true};
        events.trigger("set_dirty.Notebook", dirty_state);
    }

    const insertCertificateCell = async (certificate) => {
        let cell = Jupyter.notebook.insert_cell_at_bottom('markdown');
        cell.set_text(`<div id="ethernity_certificate">${certificate}</div>`);
        cell.render();

        await utils.delay(1000);
        await setState(cell, 'frozen');
    }

    const deleteLastCells = async () => {
        const cells = Jupyter.notebook.get_cells();
        for (const cell of cells) {
            if (!(cell instanceof CodeCell || cell instanceof MarkdownCell)) {
                continue;
            }

            if (cell.get_text().toLowerCase().includes('starting running task') ||
                cell.get_text().toLowerCase().includes('ethernity cloud certificate')) {
                const index = Jupyter.notebook.find_cell_index(cell);
                if (index > 0) {
                    await setState(cell, 'normal');
                    Jupyter.notebook.delete_cell(index);
                }
            }
        }
        const dirty_state = {value: true};
        events.trigger("set_dirty.Notebook", dirty_state);
    }

    const extractPythonCode = () => {
        let code = '';
        const cells = Jupyter.notebook.get_cells();
        for (const cell of cells) {
            if (!(cell instanceof CodeCell)) {
                continue;
            }

            const source = cell.code_mirror.getValue();
            if (!source.startsWith("%%javascript")) {
                code = source;
                break;
            }
        }

        return code;
    }

    const insertLoadingCell = async (text) => {
        const loadingCell = Jupyter.notebook.insert_cell_at_bottom('code');
        loadingCell.set_text(text);
        loadingCell.render();

        await utils.delay(1000);

        await setState(loadingCell, 'frozen');

        return loadingCell;
    }

    const removeLastLine = (text) => {
        if (text.lastIndexOf("\n") > 0) {
            return text.substring(0, text.lastIndexOf("\n"));
        } else {
            return text;
        }
    }

    const writeMessageToCell = (loadingCell, loadingText, text) => {
        loadingText = `${loadingText}${text}\n`;
        loadingCell.set_text(loadingText);
        loadingCell.render();

        return loadingText;
    }

    const updateLastLineOfCell = (loadingCell, loadingText, text) => {
        let t = removeLastLine(loadingText);
        t = `${t}\n${text}\n`;
        loadingCell.set_text(t);
        loadingCell.render();

        return loadingText;
    }

    module.exports = {
        setState,
        insertCertificateCell,
        insertLoadingCell,
        extractPythonCode,
        writeMessageToCell,
        updateLastLineOfCell,
        deleteLastCells
    };
});