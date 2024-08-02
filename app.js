const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
var debug = require("debug")("development:server");

const app = express();
const PORT = 3000;

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();

let players = {};
let currentPlayer = "W";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));


app.get("/", (req, res) => {
    res.render("index", {
        title: "Play Chess Online : Show your smartness to your friends 😊",
    });
});

io.on("connection", (uniquesocket) => {
    debug("A user connected");
    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    } else {
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.on("disconnect", function () {
        if (uniquesocket.id === players.white) {
            delete players.white;
        } else if (uniquesocket.id === players.black) {
            delete players.black;
        }
    });

    uniquesocket.on("move", (move) => {
        try {
            if (chess.turn === "w" && uniquesocket.id !== players.white) return;
            if (chess.turn === "b" && uniquesocket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                uniquesocket.emit("illegalMove", move);
            }
        } catch (error) {
            debug("error", error);
            uniquesocket.emit("Invalid move: ", move);
        }
    });
});

server.listen(PORT, () => {
    debug(`Server is running on port ${PORT}`);
});
