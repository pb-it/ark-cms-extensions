#!/bin/bash

for f in src/*; do
    if [ -d "$f" ]; then
        #echo "$f";
        d=$(basename "$f");
        echo "$d";
        zip -r dist/"$d"@1.0.0.zip $f -x "*/.*";
    fi
done