#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
#  build_web.sh  —  compile Vampire Siege to WebAssembly and prep for Vercel
#
#  Run once from the project root:   bash build_web.sh
# ═══════════════════════════════════════════════════════════════════════════
set -e

echo "▶  Adding WASM target (only needed once)"
rustup target add wasm32-unknown-unknown

echo "▶  Installing wasm-bindgen-cli (only needed once)"
# Pin to match the wasm-bindgen version macroquad pulls in.
# If you get a version mismatch error later, update this number.
cargo install wasm-bindgen-cli --version 0.2.92 --locked

echo "▶  Building release WASM…"
cargo build --release --target wasm32-unknown-unknown

echo "▶  Generating JS + WASM bindings…"
mkdir -p dist
wasm-bindgen \
  target/wasm32-unknown-unknown/release/vampire_siege.wasm \
  --out-dir dist \
  --target web \
  --no-typescript

echo "▶  Copying HTML shell and assets…"
cp index.html dist/
# Copy any assets folder if it exists (sounds, fonts…)
[ -d assets ] && cp -r assets dist/

echo ""
echo "✅  Build complete!  Output is in  ./dist/"
echo "    To test locally:  npx serve dist"
echo "    To deploy:        push to GitHub and Vercel auto-deploys"