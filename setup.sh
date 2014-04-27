#!/bin/sh

if [ ! -d website ]; then
	mkdir website
fi

cd website
sudo npm install -g express-generator
express -e
cd ..

