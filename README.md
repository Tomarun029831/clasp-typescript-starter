# clasp-typescript-starter

A template repository to help developers start **Google Apps Script** projects using **Clasp** with **TypeScript**.  
This setup is especially suitable for **backend scripts** and **API development** (not for frontend hosting like Vue/React apps).

---

## 🚀 Setup

### 1. Use this template
Click **"Use this template"** on GitHub to create your own repository.

### 2. Clone and install dependencies
```sh
git clone https://github.com/yourname/your-repo.git
cd your-repo
npm install
````

### 3. Login to Clasp

```sh
npx clasp login
```

### 4. Set your scriptId

Edit **`.clasp.json`** and set the `scriptId` of your Apps Script project.

### 5. Push to GAS

```sh
npm run push
```

---

## 📦 npm Scripts

| Command             | Description                                                         |
| ------------------- | ------------------------------------------------------------------- |
| `npm run typecheck` | TypeScript type check only (`tsc --noEmit`).                        |
| `npm run build`     | Compile TypeScript, sanitize JS, minify with Terser, copy manifest. |
| `npm run push`      | Build and deploy to Google Apps Script (`clasp push`).              |
| `npm run sanitize`  | Clean up compiled JS in the `build/` directory.                     |
| `npm run compress`  | Bundle and minify build output into `dist/bundle.js`.               |

---

## 📂 File Splitting Support

* You can split your code into multiple **`.ts`** files under `src/`.
* TypeScript compiles everything into **`.js`** files inside `build/`.
* These files are then **minified** and **combined** into `dist/bundle.js`.
* Finally, `bundle.js` (plus `appsscript.json`) is deployed to Apps Script.

This means you can keep your project **modular in TypeScript**,
but the GAS side will only see the **optimized `bundle.js`**.

---

## 🔄 Deployment Flow

```bash
src/*.ts   →   build/*.js   →   dist/bundle.js   →   Google Apps Script
```

* Develop in `src/` with multiple TypeScript files.
* Compile to plain JS in `build/`.
* Minify & bundle into a single `dist/bundle.js`.
* Deploy `bundle.js` and `appsscript.json` to Apps Script with `npm run push`.
