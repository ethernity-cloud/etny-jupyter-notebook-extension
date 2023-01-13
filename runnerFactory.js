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
define(["base/js/dialog", './runnerV0', './runnerV1'], function (dialog, runnerV0, runnerV1) {
    const run = async (etnyRunnerVersion) => {
        switch (etnyRunnerVersion) {
            case 'v0':
                await runnerV0.run();
                break;
            case 'v1':
                await runnerV1.run();
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
