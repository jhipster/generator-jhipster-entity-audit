#!/bin/bash
set -ev
#-------------------------------------------------------------------------------
# Generate the default audit behaviour
#-------------------------------------------------------------------------------
cd $HOME/$JHIPSTER
yo jhipster-entity-audit default --force --no-insight
