# Wedding Invite — Admin + Private Links · Setup Guide

Everything is **pure JavaScript + Firebase** (Google's realtime database).
No PHP, no SQL, no backend server. Vercel hosts it as a static site and
Firebase handles login, realtime data and photo storage for free.

**How it works**

- `admin.html` — you sign in, create a wedding, fill in all info about the
  bride & groom, upload photos, hit Publish → a **private guest link**
  like `https://yoursite.vercel.app/?code=k3f9xz2m7qwp4t8b` appears. Copy & share.
- `index.html` — guests open that link, the invitation loads their wedding
  from Firebase **in realtime**: you edit on your phone, every open guest
  screen updates instantly.
- The link code is a 16-character random id — nobody can guess or list
  weddings without the exact link. You can revoke a link anytime.
- You can create as many weddings as you want, each with its own private link.

---

## Test it RIGHT NOW on localhost (demo mode — no Firebase needed)

1. In this folder run:  `node dev-server.js`
2. Open <http://localhost:8123/admin> → the login form works in **demo mode**:
   sign in with any email + password (4+ chars).
3. Click **+ New wedding** → fill all the info (names, quotes, date, venue,
   story, schedule, colors), upload photos, **Publish**, copy the private
   link — it looks like `http://localhost:8123/?code=demo-xxxx`.
4. Open that link in a second tab → the guest sees the invitation.
   Save changes in the admin tab and the guest tab **updates live**.

Demo mode stores everything in your browser only (localStorage) — perfect
for testing the flow. Videos/audio uploaded in demo mode last only for the
browser session. The moment you paste real Firebase keys into
`config.js`, the same admin panel and links go online for everyone.

---

## Part 1 · Create the Firebase project (≈ 5 minutes, free)

1. Go to <https://console.firebase.google.com> → **Add project** → any name
   (e.g. `wedding-invites`) → you can skip Google Analytics.
2. In the project, click the **`</>` (Web)** icon to register a web app →
   nickname anything → **no hosting needed** → **Register app**.
3. Firebase shows a `firebaseConfig = { apiKey: ..., appId: ... }` snippet.
   Open **`config.js`** in this folder and paste the 6 values into
   `window.FIREBASE_CONFIG`. Save. (These keys are safe to publish — the
   rules in Part 3 protect your data.)
4. Enable **Email/Password sign-in**: left menu → **Build → Authentication →
   Get started → Sign-in method → Email → Enable → Save**.
5. **Create your admin account** (there is no public sign-up on the site —
   only you can have an account): **Authentication → Users → Add user** →
   enter your email + a strong password → Save. This is the email/password
   you will type on the admin page.
6. Enable **Firestore**: **Build → Firestore Database → Create database** →
   choose a location → start in **production mode** (the rules in Part 3
   will replace the defaults immediately after).
7. **Authorize your hosted domain** (otherwise sign-in fails on Vercel):
   **Authentication → Settings → Authorized domains → Add domain** →
   e.g. `eventsinviteee.vercel.app`.

## Part 2 · Paste the Firestore security rules

- **Firestore**: Build → Firestore Database → **Rules** tab → open
  [`firestore.rules`](firestore.rules) in this folder, copy **everything**,
  paste, **Publish** — then a confirmation popup appears, click
  **Publish** again. (Two clicks. If you only click once the old rules
  stay live and uploads/deletes fail with "insufficient permissions".)
- Re-check after every update to `firestore.rules`: the rules tab shows
  the last **published** version, not what's in the editor box.

## Part 2b · Uploads — no Storage, no card, nothing to enable

Everything the admin uploads lives inside **Firestore** (the free Spark
plan, no bucket, no Blaze, no credit card):

- **Photos** (bride / groom / couple / venue) are compressed in the
  browser and stored as a collection of one document per picture at
  `weddings/<code>/assets/<slot>/photos/<id>` — uploading more photos
  ADDS to the collection, each photo has its own ✕ delete button, and
  nothing ever replaces an existing photo.
- **Music**: upload any mp3 up to 4 MB — it is split into small chunks
  under `weddings/<code>/assets/music/chunks/…` and guests reassemble it
  automatically. You can also paste a direct audio URL instead.
- **Videos** (opening card + background) are **built into the invitation
  and locked** — they always stay as shipped and cannot be edited or
  uploaded, so there is nothing else to configure anywhere.

## Part 3 · Deploy to Vercel

1. Push this folder to a GitHub repository (or use the Vercel dashboard's
   drag-and-drop upload of the folder).
2. On <https://vercel.com> → **Add New → Project** → import the repo →
   Framework Preset: **Other** → **Deploy**. That's it — no build command,
   no environment variables.
3. Open `https://your-project.vercel.app/admin` once deployed.

## Part 4 · Sign in & create your first wedding

1. On the admin page **sign in** with the email + password you added in the
   Firebase console (Part 1, step 5). Guests and other visitors cannot
   create accounts — the panel has no sign-up, only you can manage weddings.
2. Click **+ New wedding** → the private link is generated instantly.
3. Fill everything: bride & groom names and quotes, photos (upload from
   your phone), date & time (the **Auto** button formats the display
   dates), venue + map coordinates, story, hashtag, RSVP deadline,
   schedule (each event has its own time, title and description),
   dress-code colors, and an optional music track (upload an mp3 or
   paste a URL — the videos stay built-in). The **"Every text line on
   the invitation"** box edits every
   heading, label and paragraph on the page — section titles, the cover
   line, the Quran verse and its translation, the couple captions, the
   3D chapter captions, the dress-code wording and the RSVP note and
   thank-you messages. Tokens: **{deadline}** shows the RSVP date,
   **{name}** / **{guests}** personalize the thank-you reply.
4. **Save changes** → **Publish** → **Copy** the guest link → share it on
   WhatsApp / wherever.
5. Later edits update every guest's open page in realtime.
   **Revoke link** locks the old link out (guests see a polite message);
   create a new wedding for a fresh link.

## Good to know

- **Privacy**: guest links contain the only access key. Don't post them
  publicly (a public Instagram caption = everyone can open it). The
  invitation itself is private to link-holders.
- **Limits & cost**: **$0/month** — Auth, Firestore and the stored
  photos/mp3 all live on Firebase's free Spark plan (no Storage bucket,
  no card), plus Vercel's free static hosting. Photos are compressed
  under 650 KB and mp3s capped at 4 MB per wedding, comfortably inside
  the free quotas for thousands of guests.
- **Local testing**: just open `index.html` — with no `?code=` and no
  Firebase keys it runs the built-in demo content.
- To change the invitation's design (fonts, 3D scenes, layout), edit
  `index.html` — the admin data only fills the content fields.
