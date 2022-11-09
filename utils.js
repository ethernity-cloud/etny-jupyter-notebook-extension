define(function (require, exports, module) {
    const delay = ms => new Promise(res => setTimeout(res, ms));
    const getCurrentTime = () => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        const yyyy = today.getFullYear();

        return mm + '/' + dd + '/' + yyyy;
    }
    module.exports = {
        delay,
        getCurrentTime
    };
});