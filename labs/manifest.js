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
  }

  /* পরের lab এখানে যোগ করো:
  ,{
    id:    "l3",
    file:  "labs/lab-03-file-permissions.html",
    title: "File Permissions",
    tag:   "chapter 06",
    time:  "50 মিনিট",
    desc:  "chmod, chown — কে কী করতে পারবে সেটা ঠিক করা।"
  }
  */
];
