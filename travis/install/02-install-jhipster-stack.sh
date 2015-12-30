#!/bin/bash
set -ev
#-------------------------------------------------------------------------------
# Install yeoman, bower, grunt and gulp
#-------------------------------------------------------------------------------
npm install -g yo
npm install -g bower
npm install -g grunt-cli
npm install -g gulp
npm install -g generator-jhipster
#-------------------------------------------------------------------------------
# Install the latest version of generator-jhipster-swagger2markup
#-------------------------------------------------------------------------------
cd $TRAVIS_BUILD_DIR/
npm install
npm link
