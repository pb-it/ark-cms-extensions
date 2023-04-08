#!/bin/bash

cd src;
for f in *; do
    if [ -d "$f" ]; then
        echo "$f";
        #d=$(basename "$f");
        zip -r ../dist/"$f"@1.0.0.zip $f -x "*/.*";
    fi
done