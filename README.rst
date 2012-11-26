===============================
OMGMG - GNU MediaGoblin client
===============================

:License: Apache License v2
:Author: `Joar Wandborg <http://wandborg.se>`_

OMGMG is a `GNU MediaGoblin <http://mediagoblin.org>`_  web client that
authenticates to a GNU MediaGoblin site (such as `gobblin.se
<http://gobblin.se>`_ or `mediagoblin.com <http://mediagoblin.com>`_) via
OAuth.


Install
-------

To install OMGMG, run::

    git clone <path-to-git-repo>
    cd omgmg/
    virtualenv .  # Create a python virtualenv
    source bin/activate  # Activate the virtualenv
    python setup.py develop  # Install the requirements


Use
---

To use OMGMG, you must have a GNU MediaGoblin account. You can either get an
account from any of the sites listed at `wiki.mediagoblin.org/Live_instances
<http://wiki.mediagoblin.org/Live_instances>`_ or `set up your own
<http://docs.mediagoblin.org/siteadmin/deploying.html>`_.


1. Visit ``/oauth/client/register`` on your GNU MediaGoblin site to
   register a new client. GNU MediaGoblin will give you values to fill
   into your OMGMG ``config.py``.
2. Copy ``config.py.sample`` to ``config.py``, then edit it to contain
   the values provided when you registered your client.
3. Start the server::

        python run.py

4. Go to http://localhost:8181.
