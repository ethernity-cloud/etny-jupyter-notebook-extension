/**
 * main.js
 * An extension that allows to execute a task using an existing enclave provided by Ethernity Cloud Network
 *
 * @version 0.2.0
 * @author  Ciprian Florea, ciprian@ethernity.cloud
 * @updated 2022-11-08
 *
 *
 */
define(["require", 'jquery', "base/js/namespace", './runnerFactory'],
    function (requirejs, $, Jupyter, runnerFactory) {
        let etnyRunnerVersion = 'v3-pynithy';

        const startRunner = async () => {
            await runnerFactory.run(etnyRunnerVersion)
        }

        const createEtnyButton = () => {
            $('#maintoolbar-container')
                .append('<button id="runOnEthernityButton" style="margin-left: 4px;" class="btn btn-default" type="submit">' +
                    '<div style="display: flex;\n' + '  justify-content: center;\n' + '  align-items: center;">' +
                    '<svg style="margin-right: 2px;" width="36" height="18" viewBox="0 0 73 38" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                    '<path d="M72.3696 21.8934C71.0385 29.5846 63.3004 34.1812 56.5748 34.1812C54.1642 34.1812 51.9044 33.638 49.8693 32.5618C46.8686 36.0252 42.4631 38 37.7794 38C34.5272 38 31.4159 37.0444 28.7739 35.2272C28.6633 35.1535 28.5895 35.0227 28.5995 34.8886C28.6096 34.7478 28.6834 34.6271 28.8041 34.5634C30.0043 33.8895 31.1979 33.0111 32.3513 31.9617C32.425 31.898 32.5256 31.8611 32.6362 31.8611C32.7033 31.8611 32.7636 31.8711 32.8307 31.908C34.4836 32.7596 36.1566 33.1888 37.7827 33.1888C42.5939 33.1888 46.5032 29.4069 49.0144 26.5537C49.0881 26.4766 49.1887 26.4196 49.2994 26.4129H49.3295C49.4301 26.4129 49.5341 26.4498 49.6145 26.5235C51.5893 28.2938 54.1675 29.2661 56.8665 29.2661C59.7465 29.2661 62.4622 28.1731 64.5141 26.1983C64.5979 26.1178 64.6247 26.0944 64.6683 26.0508C65.9491 24.8337 66.7202 23.372 67.1795 21.7258C67.2265 21.5481 67.3941 21.4274 67.5785 21.4274H71.9672C72.0846 21.4274 72.2053 21.4844 72.279 21.5682C72.3629 21.6621 72.3997 21.7828 72.3729 21.8934H72.3696V21.8934Z" fill="url(#paint0_linear_4673_53665)"></path>' + '<path d="M18.7016 33.9364C15.0706 33.9364 11.691 32.4746 8.34832 29.4907C5.9947 27.2444 4.47926 24.3945 3.95288 21.2564H0.415741C0.194461 21.2564 0 21.082 0 20.8742V17.0118C0 16.7905 0.177696 16.6128 0.398977 16.6128H3.95288C4.78436 9.52178 11.8955 3.7383 19.808 3.7383C22.2354 3.7383 24.5085 4.29486 26.5403 5.40126C29.551 1.96806 33.9565 0 38.637 0C41.8791 0 45.0005 0.955531 47.6424 2.75595C47.7531 2.82971 47.8168 2.96047 47.8168 3.09123C47.8067 3.22198 47.7329 3.35274 47.6122 3.41644C46.412 4.08699 45.2184 4.9587 44.0651 5.99805C43.9913 6.06175 43.8907 6.10199 43.7801 6.10199C43.713 6.10199 43.6493 6.09193 43.5856 6.05505C41.9327 5.21016 40.2698 4.78436 38.6437 4.78436C33.9163 4.78436 30.1579 8.27121 27.4153 11.3188C27.3416 11.4027 27.2309 11.4597 27.1203 11.4597H27.1002C26.9895 11.4597 26.889 11.4228 26.8051 11.349C24.9477 9.6123 22.4365 8.66013 19.7409 8.66013C15.2617 8.66013 10.1454 11.3893 9.05575 16.6229H19.3621C19.5833 16.6229 19.7711 16.8006 19.7778 17.0118L19.8046 20.8742C19.8046 20.9814 19.7577 21.0854 19.6839 21.1558C19.6001 21.2295 19.4995 21.2664 19.3889 21.2664H9.02893C10.1655 26.3693 15.2818 29.0347 19.7409 29.0347C22.6042 29.0347 24.1867 28.7095 27.1102 26.1044L34.6103 18.9094C41.4801 11.8251 49.2584 3.79865 57.7073 3.79865C61.3384 3.79865 64.7179 5.25039 68.0505 8.22762C68.0874 8.25444 68.1344 8.28127 68.1612 8.31144C70.1829 10.3097 71.5977 12.7739 72.2415 15.4595C72.2784 15.5768 72.2415 15.6975 72.1677 15.788C72.0839 15.8886 71.9632 15.9356 71.8458 15.9356H67.6214C67.437 15.9356 67.2794 15.8249 67.2224 15.6606C65.8746 11.5435 61.563 8.65677 56.7317 8.65677C53.8383 8.65677 51.1661 9.73635 49.2249 11.6675C49.2249 11.6675 44.3936 16.1166 41.7349 18.8659C34.8819 25.9435 27.127 33.9398 18.6949 33.9498L18.7016 33.9364V33.9364Z" fill="#0C86FF"></path>' + '<defs><linearGradient id="paint0_linear_4673_53665" x1="28.5995" y1="29.712" x2="72.3796" y2="29.712" gradientUnits="userSpaceOnUse"><stop stop-color="#0C86FF"></stop><stop offset="1" stop-color="#0A42E7"></stop></linearGradient></defs>' + '</svg>' + 'Run on Ethernity Cloud' + '</div></button>');
            setTimeout(() => {
                $('#runOnEthernityButton').off('click',  startRunner).on('click', startRunner);
            }, 500);
        }

        const createVersionSelector = () => {
            const dropdown = $("<select></select>").attr("id", "etny_runner_version_picker")
                .css("margin-left", "0.75em")
                .attr("class", "form-control select-xs")
                .change(setEtnyRunnerVersion);
            Jupyter.toolbar.element.append(dropdown);

            //Add the header as the top option, does nothing on click
            const option = $("<option></option>")
                .attr("name", "etny_runner_version_header")
                .attr("id", "etny_runner_version_header")
                .text("Ethernity Cloud version");
            $("select#etny_runner_version_picker").append(option);

            const versions = [
                // { name: 'Ethernity Cloud v0', code: 'v0' },
                // { name: 'Ethernity Cloud v1', code: 'v1' },
                { name: 'Ethernity Cloud v2 - Pynithy', code: 'v2-pynithy' },
                { name: 'Ethernity Cloud v2 - Nodenithy', code: 'v2-nodenithy' },
                { name: 'Ethernity Cloud v3 - Pynithy', code: 'v3-pynithy' },
                { name: 'Ethernity Cloud v3 - Nodenithy', code: 'v3-nodenithy' }
            ];

            $.each(versions, function (key, version) {
                const option = $("<option></option>")
                    .attr("value", version['name'])
                    .attr("name", version['code'])
                    .attr("id", version['code'])
                    .text(version['name'])
                    .attr("code", version['code']);
                $("select#etny_runner_version_picker").append(option);
            });

            $("option#v3-pynithy").prop("selected", true);
        }

        const setEtnyRunnerVersion = (e) => {
            const selectedRunner = $("select#etny_runner_version_picker").find(":selected");
            console.log(selectedRunner);
            if (selectedRunner.attr("name") != 'etny_runner_version_header') {
                const code = selectedRunner.attr("code");
                etnyRunnerVersion = code;
                $("option#etny_runner_version").prop("selected", true);
            } else {
                etnyRunnerVersion = '';
            }

            console.log('Ethernity Cloud Runner version: ', etnyRunnerVersion);
        };

        const load_ipython_extension = async () => {
            console.log('loading....');
            createVersionSelector();
            createEtnyButton();
        }

        return {
            load_ipython_extension: load_ipython_extension,
        }
    });
