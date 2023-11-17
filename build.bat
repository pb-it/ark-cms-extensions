cd src
for /D %%s in (*) do (
    echo %%s
    tar.exe -a -c -f ..\dist\%%s@1.0.0.zip %%s
)