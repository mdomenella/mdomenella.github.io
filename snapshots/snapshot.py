#!/usr/bin/env python3
import os
import sys
import shutil
import datetime

# Root workspace directory
WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(WORKSPACE_DIR)

# Important project relative files to snapshot
FILES_TO_SNAPSHOT = [
    os.path.join("assets", "js", "project-artifact.js"),
    os.path.join("assets", "js", "main.js"),
    os.path.join("assets", "css", "project-artifact.css"),
    os.path.join("assets", "css", "main.css"),
    os.path.join("projects", "clippard.html"),
    os.path.join("projects", "pg.html"),
    os.path.join("projects", "needfinding.html"),
    os.path.join("index.html"),
]

SNAPSHOTS_DIR = os.path.join(PROJECT_ROOT, "snapshots")
LOG_FILE = os.path.join(SNAPSHOTS_DIR, "SNAPSHOT_LOG.md")

def ensure_snapshots_dir():
    os.makedirs(SNAPSHOTS_DIR, exist_ok=True)
    if not os.path.exists(LOG_FILE):
        with open(LOG_FILE, "w", encoding="utf-8") as f:
            f.write("# Project Version Snapshots Log\n\n| Timestamp | ID / Folder | Label / Description | Files Captured |\n|---|---|---|---|\n")

def create_snapshot(label=""):
    ensure_snapshots_dir()
    now_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    clean_label = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in label.strip())
    folder_name = f"{now_str}_{clean_label}" if clean_label else now_str
    snapshot_path = os.path.join(SNAPSHOTS_DIR, folder_name)
    os.makedirs(snapshot_path, exist_ok=True)

    copied_files = []
    for rel_path in FILES_TO_SNAPSHOT:
        src = os.path.join(PROJECT_ROOT, rel_path)
        if os.path.exists(src):
            dest = os.path.join(snapshot_path, rel_path)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            shutil.copy2(src, dest)
            copied_files.append(rel_path)

    log_label = label if label else "Manual Snapshot"
    copied_str = ", ".join([os.path.basename(f) for f in copied_files])
    
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"| {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | `{folder_name}` | {log_label} | `{copied_str}` |\n")

    print(f"[SUCCESS] Snapshot created at: {snapshot_path}")
    print(f"Files saved: {copied_str}")
    return folder_name

def list_snapshots():
    ensure_snapshots_dir()
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            print(f.read())
    else:
        print("No snapshots found.")

def restore_snapshot(target_name):
    ensure_snapshots_dir()
    snapshots = [d for d in os.listdir(SNAPSHOTS_DIR) if os.path.isdir(os.path.join(SNAPSHOTS_DIR, d))]
    matched = [d for d in snapshots if target_name.lower() in d.lower()]

    if not matched:
        print(f"[ERROR] No snapshot matching '{target_name}' found. Available snapshots:")
        for s in sorted(snapshots):
            print(f" - {s}")
        return False

    snapshot_folder = sorted(matched)[-1]
    snapshot_path = os.path.join(SNAPSHOTS_DIR, snapshot_folder)
    print(f"[RESTORE] Restoring from snapshot: {snapshot_folder}")

    restored = []
    for root, dirs, files in os.walk(snapshot_path):
        for file in files:
            full_src = os.path.join(root, file)
            rel_path = os.path.relpath(full_src, snapshot_path)
            full_dest = os.path.join(PROJECT_ROOT, rel_path)
            os.makedirs(os.path.dirname(full_dest), exist_ok=True)
            shutil.copy2(full_src, full_dest)
            restored.append(rel_path)

    print(f"[SUCCESS] Restored {len(restored)} file(s): {', '.join(restored)}")
    return True

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "list"
    arg = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else ""

    if cmd == "create":
        create_snapshot(arg or "checkpoint")
    elif cmd == "list":
        list_snapshots()
    elif cmd == "restore":
        if not arg:
            print("Usage: python snapshot.py restore <snapshot_name_or_keyword>")
        else:
            restore_snapshot(arg)
    else:
        print("Usage: python snapshot.py [create|list|restore] [label_or_keyword]")
