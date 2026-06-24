#!/bin/bash
set -e

echo "Updating system and installing foundational build tools..."
sudo apt-get update
sudo apt-get install -y gnupg lsb-release wget build-essential pkg-config libssl-dev

echo "Fetching and executing LLVM 19 automated repository setup..."
wget https://llvm.org
chmod +x llvm.sh
sudo ./llvm.sh 19

echo "Installing LLVM 19 and Clang development headers..."
sudo apt-get install -y llvm-19-dev libclang-19-dev clang-19

echo "Cleaning up temporary setup files..."
rm llvm.sh

echo "Verification: Checking LLVM configuration tool version..."
/usr/bin/llvm-config-19 --version
