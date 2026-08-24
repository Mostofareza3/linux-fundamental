# Linux Fundamentals — একজন Developer এর জন্য

> এই বইটা Linux "administrator" হওয়ার জন্য না। একজন application developer হিসেবে server এ কাজ করতে, deploy করতে, debug করতে যতটুকু Linux লাগে — ঠিক ততটুকু, কিন্তু ভালোভাবে।

---

## সূচিপত্র

**Part 1 — Foundation**
1. Linux আসলে কী
2. Everything is a File
3. Filesystem Hierarchy
4. Shell আর Terminal

**Part 2 — Daily Driving**
5. Navigation আর File Operations
6. File পড়া আর দেখা
7. Redirection আর Pipe
8. Text Processing Tools

**Part 3 — System**
9. Users, Groups আর Permissions
10. Process Management
11. systemd আর Services
12. Package Management

**Part 4 — Practical**
13. Networking Commands
14. Disk আর Mount
15. Environment Variables আর PATH
16. Cron আর Scheduled Jobs
17. Logs আর Troubleshooting
18. Shell Scripting Basics
19. SSH আর Remote Server
20. একটা Real Deployment — শুরু থেকে শেষ

**Appendix** — Cheat Sheet

---

# Part 1 — Foundation

## ১. Linux আসলে কী

### Kernel vs Distribution

Linux শব্দটা technically শুধু **kernel** কে বোঝায়। Kernel হলো hardware আর software এর মাঝখানের layer। ওর কাজ:

- **Process scheduling** — কোন program কখন CPU পাবে
- **Memory management** — কোন process কতটুকু RAM পাবে
- **Filesystem** — disk এ data কীভাবে লেখা/পড়া হবে
- **Networking** — network packet in/out
- **Device drivers** — hardware এর সাথে কথা বলা

Kernel একা কিছু করতে পারে না। ওকে ব্যবহার করার জন্য shell লাগে, utility লাগে, package manager লাগে। এই পুরো bundle টাকে বলে **distribution** বা **distro**।

### কোন Distro শিখবে

| Distro | কোথায় ব্যবহার হয় | Package Manager |
|---|---|---|
| Ubuntu | সবচেয়ে common server, cloud VM | `apt` |
| Debian | Ubuntu এর parent, বেশি stable | `apt` |
| Alpine | Docker image, খুব ছোট (~5MB) | `apk` |
| RHEL / Rocky / CentOS | Enterprise, corporate | `dnf` / `yum` |
| Amazon Linux | AWS EC2 | `dnf` |

**সিদ্ধান্ত:** Ubuntu LTS (Long Term Support — ৫ বছর security update পায়) দিয়ে শুরু করো। DigitalOcean, AWS, Hetzner — সব জায়গায় এটাই default. একবার এটা শিখলে বাকিগুলোতে শুধু package manager আর কিছু path বদলাবে, concept একই থাকবে।

### macOS এর সাথে সম্পর্ক

তোমার MacBook এর terminal ও Unix-based (BSD lineage)। তাই `ls`, `cd`, `grep`, `ps` — এগুলো প্রায় একই কাজ করে। কিন্তু কিছু পার্থক্য আছে যেগুলো না জানলে confusion হবে:

| জিনিস | macOS | Linux |
|---|---|---|
| Home directory | `/Users/mostofa` | `/home/mostofa` |
| Package manager | `brew` | `apt` / `dnf` |
| Service manager | `launchd` | `systemd` |
| `sed -i` syntax | `sed -i '' 's/a/b/'` | `sed -i 's/a/b/'` |
| Core utilities | BSD version | GNU version (বেশি flag) |
| Network interface | `ifconfig`, `en0` | `ip`, `eth0`/`ens3` |

মূল কথা — macOS এ যা শিখেছো তার ৮০% Linux এ কাজ করবে। বাকি ২০% এই বইতে আছে।

---

## ২. Everything is a File

এটা Linux এর সবচেয়ে গুরুত্বপূর্ণ design philosophy. বুঝলে অর্ধেক জিনিস এমনিতেই clear হয়ে যায়।

Linux এ প্রায় সব resource — hard disk, keyboard, network socket, running process, এমনকি random number generator — সবকিছু filesystem এ **file** হিসেবে expose করা।

মানে হলো, তোমার আলাদা কোনো special API লাগে না। `cat`, `grep`, `echo` — এই simple tool গুলো দিয়েই system এর গভীরে ঢুকতে পারো।

```bash
# CPU এর সম্পূর্ণ তথ্য
cat /proc/cpuinfo

# RAM এর অবস্থা
cat /proc/meminfo

# System কতক্ষণ ধরে চলছে
cat /proc/uptime

# PID (Process ID — প্রতিটা running program এর unique number) ১ এর সব info
ls /proc/1/

# একটা process কোন file গুলো খুলে রেখেছে
ls -l /proc/1234/fd/

# একটা process এর environment variable
cat /proc/1234/environ | tr '\0' '\n'
```

`/proc` আসলে disk এ নেই। এটা **virtual filesystem** — kernel real-time এ memory থেকে data বানিয়ে দেখায়। তুমি `cat /proc/meminfo` চালানোর মুহূর্তে kernel ওই text টা generate করে।

### Special Files

```bash
/dev/null       # যা লিখবে হারিয়ে যাবে — output ফেলে দেওয়ার জন্য
/dev/zero       # অসীম 0 byte দেয়
/dev/random     # random data (cryptographic)
/dev/sda        # প্রথম hard disk (পুরোটা, raw)
```

Practical use:
```bash
# Output একেবারে চুপ করানো
npm install > /dev/null 2>&1

# ১০০ MB এর একটা dummy file বানানো (testing এর জন্য)
dd if=/dev/zero of=test.bin bs=1M count=100
```

### File Type

`ls -l` এর প্রথম character দিয়ে file type বোঝা যায়:

| Character | মানে |
|---|---|
| `-` | সাধারণ file |
| `d` | directory |
| `l` | symbolic link (shortcut) |
| `c` | character device (keyboard, `/dev/null`) |
| `b` | block device (disk) |
| `s` | socket (process দের মধ্যে communication) |
| `p` | named pipe |

---

## ৩. Filesystem Hierarchy

macOS এ folder structure যেমন খানিকটা এলোমেলো, Linux এ সেটা strictly defined। Standard টার নাম **FHS (Filesystem Hierarchy Standard — কোন folder এ কী থাকবে তার নির্দিষ্ট নিয়ম)**।

Linux এ কোনো `C:` drive নেই। সবকিছু একটা single tree, root `/` থেকে শুরু।

```
/
├── bin      → essential command (ls, cp, cat)
├── boot     → kernel আর bootloader file
├── dev      → device file
├── etc      → সব configuration file
├── home     → user দের personal folder
├── lib      → shared library (.so file)
├── mnt      → manually mount করা drive
├── opt      → third-party software
├── proc     → kernel এর virtual filesystem
├── root     → root user এর home
├── run      → runtime data (PID file, socket)
├── sbin     → system administration command
├── srv      → service এর data
├── sys      → hardware/kernel interface
├── tmp      → temporary file, reboot এ মুছে যায়
├── usr      → installed software
└── var      → পরিবর্তনশীল data (log, cache, database)
```

### Developer হিসেবে যেগুলো আসলে দরকার

**`/etc` — Configuration**

Server এ যা কিছু configure করবে, সব এখানে।

```bash
/etc/nginx/nginx.conf              # nginx main config
/etc/nginx/sites-available/        # per-site config
/etc/ssh/sshd_config               # SSH server config
/etc/hosts                         # local DNS override
/etc/passwd                        # user list
/etc/environment                   # system-wide env variable
/etc/postgresql/16/main/           # PostgreSQL config
/etc/systemd/system/               # custom service file
```

**`/var` — পরিবর্তনশীল Data**

```bash
/var/log/                          # সব log এখানে
/var/log/nginx/error.log
/var/log/syslog                    # system এর general log
/var/lib/postgresql/               # PostgreSQL এর actual data
/var/www/                          # website file (convention)
```

**`/home/username` — তোমার জায়গা**

```bash
~/.ssh/                            # SSH key
~/.bashrc, ~/.zshrc                # shell config
~/.config/                         # application config
~/.npm, ~/.cache                   # cache
```

`~` হলো তোমার home directory এর shortcut। `cd ~` আর `cd /home/mostofa` একই জিনিস।

**Practical কথা:** Production এ কিছু ভাঙলে তুমি ৯০% সময় `/etc` (config ঠিক আছে কিনা) আর `/var/log` (error কী বলছে) — এই দুই জায়গায় থাকবে। বাকিগুলো মুখস্থ করার দরকার নেই।

### Absolute vs Relative Path

```bash
/var/log/nginx/error.log     # absolute — / দিয়ে শুরু, সবসময় একই জায়গা
../config/app.json           # relative — বর্তমান folder থেকে হিসাব
./deploy.sh                  # বর্তমান folder এর deploy.sh
```

Script এ সবসময় absolute path ব্যবহার করো। cron বা systemd থেকে চললে working directory কী হবে তার কোনো guarantee নেই — relative path তখন ভাঙে।

---

## ৪. Shell আর Terminal

তিনটা আলাদা জিনিস, মানুষ গুলিয়ে ফেলে:

- **Terminal** — window/app যেটাতে তুমি টাইপ করো (iTerm, Ghostty, GNOME Terminal)
- **Shell** — program যেটা তোমার command interpret করে (bash, zsh, fish)
- **Command** — যেটা তুমি চালাও (`ls`, `grep`)

তুমি macOS এ **zsh** ব্যবহার করো। Linux server এ default সাধারণত **bash**। Daily commands প্রায় একই, পার্থক্য মূলত scripting আর prompt customization এ।

```bash
echo $SHELL          # কোন shell চলছে
cat /etc/shells      # কোনগুলো available
chsh -s /bin/bash    # shell বদলানো
```

### Command এর গঠন

```bash
command  -options  arguments
   │         │         │
  ls       -la      /var/log
```

Option দুই ধরনের:
```bash
ls -l -a -h          # short form
ls -lah              # একসাথে লেখা যায়
ls --all --human-readable    # long form, বেশি readable
```

### সবচেয়ে দরকারি অভ্যাস

**`man` — manual page**
```bash
man ls
man grep
# / দিয়ে search, q দিয়ে বের হওয়া
```

**`--help` — দ্রুত reference**
```bash
grep --help
docker run --help
```

**`tldr` — practical example (আলাদা install করতে হয়)**
```bash
apt install tldr
tldr tar     # tar এর ১০টা বাস্তব উদাহরণ দেবে, ৩০ পাতার manual না
```

`tar` এর syntax কেউ মুখস্থ রাখে না। `tldr` install করে নাও, জীবন সহজ হবে।

### Shortcut যেগুলো সময় বাঁচাবে

| Key | কাজ |
|---|---|
| `Tab` | auto-complete |
| `Ctrl + C` | চলমান command বন্ধ |
| `Ctrl + D` | shell থেকে exit / EOF |
| `Ctrl + R` | history তে reverse search |
| `Ctrl + L` | screen clear |
| `Ctrl + A` / `Ctrl + E` | line এর শুরু / শেষে যাওয়া |
| `Ctrl + U` / `Ctrl + K` | cursor এর আগের / পরের অংশ মুছে ফেলা |
| `Ctrl + W` | আগের একটা word মুছে ফেলা |
| `!!` | আগের command আবার চালানো |
| `sudo !!` | আগের command sudo দিয়ে আবার চালানো |
| `cd -` | আগের directory তে ফিরে যাওয়া |

`Ctrl + R` টা বিশেষ করে শিখে নাও। লম্বা command আর টাইপ করতে হবে না — কয়েকটা অক্ষর লিখলেই history থেকে খুঁজে দেবে।

---

# Part 2 — Daily Driving

## ৫. Navigation আর File Operations

### ঘোরাফেরা

```bash
pwd                  # এখন কোথায় আছি
cd /var/log          # নির্দিষ্ট জায়গায়
cd ..                # এক ধাপ উপরে
cd ~                 # home এ
cd -                 # আগের জায়গায় ফিরে যাও
```

### List করা

```bash
ls                   # সাধারণ
ls -l                # detail (permission, owner, size, date)
ls -a                # hidden file সহ (. দিয়ে শুরু হওয়া)
ls -lah              # সব একসাথে + human readable size
ls -lt               # সময় অনুযায়ী sort, নতুন আগে
ls -lS               # size অনুযায়ী sort, বড় আগে
ls -R                # recursive, সব subfolder সহ
```

`ls -lt` টা debug এ কাজে লাগে — কোন file সবচেয়ে recently বদলেছে সেটা এক নজরে দেখা যায়।

### File আর Folder বানানো

```bash
touch app.js                 # খালি file বানানো (বা timestamp update)
mkdir logs                   # folder
mkdir -p src/modules/auth    # nested folder একবারে, না থাকলে বানাবে
```

`-p` মানে "parents" — মাঝের folder না থাকলে বানিয়ে নেবে, আর already থাকলে error দেবে না। Script এ সবসময় `-p` ব্যবহার করো।

### Copy, Move, Delete

```bash
cp file.txt backup.txt              # copy
cp -r src/ dist/                    # folder copy (recursive লাগবেই)
cp -a src/ dist/                    # permission, timestamp সব রেখে copy

mv old.txt new.txt                  # rename
mv file.txt /tmp/                   # সরানো

rm file.txt                         # delete
rm -r folder/                       # folder delete
rm -rf folder/                      # force delete, প্রশ্ন করবে না
```

**সাবধানতা:** Linux এ কোনো Trash/Recycle Bin নেই। `rm` মানে চিরতরে গেছে।

```bash
rm -rf /              # পুরো system মুছে দেবে। কখনো না।
rm -rf $VAR/          # VAR খালি হলে এটাই `rm -rf /` হয়ে যায়
```

Script এ variable সহ `rm -rf` লেখার আগে সবসময় check করো:
```bash
if [ -n "$BUILD_DIR" ]; then rm -rf "$BUILD_DIR"; fi
```

### খোঁজা

**`find` — file খোঁজা**
```bash
find . -name "*.log"                    # নাম দিয়ে
find . -iname "*.LOG"                   # case-insensitive
find /var -type f -size +100M           # ১০০ MB এর বড় file
find . -type d -name node_modules       # শুধু folder
find . -mtime -7                        # গত ৭ দিনে modified
find . -name "*.tmp" -delete            # খুঁজে মুছে ফেলা
```

Disk ভরে গেলে এটা প্রথম command:
```bash
find / -type f -size +500M 2>/dev/null
```
`2>/dev/null` দিয়ে permission denied error গুলো লুকিয়ে দিলাম।

**`which` / `whereis` — command কোথায়**
```bash
which node           # /usr/bin/node
whereis nginx        # binary, source, manual সব path
```

### Symbolic Link

```bash
ln -s /var/www/app/current /var/www/html
```

Shortcut এর মতো। Deployment এ খুব কাজে লাগে — `current` নামে একটা symlink রেখে নতুন release এ সেটা repoint করলেই instant switch, rollback ও তেমনি সহজ।

---

## ৬. File পড়া আর দেখা

```bash
cat file.txt              # পুরো file একবারে print
cat -n file.txt           # line number সহ

less file.txt             # scroll করে পড়া, বড় file এর জন্য
head -20 file.txt         # প্রথম ২০ লাইন
tail -20 file.txt         # শেষ ২০ লাইন
tail -f error.log         # live follow — নতুন line আসতে থাকলে দেখাবে
tail -f -n 100 error.log  # শেষ ১০০ লাইন দেখিয়ে তারপর follow

wc -l file.txt            # কত লাইন
```

**`tail -f` টা তোমার সবচেয়ে বেশি ব্যবহৃত command হবে।** Deploy করে log দেখা, request আসছে কিনা check করা — সব এটা দিয়ে।

`less` এর ভেতরে:
- `/keyword` — search
- `n` / `N` — পরের / আগের match
- `G` — file এর শেষে
- `g` — শুরুতে
- `q` — বের হওয়া

**গুরুত্বপূর্ণ:** ১ GB এর log file এ কখনো `cat` চালাবে না — terminal hang করবে। `less` বা `tail` ব্যবহার করো।

---

## ৭. Redirection আর Pipe

এখান থেকেই Linux এর আসল শক্তি শুরু।

### তিনটা Stream

প্রতিটা program এর তিনটা default channel থাকে:

| Stream | Number | কাজ |
|---|---|---|
| stdin | 0 | input |
| stdout | 1 | normal output |
| stderr | 2 | error output |

### Redirection

```bash
command > file.txt          # stdout file এ (আগের content মুছে যাবে)
command >> file.txt         # append করবে
command 2> error.txt        # শুধু error file এ
command > out.txt 2>&1      # stdout আর stderr দুটোই একই file এ
command &> all.txt          # উপরেরটার short form (bash)
command < input.txt         # file থেকে input নেওয়া
command > /dev/null 2>&1    # সব output গিলে ফেলা
```

`2>&1` মানে "stderr কে stdout যেখানে যাচ্ছে সেখানে পাঠাও"। Order টা গুরুত্বপূর্ণ — `> file 2>&1` কাজ করে, কিন্তু `2>&1 > file` করে না।

### Pipe

`|` দিয়ে একটা command এর output আরেকটার input হিসেবে দেওয়া যায়।

```bash
cat access.log | grep "500" | wc -l
#     │              │           │
#  file পড়ো    500 filter করো   গোনো
```

এটাই Unix philosophy — একেকটা tool একটা কাজ ভালো করে, pipe দিয়ে জোড়া দিয়ে জটিল কাজ হয়।

Practical উদাহরণ:
```bash
# কোন IP সবচেয়ে বেশি request করেছে (top 10)
cat access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -10

# node process খোঁজা
ps aux | grep node | grep -v grep

# সবচেয়ে বড় ১০টা folder
du -sh */ | sort -rh | head -10

# error log এ কোন error কতবার
grep "ERROR" app.log | awk '{print $4}' | sort | uniq -c | sort -rn
```

`sort | uniq -c | sort -rn` — এই combination টা মুখস্থ করে নাও। "কোন জিনিস কতবার আছে, বেশি থেকে কম" — এই প্রশ্নের উত্তর সবসময় এটা।

### `tee` — একসাথে screen আর file এ

```bash
npm run build | tee build.log
```
Screen এ output দেখবে, একই সাথে file এও লেখা হবে।

### `xargs` — output কে argument বানানো

```bash
find . -name "*.log" | xargs rm
cat urls.txt | xargs -n1 curl -I
```
কিছু command pipe থেকে input নেয় না (যেমন `rm`), তখন `xargs` লাগে।

---

## ৮. Text Processing Tools

Log ঘাঁটাঘাঁটির জন্য এগুলো লাগবেই।

### `grep` — খোঁজা

```bash
grep "error" app.log                # সাধারণ search
grep -i "error" app.log             # case-insensitive
grep -n "error" app.log             # line number সহ
grep -r "TODO" ./src                # folder এর ভেতর recursive
grep -v "debug" app.log             # যেগুলোতে নেই সেগুলো (invert)
grep -c "error" app.log             # শুধু count
grep -A 5 "error" app.log           # match এর পরের ৫ লাইন
grep -B 5 "error" app.log           # আগের ৫ লাইন
grep -C 5 "error" app.log           # আগে পরে ৫ লাইন করে
grep -E "error|warn" app.log        # regex, একাধিক pattern
```

`-C 5` টা debug এ সবচেয়ে কাজের — error টা কোন context এ ঘটেছে সেটা দেখা যায়।

### `sed` — খুঁজে বদলানো

```bash
sed 's/old/new/' file.txt           # প্রতি লাইনে প্রথম match বদলাবে
sed 's/old/new/g' file.txt          # সব match
sed -i 's/old/new/g' file.txt       # file টাই বদলে দেবে (in-place)
sed -i.bak 's/old/new/g' file.txt   # backup রেখে বদলাবে
sed -n '10,20p' file.txt            # শুধু ১০-২০ নম্বর লাইন
sed '/^#/d' config.conf             # comment line মুছে ফেলা
```

**Note:** macOS এ `sed -i` এর পরে খালি string লাগে — `sed -i '' 's/a/b/' file`. Linux এ লাগে না। Script portable রাখতে চাইলে এটা মনে রেখো।

### `awk` — column নিয়ে কাজ

```bash
awk '{print $1}' access.log         # প্রথম column
awk '{print $1, $7}' access.log     # ১ম আর ৭ম
awk -F: '{print $1}' /etc/passwd    # : কে delimiter ধরে
awk '$9 == 500 {print $7}' access.log   # condition সহ
awk '{sum += $10} END {print sum}' access.log   # যোগফল
```

`awk` পুরো একটা programming language, কিন্তু ৯৫% ক্ষেত্রে তুমি শুধু `{print $N}` ব্যবহার করবে।

### বাকিগুলো

```bash
sort file.txt              # sort
sort -rn                   # উল্টো, সংখ্যা হিসেবে
uniq -c                    # duplicate গুনে দেখানো (আগে sort লাগে)
cut -d',' -f2 data.csv     # CSV এর ২ নম্বর column
tr 'a-z' 'A-Z'             # character replace
wc -l / -w / -c            # line / word / character গোনা
head / tail                # শুরু / শেষ
jq '.name' data.json       # JSON parse (আলাদা install লাগে)
```

`jq` অবশ্যই install করে নিও — API response দেখতে অসাধারণ:
```bash
curl -s https://api.example.com/users | jq '.data[] | {id, name}'
```

---

# Part 3 — System

## ৯. Users, Groups আর Permissions

Deployment এ "Permission denied" error এর ৯৫% এখান থেকে আসে। তাই এই chapter টা মন দিয়ে পড়ো।

### User আর Group

Linux multi-user system। প্রতিটা file এর একজন **owner** আর একটা **group** থাকে।

```bash
whoami                    # আমি কে
id                        # আমার uid, gid, group list
groups                    # কোন কোন group এ আছি

cat /etc/passwd           # সব user
cat /etc/group            # সব group
```

`/etc/passwd` এর একটা লাইন:
```
mostofa:x:1000:1000:Mostofa:/home/mostofa:/bin/bash
   │    │  │    │      │          │           │
 name  pw uid  gid   info      home        shell
```

**System user** (uid < 1000) আসল মানুষ না — service চালানোর জন্য বানানো। যেমন `www-data` (nginx), `postgres` (PostgreSQL)। এদের সাধারণত login shell থাকে `/usr/sbin/nologin`, যাতে কেউ ওই account দিয়ে login করতে না পারে। Security এর জন্য এটা গুরুত্বপূর্ণ।

```bash
adduser deploy                    # নতুন user (interactive)
usermod -aG sudo deploy           # sudo group এ যোগ করা
usermod -aG docker deploy         # docker চালানোর permission
su - deploy                       # ওই user হয়ে যাওয়া
passwd deploy                     # password বদলানো
```

`-aG` এর `a` মানে **append**। শুধু `-G` দিলে আগের সব group থেকে বের করে দেবে। এটা একটা common mistake — মনে রেখো।

### Permission পড়া

```bash
$ ls -l
-rw-r--r-- 1 mostofa dev  1024 Aug 24 10:30 app.js
drwxr-xr-x 2 mostofa dev  4096 Aug 24 10:30 src/
```

প্রথম ১০টা character ভাঙলে:

```
-  rw-  r--  r--
│   │    │    │
│   │    │    └── others (বাকি সবাই)
│   │    └─────── group
│   └──────────── owner
└──────────────── file type
```

প্রতি সেটে তিনটা bit:

| Bit | File এর ক্ষেত্রে | Directory এর ক্ষেত্রে |
|---|---|---|
| `r` (4) | content পড়া | ভেতরে কী আছে list করা |
| `w` (2) | content বদলানো | ভেতরে file বানানো/মোছা |
| `x` (1) | program হিসেবে চালানো | ভেতরে ঢোকা (`cd`) |

**Directory এর `x` না থাকলে তুমি ভেতরে ঢুকতেই পারবে না** — ফলে ভেতরের file এর permission যাই হোক, access পাবে না। Nested folder এ permission debug করার সময় এটা মাথায় রেখো।

### Numeric Notation

r=4, w=2, x=1 — যোগ করো।

| Number | Permission | মানে |
|---|---|---|
| 7 | rwx | সব |
| 6 | rw- | পড়া + লেখা |
| 5 | r-x | পড়া + চালানো |
| 4 | r-- | শুধু পড়া |
| 0 | --- | কিছু না |

```bash
chmod 755 deploy.sh       # owner: rwx, group: r-x, others: r-x
chmod 644 config.json     # owner: rw-, group: r--, others: r--
chmod 600 ~/.ssh/id_rsa   # শুধু owner পড়তে/লিখতে পারবে
chmod +x script.sh        # সবার জন্য execute যোগ করা
chmod -R 755 /var/www     # recursive
```

**মুখস্থ রাখার নিয়ম:**
- `755` → executable file আর directory
- `644` → সাধারণ file (config, code, HTML)
- `600` → sensitive file (private key, `.env`)
- `700` → sensitive directory (`~/.ssh`)

SSH key এর permission `600` না হলে SSH নিজেই connection reject করবে। এটা খুব common error।

### Ownership

```bash
chown mostofa file.txt              # owner বদলানো
chown mostofa:dev file.txt          # owner আর group একসাথে
chown -R www-data:www-data /var/www # recursive
chgrp dev file.txt                  # শুধু group
```

nginx `www-data` user হিসেবে চলে। তাই `/var/www` এর ownership `www-data` না হলে nginx file পড়তে পারবে না — 403 Forbidden দেবে।

### sudo

```bash
sudo command              # root হিসেবে একটা command
sudo -i                   # root shell এ ঢোকা
sudo -u postgres psql     # নির্দিষ্ট user হিসেবে চালানো
sudo !!                   # আগের command sudo দিয়ে আবার
```

**Practice:** Production এ সরাসরি `root` হিসেবে কাজ করবে না। একটা normal user বানিয়ে তাকে sudo দাও। ভুল করলে অন্তত একটা layer থাকে।

### umask

নতুন file বানালে default permission কী হবে সেটা `umask` ঠিক করে।

```bash
umask          # সাধারণত 022
```
মানে নতুন file হবে `666 - 022 = 644`, folder হবে `777 - 022 = 755`। এজন্যই নতুন script এ execute permission থাকে না, `chmod +x` করতে হয়।

---

## ১০. Process Management

### দেখা

```bash
ps aux                        # সব process
ps aux | grep node            # node process খোঁজা
ps -ef --forest               # parent-child tree

top                           # live view
htop                          # top এর সুন্দর version (install করে নাও)
```

`ps aux` এর column গুলো:
```
USER  PID  %CPU  %MEM   VSZ    RSS  STAT  START  TIME  COMMAND
```

- **PID** — process এর unique number
- **RSS** — আসলে কত RAM ব্যবহার করছে (KB তে)। **এটাই দেখার জিনিস**, VSZ না
- **STAT** — `R` running, `S` sleeping, `Z` zombie, `D` uninterruptible

### মারা

```bash
kill 1234              # ভদ্রভাবে বন্ধ হতে বলা (SIGTERM)
kill -9 1234           # জোর করে মারা (SIGKILL)
killall node           # নাম দিয়ে সব মারা
pkill -f "node dist"   # command line pattern দিয়ে
```

**সবসময় আগে সাধারণ `kill` চেষ্টা করো।** SIGTERM পেলে application cleanup করার সুযোগ পায় — database connection বন্ধ করা, চলমান request শেষ করা। `kill -9` কোনো সুযোগ দেয় না, data corrupt হতে পারে।

তোমার NestJS app এ graceful shutdown এভাবে handle হয়:
```javascript
process.on('SIGTERM', async () => {
  await app.close();
  process.exit(0);
});
```

### Background এ চালানো

```bash
node server.js &          # background এ
jobs                      # background job list
fg %1                     # সামনে আনা
bg %1                     # background এ পাঠানো
Ctrl + Z                  # pause করা
```

**সমস্যা:** SSH session বন্ধ করলে `&` দিয়ে চালানো process মরে যায়। কারণ shell বন্ধ হলে ওর সব child process SIGHUP পায়।

সমাধান:
```bash
nohup node server.js &                 # HUP signal ignore করবে
setsid node server.js                  # নতুন session এ
tmux new -s app                        # terminal multiplexer — সবচেয়ে ভালো
```

তবে production এ এর কোনোটাই ঠিক না। সেখানে **systemd service** ব্যবহার করবে — crash করলে auto restart হবে, boot এ auto start হবে, log properly যাবে।

### Resource দেখা

```bash
free -h                # RAM
df -h                  # disk space
du -sh *               # প্রতিটা folder কত জায়গা নিচ্ছে
uptime                 # load average
lsof -i :3000          # port 3000 কে দখল করে আছে
ss -tulpn              # সব listening port
```

`lsof -i :3000` — "port already in use" error এর একমাত্র সমাধান। PID পেয়ে kill করে দাও।

---

## ১১. systemd আর Services

Modern Linux এ সব service manage করে **systemd**। macOS এর `launchd` এর সমতুল্য।

### Service Control

```bash
systemctl status nginx        # অবস্থা দেখা
systemctl start nginx         # চালু
systemctl stop nginx          # বন্ধ
systemctl restart nginx       # restart
systemctl reload nginx        # config reload, downtime ছাড়া
systemctl enable nginx        # boot এ auto start
systemctl disable nginx       # auto start বন্ধ
systemctl list-units --type=service --state=running
```

`restart` আর `reload` এর পার্থক্য গুরুত্বপূর্ণ — `reload` process টা মারে না, শুধু config আবার পড়ে। nginx এ config বদলালে `reload` করো, তাহলে চলমান connection ভাঙবে না।

### Log দেখা

```bash
journalctl -u nginx           # ওই service এর log
journalctl -u nginx -f        # live follow
journalctl -u nginx -n 100    # শেষ ১০০ লাইন
journalctl -u nginx --since "10 min ago"
journalctl -u nginx --since today
journalctl -p err             # শুধু error level
```

### নিজের Service বানানো

তোমার NestJS app কে systemd service বানাই। File বানাও `/etc/systemd/system/sikhiai-api.service`:

```ini
[Unit]
Description=SikhiAI API
After=network.target postgresql.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/sikhiai/api
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=/var/www/sikhiai/api/.env
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

তারপর:
```bash
systemctl daemon-reload           # নতুন file পড়ানো
systemctl enable sikhiai-api
systemctl start sikhiai-api
systemctl status sikhiai-api
journalctl -u sikhiai-api -f
```

গুরুত্বপূর্ণ field:
- `Restart=always` — crash করলে নিজে থেকে উঠে যাবে
- `After=` — এই service গুলোর পরে start হবে
- `User=` — root হিসেবে চালাবে না, dedicated user দাও
- `EnvironmentFile=` — `.env` থেকে variable নেবে

এইটুকু জানলে PM2 বা supervisor ছাড়াই production এ Node app চালাতে পারবে।

---

## ১২. Package Management

### Ubuntu / Debian — `apt`

```bash
apt update                    # package list refresh (install করে না)
apt upgrade                   # installed package update
apt install nginx             # install
apt install nginx -y          # confirmation ছাড়া
apt remove nginx              # uninstall (config থেকে যাবে)
apt purge nginx               # config সহ সব মুছে ফেলা
apt search postgres           # খোঁজা
apt list --installed          # কী কী installed
apt autoremove                # অপ্রয়োজনীয় dependency মোছা
```

**`apt update` আর `apt upgrade` আলাদা।** `update` শুধু "কোন package এর কোন version পাওয়া যাচ্ছে" সেই list টা refresh করে। আসল install/update করে `upgrade`। নতুন server এ প্রথম কাজ সবসময়:
```bash
sudo apt update && sudo apt upgrade -y
```

### Third-party Repository

Ubuntu এর default repo তে সবসময় latest version থাকে না। যেমন Node.js:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### RHEL / Rocky / Amazon Linux — `dnf`

```bash
dnf update
dnf install nginx
dnf remove nginx
dnf search postgres
```

### Alpine (Docker) — `apk`

```bash
apk update
apk add --no-cache curl
```
`--no-cache` দিলে cache রাখে না — Docker image ছোট থাকে।

---

# Part 4 — Practical

## ১৩. Networking Commands

তুমি networking এর theory ইতিমধ্যে জানো, তাই এখানে শুধু Linux এর tool গুলো।

### Interface আর IP

macOS এ `ifconfig` ব্যবহার করেছো। Linux এ সেটা deprecated, এখন `ip`:

```bash
ip addr show              # সব interface আর IP (সংক্ষেপে: ip a)
ip link show              # interface এর status (up/down)
ip route show             # routing table
ip -s link                # traffic statistics
hostname -I               # শুধু IP গুলো
```

Mapping:
| পুরনো | নতুন |
|---|---|
| `ifconfig` | `ip addr` |
| `route -n` | `ip route` |
| `netstat -tulpn` | `ss -tulpn` |
| `arp -a` | `ip neigh` |

### Port আর Connection

```bash
ss -tulpn                 # সব listening port (t=tcp, u=udp, l=listening, p=process, n=numeric)
ss -tn state established  # active connection
lsof -i :3000             # নির্দিষ্ট port কে ধরে আছে
```

`ss -tulpn` — server এ ঢুকে "কী কী চলছে" জানার সবচেয়ে দ্রুত উপায়।

### Connectivity Test

```bash
ping google.com                    # reachable কিনা
curl -I https://example.com        # শুধু HTTP header
curl -v https://example.com        # verbose, TLS handshake সহ
dig example.com                    # DNS lookup
dig +short example.com             # শুধু IP
nslookup example.com               # DNS (পুরনো tool)
traceroute example.com             # কোন কোন hop দিয়ে যাচ্ছে
nc -zv host.com 5432               # নির্দিষ্ট port খোলা কিনা
```

`nc -zv db-host 5432` — "database এ connect হচ্ছে না" সমস্যায় প্রথম check। network reachable কিনা সেটা application এর আগেই আলাদা করে বোঝা যায়।

### Firewall — `ufw`

```bash
ufw status
ufw allow 22/tcp          # SSH — সবার আগে এটা করো
ufw allow 80
ufw allow 443
ufw enable
ufw delete allow 8080
```

**SSH এর port allow করার আগে `ufw enable` করবে না** — নিজেকেই server থেকে লক করে ফেলবে। এই ভুল সবাই একবার করে।

### File Download / Transfer

```bash
curl -O https://example.com/file.zip
wget https://example.com/file.zip
scp file.txt user@server:/path/       # local → remote
scp user@server:/path/file.txt .      # remote → local
rsync -avz ./dist/ user@server:/var/www/app/    # sync, শুধু পার্থক্যটুকু পাঠায়
```

Deployment এ `rsync` `scp` এর চেয়ে অনেক ভালো — যা বদলায়নি তা পাঠায় না।

---

## ১৪. Disk আর Mount

```bash
df -h                     # কোন filesystem কত ভরা
df -i                     # inode usage
du -sh /var/log           # নির্দিষ্ট folder এর size
du -sh * | sort -rh | head -10    # সবচেয়ে বড় ১০টা
lsblk                     # block device (disk আর partition)
mount                     # কী কী mount করা আছে
```

### "Disk Full" সমস্যা

Server এ disk ভরে যাওয়া সবচেয়ে common production issue। ধাপে ধাপে:

```bash
df -h                                    # ১. কোন partition ভরা
du -sh /* 2>/dev/null | sort -rh         # ২. root এর কোন folder বড়
du -sh /var/* | sort -rh                 # ৩. আরো গভীরে
journalctl --vacuum-size=200M            # systemd log ছোট করা
docker system prune -a                   # Docker এর জঞ্জাল (সাবধান)
```

সাধারণত অপরাধী তিনটার একটা — `/var/log` (log rotate হচ্ছে না), Docker image/volume, অথবা কোনো folder এ জমে থাকা upload/temp file।

**যদি `df -h` জায়গা আছে দেখায় কিন্তু তবু "No space left" error দেয়** — তখন `df -i` দেখো। inode শেষ হয়ে গেছে। লক্ষ লক্ষ ছোট file (session file, cache) থাকলে এটা হয়।

---

## ১৫. Environment Variables আর PATH

```bash
echo $HOME
echo $PATH
env                       # সব environment variable
printenv NODE_ENV

export NODE_ENV=production       # শুধু বর্তমান session এ
unset NODE_ENV
```

### PATH

`PATH` হলো colon দিয়ে আলাদা করা folder এর list। তুমি `node` লিখলে shell এই folder গুলোতে ক্রমানুসারে খোঁজে।

```bash
echo $PATH
# /usr/local/bin:/usr/bin:/bin:/home/mostofa/.local/bin
```

"command not found" মানে সাধারণত binary টা PATH এ নেই:
```bash
which node               # কিছু না দিলে PATH এ নেই
export PATH="$PATH:/opt/myapp/bin"
```

### স্থায়ী করা

```bash
~/.bashrc          # প্রতিটা interactive shell এ load হয় (bash)
~/.zshrc           # zsh এর জন্য
~/.profile         # login এ একবার
/etc/environment   # সব user এর জন্য
```

```bash
echo 'export PATH="$PATH:/opt/bin"' >> ~/.bashrc
source ~/.bashrc          # নতুন terminal না খুলেই apply
```

### `.env` File

```bash
set -a; source .env; set +a
```
`set -a` মানে "এরপর যা define হবে সব export করো"। Script এ `.env` load করার সহজ উপায়।

**নিয়ম:** `.env` কখনো git এ commit করবে না। `.gitignore` এ রাখো, আর permission `600` দাও।

---

## ১৬. Cron আর Scheduled Jobs

```bash
crontab -e                # নিজের cron edit
crontab -l                # list
crontab -r                # সব মুছে ফেলা (সাবধান)
```

### Syntax

```
* * * * *  command
│ │ │ │ │
│ │ │ │ └── দিন (0-7, রবি=0 বা 7)
│ │ │ └──── মাস (1-12)
│ │ └────── তারিখ (1-31)
│ └──────── ঘন্টা (0-23)
└────────── মিনিট (0-59)
```

উদাহরণ:
```bash
0 2 * * *      /opt/backup.sh              # প্রতিদিন রাত ২টা
*/15 * * * *   /opt/health-check.sh        # প্রতি ১৫ মিনিট
0 0 * * 0      /opt/weekly-report.sh       # প্রতি রবিবার রাত ১২টা
0 */6 * * *    /opt/sync.sh                # প্রতি ৬ ঘন্টা
@reboot        /opt/startup.sh             # boot এর সময়
```

### Cron এর তিনটা ফাঁদ

**১. PATH খুব সীমিত।** Cron এর PATH তোমার shell এর মতো না। `node` চলবে না।
```bash
# ভুল
0 2 * * * node /opt/script.js

# ঠিক
0 2 * * * /usr/bin/node /opt/script.js
```

**২. Working directory `$HOME`।** Relative path ভাঙবে। সবসময় absolute path দাও।

**৩. Output কোথাও যায় না।** Error হলে টেরই পাবে না।
```bash
0 2 * * * /opt/backup.sh >> /var/log/backup.log 2>&1
```

**Timezone check করে নিও** — server সাধারণত UTC তে থাকে, তোমার হিসাব BST (UTC+6) এ:
```bash
timedatectl
sudo timedatectl set-timezone Asia/Dhaka
```

---

## ১৭. Logs আর Troubleshooting

### কোথায় দেখবে

```bash
/var/log/syslog              # system এর general (Ubuntu)
/var/log/auth.log            # login attempt, sudo — security audit
/var/log/nginx/access.log
/var/log/nginx/error.log
journalctl -u <service>      # systemd service এর log
```

### Log Rotation

log file অসীম বড় হয়ে disk ভরিয়ে ফেলে না, কারণ `logrotate` নিয়মিত ভাগ করে পুরনোগুলো compress করে।

```bash
cat /etc/logrotate.d/nginx
logrotate -d /etc/logrotate.conf     # dry run
```

নিজের app এর জন্য `/etc/logrotate.d/sikhiai`:
```
/var/www/sikhiai/logs/*.log {
    daily
    rotate 14
    compress
    missingok
    notifempty
    copytruncate
}
```

### Debugging Checklist

Server এ কিছু ভাঙলে এই order এ যাও:

```bash
# ১. Service চলছে?
systemctl status myapp

# ২. Log কী বলছে?
journalctl -u myapp -n 100 --no-pager

# ৩. Port listen করছে?
ss -tulpn | grep 3000

# ৪. Disk আছে?
df -h

# ৫. RAM আছে?
free -h

# ৬. CPU load?
uptime

# ৭. Local এ response দেয়?
curl -I localhost:3000

# ৮. Firewall আটকাচ্ছে?
ufw status

# ৯. Permission ঠিক আছে?
ls -la /var/www/app
```

এই ৯টা check এ production এর ৯০% সমস্যা ধরা পড়ে। মুখস্থ না করে একটা file এ লিখে রাখো।

### OOM Killer

RAM শেষ হয়ে গেলে kernel নিজে থেকে সবচেয়ে বেশি memory খাওয়া process মেরে ফেলে। App "কোনো কারণ ছাড়াই" মারা গেলে এটা check করো:

```bash
dmesg | grep -i "killed process"
journalctl -k | grep -i oom
```

ছোট VPS এ Node build করতে গেলে এটা প্রায়ই হয়। সমাধান — swap যোগ করা:
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## ১৮. Shell Scripting Basics

Deploy script, backup script — এগুলো লিখতে যতটুকু লাগে।

### Structure

```bash
#!/bin/bash
set -euo pipefail

# -e : কোনো command fail করলে script থামবে
# -u : undefined variable ব্যবহার করলে error
# -o pipefail : pipe এর মাঝের command fail করলেও ধরবে
```

**`set -euo pipefail` প্রতিটা script এর প্রথম লাইনে রাখো।** এটা ছাড়া script error হওয়ার পরেও চলতে থাকে — deploy script এ এটা ভয়ংকর।

### Variable

```bash
NAME="Mostofa"
echo "Hello $NAME"
echo "Hello ${NAME}Bhai"        # ambiguity এড়াতে brace

COUNT=$(ls | wc -l)             # command এর output
TODAY=$(date +%Y-%m-%d)
```

**সবসময় variable কে quote করো** — `"$VAR"`, `$VAR` না। নাহলে space থাকা path ভাঙবে।

### Condition

```bash
if [ -f "config.json" ]; then
    echo "file আছে"
elif [ -d "config/" ]; then
    echo "folder আছে"
else
    echo "কিছুই নাই"
fi
```

Test operator:
```bash
-f file        # file আছে
-d dir         # directory আছে
-z "$VAR"      # খালি string
-n "$VAR"      # খালি না
"$A" = "$B"    # string সমান
$A -eq $B      # সংখ্যা সমান
$A -gt $B      # বড়
```

### Loop

```bash
for file in *.log; do
    gzip "$file"
done

for i in {1..5}; do
    echo "Attempt $i"
done

while read -r line; do
    echo "$line"
done < input.txt
```

### Function

```bash
log() {
    echo "[$(date +'%H:%M:%S')] $1"
}

log "Deploy শুরু"
```

### একটা বাস্তব Deploy Script

```bash
#!/bin/bash
set -euo pipefail

APP_DIR="/var/www/sikhiai/api"
SERVICE="sikhiai-api"
BRANCH="main"

log() { echo "[$(date +'%H:%M:%S')] $*"; }

log "Deploy শুরু"

cd "$APP_DIR"

log "Code pull করছি"
git fetch origin
git reset --hard "origin/$BRANCH"

log "Dependency install"
pnpm install --frozen-lockfile

log "Build"
pnpm build

log "Migration"
pnpm drizzle-kit migrate

log "Service restart"
sudo systemctl restart "$SERVICE"

sleep 3
if systemctl is-active --quiet "$SERVICE"; then
    log "Deploy সফল"
else
    log "Service start হয়নি — log দেখো"
    journalctl -u "$SERVICE" -n 30 --no-pager
    exit 1
fi
```

---

## ১৯. SSH আর Remote Server

### Connect

```bash
ssh user@192.168.1.10
ssh -p 2222 user@host              # অন্য port
ssh -i ~/.ssh/mykey user@host      # নির্দিষ্ট key
```

### Key-based Login

Password দিয়ে login বন্ধ করে key ব্যবহার করাই standard practice।

```bash
# ১. Local এ key বানাও
ssh-keygen -t ed25519 -C "mostofa@laptop"

# ২. Server এ পাঠাও
ssh-copy-id user@server

# manual ভাবে করলে:
cat ~/.ssh/id_ed25519.pub | ssh user@server "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

**Permission ঠিক না থাকলে SSH কাজ করবে না:**
```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/id_ed25519
```

### SSH Config

`~/.ssh/config` এ লিখে রাখলে প্রতিবার IP মনে রাখতে হয় না:

```
Host sikhiai
    HostName 157.230.xx.xx
    User deploy
    Port 22
    IdentityFile ~/.ssh/sikhiai_key
    ServerAliveInterval 60
```

এখন শুধু `ssh sikhiai` লিখলেই হবে। `scp file.txt sikhiai:/tmp/` ও কাজ করবে।

`ServerAliveInterval 60` টা তোমার কাজে লাগবে — Starlink এ connection মাঝে মাঝে drop হলে session টিকে থাকবে।

### Server Hardening

`/etc/ssh/sshd_config` এ:
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```
```bash
sudo systemctl restart ssh
```

**সাবধান:** `PasswordAuthentication no` করার আগে নিশ্চিত হও যে key দিয়ে login কাজ করছে। একটা terminal খোলা রেখে আরেকটা terminal থেকে test করো। নাহলে নিজেই লক আউট হয়ে যাবে।

### SSH Tunnel

Server এর database local এ access করার জন্য দারুণ কাজে লাগে:

```bash
ssh -L 5433:localhost:5432 user@server
```
এখন তোমার Mac এর `localhost:5433` → server এর PostgreSQL। DBeaver বা TablePlus দিয়ে সরাসরি connect করতে পারবে, database কে internet এ expose না করেই।

---

## ২০. একটা Real Deployment — শুরু থেকে শেষ

সব জিনিস একসাথে জোড়া দিয়ে একটা Node.js API deploy করি। Ubuntu server ধরে নিলাম।

### ধাপ ১ — প্রথম Login আর Update

```bash
ssh root@your-server-ip
apt update && apt upgrade -y
```

### ধাপ ২ — Deploy User

```bash
adduser deploy
usermod -aG sudo deploy

# SSH key copy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# এখন থেকে deploy user দিয়ে কাজ
su - deploy
```

### ধাপ ৩ — Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
sudo ufw status
```

### ধাপ ৪ — Node আর PostgreSQL

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm

sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql
```
```sql
CREATE DATABASE sikhiai;
CREATE USER sikhiai_user WITH ENCRYPTED PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE sikhiai TO sikhiai_user;
\q
```

### ধাপ ৫ — Code

```bash
sudo mkdir -p /var/www/sikhiai
sudo chown -R deploy:deploy /var/www/sikhiai
cd /var/www/sikhiai

git clone git@github.com:username/sikhiai.git api
cd api
pnpm install
pnpm build

nano .env
chmod 600 .env
```

### ধাপ ৬ — systemd Service

```bash
sudo nano /etc/systemd/system/sikhiai-api.service
```
(Chapter ১১ এর file টা use করো)

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now sikhiai-api
systemctl status sikhiai-api
curl -I localhost:3000
```

### ধাপ ৭ — nginx Reverse Proxy

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/sikhiai
```

```nginx
server {
    listen 80;
    server_name api.sikhiai.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/sikhiai /etc/nginx/sites-enabled/
sudo nginx -t                 # config এ ভুল আছে কিনা — সবসময় আগে করো
sudo systemctl reload nginx
```

### ধাপ ৮ — HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.sikhiai.com
```

Certbot নিজেই nginx config বদলে দেবে আর auto-renewal timer বসাবে।

```bash
systemctl list-timers | grep certbot
```

### ধাপ ৯ — Backup Cron

```bash
nano /home/deploy/backup.sh
```
```bash
#!/bin/bash
set -euo pipefail
BACKUP_DIR="/home/deploy/backups"
mkdir -p "$BACKUP_DIR"
FILE="$BACKUP_DIR/db-$(date +%Y%m%d-%H%M).sql.gz"
pg_dump -U sikhiai_user sikhiai | gzip > "$FILE"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
```
```bash
chmod +x /home/deploy/backup.sh
crontab -e
# 0 3 * * * /home/deploy/backup.sh >> /var/log/backup.log 2>&1
```

এই পুরো flow টা একবার নিজে হাতে করলে এই বইয়ের প্রায় সব chapter এর জিনিস ব্যবহার হয়ে যাবে। পড়ে শেখার চেয়ে এভাবে শেখাটা অনেক বেশি টেকে।

---

# Appendix — Cheat Sheet

### Navigation
```bash
pwd                    cd -                   ls -lah
cd ~                   cd ..                  ls -lt
```

### File
```bash
cp -r src/ dst/        mkdir -p a/b/c         find . -name "*.log"
mv a b                 touch file             ln -s target link
rm -rf dir/            
```

### পড়া
```bash
tail -f app.log        less file              head -20
grep -rn "text" .      grep -C 5 "err"        wc -l
```

### Permission
```bash
chmod 755 file         chown user:group file  chmod 600 ~/.ssh/id_rsa
chmod +x script.sh     chown -R www-data:www-data /var/www
```

### Process
```bash
ps aux | grep node     kill -9 PID            htop
lsof -i :3000          pkill -f "pattern"     free -h
```

### Service
```bash
systemctl status X     systemctl restart X    systemctl enable X
journalctl -u X -f     systemctl reload X     systemctl daemon-reload
```

### Network
```bash
ip a                   ss -tulpn              curl -I url
ping host              dig +short domain      nc -zv host port
ufw allow 443          ufw status
```

### Disk
```bash
df -h                  du -sh * | sort -rh    df -i
```

### Package
```bash
apt update && apt upgrade -y                  apt install X
apt search X           apt autoremove
```

### Emergency
```bash
df -h                              # disk ভরা?
free -h                            # RAM শেষ?
systemctl status myapp             # service চলছে?
journalctl -u myapp -n 100         # log কী বলছে?
ss -tulpn | grep PORT              # listen করছে?
dmesg | grep -i "killed process"   # OOM এ মারা গেছে?
```

---

## এরপর কী

এই বইয়ের জিনিসগুলো practice করার জন্য:

**১. Docker দিয়ে খেলা** (কোনো ঝুঁকি নেই)
```bash
docker run -it --name lab ubuntu:24.04 bash
```
ভাঙো, মুছো, আবার নতুন container। Command practice এর জন্য যথেষ্ট।

**২. VPS নাও** (আসল শেখা এখানে)
DigitalOcean, Hetzner, বা Vultr এ $৪-৬ এর একটা droplet। systemd, firewall, nginx, SSL — এগুলো container এ ঠিকমতো শেখা যায় না।

**৩. নিজের project deploy করো**
Chapter ২০ follow করে একটা Node app উঠিয়ে দাও। যা যা আটকাবে, সেটাই তোমার পরের syllabus।

Linux course হিসেবে পড়লে দুই সপ্তাহে ভুলে যাবে। কিন্তু নিজের project একবার নিজের হাতে server এ তুলে, ভেঙে, আবার ঠিক করলে জিনিসটা থেকে যাবে।
