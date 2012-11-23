# Copyright (c) 2012, Joar Wandborg
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without modification,
# are permitted provided that the following conditions are met:
#
# *    Redistributions of source code must retain the above copyright notice,
#      this list of conditions and the following disclaimer.
# *    Redistributions in binary form must reproduce the above copyright notice,
#      this list of conditions and the following disclaimer in the
#      documentation and/or other materials provided with the distribution.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
# ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
# LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
# CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
# SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
# INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
# CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
# ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
# POSSIBILITY OF SUCH DAMAGE.

import logging
import json

from oauthlib.oauth2.draft25 import WebApplicationClient
from urllib2 import urlopen
from urllib import urlencode
from urlparse import urlunparse, urlparse
from jinja2 import Markup

from flask import Flask, render_template, request, url_for, redirect, session
from flask.ext.bootstrap import Bootstrap

_log = logging.getLogger(__name__)
logging.basicConfig()
_log.setLevel(logging.DEBUG)

app = Flask(__name__)
app.config.from_pyfile('../config.py')
Bootstrap(app)

mg_client = WebApplicationClient(app.config['CLIENT_ID'])
MG_SERVER = app.config['MG_SERVER']
#MG_SERVER = 'http://joar.pagekite.me'


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/mg/submit')
def mg_submit():
    mg_server_url = Markup(json.dumps(app.config['MG_SERVER']))
    processing_callback_url = Markup(json.dumps(url_for('processing_callback',
        _external=True)))
    return render_template('submit.html', mg_server_url=mg_server_url,
            processing_callback_url=processing_callback_url)


@app.route('/mg/logout')
def logout():
    del session['access_token']
    del session['user_info']
    return redirect(url_for('index'))


@app.route('/mg/authorize')
def mg_authorize():
    # Create URL to redirect client to
    callback_uri = url_for('mg_callback', _external=True)

    _log.debug('callback uri: {0}'.format(callback_uri))

    uri = mg_client.prepare_request_uri(
            MG_SERVER + '/oauth/authorize',
            redirect_uri=callback_uri,
            scope=[
                'full_control'])

    _log.debug('server url: {0}'.format(uri))

    return redirect(uri)


@app.route('/mg/callback')
def mg_callback():
    # Parse code from callback
    _log.debug('request url: {0}'.format(request.url))
    uri = request.url

    if not 'access_token' in session:
        data = mg_client.parse_request_uri_response(uri)

        token_data = mg_get_access_token(data['code'])
        _log.debug('token data: {0}'.format(token_data))
        session['access_token'] = token_data['access_token']

    about_you = mg_get_data('/api/test', session['access_token'])

    session['user_info'] = about_you

    return render_template(
            'callback.html',
            about_you=about_you)


@app.route('/processing-callback', methods=['POST'])
def processing_callback():
    _log.debug('processing callback: {0}'.format(request.json))
    return ''


def mg_get_access_token(code):
    token_uri = mg_client.prepare_request_uri(
            MG_SERVER + '/oauth/access_token',
            code=code,
            client_secret=app.config['SECRET_KEY'],
    )

    _log.debug('token uri: {0}'.format(token_uri))

    token_request = urlopen(token_uri)
    token_response = token_request.read()
    _log.debug('token response: {0}'.format(token_response))
    token_data = mg_client.parse_request_body_response(token_response)
    return token_data


def mg_get_data(uri, access_token, *qs):
    mg_server = urlparse(MG_SERVER)
    request_uri_parsed = (
            mg_server.scheme,
            mg_server.netloc,
            uri,
            '',
            urlencode({
                'client_id': app.config['CLIENT_ID'],
                'access_token': access_token}),
            None)

    _log.debug('mg uri parsed: {0}'.format(request_uri_parsed))

    request = urlopen(urlunparse(request_uri_parsed))
    response_json = request.read()

    response = json.loads(response_json)
    _log.debug('response: {0}'.format(response))

    return response
