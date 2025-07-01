![Logo](https://github.com/HeliCraft-MC/Vesper/blob/master/public/cover.png)


# HeliCraft Teapot

**EN**: Backend application for the HeliCraft Minecraft server

**RU**:   Бэкенд-приложение для Minecraft-сервера HeliCraft

---

<p align="center">
  <a href="https://github.com/HeliCraft-MC/Teapot">
    <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/HeliCraft-MC/Teapot?style=social">
  </a>
  <a href="https://github.com/HeliCraft-MC/Teapot/issues">
    <img alt="GitHub issues" src="https://img.shields.io/github/issues/HeliCraft-MC/Teapot?style=flat-square">
  </a>
  <a href="https://github.com/HeliCraft-MC/Teapot/blob/master/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/HeliCraft-MC/Teapot?style=flat-square">
  </a>
  <a href="https://github.com/HeliCraft-MC/Vesper">
    <img src="https://img.shields.io/badge/Frontend%20App:%20Vesper-gray?style=flat&logo=https://github.com/HeliCraft-MC/Vesper/blob/master/public/logo_noback.png" alt="Frontend App: Vesper" />
  </a>
  <a href="https://beta.helicraft.ru/">
    <img alt="Live Demo" src="https://img.shields.io/website?url=https%3A%2F%2Fbeta.helicraft.ru&style=flat-square">
  </a>
</p>

---

## 🌐 Demo

[https://beta.helicraft.ru/](https://beta.helicraft.ru/)

---

## 🚀 Run Locally

### 0. Prerequisites
- Node.js (latest)
- MySQL

### 0. Set up MySQL

sql scripts for creating the databases and tables can be found in the `.dev/dbs` directory of this repository. You can execute it using a MySQL client or command line.

### 1.Clone the project

```bash
  git clone https://github.com/HeliCraft-MC/Teapot.git
```

### 2.Go to the project directory

```bash
  cd Teapot
```

### 3.Install dependencies

```bash
  npm install
```


### 4. Copy and configure environment variables

```bash
cp .env.example .env
nano .env
```

### 5. Start the development server

```bash
npm run dev
```

---

## 🛠️ Tech Stack

- **Nitro** (and other unJS packages) - A modern, fast, and lightweight Node.js framework for building web applications.
- **MySQL 2** - A MySQL client for Node.js, providing a simple and efficient way to interact with MySQL databases.
- **Better SQLite 3** - A SQLite client for Node.js, offering a powerful and easy-to-use interface for working with SQLite databases.
