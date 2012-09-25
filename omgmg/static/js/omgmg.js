'use strict';
var OMGMG = function(form, endpoint, progressElement) {
    OMGMG.init(form, endpoint, progressElement);
};

(function(omg) {
    omg.init = function (form, endpoint, progressElementWrapper) {
        if ('string' == typeof form)
            form = document.getElementById(form);
        omg.form = form;

        if ('string' == typeof progressElementWrapper)
            progressElementWrapper = document.getElementById(
                progressElementWrapper);
        omg.progressElementWrapper = progressElementWrapper;

        omg.mg = new MediaGoblin(endpoint);

        console.log('Form: ', omg.form);

        omg.form.addEventListener('submit', omg.onFormSubmit);
    };
    omg.onFormSubmit = function (e) {
        e.preventDefault();
        var form = this;
        var fileBlob = form.file.files[0];
        var fileReader = new FileReader();

        fileReader.onloadend = omg.onFileLoadEndHelper(
            new omg.onFileLoadEnd(form, fileBlob));

        fileReader.readAsBinaryString(fileBlob);
    };
    omg.onFileLoadEndHelper = function(callback) {
        var cb_func;
        if ('callback' in callback)
            cb_func = callback.callback;
        else
            cb_func = callback;

        return function (e) {
            console.log('callback: ', cb_func);
            // `this` is the FileReader object
            cb_func.apply(callback, [this, e]);
        };
    };
    omg.onFileLoadEnd = function (form, file) {
        this.form = form;
        this.file = file;
    };
    omg.onFileLoadEnd.prototype.callback = function (fileReader, progressEvent) {
        var form = this.form;
        var file = this.file;
        console.log(form, file, fileReader.result.length);

        var fields = [
                {
                    name: form.file.name,
                    type: file.type,
                    filename: file.name,
                    data: fileReader.result}];

        [].forEach.call(
            ['title', 'license', 'description'],
            function(fieldName) {
                if ('license' == fieldName)
                    fields.push({
                        name: fieldName,
                        data: omg.getRadioValue(form[fieldName])});
                else
                    fields.push({
                        name: fieldName,
                        data: form[fieldName].value});
            });

        fields.push({
            name: 'callback_url',
            data: window.PROCESSING_CALLBACK_URL});

        omg.form.style.display = 'none';
        omg.progressElementWrapper.style.display = 'block';

        omg.mg.post(
            '/api/submit?access_token='
            + encodeURIComponent(form.access_token.value),
            fields,
            omg.onSubmitSent,
            omg.onProgress);
    };
    omg.getRadioValue = function(radioElements) {
        var value;
        [].forEach.call(radioElements, function (element) {
            console.log('element: ', element);
            if (element.checked)
                value = element.value;
        });

        return value;
    };

    omg.onProgress = function(pe) {
        var progressBar =
            omg.progressElementWrapper.getElementsByClassName('bar')[0];
        var progressElement =
            omg.progressElementWrapper.getElementsByClassName('progress')[0];

        if (pe.lengthComputable) {
            var progress = pe.loaded / pe.total * 100;

            console.log('progress: ', progress);

            if (100 == progress) {
                progressBar.style.width = '100%';
                progressElement.classList.add('active');
                progressElement.classList.add('progress-striped');
                return;
            }

            if (progressElement.classList.contains('active')) {
                progressElement.className = 'progress';
            }

            progressBar.style.width = progress + '%';
        } else {
            console.log('!lengComputable');
            progressBar.style.width = '100%';

            progressElement.classList.add('active');
            progressElement.classList.add('progress-striped');
        }
        console.log(pe);
    };

    omg.onSubmitSent = function (response) {
        console.log(response);
        var uploadResult = document.getElementById('upload-result');

        uploadResult.style.display = 'block';
        omg.progressElementWrapper.style.display = 'none';

        if (response.error) {
            var uploadErrorElement = document.getElementById('upload-error');
            var errorMessageElement =
                document.getElementById('upload-error-message');

            errorMessageElement.textContent = response.error;
            uploadErrorElement.style.display = 'block';
            return;
        }

        var uploadSuccessElement = document.getElementById('upload-success');

        if ('unprocessed' == response.state) {
            document.getElementById('async-processing').style.display = 'block';
            var processingPanelLink =
                document.getElementById('processing-panel-link');
            var link = response.user_permalink + 'panel';
            processingPanelLink.href = processingPanelLink.textContent = link;
        } else {
            document.getElementById('sync-processing').style.display = 'block';
            var entryLink = document.getElementById('entry-link');
            entryLink.href = entryLink.textContent = response.permalink;
        }

        /*
        var successDataElement =
            document.getElementById('upload-success-data');

        successDataElement.textContent = JSON.stringify(response);
        */
        uploadSuccessElement.style.display = 'block';
    };
})(OMGMG);

new OMGMG('submit-form', window.MG_SERVER, 'upload-progress');
