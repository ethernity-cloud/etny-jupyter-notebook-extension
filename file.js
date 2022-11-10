define(function (require, exports, module) {
    const saveFile = (file, fileName, fileType = 'zip') => {
        let blobType = 'application/zip';
        const reader = new FileReader();
        reader.onload = function () {
            const blob = new Blob([file.data], {type: blobType});
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}.${fileType}`;
            a.click();
            window.URL.revokeObjectURL(url);
        };

        reader.readAsText(file.data);
    }
    module.exports = {
        saveFile
    };
});

