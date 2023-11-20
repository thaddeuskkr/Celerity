#!/bin/bash

# Set the directory path
directory_path="node_modules"

# Find TypeScript files in the specified directory and add '@ts-ignore' at the top
find "$directory_path" -type f -name '*.ts' -exec sed -i '1i\// @ts-ignore' {} \;
