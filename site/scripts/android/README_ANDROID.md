# GwenTable private UAT on Android (Termux)

This folder runs GwenTable on your phone at **http://127.0.0.1:42639/** with a small Python server. Nothing is uploaded; characters stay in Chrome's storage for that address.

## First time only
1. Install **Termux** (from F-Droid or Google Play).
2. In Termux:
   ```
   pkg install python unzip
   termux-setup-storage
   ```
   Allow storage access when Android asks.

## Install or upgrade
1. In the current GwenTable (if you have one): **Saved Characters → Export roster backup**, and keep the file.
2. If an older GwenTable server is running in Termux, stop it with **Ctrl+C**. Keep its folder for rollback.
3. Download this ZIP to your phone's Downloads folder, then in Termux:
   ```
   cd ~/storage/downloads
   unzip GwenTable_I13_Android_UAT.zip
   cd GwenTable-I13-Android-UAT
   python3 start_gwentable.py
   ```
4. Open **http://127.0.0.1:42639/** in Chrome (same Chrome profile every time).
5. Keep Termux running while you play. Close it with Ctrl+C when done.

If `unzip` created a nested folder, run `ls` and `cd` into the folder that contains `start_gwentable.py`.

## Rules for keeping your data
- Always use exactly `http://127.0.0.1:42639/` in the same Chrome profile; a different address or port is a different, empty storage.
- Never use "Clear site data" for 127.0.0.1.
- Export backups before installing a new version.

## Updating and rollback
- After starting a newer version, reload the page twice so the offline cache updates.
- To roll back: stop the server, `cd` into the older folder, run its `start_gwentable.py`. A newer save format may not open in an older build; import your backup if needed.

## Not included
Withheld artwork (letters/shapes replace logo and portraits). No accounts, sync, or internet services. Private testing only; not a public release.
