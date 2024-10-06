# extension examples

### build

```bash
$ npm run build <extension>
```
or
```bash
$ ./build.sh <extension>
```

> With omitted 'extension' argument all available extensions will be packed.

> Append `-v` or `--version` for version in file name, e.g. `echo@0.1.0.zip` instead of `echo.zip`. Option currently only supported in Linux.
>
> ```sh
> ./build.sh echo --version
> npm run build 'echo chat process --version'
> npm run build 'echo --version'
> npm run build ' --version'
> ```

Generated ZIP files can be found in 'dist' folder


## Ideas/Roadmap for future implementation

- [ ] CRM
- [ ] Mind Mapping App


## Disclaimer

> [!IMPORTANT]
>
> These extensions are subject to change, including but not limited to breaking changes without prior notice.
>
> Because of this please don't rely on this in production environments.