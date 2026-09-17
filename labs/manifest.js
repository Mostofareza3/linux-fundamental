/* ============================================================
   LAB MANIFEST
   ------------------------------------------------------------
   নতুন lab যোগ করতে হলে শুধু এই দুটো কাজ:

     ১. labs/ ফোল্ডারে নতুন একটা .html file বানাও।
        ভেতরে একটাই <section class="lab" ...> থাকবে —
        labs/lab-01-filesystem-navigation.html দেখে নকল করো।

     ২. নিচের তালিকায় একটা নতুন ঘর যোগ করো।

   আর কোথাও হাত দিতে হবে না — sidebar, hub card, pager,
   progress bar, checklist সব নিজে থেকেই ঠিক হয়ে যাবে।
   ============================================================ */

window.LAB_MANIFEST = [
  {
    id:    "l1",
    file:  "labs/lab-01-filesystem-navigation.html",
    title: "File System Navigation",
    tag:   "chapter 03-04",
    time:  "45 মিনিট",
    desc:  "pwd, cd, ls, find, grep — Linux-এ পথ চেনা আর জিনিস খুঁজে বের করার হাতেখড়ি।"
  },
  {
    id:    "l2",
    file:  "labs/lab-02-user-group-management.html",
    title: "User & Group Management",
    tag:   "chapter 06",
    time:  "59 মিনিট",
    desc:  "useradd, groupadd, usermod — user বানানো, group-এ ঢোকানো, account lock করা।"
  },
  {
    id:    "l3",
    file:  "labs/lab-03-sudo-access-management.html",
    title: "Sudo Access Management",
    tag:   "chapter 06",
    time:  "60 মিনিট",
    desc:  "sudoers, visudo, Cmnd_Alias — কাকে কতটুকু ক্ষমতা দেবে, ঠিক ততটুকুই।"
  },
  {
    id:    "l4",
    file:  "labs/lab-04-etc-skel.html",
    title: "Understanding /etc/skel/",
    tag:   "chapter 06",
    time:  "59 মিনিট",
    desc:  "নতুন user-এর home directory-র ছাঁচ — একবার সাজিয়ে রাখলে সবাই একই environment নিয়ে জন্মায়।"
  },
  {
    id:    "l5",
    file:  "labs/lab-05-user-modification.html",
    title: "Linux User Modification",
    tag:   "chapter 06",
    time:  "59 মিনিট",
    desc:  "usermod, chage — নাম, shell, home, UID, মেয়াদ — বানানো account ধাপে ধাপে বদলানো।"
  },
  {
    id:    "l6",
    file:  "labs/lab-06-file-permissions.html",
    title: "Mastering File Permissions",
    tag:   "chapter 06",
    time:  "59 মিনিট",
    desc:  "umask, chmod, setfacl — তিন টিমকে একই folder-এ তিন রকম অনুমতি দেওয়া।"
  }

  /* পরের lab এখানে যোগ করো:
  ,{
    id:    "l7",
    file:  "labs/lab-07-process-management.html",
    title: "Process Management",
    tag:   "chapter 07",
    time:  "50 মিনিট",
    desc:  "ps, top, kill — কোন program চলছে আর কীভাবে থামাবে।"
  }
  */
];
