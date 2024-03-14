#!/bin/bash

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -v|--version) echo "test"; v=true; shift ;;
        *) POSITIONAL_ARGS+=("$1"); shift;;
    esac
done
set -- "${POSITIONAL_ARGS[@]}"

cd src;
if [ "$#" -eq 0 ]; then
    src=*
else
    src=$@
fi
for f in $src; do
    if [ -d "$f" ]; then
        echo "$f";
        #d=$(basename "$f");
        if [ "$v" = true ]; then
            version=$(grep -Po '"version"\s*:\s*"\K([^"]*)' $f/manifest.json)
            zip -r ../dist/"$f"@"$version".zip $f -x "*/.*";
        else
            zip -r ../dist/"$f".zip $f -x "*/.*";
        fi
    fi
done

cd - > /dev/null;