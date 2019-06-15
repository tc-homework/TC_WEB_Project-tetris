# Tetris

![](https://badgen.net/badge/Windows%2010/1903/blue) ![](https://badgen.net/badge/Ubuntu/18.04/orange) ![](https://badgen.net/badge/Node.js/v10.15.0/green) ![](https://badgen.net/badge/yarn/v1.15.2/cyan) ![](https://badgen.net/badge/Express.js/v4.17.1/blue) ![](https://badgen.net/badge/socket.io/v2.2.0/black) ![](https://badgen.net/badge/build/passing/green) 

*Writen by* @1751130

*Live Demo :*  [http://47.100.60.154/](http://47.100.60.154/)

This is the web final project - a Multiplayer online match or cooperation (still on building) tetris game (also including stand-alone version).

<h4 align="center">Index Page</h4>

![index](img/1.png)

<h4 align="center">Single Player Page</h4>

![single](img/2.png)

<h4 align="center">Confrontation Mode Page</h4>

![3](img/3.png)

<h4 align="center">Cooperation Mode Page <span style="color:rgba(0,0,0,0.5); font-size:16px"> (Still on building)</span></h4>

![4](img/4.png)

<h4 align="center">Help Page</h4>

![](img/5.png)

## Project Structure

```bash
└─TC_WEB_Project-tetris
    │  .gitignore
    │  LICENSE
    │  package.json
    │  README.md
    │  server.js
    │  yarn.lock
    │
    ├─.git
    ├─log
    │      access.log
    │
    ├─node_modules
    └─public
        │  confrontation.html
        │  cooperation.html
        │  help.html
        │  index.html
        │  single.html
        │
        ├─css
        │      confrontation.css
        │      cooperation.css
        │      help.css
        │      index.css
        │      tetris.css
        │
        └─js
                confrontation.js
                cooperation.js
                single.js
                socket.io.js
```

## Getting Started

### Prerequisites

What things you need to install the software and how to install them.

```
1. Node.js
2. yarn (recommend) or npm
```

### Deployment

```bash
cd TC_WEB_Project-tetris
yarn install
node server.js
```

## How does it work

### Tetris

### Rendering

### Communication

### Router

### Log System


## License

This project is licensed under the WTFPL License - see the [LICENSE](LICENSE) file for details
