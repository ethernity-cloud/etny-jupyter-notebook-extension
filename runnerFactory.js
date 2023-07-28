/**
 * runnerFactory.js
 * An extension that allows to execute a task using an existing enclave provided by Ethernity Cloud Network
 *
 * @version 0.2.0
 * @author  Ciprian Florea, ciprian@ethernity.cloud
 * @updated 2023-01-09
 *
 *
 */
define(["base/js/dialog", './runnerV0', './runnerV1', './runnerV2Pynithy', './runnerV2Nodenithy', './runnerV3Pynithy', './runnerV3Nodenithy'], function (dialog, runnerV0, runnerV1, runnerV2Pynithy, runnerV2Nodenithy,  runnerV3Pynithy, runnerV3Nodenithy) {
    const run = async (etnyRunnerVersion) => {
        switch (etnyRunnerVersion) {
            case 'v0':
                await runnerV0.run();
                break;
            case 'v1':
                await runnerV1.run();
                break;
            case 'v2-pynithy':
                await runnerV2Pynithy.run();
                break;
            case 'v2-nodenithy':
                await runnerV2Nodenithy.run();
                break;
            case 'v3-pynithy':
                await runnerV3Pynithy.run();
                break;
            case 'v3-nodenithy':
                await runnerV3Nodenithy.run();
                break;
            default:
                dialog.modal({
                    title: "Ethernity Cloud",
                    body: "Please select the Ethernity Cloud Runner",
                    buttons: {OK: {class: "btn-primary"}},
                    notebook: Jupyter.notebook,
                    keyboard_manager: Jupyter.keyboard_manager,
                });

        }
    }

    return {
        run
    }
});
