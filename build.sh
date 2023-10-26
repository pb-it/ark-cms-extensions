#!/bin/bash

cd src;
echo $1
if [ ! -z "$1" ]; then
	zip -r ../dist/"$1"@1.0.0.zip $1 -x "*/.*";
else
   for f in *; do
      if [ -d "$f" ]; then
         echo "$f";
         #d=$(basename "$f");
         zip -r ../dist/"$f"@1.0.0.zip $f -x "*/.*";
      fi
   done
fi
cd - > /dev/null;