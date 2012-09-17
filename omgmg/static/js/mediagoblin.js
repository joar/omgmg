"use strict";

var MediaGoblin = function (endpoint) {
    return MediaGoblin.init(endpoint);
};

if (! ('sendAsBinary' in new XMLHttpRequest())) {
    console.log('Using sendAsBinary polyfill');
    XMLHttpRequest.prototype.sendAsBinary = function(datastr) {
        function byteValue(x) {
            return x.charCodeAt(0) & 0xff;
        }
        var ords = Array.prototype.map.call(datastr, byteValue);
        var ui8a = new Uint8Array(ords);
        this.send(ui8a.buffer);
    }
}

(function (mg) {
    mg.init = function (endpoint) {
        this.endpoint = endpoint;
        console.log('Initialized MediaGoblin client, using '
            + endpoint + ' as endpoint.');

        return this;
    };
    mg.get = function (url, cb) {
        var client = new XMLHttpRequest();

        client.addEventListener('readystatechange', function () {
            if (this.readyState == this.DONE) {
                if (this.status == '200') {
                    cb(JSON.parse(this.responseText));
                }
            }
        });

        client.open('GET', this.endpoint + url, true);
        client.setRequestHeader('Accept', 'application/json');
        client.send()
    };
    mg.multipartField = function (p) {
        var out = 'Content-Disposition: form-data';
        out += '; name="' + p.name + '"';
        out += p.filename ? '; filename="' + p.filename + '"' : '';
        out += '\r\n';
        out += p.type ? 'Content-Type: ' + p.type + '\r\n' : '';
        out += '\r\n';
        out += p.data + '\r\n';
        return out;
    };
    mg.createMultipartRequest = function (client, fields) {
        var boundary = 'MediaGoblinJavaScriptClient'
            + new String(Math.round(Math.random() * 1000, 0));

        client.setRequestHeader('Content-Type',
                'multipart/form-data; boundary=----' + boundary);

        var requestBody = '';
        [].forEach.call(fields, function (field) {
            requestBody += '------' + boundary + '\r\n';
            requestBody += mg.multipartField(field);
        });
        requestBody += '------' + boundary + '--';

        return requestBody;
    };
    mg.post = function (url, fields, cb, progress_cb) {
        var client = new XMLHttpRequest();

        client.addEventListener('readystatechange', function () {
            if (this.readyState == this.DONE) {
                if (this.status == 200) {
                    cb(JSON.parse(this.responseText));
                }
            }
        });

        client.upload.addEventListener('progress', progress_cb);

        client.open('POST', this.endpoint + url, true);

        var body = mg.createMultipartRequest(client, fields);

        client.sendAsBinary(body);
    };
})(MediaGoblin);
